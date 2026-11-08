"""Small enforceable boundaries rather than a dependency injection framework."""

import ast
from pathlib import Path

root = Path(__file__).resolve().parents[1]
for name in ("domain", "providers"):
    tree = ast.parse((root / "server" / f"{name}.py").read_text(encoding="utf-8"))
    forbidden = ("server.app", "server.db", "server.auth", "fastapi", "httpx")
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports = [n.name for n in node.names]
        elif isinstance(node, ast.ImportFrom):
            imports = [node.module or ""]
        else:
            continue
        if any(i.startswith(forbidden) for i in imports):
            raise SystemExit(f"Boundary violation in {name}: {imports}")
for file in (root / "frontend").glob("*.*"):
    text = file.read_text(encoding="utf-8")
    if "api_key" in text.lower() or "data.sec.gov" in text or "gamma-api.polymarket.com" in text:
        raise SystemExit(f"Direct external provider or secret in {file.name}")
print("Domain/provider boundaries and frontend source checks passed")
