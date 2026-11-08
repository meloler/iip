# Keep native flags (such as -D and --write) intact, without PowerShell parameter binding.
$NpmArgs=$args
$ErrorActionPreference='Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$NodeExe=(Get-Command node.exe).Source
$NodeVersion=[version]((& $NodeExe --version).TrimStart('v'))
if ($NodeVersion -lt [version]'22.13.0') {
    $BundledNode=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (Test-Path -LiteralPath $BundledNode) { $NodeExe=$BundledNode }
    else { throw 'Instala Node.js >=22.13 o Node.js 24 LTS.' }
}
$NpmCli=Join-Path (Split-Path (Get-Command npm.cmd).Source -Parent) 'node_modules\npm\bin\npm-cli.js'
if (!(Test-Path -LiteralPath $NpmCli)) { throw 'No se encuentra npm-cli.js. Instala npm.' }
$env:PATH=(Split-Path -Parent $NodeExe)+';'+$env:PATH
& $NodeExe $NpmCli @NpmArgs
exit $LASTEXITCODE
