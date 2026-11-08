import json
import re

from server.db import connect


def search(query: str, limit=12) -> list[dict]:
    tokens = re.findall(r"[^\W_]+", query, re.UNICODE)[:12]
    if not tokens:
        return []
    # User text is quoted token by token; no FTS operators or SQL are executable.
    expression = " OR ".join('"' + token.replace('"', '""') + '"' for token in tokens)
    with connect() as db:
        rows = db.execute(
            "SELECT p.document_id,p.page_number,p.text,d.name,d.module,d.format,bm25(pages_fts) AS rank FROM pages_fts JOIN pages p ON p.id=pages_fts.rowid JOIN documents d ON d.id=p.document_id WHERE pages_fts MATCH ? ORDER BY rank,p.id LIMIT ?",
            (expression, limit),
        ).fetchall()
        return [
            {
                **dict(row),
                "text": row["text"][:5000],
                "original_url": f"/api/library/{row['document_id']}/original#page={row['page_number']}"
                if row["format"] == "pdf"
                else f"/api/library/{row['document_id']}/original",
                "locator_type": "page" if row["format"] == "pdf" else "sheet",
            }
            for row in rows
        ]


def catalog():
    with connect() as db:
        rows = db.execute("SELECT * FROM documents ORDER BY module,name").fetchall()
    output = []
    for row in rows:
        details = json.loads(row["details_json"])
        output.append(
            {
                "id": row["id"],
                "name": row["name"],
                "format": row["format"],
                "module": row["module"],
                "page_count": row["page_count"],
                "methods": details.get("methods", {}),
                "status": details["status"],
                "review_status": details["review_status"],
                "low_text_pages": details.get("low_text_pages", []),
                "duplicate_of": details.get("duplicate_of"),
                "sha256": row["sha256"],
            }
        )
    return output
