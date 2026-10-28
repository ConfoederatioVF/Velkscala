# ==============================================================================
# Velkscala R Framework Bootstrapper (core/framework/R/framework_init.R)
# ==============================================================================
# Sources all core/framework/R/ templating, PDF embedding, pagination, and
# intellte/rticles modules and initialises `velkscala_defines` in the session.
# ==============================================================================

local({
  #Locate core/framework/R directory relative to this script or project root
  init_dir <- NULL
  for (i in sys.nframe():1) {
    ofile <- sys.frame(i)$ofile
    if (!is.null(ofile) && nzchar(ofile)) {
      init_dir <- dirname(normalizePath(ofile, winslash = "/", mustWork = FALSE))
      break
    }
  }
  if (is.null(init_dir)) {
    #Fallback search from working directory
    cand1 <- file.path(getwd(), "core", "framework", "R")
    cand2 <- file.path(getwd(), "..", "..", "core", "framework", "R")
    if (dir.exists(cand1)) {
      init_dir <- normalizePath(cand1, winslash = "/")
    } else if (dir.exists(cand2)) {
      init_dir <- normalizePath(cand2, winslash = "/")
    }
  }

  module_files <- c(
    "filepath_loader.R",
    "layout_pagination.R",
    "table_templating.R",
    "figure_templating.R",
    "prose_templating.R",
    "intellte_format.R"
  )

  for (mod in module_files) {
    mod_path <- file.path(init_dir, mod)
    if (file.exists(mod_path)) {
      source(mod_path, local = FALSE, encoding = "UTF-8")
    } else {
      stop(sprintf("Required R framework module missing: %s", mod_path))
    }
  }
})

#Load global filepath defines and stage intellte resources if knitting
velkscala_defines <- load_filepath_defines()
stage_intellte_resources(NULL, velkscala_defines)

if (requireNamespace("knitr", quietly = TRUE)) {
  knitr::opts_chunk$set(
    echo = FALSE,
     eval = TRUE,
    fig.align = "center",
    message = FALSE,
    warning = FALSE
  )
}

