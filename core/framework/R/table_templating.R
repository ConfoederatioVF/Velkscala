# ==============================================================================
# Table Templating Framework (core/framework/R/table_templating.R)
# ==============================================================================
# Provides CRD working paper table templating:
# - Borderless, minimally intrusive tables (no horizontal or vertical rules)
# - Headers set in Karla Bold (\karlabold)
# - Data cells set in non-bold Source Serif 4 (\normalfont\rmfamily\mdseries)
# - Captions always placed underneath the table and centred
# ==============================================================================


#' Formats and sanitises a single table cell according to CRD typography norms.
#' Headers use Karla Bold; all data cells underneath are non-bold Source Serif 4.
#'
#' @param arg0_val Raw cell value.
#' @param arg1_col_index Integer 1-based column index.
#' @param arg2_options Optional named list (`bold_first_col`, `euro_decimals`, `is_latex`, `is_header`).
#' @return Formatted cell string safe for LaTeX or Markdown/HTML rendering.
#' @export
format_table_cell <- function (arg0_val, arg1_col_index = 1L, arg2_options = NULL) {
  #Convert from parameters
  val <- if (is.null(arg0_val) || is.na(arg0_val)) "---" else as.character(arg0_val)
  col_index <- as.integer(arg1_col_index)
  options <- if (!is.null(arg2_options)) arg2_options else list()

  #Initialise options
  bold_first_col <- if (!is.null(options$bold_first_col)) isTRUE(options$bold_first_col) else FALSE
  euro_decimals <- if (!is.null(options$euro_decimals)) isTRUE(options$euro_decimals) else TRUE
  is_header <- if (!is.null(options$is_header)) isTRUE(options$is_header) else FALSE
  is_latex <- if (!is.null(options$is_latex)) isTRUE(options$is_latex) else TRUE

  #Declare local instance variables
  clean_val <- trimws(val)

  #Strip existing markdown bold markers (**...**) so data cells remain non-bold
  clean_val <- gsub("\\*\\*", "", clean_val)

  if (euro_decimals && !is_header) {
    clean_val <- convert_euro_decimals_in_text(clean_val)
  }

  if (is_latex) {
    if (is_header) {
      if (grepl("\n", clean_val, fixed = TRUE)) {
        header_parts <- unlist(strsplit(clean_val, "\n", fixed = TRUE))
        header_parts <- vapply(header_parts, function (hp) sanitize_latex_text(trimws(hp)), character(1))
        return(paste0(
          "{\\karlabold\\begin{tabular}[t]{@{}l@{}}",
          paste(header_parts, collapse = " \\\\[-2pt] "),
          "\\end{tabular}}"
        ))
      }
      clean_val <- sanitize_latex_text(clean_val)
      return(paste0("{\\karlabold ", clean_val, "}"))
    }
    clean_val <- sanitize_latex_text(clean_val)
    if (bold_first_col && col_index == 1L) {
      return(paste0("{\\normalfont\\rmfamily\\bfseries ", clean_val, "}"))
    }
    return(paste0("{\\normalfont\\rmfamily\\mdseries ", clean_val, "}"))
  } else {
    clean_val <- gsub("\n", " ", clean_val, fixed = TRUE)
    if (is_header || (bold_first_col && col_index == 1L)) {
      return(paste0("**", clean_val, "**"))
    }
    return(clean_val)
  }
}


#' Renders a group of sub-tables (e.g. multi-region NDT trajectories) packed tightly onto
#' shared single-column pages without horizontal rules and with centred captions underneath.
#'
#' @param arg0_subtables_list List of sub-table items (`list(title = ..., df = ...)`).
#' @param arg1_options Optional named list (`caption`, `label`, `col_names`, `align`, `font_size`, `max_rows_per_page`, `footnote`).
#' @return A `knitr::asis_output` object (in LaTeX/Rmd) or list of formatted tables (in interactive RStudio).
#' @export
render_packed_subtables <- function (arg0_subtables_list, arg1_options = NULL) {
  #Convert from parameters
  subtables_list <- arg0_subtables_list
  options <- if (!is.null(arg1_options)) arg1_options else list()

  #Initialise options
  base_caption <- if (!is.null(options$caption)) as.character(options$caption) else "Composite Validation Table"
  base_label <- if (!is.null(options$label)) as.character(options$label) else "tab:composite"
  col_names <- options$col_names
  euro_decimals <- if (!is.null(options$euro_decimals)) isTRUE(options$euro_decimals) else TRUE
  font_size <- if (!is.null(options$font_size)) as.character(options$font_size) else "normalsize"
  is_latex <- if (requireNamespace("knitr", quietly = TRUE)) knitr::is_latex_output() else FALSE
  max_rows_per_page <- if (!is.null(options$max_rows_per_page)) as.integer(options$max_rows_per_page) else 34L
  first_page_max_rows <- if (!is.null(options$first_page_max_rows)) as.integer(options$first_page_max_rows) else max_rows_per_page
  placement <- if (!is.null(options$placement)) as.character(options$placement) else "!htbp"

  #Declare local instance variables
  out_blocks <- character(0)
  packed_pages <- pack_subtables_onto_pages(
    subtables_list,
    list(
      first_page_max_rows = first_page_max_rows,
      max_rows_per_page = max_rows_per_page,
      subtable_overhead = 2L
    )
  )

  #Guard clauses
  if (length(packed_pages) == 0) return(invisible(NULL))

  if (!is_latex) {
    #RStudio interactive / HTML preview mode
    md_lines <- character(0)
    for (p in seq_along(packed_pages)) {
      page_items <- packed_pages[[p]]
      for (s in seq_along(page_items)) {
        item <- page_items[[s]]
        local_df <- as.data.frame(item$df, stringsAsFactors = FALSE)
        if (!is.null(col_names) && length(col_names) == ncol(local_df)) {
          colnames(local_df) <- col_names
        }
        for (c_idx in seq_len(ncol(local_df))) {
          local_df[[c_idx]] <- vapply(
            local_df[[c_idx]],
            function (v) format_table_cell(v, c_idx, list(bold_first_col = FALSE, euro_decimals = euro_decimals, is_latex = FALSE)),
            character(1)
          )
        }
        md_lines <- c(
          md_lines,
          paste0("\n#### ", item$title, "\n"),
          as.character(knitr::kable(local_df, format = "markdown", caption = if (p == 1L && s == 1L) base_caption else NULL))
        )
      }
    }
    return(knitr::asis_output(paste(md_lines, collapse = "\n")))
  }

  #LaTeX mode: emit one borderless table per packed page with caption underneath
  for (p in seq_along(packed_pages)) {
    page_items <- packed_pages[[p]]
    first_df <- as.data.frame(page_items[[1]]$df, stringsAsFactors = FALSE)
    n_cols <- ncol(first_df)
    headers <- if (!is.null(col_names) && length(col_names) == n_cols) col_names else colnames(first_df)
    align_str <- paste(rep("l", n_cols), collapse = "")

    header_cells <- vapply(
      seq_len(n_cols),
      function (c_idx) format_table_cell(headers[c_idx], c_idx, list(is_header = TRUE, is_latex = TRUE)),
      character(1)
    )
    header_line <- paste0(paste(header_cells, collapse = " & "), " \\\\[4pt]")

    cap_str <- sanitize_latex_text(base_caption)
    if (p > 1L) {
      cap_str <- paste0("(Continued) ", cap_str)
    }

    block_lines <- c(
      paste0("\\begin{table}[", placement, "]"),
      if (p > 1L) "\\addtocounter{table}{-1}" else NULL,
      "\\centering",
      "\\fontsize{10pt}{15pt}\\selectfont\\normalfont\\rmfamily\\mdseries",
      "\\setlength{\\tabcolsep}{2.5pt}",
      "\\renewcommand{\\arraystretch}{1.0}",
      paste0("\\begin{tabular*}{\\textwidth}{@{\\extracolsep{\\fill}}", align_str, "@{}}"),
      header_line
    )

    for (s in seq_along(page_items)) {
      item <- page_items[[s]]
      local_df <- as.data.frame(item$df, stringsAsFactors = FALSE)
      panel_title <- sanitize_latex_text(item$title)
      block_lines <- c(
        block_lines,
        if (s > 1L) "\\addlinespace[4pt]" else NULL,
        paste0("\\multicolumn{", n_cols, "}{@{}l}{\\karlabold ", panel_title, "} \\\\[2pt]")
      )

      for (r_idx in seq_len(nrow(local_df))) {
        row_cells <- vapply(
          seq_len(n_cols),
          function (c_idx) {
            format_table_cell(
              local_df[r_idx, c_idx],
              c_idx,
              list(bold_first_col = FALSE, euro_decimals = euro_decimals, is_latex = TRUE)
            )
          },
          character(1)
        )
        block_lines <- c(block_lines, paste0(paste(row_cells, collapse = " & "), " \\\\"))
      }
    }

    block_lines <- c(
      block_lines,
      "\\end{tabular*}",
      paste0("\\caption{", cap_str, "}"),
      if (p == 1L && nzchar(base_label)) paste0("\\label{", base_label, "}") else NULL,
      "\\end{table}"
    )

    if (p < length(packed_pages)) {
      block_lines <- c(block_lines, "\\clearpage")
    }
    out_blocks <- c(out_blocks, paste(block_lines, collapse = "\n"))
  }

  #Return statement
  return(knitr::asis_output(paste(out_blocks, collapse = "\n\n")))
}


#' Renders a single data frame using the CRD borderless table template:
#' Karla Bold headers, non-bold Source Serif 4 body cells, no rules, and centred caption underneath.
#'
#' @param arg0_df Data frame to render.
#' @param arg1_options Optional named list (`caption`, `label`, `col_names`, `align`, `span_columns`,
#'   `placement`, `font_size`, `scale_to_fit`, `max_rows_per_page`, `bold_first_col`, `euro_decimals`, `footnote`).
#' @return A `knitr::asis_output` object containing the rendered LaTeX or Markdown/HTML table.
#' @export
render_table_template <- function (arg0_df, arg1_options = NULL) {
  #Convert from parameters
  df <- as.data.frame(arg0_df, stringsAsFactors = FALSE)
  options <- if (!is.null(arg1_options)) arg1_options else list()

  #Initialise options
  bold_first_col <- if (!is.null(options$bold_first_col)) isTRUE(options$bold_first_col) else FALSE
  caption_str <- if (!is.null(options$caption)) as.character(options$caption) else ""
  col_names <- if (!is.null(options$col_names)) as.character(options$col_names) else colnames(df)
  euro_decimals <- if (!is.null(options$euro_decimals)) isTRUE(options$euro_decimals) else TRUE
  font_size <- if (!is.null(options$font_size)) as.character(options$font_size) else "normalsize"
  is_latex <- if (requireNamespace("knitr", quietly = TRUE)) knitr::is_latex_output() else FALSE
  label_str <- if (!is.null(options$label)) as.character(options$label) else ""
  placement <- if (!is.null(options$placement)) as.character(options$placement) else "!htbp"
  scale_to_fit <- if (!is.null(options$scale_to_fit)) isTRUE(options$scale_to_fit) else FALSE
  span_columns <- if (!is.null(options$span_columns)) isTRUE(options$span_columns) else TRUE
  max_rows_per_page <- if (!is.null(options$max_rows_per_page)) {
    as.integer(options$max_rows_per_page)
  } else {
    calculate_page_budget(list(font_size = font_size, two_column = FALSE))$max_table_rows
  }

  #Declare local instance variables
  chunks <- split_dataframe_for_pages(df, list(max_rows_per_page = max_rows_per_page))
  n_cols <- ncol(df)
  out_blocks <- character(0)

  #Guard clauses
  if (nrow(df) == 0 || n_cols == 0) return(invisible(NULL))

  if (!is_latex) {
    #RStudio interactive preview / HTML output
    disp_df <- df
    if (length(col_names) == n_cols) colnames(disp_df) <- col_names
    for (c_idx in seq_len(n_cols)) {
      disp_df[[c_idx]] <- vapply(
        disp_df[[c_idx]],
        function (v) format_table_cell(v, c_idx, list(bold_first_col = bold_first_col, euro_decimals = euro_decimals, is_latex = FALSE)),
        character(1)
      )
    }
    kb <- knitr::kable(disp_df, format = "markdown", caption = if (nzchar(caption_str)) caption_str else NULL)
    return(knitr::asis_output(paste(as.character(kb), collapse = "\n")))
  }

  #CRD tables use left-aligned columns matching body text
  align_str <- paste(rep("l", n_cols), collapse = "")

  header_cells <- vapply(
    seq_len(n_cols),
    function (c_idx) format_table_cell(col_names[c_idx], c_idx, list(is_header = TRUE, is_latex = TRUE)),
    character(1)
  )
  header_line <- paste0(paste(header_cells, collapse = " & "), " \\\\[5pt]")
  env_name <- "table"
  target_width <- "\\textwidth"

  for (ch_idx in seq_along(chunks)) {
    chunk_obj <- chunks[[ch_idx]]
    chunk_df <- chunk_obj$df
    is_cont <- chunk_obj$is_continued

    cap_tex <- sanitize_latex_text(caption_str)
    if (is_cont && nzchar(cap_tex)) {
      cap_tex <- paste0("(Continued) ", cap_tex)
    }

    block_lines <- c(
      paste0("\\begin{", env_name, "}[", placement, "]"),
      if (is_cont) "\\addtocounter{table}{-1}" else NULL,
      "\\centering",
      "\\fontsize{10pt}{15pt}\\selectfont\\normalfont\\rmfamily\\mdseries",
      "\\setlength{\\tabcolsep}{2.5pt}",
      "\\renewcommand{\\arraystretch}{1.0}"
    )

    if (scale_to_fit) {
      block_lines <- c(
        block_lines,
        paste0("\\resizebox{", target_width, "}{!}{\\begin{tabular}{@{}", align_str, "@{}}")
      )
    } else {
      block_lines <- c(
        block_lines,
        paste0("\\begin{tabular*}{", target_width, "}{@{\\extracolsep{\\fill}}", align_str, "@{}}")
      )
    }

    block_lines <- c(block_lines, header_line)

    for (r_idx in seq_len(nrow(chunk_df))) {
      row_cells <- vapply(
        seq_len(n_cols),
        function (c_idx) {
          format_table_cell(
            chunk_df[r_idx, c_idx],
            c_idx,
            list(bold_first_col = bold_first_col, euro_decimals = euro_decimals, is_latex = TRUE)
          )
        },
        character(1)
      )
      block_lines <- c(block_lines, paste0(paste(row_cells, collapse = " & "), " \\\\"))
    }

    if (scale_to_fit) {
      block_lines <- c(block_lines, "\\end{tabular}}")
    } else {
      block_lines <- c(block_lines, "\\end{tabular*}")
    }

    #Caption always underneath the table and centred
    if (nzchar(cap_tex)) {
      block_lines <- c(block_lines, paste0("\\caption{", cap_tex, "}"))
    }
    if (!is_cont && nzchar(label_str)) {
      block_lines <- c(block_lines, paste0("\\label{", label_str, "}"))
    }

    block_lines <- c(block_lines, paste0("\\end{", env_name, "}"))
    out_blocks <- c(out_blocks, paste(block_lines, collapse = "\n"))
  }

  #Return statement
  return(knitr::asis_output(paste(out_blocks, collapse = "\n\n")))
}


#' Sanitises a string containing mixed plain text and `$...$` math segments for safe LaTeX compilation.
#'
#' @param arg0_text Input string.
#' @return LaTeX-safe character string.
#' @export
sanitize_latex_text <- function (arg0_text) {
  #Convert from parameters
  text <- as.character(arg0_text)

  #Guard clauses
  if (length(text) == 0 || is.na(text) || !nzchar(text)) return("")

  #Split on $...$ math segments so we only escape %, &, _ outside math mode
  parts <- strsplit(text, "(?<=\\$)|(?=\\$)", perl = TRUE)[[1]]
  in_math <- FALSE
  out_parts <- character(length(parts))

  for (i in seq_along(parts)) {
    p <- parts[i]
    if (identical(p, "$")) {
      in_math <- !in_math
      out_parts[i] <- "$"
    } else if (in_math) {
      p <- gsub("\u2192", " \\rightarrow ", p, fixed = TRUE)
      p <- gsub("\u00d7", " \\times ", p, fixed = TRUE)
      p <- gsub("\u0394", "\\Delta ", p, fixed = TRUE)
      p <- gsub("\u00b2", "^2", p, fixed = TRUE)
      p <- gsub("\u2013", "--", p, fixed = TRUE)
      p <- gsub("\u2014", "---", p, fixed = TRUE)
      p <- gsub("(?<!\\\\)%", "\\\\%", p, perl = TRUE)
      out_parts[i] <- p
    } else {
      p <- gsub("\u2192", "$\\rightarrow$", p, fixed = TRUE)
      p <- gsub("\u00d7", "$\\times$", p, fixed = TRUE)
      p <- gsub("\u0394", "$\\Delta$", p, fixed = TRUE)
      p <- gsub("km\u00b2", "$\\text{km}^2$", p, fixed = TRUE)
      p <- gsub("m\u00b2", "$\\text{m}^2$", p, fixed = TRUE)
      p <- gsub("R\u00b2", "$R^2$", p, fixed = TRUE)
      p <- gsub("\u00b2", "$^2$", p, fixed = TRUE)
      p <- gsub("\u2013", "--", p, fixed = TRUE)
      p <- gsub("\u2014", "---", p, fixed = TRUE)
      p <- gsub("(?<!\\\\)&", "\\\\&", p, perl = TRUE)
      p <- gsub("(?<!\\\\)%", "\\\\%", p, perl = TRUE)
      p <- gsub("(?<!\\\\)_", "\\\\_", p, perl = TRUE)
      out_parts[i] <- p
    }
  }

  #Return statement
  return(paste(out_parts, collapse = ""))
}
