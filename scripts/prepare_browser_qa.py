"""Isolated, disposable browser-test database. Never seeds the normal application database."""

import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server.auth import hash_password  # noqa: E402
from server.db import data_dir  # noqa: E402

source = data_dir() / "iip.sqlite"
target = data_dir() / "browser-qa" / "iip.sqlite"
if target.exists():
    raise SystemExit("QA database already exists; reuse it rather than overwriting")
target.parent.mkdir(parents=True, exist_ok=True)
with sqlite3.connect(source) as src, sqlite3.connect(target) as dst:
    src.backup(dst)
    if dst.execute("SELECT COUNT(*) FROM users").fetchone()[0]:
        raise SystemExit("Refusing to seed QA from a database containing users")
    dst.execute(
        "INSERT INTO users VALUES(?,?,?)",
        ("browser-qa-only", "browser.qa", hash_password("Local-QA-fixture-only-2026")),
    )
    dst.commit()
print("Isolated QA database ready in .local/browser-qa (test fixture account only)")
