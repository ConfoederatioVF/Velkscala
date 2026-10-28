@echo off
setlocal
cd /d "%~dp0"

set "RSCRIPT_BIN=C:\Program Files\R\R-4.6.1\bin\Rscript.exe"
if not exist "%RSCRIPT_BIN%" (
  set "RSCRIPT_BIN=Rscript"
)

echo ============================================================================
echo   Velkscala 1.0 Manuscript Compilation Pipeline (papers/velkscala_1.0)
echo ============================================================================

"%RSCRIPT_BIN%" -e "source('../../core/framework/R/framework_init.R'); compile_velkscala_paper('main.Rmd', list(run_visualisations = TRUE, clean_staged_cls = TRUE, quiet = FALSE))"

if %ERRORLEVEL% neq 0 (
  echo.
  echo [ERROR] Manuscript compilation failed with exit code %ERRORLEVEL%.
  exit /b %ERRORLEVEL%
)

echo.
echo [OK] Compiled papers/velkscala_1.0/main.pdf successfully.
endlocal

