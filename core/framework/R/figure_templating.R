# ==============================================================================
# Figure Templating & PDF Embedding Framework (core/framework/R/figure_templating.R)
# ==============================================================================
# Provides academic figure templating, vector PDF + high-DPI PNG dual export,
# direct PDF page/document embedding, and height-constrained float formatting
# to prevent page overflow and vertical deadspace in PNAS/intellte layouts.
# ==============================================================================


#' Embeds one or more pages from an external PDF file directly into the document.
#'
#' @param arg0_pdf_path Path or defines key to the PDF file.
#' @param arg1_options Optional named list (`pages`, `caption`, `label`, `span_columns`, `width`, `max_height`, `placement`).
#' @return A `knitr::asis_output` object (or `knitr::include_graphics` in RStudio interactive mode).
#' @export
embed_pdf_document <- function (arg0_pdf_path, arg1_options = NULL) {
  #Convert from parameters
  pdf_path <- resolve_project_path(arg0_pdf_path)
  options <- if (!is.null(arg1_options)) arg1_options else list()

  #Initialise options
  caption_str <- if (!is.null(options$caption)) as.character(options$caption) else ""
  is_latex <- if (requireNamespace("knitr", quietly = TRUE)) knitr::is_latex_output() else FALSE
  label_str <- if (!is.null(options$label)) as.character(options$label) else ""
  max_height <- if (!is.null(options$max_height)) as.character(options$max_height) else "0.44\\textheight"
  pages_vec <- if (!is.null(options$pages)) as.integer(options$pages) else 1L
  placement <- if (!is.null(options$placement)) as.character(options$placement) else "!htbp"
  span_columns <- if (!is.null(options$span_columns)) isTRUE(options$span_columns) else TRUE
  width_str <- if (!is.null(options$width)) {
    as.character(options$width)
  } else if (span_columns) {
    "\\textwidth"
  } else {
    "\\columnwidth"
  }

  #Declare local instance variables
  env_name <- "figure"
  out_blocks <- character(0)
  png_fallback <- sub("\\.pdf$", ".png", pdf_path, ignore.case = TRUE)

  #Guard clauses
  if (!file.exists(pdf_path)) {
    if (file.exists(png_fallback)) {
      return(render_figure_template(png_fallback, options))
    }
    warning(sprintf("PDF file for embedding not found: %s", pdf_path))
    return(invisible(NULL))
  }

  if (!is_latex) {
    #In RStudio interactive / HTML preview, display PNG sibling if available, otherwise include PDF
    if (file.exists(png_fallback)) {
      return(knitr::include_graphics(png_fallback))
    }
    return(knitr::include_graphics(pdf_path))
  }

  for (idx in seq_along(pages_vec)) {
    pg <- pages_vec[idx]
    is_cont <- (idx > 1L)
    cap_tex <- sanitize_latex_text(caption_str)
    if (is_cont && nzchar(cap_tex)) {
      cap_tex <- paste0("\\textbf{(Continued, p. ", pg, ")} ", cap_tex)
    }
    lbl_tex <- if (!is_cont && nzchar(label_str)) paste0("\\label{", label_str, "}") else ""

    block_lines <- c(
      paste0("\\begin{", env_name, "}[", placement, "]"),
      if (is_cont) "\\addtocounter{figure}{-1}" else NULL,
      "\\centering",
      paste0(
        "\\includegraphics[page=", pg,
        ",width=", width_str,
        ",height=", max_height,
        ",keepaspectratio]{", pdf_path, "}"
      ),
      if (nzchar(cap_tex) || nzchar(lbl_tex)) paste0("\\caption{", cap_tex, lbl_tex, "}") else NULL,
      paste0("\\end{", env_name, "}")
    )
    out_blocks <- c(out_blocks, paste(block_lines, collapse = "\n"))
  }

  #Return statement
  return(knitr::asis_output(paste(out_blocks, collapse = "\n\n")))
}


#' Renders a figure (automatically preferring vector .pdf in LaTeX and .png in RStudio)
#' with aspect-ratio and vertical height constraints to prevent page deadspace.
#'
#' @param arg0_file_path Path or defines key to the figure (.png or .pdf).
#' @param arg1_options Optional named list (`caption`, `label`, `span_columns`, `width`, `max_height`, `placement`, `prefer_pdf`).
#' @return A `knitr::asis_output` object (in LaTeX) or `knitr::include_graphics` (in RStudio/HTML).
#' @export
render_figure_template <- function (arg0_file_path, arg1_options = NULL) {
  #Convert from parameters
  file_path <- resolve_project_path(arg0_file_path)
  options <- if (!is.null(arg1_options)) arg1_options else list()

  #Initialise options
  caption_str <- if (!is.null(options$caption)) as.character(options$caption) else ""
  is_latex <- if (requireNamespace("knitr", quietly = TRUE)) knitr::is_latex_output() else FALSE
  label_str <- if (!is.null(options$label)) as.character(options$label) else ""
  max_height <- if (!is.null(options$max_height)) as.character(options$max_height) else "none"
  placement <- if (!is.null(options$placement)) as.character(options$placement) else "!t"
  prefer_pdf <- if (!is.null(options$prefer_pdf)) isTRUE(options$prefer_pdf) else FALSE
  span_columns <- if (!is.null(options$span_columns)) isTRUE(options$span_columns) else TRUE
  width_str <- if (!is.null(options$width)) {
    as.character(options$width)
  } else if (span_columns) {
    "\\textwidth"
  } else {
    "\\columnwidth"
  }

  #Declare local instance variables
  chosen_path <- file_path
  env_name <- "figure"
  pdf_candidate <- sub("\\.(png|jpg|jpeg)$", ".pdf", file_path, ignore.case = TRUE)
  png_candidate <- sub("\\.pdf$", ".png", file_path, ignore.case = TRUE)

  if (is_latex && prefer_pdf && file.exists(pdf_candidate)) {
    chosen_path <- pdf_candidate
  } else if (!is_latex && file.exists(png_candidate)) {
    chosen_path <- png_candidate
  }

  #Guard clauses
  if (!file.exists(chosen_path)) {
    warning(sprintf("Figure file not found: %s", chosen_path))
    return(invisible(NULL))
  }

  if (!is_latex) {
    return(knitr::include_graphics(chosen_path))
  }

  cap_tex <- sanitize_latex_text(caption_str)
  lbl_tex <- if (nzchar(label_str)) paste0("\\label{", label_str, "}") else ""

  if (identical(placement, "inline") && !span_columns) {
    block_lines <- c(
      "\\par\\vspace{4pt}\\noindent\\begin{minipage}{\\columnwidth}",
      "\\centering",
      paste0(
        "\\includegraphics[width=", width_str,
        ",height=", max_height,
        ",keepaspectratio]{", chosen_path, "}"
      ),
      if (nzchar(cap_tex)) paste0("\\vspace{2pt}\\par\\footnotesize\\textbf{Figure:} ", cap_tex, "\\par") else NULL,
      "\\end{minipage}\\par\\vspace{4pt}"
    )
  } else {
    inc_args <- paste0("width=", width_str)
    if (!is.null(options$max_height) && nzchar(max_height) && !identical(max_height, "none")) {
      inc_args <- paste0(inc_args, ",height=", max_height, ",keepaspectratio")
    }
    block_lines <- c(
      paste0("\\begin{", env_name, "}[", placement, "]"),
      "\\centering",
      paste0("\\includegraphics[", inc_args, "]{", chosen_path, "}"),
      if (nzchar(cap_tex) || nzchar(lbl_tex)) paste0("\\caption{", cap_tex, lbl_tex, "}") else NULL,
      paste0("\\end{", env_name, "}")
    )
  }

  #Return statement
  return(knitr::asis_output(paste(block_lines, collapse = "\n")))
}


#' Combines multiple figures (PDF or PNG) into a single shared multi-panel float
#' to prevent float queue congestion and page deadspace.
#'
#' @param arg0_file_paths Character vector of paths or defines keys to figures.
#' @param arg1_options Optional named list (`caption`, `subcaptions`, `label`, `ncol`, `max_panel_height`, `placement`).
#' @return A `knitr::asis_output` object (or `knitr::include_graphics` in RStudio/HTML).
#' @export
render_multipanel_figure_template <- function (arg0_file_paths, arg1_options = NULL) {
  #Convert from parameters
  file_paths <- vapply(arg0_file_paths, resolve_project_path, character(1), USE.NAMES = FALSE)
  options <- if (!is.null(arg1_options)) arg1_options else list()

  #Initialise options
  caption_str <- if (!is.null(options$caption)) as.character(options$caption) else ""
  is_latex <- if (requireNamespace("knitr", quietly = TRUE)) knitr::is_latex_output() else FALSE
  label_str <- if (!is.null(options$label)) as.character(options$label) else ""
  max_panel_height <- if (!is.null(options$max_panel_height)) as.character(options$max_panel_height) else "0.40\\textheight"
  ncol_grid <- if (!is.null(options$ncol)) max(1L, as.integer(options$ncol)) else 1L
  placement <- if (!is.null(options$placement)) as.character(options$placement) else "!t"
  subcaptions <- options$subcaptions

  #Declare local instance variables
  chosen_paths <- character(length(file_paths))

  for (i in seq_along(file_paths)) {
    p <- file_paths[i]
    pdf_cand <- sub("\\.(png|jpg|jpeg)$", ".pdf", p, ignore.case = TRUE)
    png_cand <- sub("\\.pdf$", ".png", p, ignore.case = TRUE)
    if (is_latex && file.exists(pdf_cand)) {
      chosen_paths[i] <- pdf_cand
    } else if (!is_latex && file.exists(png_cand)) {
      chosen_paths[i] <- png_cand
    } else {
      chosen_paths[i] <- p
    }
  }

  chosen_paths <- chosen_paths[file.exists(chosen_paths)]
  if (length(chosen_paths) == 0) return(invisible(NULL))

  if (!is_latex) {
    return(knitr::include_graphics(chosen_paths))
  }

  panel_width_frac <- round(0.96 / ncol_grid, 3)
  cap_tex <- sanitize_latex_text(caption_str)
  lbl_tex <- if (nzchar(label_str)) paste0("\\label{", label_str, "}") else ""

  block_lines <- c(
    paste0("\\begin{figure}[", placement, "]"),
    "\\centering"
  )

  for (i in seq_along(chosen_paths)) {
    block_lines <- c(
      block_lines,
      paste0("\\begin{minipage}[t]{", panel_width_frac, "\\textwidth}"),
      "\\centering",
      paste0(
        "\\includegraphics[width=\\textwidth,height=", max_panel_height,
        ",keepaspectratio]{", chosen_paths[i], "}"
      )
    )
    if (!is.null(subcaptions) && length(subcaptions) >= i && nzchar(subcaptions[i])) {
      block_lines <- c(
        block_lines,
        paste0("\\par\\vspace{1pt}\\scriptsize\\textbf{(", LETTERS[i], ")} ", sanitize_latex_text(subcaptions[i]), "\\par")
      )
    }
    block_lines <- c(block_lines, "\\end{minipage}")
    if (i %% ncol_grid == 0L && i < length(chosen_paths)) {
      block_lines <- c(block_lines, "\\par\\vspace{6pt}")
    } else if (i < length(chosen_paths)) {
      block_lines <- c(block_lines, "\\hfill")
    }
  }

  if (nzchar(cap_tex) || nzchar(lbl_tex)) {
    block_lines <- c(block_lines, paste0("\\caption{", cap_tex, lbl_tex, "}"))
  }
  block_lines <- c(block_lines, "\\end{figure}")

  #Return statement
  return(knitr::asis_output(paste(block_lines, collapse = "\n")))
}


#' Saves a ggplot2/patchwork plot to both high-DPI PNG and vector PDF in
#' `data/3.data_visualisation/images/` and mirrors them into `visuals/`.
#'
#' @param arg0_plot A ggplot or patchwork object.
#' @param arg1_stem_name Base filename stem without extension (e.g. `"cdt_proxy_vs_empirical"`).
#' @param arg2_options Optional named list (`width`, `height`, `dpi`, `defines`, `extra_dirs`).
#' @return Named list of saved file paths (`png`, `pdf`, `visuals_png`, `visuals_pdf`).
#' @export
save_dual_plot <- function (arg0_plot, arg1_stem_name, arg2_options = NULL) {
  #Convert from parameters
  plot_obj <- arg0_plot
  stem_name <- sub("\\.(png|pdf)$", "", as.character(arg1_stem_name), ignore.case = TRUE)
  options <- if (!is.null(arg2_options)) arg2_options else list()

  #Initialise options
  defines <- if (!is.null(options$defines)) options$defines else load_filepath_defines()
  dpi <- if (!is.null(options$dpi)) as.integer(options$dpi) else 220L
  export_pdf <- if (!is.null(options$export_pdf)) isTRUE(options$export_pdf) else FALSE
  extra_dirs <- if (!is.null(options$extra_dirs)) as.character(options$extra_dirs) else character(0)
  height <- if (!is.null(options$height)) as.numeric(options$height) else 10.0
  width <- if (!is.null(options$width)) as.numeric(options$width) else 16.0

  #Declare local instance variables
  fonts_dir <- file.path(defines$directories$rticles_intellte_resources, "fonts")
  images_dir <- defines$directories$data_images
  visuals_dir <- defines$directories$visuals

  #Register Karla font family for ggplot2 rendering
  if (requireNamespace("sysfonts", quietly = TRUE) && requireNamespace("showtext", quietly = TRUE)) {
    karla_reg <- file.path(fonts_dir, "Karla-Regular.ttf")
    karla_bold <- file.path(fonts_dir, "Karla-Bold.ttf")
    karla_it <- file.path(fonts_dir, "Karla-Italic.ttf")
    karla_bi <- file.path(fonts_dir, "Karla-BoldItalic.ttf")
    if (file.exists(karla_reg) && !("Karla" %in% sysfonts::font_families())) {
      tryCatch({
        sysfonts::font_add(
          family = "Karla",
          regular = karla_reg,
          bold = if (file.exists(karla_bold)) karla_bold else karla_reg,
          italic = if (file.exists(karla_it)) karla_it else karla_reg,
          bolditalic = if (file.exists(karla_bi)) karla_bi else karla_reg
        )
      }, error = function (e) NULL)
    }
    showtext::showtext_opts(dpi = dpi)
    showtext::showtext_auto(enable = TRUE)
  }

  if (!dir.exists(images_dir)) dir.create(images_dir, recursive = TRUE)
  if (!dir.exists(visuals_dir)) dir.create(visuals_dir, recursive = TRUE)

  out_png_tmp <- file.path(images_dir, paste0(stem_name, ".tmp.png"))
  out_png <- file.path(images_dir, paste0(stem_name, ".png"))
  vis_png <- file.path(visuals_dir, paste0(stem_name, ".png"))

  #Save high-DPI PNG atomically (no intermediate .pdf files in test_cdt or test_ndt)
  ggplot2::ggsave(out_png_tmp, plot = plot_obj, width = width, height = height, dpi = dpi)
  file.copy(out_png_tmp, out_png, overwrite = TRUE)
  file.copy(out_png_tmp, vis_png, overwrite = TRUE)
  for (d in extra_dirs) {
    if (dir.exists(d)) file.copy(out_png_tmp, file.path(d, paste0(stem_name, ".png")), overwrite = TRUE)
  }
  unlink(out_png_tmp)

  if (export_pdf) {
    out_pdf_tmp <- file.path(images_dir, paste0(stem_name, ".tmp.pdf"))
    out_pdf <- file.path(images_dir, paste0(stem_name, ".pdf"))
    pdf_dev <- if (capabilities("cairo")) grDevices::cairo_pdf else "pdf"
    tryCatch({
      ggplot2::ggsave(out_pdf_tmp, plot = plot_obj, width = width, height = height, device = pdf_dev)
    }, error = function (e) {
      ggplot2::ggsave(out_pdf_tmp, plot = plot_obj, width = width, height = height, device = "pdf")
    })
    if (file.exists(out_pdf_tmp)) {
      file.copy(out_pdf_tmp, out_pdf, overwrite = TRUE)
      unlink(out_pdf_tmp)
    }
  }

  #Return statement
  return(list(
    png = normalizePath(out_png, winslash = "/", mustWork = FALSE),
    visuals_png = normalizePath(vis_png, winslash = "/", mustWork = FALSE)
  ))
}

