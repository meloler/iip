import hashlib
import hmac
import secrets
import time

from fastapi import HTTPException, Request

from server.db import connect

COOKIE = "iip_session"
SESSION_SECONDS = 60 * 60 * 12


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    value = hashlib.scrypt(
        password.encode(), salt=bytes.fromhex(salt), n=32768, r=8, p=3, maxmem=128 * 1024 * 1024
    )
    return salt + ":" + value.hex()


def verify_password(password: str, saved: str) -> bool:
    salt, expected = saved.split(":")
    value = hashlib.scrypt(
        password.encode(), salt=bytes.fromhex(salt), n=32768, r=8, p=3, maxmem=128 * 1024 * 1024
    )
    return hmac.compare_digest(value.hex(), expected)


def token_hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def current_user(request: Request) -> dict:
    token = request.cookies.get(COOKIE, "")
    with connect() as db:
        row = db.execute(
            "SELECT u.id,u.username FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?",
            (token_hash(token), int(time.time())),
        ).fetchone()
        if row is None:
            raise HTTPException(401, "Inicia sesión para acceder")
        return dict(row)
