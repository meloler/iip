param([int]$Port = 8765)
$ErrorActionPreference = 'Stop'
$env:PYTHONUTF8 = '1'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
if (!(Test-Path -LiteralPath '.venv\Scripts\python.exe')) { throw 'Ejecuta uv sync antes de iniciar.' }
if (!(Test-Path -LiteralPath 'dist\index.html')) { throw 'Ejecuta npm ci y npm run build antes de iniciar.' }
Write-Host "IIP local: http://127.0.0.1:$Port"
& '.venv\Scripts\python.exe' -m uvicorn server.app:app --host 127.0.0.1 --port $Port
