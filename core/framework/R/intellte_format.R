# ==============================================================================
# Intellte / rticles Output Format & Compilation (core/framework/R/intellte_format.R)
# ==============================================================================
# Bridges core/rticles/intellte/ (borrowed from rticles::pnas_article) with the
# Velkscala R framework, staging LaTeX class/style assets for both RStudio Knit
# and command-line autorun.bat compilation.
# ==============================================================================


#' Compiles an RMarkdown paper (e.g. `papers/velkscala_1.0/main.Rmd`) into PDF,
#' optionally executing visualisation scripts beforehand so all figures are fresh.
#'
#' @param arg0_rmd_path Path or defines key to the target `.Rmd` file.
#' @param arg1_options Optional named list (`run_visualisations`, `clean_staged_cls`, `quiet`).
#' @return Normalised path to the compiled output PDF.
#' @export
compile_velkscala_paper <- function (arg0_rmd_path = "velkscala_1_0_rmd", arg1_options = NULL) {
  #Convert from parameters
  defines <- load_filepath_defines()
  rmd_path <- resolve_project_path(arg0_rmd_path, defines)
  options <- if (!is.null(arg1_options)) arg1_options else list()

  #Initialise options
  clean_staged_cls <- if (!is.null(options$clean_staged_cls)) isTRUE(options$clean_staged_cls) else TRUE
  quiet_flag <- if (!is.null(options$quiet)) isTRUE(options$quiet) else FALSE
  run_visualisations <- if (!is.null(options$run_visualisations)) isTRUE(options$run_visualisations) else TRUE

  #Declare local instance variables
  paper_dir <- dirname(rmd_path)
  staged_files <- character(0)

  #Guard clauses
  if (!file.exists(rmd_path)) {
    stop(sprintf("Target RMarkdown file not found: %s", rmd_path))
  }

  if (run_visualisations) {
    cdt_script <- defines$paths$cdt_plot_script
    ndt_script <- defines$paths$ndt_plot_script
    if (file.exists(cdt_script)) {
      message("[Velkscala] Rendering CDT validation figures (PNG + PDF)...")
      sys.source(cdt_script, envir = new.env(parent = globalenv()))
    }
    if (file.exists(ndt_script)) {
      message("[Velkscala] Rendering NDT paleodemographic figures (PNG + PDF)...")
      sys.source(ndt_script, envir = new.env(parent = globalenv()))
    }
  }

  staged_files <- stage_intellte_resources(paper_dir, defines)
  if (clean_staged_cls) {
    on.exit({
      transient_assets <- c(
        "pnas-new.cls",
        "pnasresearcharticle.sty",
        "widetext.sty",
        "pnas.csl",
        "crd-mla-numeric.csl",
        "crd_logo.png",
        "pnas-sample.bib"
      )
      for (fname in transient_assets) {
        f_path <- file.path(paper_dir, fname)
        if (file.exists(f_path)) unlink(f_path)
      }
    }, add = TRUE)
  }

  message(sprintf("[Velkscala] Compiling RMarkdown manuscript: %s ...", rmd_path))
  out_pdf <- rmarkdown::render(
    input = rmd_path,
    output_dir = paper_dir,
    envir = new.env(parent = globalenv()),
    quiet = quiet_flag
  )

  #Clean auxiliary LaTeX build files (.log, .aux, .out, .bbl, .blg, .fls, .fdb_latexmk)
  aux_exts <- c("aux", "bbl", "blg", "fdb_latexmk", "fls", "log", "out", "synctex.gz", "tex")
  stem <- tools::file_path_sans_ext(basename(rmd_path))
  for (ext in aux_exts) {
    aux_cand <- file.path(paper_dir, paste0(stem, ".", ext))
    if (file.exists(aux_cand)) unlink(aux_cand)
  }

  message(sprintf("[Velkscala] Successfully compiled PDF: %s", out_pdf))

  #Return statement
  return(normalizePath(out_pdf, winslash = "/", mustWork = FALSE))
}


#' Custom RMarkdown output format wrapper for `core/rticles/intellte/`.
#'
#' @param ... Additional arguments passed to `rticles::pnas_article` or `rmarkdown::pdf_document`.
#' @param keep_tex Logical; whether to keep the intermediate `.tex` file.
#' @param latex_engine Character; LaTeX engine to use (defaults to `"xelatex"` for Jost* and Source Serif 4 fonts).
#' @return An RMarkdown output format object.
#' @export
intellte_article <- function (..., keep_tex = FALSE, latex_engine = "xelatex") {
  #Declare local instance variables
  defines <- load_filepath_defines()
  template_path <- file.path(defines$directories$rticles_intellte_resources, "template.tex")

  #Ensure TEXINPUTS includes the intellte skeleton directory
  stage_intellte_resources(NULL, defines)

  if (requireNamespace("rticles", quietly = TRUE)) {
    fmt <- rticles::pnas_article(
      ...,
      keep_tex = keep_tex,
      latex_engine = latex_engine,
      pandoc_args = c("--metadata=link-citations:true"),
      template = template_path
    )
  } else {
    fmt <- rmarkdown::pdf_document(
      ...,
      keep_tex = keep_tex,
      latex_engine = latex_engine,
      pandoc_args = c("--metadata=link-citations:true"),
      template = template_path
    )
  }

  #Return statement
  return(fmt)
}


#' Configures TEXINPUTS/BIBINPUTS and stages `core/rticles/intellte/skeleton/`
#' class and style files into the target render directory so `pdflatex` resolves
#' `pnas-new.cls`, `pnasresearcharticle.sty`, `widetext.sty`, and `pnas.csl` in RStudio.
#'
#' @param arg0_target_dir Optional directory where RMarkdown is rendering (defaults to knitr input dir).
#' @param arg1_defines Optional loaded defines list.
#' @return Character vector of newly copied files in `arg0_target_dir` (for optional cleanup).
#' @export
stage_intellte_resources <- function (arg0_target_dir = NULL, arg1_defines = NULL) {
  #Convert from parameters
  defines <- if (!is.null(arg1_defines)) arg1_defines else load_filepath_defines()
  target_dir <- arg0_target_dir

  #Declare local instance variables
  copied_files <- character(0)
  res_dir <- defines$directories$rticles_intellte_resources
  skel_dir <- defines$directories$rticles_intellte_skeleton

  if (is.null(target_dir) && requireNamespace("knitr", quietly = TRUE)) {
    knit_in <- tryCatch(knitr::current_input(dir = TRUE), error = function (e) NULL)
    if (!is.null(knit_in) && nzchar(knit_in)) {
      target_dir <- dirname(knit_in)
    }
  }

  #Prepend intellte skeleton & resources directories to TEXINPUTS, BIBINPUTS, BSTINPUTS
  path_sep <- if (.Platform$OS.type == "windows") ";" else ":"
  curr_tex <- Sys.getenv("TEXINPUTS", unset = "")
  new_tex <- paste(c(skel_dir, res_dir, curr_tex, ""), collapse = path_sep)
  Sys.setenv(
    BIBINPUTS = new_tex,
    BSTINPUTS = new_tex,
    TEXINPUTS = new_tex
  )

  #Also copy required LaTeX class/style/csl assets into target_dir if missing
  if (!is.null(target_dir) && dir.exists(target_dir) && dir.exists(skel_dir)) {
    asset_names <- c(
      "pnas-new.cls",
      "pnasresearcharticle.sty",
      "widetext.sty",
      "pnas.csl",
      "crd-mla-numeric.csl",
      "crd_logo.png",
      "pnas-sample.bib"
    )
    for (fname in asset_names) {
      src_file <- file.path(skel_dir, fname)
      dst_file <- file.path(target_dir, fname)
      if (file.exists(src_file)) {
        file.copy(src_file, dst_file, overwrite = TRUE)
        copied_files <- c(copied_files, dst_file)
      }
    }
  }

  #Return statement
  return(copied_files)
}

