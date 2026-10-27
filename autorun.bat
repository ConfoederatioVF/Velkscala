@echo off
chcp 65001 >nul
title Velkscala - Web Orchestrator (Port 16000)
cd /d "%~dp0"

if not exist "node_modules\" (
  echo [Velkscala] Installing npm dependencies...
  call npm install
)

set NODE_OPTIONS=--max-old-space-size=8192
node main.js %*

if errorlevel 1 (
  echo.
  echo [Velkscala] Process exited with error code %errorlevel%.
  pause
)
