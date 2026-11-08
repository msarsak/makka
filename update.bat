@echo off
chcp 65001 >nul
title HEPHAESTION - Update
cd /d "%~dp0"
echo.
echo   ===== HEPHAESTION · UPDATE =====
echo   Bitte vorher das Hephaestion-Fenster (start.bat) schliessen.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update.ps1"
if errorlevel 1 (
  echo   [FEHLER] Update hat nicht geklappt. Internet pruefen und nochmal versuchen.
  pause
  exit /b 1
)
echo   Installiere neue Bausteine ...
call npm install --no-fund --no-audit
echo.
echo   Fertig! Jetzt start.bat doppelklicken.
pause
