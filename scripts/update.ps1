# Holt die neueste Version von GitHub und aktualisiert diesen Ordner.
# Behält: .env (Keys), vault (Gedächtnis), models (Handmodell), node_modules
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$url = 'https://github.com/msarsak/makka/archive/refs/heads/claude/hephaestion-ai-assistant-25g0l7.zip'
$tmp = Join-Path $env:TEMP ('heph-update-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  Write-Host '  Lade neueste Version ...'
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $url -OutFile (Join-Path $tmp 'update.zip') -UseBasicParsing
  Write-Host '  Entpacke ...'
  Expand-Archive -Path (Join-Path $tmp 'update.zip') -DestinationPath $tmp -Force
  $src = Get-ChildItem -Path $tmp -Directory | Select-Object -First 1
  if (-not $src) { throw 'ZIP war leer.' }
  Write-Host '  Kopiere neue Dateien (deine .env und dein Gedächtnis bleiben) ...'
  robocopy $src.FullName $root /E /XD node_modules vault models .git /XF .env update.bat /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "Kopieren fehlgeschlagen (Code $LASTEXITCODE)" }
  Write-Host '  Dateien aktualisiert.' -ForegroundColor Green
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
