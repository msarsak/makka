@echo off
chcp 65001 >nul
title HEPHAESTION - Einrichtung
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo   [FEHLER] Node.js ist nicht installiert: https://nodejs.org
  pause
  exit /b 1
)
node scripts\setup.js
echo   Teste jetzt den Claude-Key ...
if not exist "node_modules" call npm install
call npm run check-key
echo.
echo   Fertig! Jetzt start.bat doppelklicken.
pause
