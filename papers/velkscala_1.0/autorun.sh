#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

RSCRIPT_BIN="Rscript"
if [ -x "/c/Program Files/R/R-4.6.1/bin/Rscript.exe" ]; then
  RSCRIPT_BIN="/c/Program Files/R/R-4.6.1/bin/Rscript.exe"
fi

echo "============================================================================"
echo "  Velkscala 1.0 Manuscript Compilation Pipeline (papers/velkscala_1.0)"
echo "============================================================================"

"$RSCRIPT_BIN" -e "source('../../../core/framework/R/framework_init.R'); compile_velkscala_paper('main.Rmd', list(run_visualisations = TRUE, clean_staged_cls = TRUE, quiet = FALSE))"

echo ""
echo "[OK] Compiled papers/velkscala_1.0/main.pdf successfully."

