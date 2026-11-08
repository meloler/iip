$ErrorActionPreference='Stop'
$env:PYTHONUTF8='1'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
function Check-Exit { if ($LASTEXITCODE -ne 0) { throw "Verification failed: $LASTEXITCODE" } }
uv run ruff check server scripts tests
Check-Exit
uv run pytest -q
Check-Exit
& "$PSScriptRoot\npm.ps1" run lint
Check-Exit
& "$PSScriptRoot\npm.ps1" run build
Check-Exit
uv run python scripts/check_boundaries.py
Check-Exit
