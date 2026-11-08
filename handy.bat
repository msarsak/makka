@echo off
chcp 65001 >nul
title HEPHAESTION - Handy-Modus
cd /d "%~dp0"
echo.
echo   ===== HEPHAESTION · HANDY-MODUS =====
echo.

where node >nul 2>nul
if errorlevel 1 ( echo   [FEHLER] Node.js fehlt: https://nodejs.org & pause & exit /b 1 )
if not exist ".env" ( node scripts\setup.js )
if not exist "node_modules" ( call npm install --no-fund --no-audit )

rem Tailscale suchen
where tailscale >nul 2>nul
if errorlevel 1 if exist "%ProgramFiles%\Tailscale\tailscale.exe" set "PATH=%PATH%;%ProgramFiles%\Tailscale"
where tailscale >nul 2>nul
if errorlevel 1 (
  echo   [INFO] Tailscale ist noch nicht installiert.
  echo   1. Auf dem Laptop: https://tailscale.com/download  installieren und anmelden
  echo   2. Auf dem Handy: App "Tailscale" installieren und mit DEMSELBEN Konto anmelden
  echo   3. Danach handy.bat nochmal starten.
  pause
  exit /b 1
)

echo   Baue die App ...
call npx vite build
if errorlevel 1 ( echo   [FEHLER] Build fehlgeschlagen. & pause & exit /b 1 )

echo   Starte Hephaestion im Hintergrund-Fenster ...
start "HEPHAESTION Server (offen lassen)" cmd /k "node server\index.js"
timeout /t 3 >nul

echo   Gebe Hephaestion sicher fuer deine Geraete frei (nur in deinem Tailscale-Netz) ...
tailscale serve --bg 3000
if errorlevel 1 (
  echo   [HINWEIS] Falls oben ein Link steht: oeffnen und "HTTPS" bzw. "Serve" erlauben, dann handy.bat nochmal starten.
  pause
  exit /b 1
)

for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "(tailscale status --json | ConvertFrom-Json).Self.DNSName.TrimEnd('.')"`) do set "TSNAME=%%A"
echo.
echo   =============================================
echo     Auf dem Handy oeffnen:
echo     https://%TSNAME%
echo   =============================================
echo   Dann im Browser-Menue "Zum Startbildschirm hinzufuegen" waehlen.
echo   Laptop: http://127.0.0.1:3000
echo.
echo   Freigabe beenden: tailscale serve reset
start "" "http://127.0.0.1:3000"
pause
