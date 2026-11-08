"""Verify source fingerprints and publish a metadata-only inventory for local continuity."""

import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server.db import ROOT, connect, data_dir  # noqa: E402
from server.knowledge import search  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
inventory = json.loads((data_dir() / "inventory.json").read_text(encoding="utf-8"))
failures = []
for record in inventory:
    if hashlib.sha256(Path(record["absolute_path"]).read_bytes()).hexdigest() != record["sha256"]:
        failures.append(record["relative_path"])
with connect() as db:
    count = db.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    page_count = db.execute("SELECT COUNT(*) FROM pages").fetchone()[0]
assert count == len(inventory), (count, len(inventory))
assert page_count == sum(x["page_count"] for x in inventory)
assert not failures, failures
assert search("WACC")
for hit in search("WACC"):
    with connect() as db:
        row = db.execute(
            "SELECT text FROM pages WHERE document_id=? AND page_number=?",
            (hit["document_id"], hit["page_number"]),
        ).fetchone()
    assert hit["text"] == row["text"][:5000]
lines = [
    "# Inventario documental",
    "",
    "Generado desde la extracción local el 8 de noviembre de 2026. 197 archivos; 194 PDF y 3 Excel. 2.663 páginas PDF y 10 hojas Excel. Las rutas son relativas al origen de solo lectura `../Módulos`.",
    "",
    "La extracción es sistemática; el análisis académico integral está pendiente. Temas por carpeta/título y métodos/autores por coincidencia textual son candidatos, no validaciones. Los indicadores, fórmulas candidatas y localizadores completos están en `.local/inventory.json` (privado, excluido de Git). Excel no se recalcula. 294 páginas PDF con menos de 80 caracteres requieren revisión; no se puede concluir que todas necesiten OCR.",
    "",
    "| Documento / ruta relativa | Formato | Páginas / hojas | Metodologías detectadas | Estado |",
    "|---|---|---:|---|---|",
]
for record in inventory:
    methods = (
        "; ".join(
            f"{m} ({','.join(map(str, pages[:8]))}){'…' if len(pages) > 8 else ''}"
            for m, pages in record["methods"].items()
        )
        or "Sin detección automática"
    )
    lines.append(
        f"| {record['relative_path'].replace('|', '/')} | {record['format']} | {record['page_count']} | {methods} | Extraído; revisión pendiente{' · duplicado' if record['duplicate_of'] else ''} |"
    )
(ROOT / "docs" / "INVENTORY.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
methods = defaultdict(list)
for record in inventory:
    for method, pages in record["methods"].items():
        methods[method].append((record["name"], record["id"], pages))
lines = [
    "# Mapa de metodologías",
    "",
    "Detección lexical por páginas; no implica que el método esté explicado, sea válido o haya sido implementado. Cada nodo vuelve al original protegido desde la biblioteca. No se han creado resúmenes académicos automáticos.",
    "",
]
for method, documents in methods.items():
    lines += [
        f"## {method}",
        "",
        f"Detectado en {len(documents)} documentos. Ejemplos para el lote de revisión:",
        "",
    ]
    for name, key, pages in documents[:6]:
        lines.append(f"- {name}: páginas/hojas {', '.join(map(str, pages[:12]))}. ID `{key}`.")
    lines.append("")
(ROOT / "docs" / "KNOWLEDGE_MAP.md").write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
result = {
    "original_hashes_match": len(inventory),
    "documents_in_database": count,
    "page_and_sheet_records": page_count,
    "fts_citations_checked": len(search("WACC")),
    "failed_source_hashes": failures,
}
(data_dir() / "catalog-verification.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
print(json.dumps(result, indent=2))
