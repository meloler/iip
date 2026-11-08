import hashlib
import json

from openpyxl import Workbook
from pypdf import PdfWriter

from scripts.ingest import run
from server.db import connect


def test_ingest_idempotence_originals_and_excel_locators(tmp_path, monkeypatch):
    source, output = tmp_path / "course", tmp_path / "derived"
    source.mkdir()
    monkeypatch.setenv("IIP_DATA_DIR", str(output))
    pdf = PdfWriter()
    pdf.add_blank_page(width=200, height=200)
    with (source / "scan.pdf").open("wb") as f:
        pdf.write(f)
    # Fixture workbook only; no user workbook is authored or modified.
    book = Workbook()
    book.active["A1"] = "WACC"
    book.active["B1"] = "=1+2"
    book.save(source / "formula.xlsx")
    hashes = {f.name: hashlib.sha256(f.read_bytes()).hexdigest() for f in source.iterdir()}
    run(source)
    run(source)
    result = json.loads((output / "inventory.json").read_text(encoding="utf-8"))
    assert len(result) == 2
    assert all(x["status"] == "extracted_needs_QA" for x in result)
    excel = next(x for x in result if x["format"] == "xlsx")
    assert excel["sheets"][0]["formulas_sample"][0] == {"cell": "B1", "formula": "=1+2"}
    assert not excel["formulas_evaluated"]
    assert next(x for x in result if x["format"] == "pdf")["low_text_pages"] == [1]
    with connect() as db:
        assert db.execute("SELECT COUNT(*) FROM pages").fetchone()[0] == 2
    assert hashes == {f.name: hashlib.sha256(f.read_bytes()).hexdigest() for f in source.iterdir()}
