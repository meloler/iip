"""Render selected original pages for manual QA; all output is derived and ignored."""

import json
import shutil
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
inventory = json.loads((root / ".local" / "inventory.json").read_text(encoding="utf-8"))
output = root / ".local" / "source-qa"
output.mkdir(exist_ok=True)
tool = shutil.which("pdftoppm")
if not tool:
    raise SystemExit("Poppler pdftoppm is required")
doc = next(x for x in inventory if x["id"] == "4cf123d7abc14ceae158")
for page in [4, 19, 20]:
    prefix = output / f"dcf-page-{page}"
    subprocess.run(
        [
            tool,
            "-f",
            str(page),
            "-l",
            str(page),
            "-scale-to",
            "1600",
            "-singlefile",
            "-png",
            doc["absolute_path"],
            str(prefix),
        ],
        check=True,
    )
    print(str(prefix.with_suffix(".png")))
