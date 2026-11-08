@echo off
chcp 65001 >nul
title HEPHAESTION
cd /d "%~dp0"
echo.
echo   =========================================
echo        H E P H A E S T I O N   startet ...
echo   =========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [FEHLER] Node.js ist nicht installiert.
  echo   Bitte installieren: https://nodejs.org  ^(Version "LTS"^)
  echo   Danach dieses Fenster schliessen und start.bat erneut oeffnen.
  pause
  exit /b 1
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo   [INFO] Datei .env wurde angelegt. Trage dort deinen API-Key ein.
  echo.
)

if not exist "node_modules" (
  echo   Installiere Bausteine ^(nur beim ersten Start, ca. 1 Minute^) ...
  call npm install
  if errorlevel 1 ( echo   [FEHLER] Installation fehlgeschlagen. & pause & exit /b 1 )
)

echo   Browser oeffnet gleich: http://localhost:5173
echo   Zum Beenden dieses Fenster schliessen.
echo.
start "" cmd /c "timeout /t 4 >nul & start http://localhost:5173"
call npm run dev
pause
