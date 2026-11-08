"""Read course originals; write only the separate IIP data directory. No generated summaries."""

import argparse
import csv
import hashlib
import json
import logging
import re
import sys
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.stdout.reconfigure(encoding="utf-8")
from openpyxl import load_workbook  # noqa: E402
from pypdf import PdfReader  # noqa: E402

from server.db import connect, data_dir, migrate  # noqa: E402

TERMS = {
    "DCF / descuento de flujos": r"\b(?:DCF|DFC|descuento de flujos|discounted cash flow)\b",
    "VAN / TIR": r"\b(?:VAN|TIR|valor actual neto|tasa interna de retorno)\b",
    "ROIC / ROCE / ROE": r"\b(?:ROIC|ROCE|ROE)\b",
    "WACC / CAPM": r"\b(?:WACC|CAPM|coste de capital)\b",
    "Múltiplos": r"\b(?:EV/EBITDA|PER|P/E|multiplo|multiplos)\b",
    "Value / margen de seguridad": r"\b(?:value investing|margen de seguridad|inversion en valor)\b",
    "Momentum / técnico": r"\b(?:momentum|RSI|medias moviles|analisis tecnico)\b",
    "Diversificación / riesgo": r"\b(?:diversificacion|volatilidad|drawdown|correlacion)\b",
    "Duración / convexidad": r"\b(?:duracion|convexidad)\b",
    "Black-Scholes / opciones": r"\b(?:Black.Scholes|put.call|griegas)\b",
    "Ciclo de capital": r"\bciclo de capital\b",
}
AUTHORS = [
    "Warren Buffett",
    "Benjamin Graham",
    "Peter Lynch",
    "Aswath Damodaran",
    "Charlie Munger",
    "Philip Fisher",
    "Howard Marks",
    "Joel Greenblatt",
    "Markowitz",
    "Keynes",
    "Hayek",
    "Mises",
    "Elena Rico",
]


class ExtractionWarnings(logging.Handler):
    def __init__(self):
        super().__init__()
        self.messages = []

    def emit(self, record):
        self.messages.append(record.getMessage())


def normalized(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


def extract(path):
    if path.suffix.lower() == ".pdf":
        reader = PdfReader(path)
        pages = []
        errors = []
        layout_warnings = []
        capture = ExtractionWarnings()
        log = logging.getLogger("pypdf")
        log.addHandler(capture)
        for i, page in enumerate(reader.pages, 1):
            capture.messages = []
            try:
                text = page.extract_text(extraction_mode="layout") or ""
                if capture.messages:
                    layout_warnings.append(
                        {
                            "page": i,
                            "warnings": capture.messages[:],
                            "fallback": "plain text; visual QA required",
                        }
                    )
                    text = page.extract_text() or text
            except Exception as exc:
                text = ""
                errors.append({"page": i, "error": type(exc).__name__})
            pages.append((i, text))
        log.removeHandler(capture)
        return pages, {
            "extraction_errors": errors,
            "layout_warnings": layout_warnings,
            "formulas_status": "text candidates only; formulas in images require visual review",
            "locator": "PDF physical page, 1-based",
        }
    if path.suffix.lower() == ".xlsx":
        book = load_workbook(path, read_only=True, data_only=False, keep_links=False)
        pages, sheets = [], []
        for i, sheet in enumerate(book.worksheets, 1):
            lines, formulas = [], []
            for row in sheet.iter_rows():
                values = []
                for cell in row:
                    if cell.value is not None:
                        value = str(cell.value)
                        values.append(f"{cell.coordinate}: {value}")
                        if cell.data_type == "f":
                            formulas.append({"cell": cell.coordinate, "formula": value})
                if values:
                    lines.append(" | ".join(values))
            pages.append((i, f"Hoja: {sheet.title}\n" + "\n".join(lines)))
            sheets.append(
                {
                    "name": sheet.title,
                    "rows": sheet.max_row,
                    "columns": sheet.max_column,
                    "formula_count": len(formulas),
                    "formulas_sample": formulas[:30],
                }
            )
        book.close()
        return pages, {
            "sheets": sheets,
            "locator": "Sheet ordinal, 1-based; cell references in text. Not PDF pages.",
            "formulas_evaluated": False,
        }
    return [], {"unsupported": True}


def run(source):
    source = source.resolve(strict=True)
    output = data_dir()
    if output == source or source in output.parents:
        raise ValueError("Output must be outside the read-only course directory")
    migrate()
    files = sorted(p for p in source.rglob("*") if p.is_file())
    inventory = []
    seen = {}
    with connect() as db:
        # Atomic replacement of derived catalog only; original files are never written.
        db.execute("DELETE FROM pages")
        db.execute("DELETE FROM documents")
        db.execute("INSERT OR REPLACE INTO settings VALUES('course_root',?)", (str(source),))
        for index, path in enumerate(files, 1):
            relative = path.relative_to(source).as_posix()
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            doc_id = hashlib.sha256(relative.encode()).hexdigest()[:20]
            record = {
                "id": doc_id,
                "name": path.name,
                "relative_path": relative,
                "absolute_path": str(path),
                "format": path.suffix.lower().lstrip("."),
                "module": relative.split("/")[0],
                "bytes": path.stat().st_size,
                "sha256": digest,
                "duplicate_of": seen.get(digest),
                "topic": str(path.parent.relative_to(source)),
                "topic_basis": "folder and title; provisional",
                "review_status": "pending_human_review",
                "methods": {},
                "authors_candidates": {},
                "formula_candidates": [],
                "platform_modules": ["Knowledge Library"],
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }
            seen.setdefault(digest, relative)
            try:
                pages, extra = extract(path)
                record.update(extra)
                record["page_count"] = len(pages)
                record["low_text_pages"] = [n for n, text in pages if len(text.strip()) < 80]
                record["status"] = "extracted_needs_QA" if pages else "unsupported"
                if record.get("extraction_errors"):
                    record["status"] = "partial_extraction"
                for n, text in pages:
                    norm = normalized(" ".join(text.split()))
                    for name, pattern in TERMS.items():
                        if re.search(pattern, norm, re.I):
                            record["methods"].setdefault(name, []).append(n)
                    for name in AUTHORS:
                        if normalized(name) in norm:
                            record["authors_candidates"].setdefault(name, []).append(n)
                    for line in text.splitlines():
                        if "=" in line and len(line) < 240:
                            record["formula_candidates"].append({"page": n, "text": line.strip()})
                if record["methods"]:
                    record["platform_modules"] += ["Research & Valuation", "Screener"]
                if re.search(r"riesgo|cartera|diversific", normalized(relative)):
                    record["platform_modules"].append("Portfolio")
                if re.search(r"geopolit|econom|materias", normalized(relative)):
                    record["platform_modules"].append("Market Intelligence")
                record["content_preview"] = next((t[:900] for _, t in pages if len(t.strip()) > 80), "")
                db.execute(
                    "INSERT INTO documents VALUES(?,?,?,?,?,?,?,?)",
                    (
                        doc_id,
                        path.name,
                        relative,
                        record["format"],
                        record["module"],
                        len(pages),
                        digest,
                        json.dumps(record, ensure_ascii=False),
                    ),
                )
                db.executemany(
                    "INSERT INTO pages(document_id,page_number,text) VALUES(?,?,?)",
                    [(doc_id, n, t) for n, t in pages],
                )
            except Exception as exc:
                record.update(status="failed", error=f"{type(exc).__name__}: {exc}", page_count=0)
            inventory.append(record)
            if index % 20 == 0 or index == len(files):
                print(f"Processed {index}/{len(files)}", flush=True)
        db.execute("INSERT INTO pages_fts(pages_fts) VALUES('rebuild')")
    (output / "inventory.json").write_text(
        json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    with (output / "inventory.csv").open("w", newline="", encoding="utf-8-sig") as stream:
        fields = [
            "name",
            "relative_path",
            "format",
            "module",
            "topic",
            "page_count",
            "status",
            "review_status",
            "sha256",
            "duplicate_of",
            "methods",
            "authors_candidates",
            "platform_modules",
        ]
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for item in inventory:
            writer.writerow(
                {
                    k: json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v
                    for k, v in item.items()
                    if k in fields
                }
            )
    summary = {
        "source": str(source),
        "files": len(files),
        "formats": dict(Counter(x["format"] for x in inventory)),
        "modules": dict(Counter(x["module"] for x in inventory)),
        "physical_pdf_pages": sum(x["page_count"] for x in inventory if x["format"] == "pdf"),
        "worksheets": sum(x["page_count"] for x in inventory if x["format"] == "xlsx"),
        "status": dict(Counter(x["status"] for x in inventory)),
        "duplicates": [x["relative_path"] for x in inventory if x["duplicate_of"]],
        "low_text_pdf_pages": sum(
            len(x.get("low_text_pages", [])) for x in inventory if x["format"] == "pdf"
        ),
    }
    (output / "ingest-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    if any(item["status"] in ("failed", "partial_extraction") for item in inventory):
        raise SystemExit("Extraction incomplete. Inspect .local/inventory.json")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    run(parser.parse_args().source)
