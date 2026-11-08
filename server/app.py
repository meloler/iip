import hashlib
import json
import logging
import os
import secrets
import shutil
import subprocess
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, model_validator
from starlette.middleware.trustedhost import TrustedHostMiddleware

from server.auth import COOKIE, SESSION_SECONDS, current_user, hash_password, token_hash, verify_password
from server.db import ROOT, connect, data_dir, migrate
from server.domain import DCFInputs, dcf, ledger
from server.knowledge import catalog, search
from server.providers import provider

logger = logging.getLogger("iip")
attempts = defaultdict(deque)
DUMMY_PASSWORD = hash_password(secrets.token_urlsafe(24))


def now():
    return datetime.now(timezone.utc).isoformat()


@asynccontextmanager
async def lifespan(app):
    migrate()
    provider()  # Fail closed on configuration errors.
    yield


app = FastAPI(
    title="Investment Intelligence Platform",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost", "testserver"])
User = Annotated[dict, Depends(current_user)]


@app.middleware("http")
async def guard(request: Request, call_next):
    request_id = secrets.token_hex(6)
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        if request.headers.get("x-iip-request") != "1":
            return JSONResponse({"detail": "Falta protección de solicitud"}, status_code=403)
        origin = request.headers.get("origin")
        if origin and origin != str(request.base_url).rstrip("/"):
            return JSONResponse({"detail": "Origen no permitido"}, status_code=403)
        length = request.headers.get("content-length", "0")
        if not length.isdigit() or int(length) > 32768:
            return JSONResponse({"detail": "Solicitud demasiado grande"}, status_code=413)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Request-ID"] = request_id
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
    )
    logger.info("%s %s %s %s", request_id, request.method, request.url.path, response.status_code)
    return response


@app.exception_handler(Exception)
async def unexpected(request, exc):
    logger.exception("Unhandled %s", type(exc).__name__)
    return JSONResponse({"detail": "Error interno. Consulta el registro local."}, status_code=500)


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Credentials(Input):
    username: str = Field(min_length=3, max_length=60, pattern=r"^[a-zA-Z0-9_.@-]+$")
    password: str = Field(min_length=12, max_length=128)


class Valuation(Input):
    company_id: str
    assumptions: DCFInputs
    save: bool = False


class Trade(Input):
    company_id: str
    kind: Literal["BUY", "SELL", "DIVIDEND"]
    quantity: Decimal = Field(ge=0, le=1_000_000)
    price: Decimal = Field(gt=0, le=1_000_000)
    fees: Decimal = Field(default=Decimal("0"), ge=0, le=1_000_000)
    occurred_at: date
    currency: Literal["USD"] = "USD"

    @model_validator(mode="after")
    def valid_trade(self):
        if self.kind in ("BUY", "SELL") and self.quantity <= 0:
            raise ValueError("La cantidad debe ser positiva")
        if self.kind == "DIVIDEND" and self.quantity != 0:
            raise ValueError("En dividendos, cantidad=0 y precio=importe bruto total")
        if self.occurred_at > datetime.now(timezone.utc).date():
            raise ValueError("Las operaciones futuras no están ejecutadas")
        if self.kind != "BUY" and self.fees > (
            self.price if self.kind == "DIVIDEND" else self.price * self.quantity
        ):
            raise ValueError("Las comisiones exceden el importe bruto")
        return self


def company(key):
    row = next((x for x in provider().companies() if x["id"] == key), None)
    if row is None:
        raise HTTPException(404, "Empresa no disponible en el proveedor activo")
    return row


def rows_for(db, user_id):
    return [
        dict(r)
        for r in db.execute(
            "SELECT * FROM trades WHERE user_id=? ORDER BY occurred_at,created_at,id", (user_id,)
        ).fetchall()
    ]


def prices():
    return {x["id"]: x["price"] for x in provider().companies()}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "data_mode": os.environ.get("IIP_DATA_MODE", "demo"),
        "provider_configured": os.environ.get("IIP_DATA_MODE", "demo") == "demo",
    }


@app.get("/api/auth/status")
def auth_status():
    with connect() as db:
        return {"setup_required": db.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0}


@app.post("/api/auth/setup", status_code=201)
def setup(body: Credentials, request: Request):
    if request.client.host not in ("127.0.0.1", "::1", "testclient"):
        raise HTTPException(403, "La creación inicial solo está disponible en este equipo")
    with connect() as db:
        db.execute("BEGIN IMMEDIATE")
        if db.execute("SELECT COUNT(*) FROM users").fetchone()[0]:
            raise HTTPException(409, "La cuenta inicial ya existe")
        db.execute(
            "INSERT INTO users VALUES(?,?,?)",
            (str(uuid4()), body.username.lower(), hash_password(body.password)),
        )
    return {"created": True}


@app.post("/api/auth/users", status_code=201)
def add_user(body: Credentials, user: User):
    with connect() as db:
        db.execute("BEGIN IMMEDIATE")
        if db.execute("SELECT COUNT(*) FROM users").fetchone()[0] >= 2:
            raise HTTPException(409, "El límite inicial es de dos usuarios")
        if db.execute("SELECT 1 FROM users WHERE username=?", (body.username.lower(),)).fetchone():
            raise HTTPException(409, "El usuario ya existe")
        db.execute(
            "INSERT INTO users VALUES(?,?,?)",
            (str(uuid4()), body.username.lower(), hash_password(body.password)),
        )
    return {"created": True}


@app.post("/api/auth/login")
def login(body: Credentials, request: Request, response: Response):
    key = request.client.host
    bucket = attempts[key]
    while bucket and bucket[0] < time.time() - 60:
        bucket.popleft()
    if len(bucket) >= 8:
        raise HTTPException(429, "Demasiados intentos. Espera un minuto.")
    bucket.append(time.time())
    with connect() as db:
        row = db.execute("SELECT * FROM users WHERE username=?", (body.username.lower(),)).fetchone()
        valid = verify_password(body.password, row["password_hash"] if row else DUMMY_PASSWORD)
        if not row or not valid:
            raise HTTPException(401, "Credenciales incorrectas")
        token = secrets.token_urlsafe(32)
        db.execute("DELETE FROM sessions WHERE expires_at<=?", (int(time.time()),))
        db.execute(
            "INSERT INTO sessions VALUES(?,?,?)",
            (token_hash(token), row["id"], int(time.time()) + SESSION_SECONDS),
        )
    response.set_cookie(
        COOKIE,
        token,
        httponly=True,
        samesite="strict",
        secure=request.url.scheme == "https",
        max_age=SESSION_SECONDS,
    )
    return {"username": row["username"]}


@app.get("/api/auth/me")
def me(user: User):
    return user


@app.post("/api/auth/logout")
def logout(request: Request, response: Response, user: User):
    with connect() as db:
        db.execute("DELETE FROM sessions WHERE token_hash=?", (token_hash(request.cookies.get(COOKIE, "")),))
    response.delete_cookie(COOKIE)
    return {"ok": True}


@app.get("/api/companies")
def companies(user: User, q: str = Query(default="", max_length=100)):
    return [x for x in provider().companies() if q.lower() in (x["ticker"] + x["name"] + x["sector"]).lower()]


@app.get("/api/companies/{key}")
def get_company(key: str, user: User):
    return company(key)


@app.post("/api/valuations")
def calculate(body: Valuation, user: User):
    row = company(body.company_id)
    if not row["dcf_applicable"]:
        raise HTTPException(422, "Este DCF FCFF simplificado no es adecuado para esta empresa")
    result = dcf(body.assumptions)
    if body.save:
        with connect() as db:
            db.execute(
                "INSERT INTO valuations VALUES(?,?,?,?,?,?,?)",
                (
                    str(uuid4()),
                    user["id"],
                    row["id"],
                    body.assumptions.model_dump_json(),
                    json.dumps(result),
                    now(),
                    result["method_version"],
                ),
            )
    return result


@app.get("/api/valuations")
def valuations(user: User):
    with connect() as db:
        rows = db.execute(
            "SELECT * FROM valuations WHERE user_id=? ORDER BY created_at DESC LIMIT 50", (user["id"],)
        ).fetchall()
        return [
            {
                "id": r["id"],
                "company_id": r["company_id"],
                "created_at": r["created_at"],
                "assumptions": json.loads(r["assumptions_json"]),
                "result": json.loads(r["result_json"]),
            }
            for r in rows
        ]


@app.get("/api/watchlist")
def watchlist(user: User):
    with connect() as db:
        return [
            dict(r)
            for r in db.execute(
                "SELECT company_id,created_at FROM watchlist WHERE user_id=? ORDER BY created_at DESC",
                (user["id"],),
            )
        ]


@app.put("/api/watchlist/{key}")
def watch(key: str, user: User):
    company(key)
    with connect() as db:
        db.execute("INSERT OR IGNORE INTO watchlist VALUES(?,?,?)", (user["id"], key, now()))
    return {"saved": True}


@app.delete("/api/watchlist/{key}")
def unwatch(key: str, user: User):
    with connect() as db:
        db.execute("DELETE FROM watchlist WHERE user_id=? AND company_id=?", (user["id"], key))
    return {"saved": False}


@app.get("/api/portfolio")
def portfolio(user: User):
    with connect() as db:
        rows = rows_for(db, user["id"])
    return {**ledger(rows, prices()), "trades": rows}


@app.post("/api/trades", status_code=201)
def trade(body: Trade, user: User):
    company(body.company_id)
    row = {**body.model_dump(mode="json"), "id": str(uuid4()), "user_id": user["id"], "created_at": now()}
    with connect() as db:
        db.execute("BEGIN IMMEDIATE")
        all_rows = rows_for(db, user["id"]) + [row]
        all_rows.sort(key=lambda x: (x["occurred_at"], x["created_at"], x["id"]))
        try:
            ledger(all_rows, prices())
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
        db.execute(
            "INSERT INTO trades VALUES(?,?,?,?,?,?,?,?,?,?)",
            tuple(
                row[k]
                for k in (
                    "id",
                    "user_id",
                    "company_id",
                    "kind",
                    "quantity",
                    "price",
                    "fees",
                    "occurred_at",
                    "currency",
                    "created_at",
                )
            ),
        )
    return {"id": row["id"], "recorded": True}


@app.get("/api/library")
def library(user: User):
    return catalog()


@app.get("/api/library/search")
def library_search(user: User, q: str = Query(min_length=2, max_length=200)):
    return {"query": q, "mode": "lexical_evidence_only", "generated_answer": False, "results": search(q)}


@app.get("/api/library/{key}/pages/{number}")
def document_page(key: str, number: int, user: User):
    with connect() as db:
        row = db.execute(
            "SELECT p.text,p.page_number,d.name,d.format FROM pages p JOIN documents d ON d.id=p.document_id WHERE p.document_id=? AND p.page_number=?",
            (key, number),
        ).fetchone()
        if not row:
            raise HTTPException(404, "Página no disponible")
        return dict(row)


def resolve_original(key: str):
    with connect() as db:
        row = db.execute("SELECT * FROM documents WHERE id=?", (key,)).fetchone()
        root_row = db.execute("SELECT value FROM settings WHERE key='course_root'").fetchone()
    if not row or not root_row:
        raise HTTPException(404, "Documento no disponible")
    source = Path(root_row["value"]).resolve()
    target = (source / row["relative_path"]).resolve()
    if source not in target.parents or not target.is_file():
        raise HTTPException(404, "Original no disponible")
    if hashlib.sha256(target.read_bytes()).hexdigest() != row["sha256"]:
        raise HTTPException(409, "El original cambió. Reindexa antes de usar estas referencias.")
    return target, dict(row)


@app.get("/api/library/{key}/preview/{number}.png")
def preview(key: str, number: int, user: User):
    target, row = resolve_original(key)
    if row["format"] != "pdf" or number < 1 or number > row["page_count"]:
        raise HTTPException(404, "Página PDF no disponible")
    executable = shutil.which("pdftoppm")
    if not executable:
        raise HTTPException(503, "El visor necesita Poppler (pdftoppm). Puedes abrir el original.")
    folder = data_dir() / "rendered" / row["sha256"]
    folder.mkdir(parents=True, exist_ok=True)
    cached = folder / f"page-{number}.png"
    if not cached.is_file():
        temporary = folder / secrets.token_hex(12)
        generated = temporary.with_suffix(".png")
        try:
            subprocess.run(
                [
                    executable,
                    "-f",
                    str(number),
                    "-l",
                    str(number),
                    "-singlefile",
                    "-scale-to",
                    "1600",
                    "-png",
                    str(target),
                    str(temporary),
                ],
                check=True,
                timeout=25,
                capture_output=True,
            )
            generated.replace(cached)
        except (subprocess.SubprocessError, OSError) as exc:
            logger.warning("PDF preview failed: %s", type(exc).__name__)
            raise HTTPException(503, "No se pudo renderizar la página. Abre el original.") from exc
        finally:
            generated.unlink(missing_ok=True)
    return FileResponse(cached, media_type="image/png")


@app.get("/api/library/{key}/original")
def original(key: str, user: User):
    target, row = resolve_original(key)
    return FileResponse(
        target,
        media_type="application/pdf"
        if row["format"] == "pdf"
        else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=row["name"],
        content_disposition_type="inline" if row["format"] == "pdf" else "attachment",
    )


@app.get("/api/openapi.json")
def schema(user: User):
    return app.openapi()


BUILD = ROOT / "dist"
if (BUILD / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=BUILD / "assets"), name="assets")


@app.get("/{path:path}")
def frontend(path: str):
    if path.startswith("api/"):
        raise HTTPException(404, "Ruta API no encontrada")
    if not (BUILD / "index.html").is_file():
        raise HTTPException(503, "Ejecuta npm run build antes de iniciar el servidor")
    return FileResponse(BUILD / "index.html")
