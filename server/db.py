import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def data_dir() -> Path:
    path = Path(os.environ.get("IIP_DATA_DIR", str(ROOT / ".local"))).resolve()
    path.mkdir(parents=True, exist_ok=True)
    return path


@contextmanager
def connect():
    db = sqlite3.connect(data_dir() / "iip.sqlite", timeout=20)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("PRAGMA journal_mode=WAL")
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def migrate():
    with connect() as db:
        db.execute("CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY)")
        for file in sorted((ROOT / "migrations").glob("*.sql")):
            if not db.execute("SELECT 1 FROM schema_migrations WHERE version=?", (file.name,)).fetchone():
                db.executescript(file.read_text(encoding="utf-8"))
                db.execute("INSERT INTO schema_migrations VALUES(?)", (file.name,))
