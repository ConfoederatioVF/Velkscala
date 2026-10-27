@echo off
title Velkscala - OpenTUI Orchestrator (Port 16000)
cd /d "%~dp0"

if not exist "node_modules\" (
  echo [Velkscala] Installing npm dependencies...
  call npm install
)

set NODE_OPTIONS=--max-old-space-size=8192
echo [Velkscala] Starting OpenTUI Orchestrator and Vite Server on http://127.0.0.1:16000 ...
node main.js %*

