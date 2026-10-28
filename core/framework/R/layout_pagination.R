# ==============================================================================
# Page-Splitting & Deadspace Elimination Framework (core/framework/R/layout_pagination.R)
# ==============================================================================
# Accurately calculates vertical line budgets, splits long data frames and
# composite content blocks across pages without bottom overflow, and configures
# LaTeX float placement parameters to prevent excessive column/page deadspace.
# ==============================================================================


#' Calculates usable vertical line budget for a page or column in the intellte/PNAS layout.
#'
#' @param arg0_options Optional named list (`two_column`, `font_size`, `is_first_page`, `has_banner_figure`).
#' @return Named list containing `max_body_lines`, `max_table_rows`, `chars_per_line`, and `usable_height_pt`.
#' @export
calculate_page_budget <- function (arg0_options = NULL) {
  #Convert from parameters
  options <- if (!is.null(arg0_options)) arg0_options else list()

  #Initialise options
  font_size <- if (!is.null(options$font_size)) as.character(options$font_size) else "normalsize"
  has_banner_figure <- if (!is.null(options$has_banner_figure)) isTRUE(options$has_banner_figure) else FALSE
  is_first_page <- if (!is.null(options$is_first_page)) isTRUE(options$is_first_page) else FALSE
  two_column <- if (!is.null(options$two_column)) isTRUE(options$two_column) else FALSE

  #Declare local instance variables
  #CRD single-column textheight is 720pt (10.0 in, 0.5in top/bottom margins). Body baseline skip is 15pt.
  base_leading_pt <- 15.0
  chars_per_line <- if (two_column) 67L else 98L
  table_row_pt <- 15.0
  usable_height_pt <- 708.0

  if (font_size == "tiny") {
    table_row_pt <- 8.2
  } else if (font_size == "scriptsize") {
    table_row_pt <- 9.4
  } else if (font_size == "footnotesize") {
    table_row_pt <- 10.6
  } else if (font_size == "small") {
    table_row_pt <- 12.0
  } else {
    table_row_pt <- 15.0
  }

  if (is_first_page) {
    #Title, author block, abstract, and significance box consume ~240pt on page 1
    usable_height_pt <- usable_height_pt - 240.0
  }
  if (has_banner_figure) {
    #A top 2x2 dashboard float consumes ~285pt
    usable_height_pt <- usable_height_pt - 285.0
  }

  #Account for table caption + toprule + header + midrule + bottomrule (~58pt overhead)
  table_usable_pt <- max(120.0, usable_height_pt - 62.0)
  max_body_lines <- as.integer(floor(usable_height_pt / base_leading_pt))
  max_table_rows <- as.integer(floor(table_usable_pt / table_row_pt))

  #Return statement
  return(list(
    chars_per_line = chars_per_line,
    max_body_lines = max_body_lines,
    max_table_rows = max_table_rows,
    table_row_pt = table_row_pt,
    usable_height_pt = usable_height_pt
  ))
}


#' Emits LaTeX preamble and body directives that eliminate float deadspace and orphaned headers.
#'
#' @param arg0_options Optional named list (`ragged_bottom`, `compact_floats`, `allow_float_barrier`).
#' @return A `knitr::asis_output` object containing LaTeX layout tuning macros.
#' @export
emit_deadspace_control <- function (arg0_options = NULL) {
  #Convert from parameters
  options <- if (!is.null(arg0_options)) arg0_options else list()

  #Initialise options
  compact_floats <- if (!is.null(options$compact_floats)) isTRUE(options$compact_floats) else TRUE
  ragged_bottom <- if (!is.null(options$ragged_bottom)) isTRUE(options$ragged_bottom) else TRUE

  #Declare local instance variables
  latex_lines <- character(0)

  #Guard clauses
  if (requireNamespace("knitr", quietly = TRUE) && !knitr::is_latex_output()) {
    return(knitr::asis_output(""))
  }

  if (compact_floats) {
    latex_lines <- c(
      latex_lines,
      "```{=latex}",
      "% --- Velkscala Deadspace & Float Pagination Control ---",
      "\\renewcommand{\\topfraction}{0.95}",
      "\\renewcommand{\\bottomfraction}{0.92}",
      "\\renewcommand{\\textfraction}{0.04}",
      "\\renewcommand{\\floatpagefraction}{0.88}",
      "\\renewcommand{\\dbltopfraction}{0.95}",
      "\\renewcommand{\\dblfloatpagefraction}{0.88}",
      "\\setcounter{topnumber}{4}",
      "\\setcounter{bottomnumber}{4}",
      "\\setcounter{totalnumber}{8}",
      "\\setcounter{dbltopnumber}{4}",
      "\\setlength{\\floatsep}{22pt plus 2pt minus 2pt}",
      "\\setlength{\\textfloatsep}{22pt plus 2pt minus 2pt}",
      "\\setlength{\\intextsep}{22pt plus 2pt minus 2pt}",
      "\\setlength{\\dblfloatsep}{22pt plus 2pt minus 2pt}",
      "\\setlength{\\dbltextfloatsep}{22pt plus 2pt minus 2pt}",
      "\\setlength{\\abovecaptionskip}{18pt plus 2pt minus 2pt}",
      "\\setlength{\\belowcaptionskip}{18pt plus 2pt minus 2pt}",
      "\\makeatletter",
      "\\setlength{\\@fptop}{0pt}",
      "\\setlength{\\@fpsep}{10pt}",
      "\\setlength{\\@fpbot}{0pt plus 1fil}",
      "\\setlength{\\@dblfptop}{0pt}",
      "\\setlength{\\@dblfpsep}{10pt}",
      "\\setlength{\\@dblfpbot}{0pt plus 1fil}",
      "\\makeatother",
      "\\widowpenalty=10000",
      "\\clubpenalty=10000"
    )
  }

  if (ragged_bottom) {
    #Prevents LaTeX from stretching inter-paragraph vertical glue when a column breaks before a float/table
    latex_lines <- c(latex_lines, "\\raggedbottom")
  }

  if (length(latex_lines) > 0) {
    latex_lines <- c(latex_lines, "```")
  }

  #Return statement
  return(knitr::asis_output(paste(latex_lines, collapse = "\n")))
}


#' Estimates the vertical line count of a prose string for a given column width.
#'
#' @param arg0_text Character string or vector of lines.
#' @param arg1_chars_per_line Integer characters per column line (default 67 for 2-column PNAS).
#' @return Integer estimated number of vertical lines.
#' @export
estimate_prose_lines <- function (arg0_text, arg1_chars_per_line = 67L) {
  #Convert from parameters
  text <- arg0_text
  chars_per_line <- max(20L, as.integer(arg1_chars_per_line))

  #Declare local instance variables
  paragraphs <- character(0)
  total_lines <- 0L

  #Guard clauses
  if (is.null(text) || length(text) == 0) return(0L)

  paragraphs <- unlist(strsplit(paste(text, collapse = "\n"), "\n", fixed = TRUE))

  for (i in seq_along(paragraphs)) {
    local_p <- trimws(paragraphs[i])
    if (!nzchar(local_p)) {
      total_lines <- total_lines + 1L
    } else if (grepl("^#+\\s+", local_p)) {
      #Section headings include above/below spacing (~3 lines equivalent)
      total_lines <- total_lines + 3L
    } else {
      #Strip markdown/LaTeX commands when estimating visual character width
      clean_p <- gsub("\\$[\\s\\S]*?\\$", "XXXX", local_p, perl = TRUE)
      clean_p <- gsub("\\*\\*|\\*", "", clean_p)
      local_wrapped <- max(1L, as.integer(ceiling(nchar(clean_p) / chars_per_line)))
      total_lines <- total_lines + local_wrapped
    }
  }

  #Return statement
  return(total_lines)
}


#' Estimates the vertical height (in row-equivalents) of a data frame when rendered as a LaTeX table.
#'
#' @param arg0_df Data frame to measure.
#' @param arg1_options Optional named list (`col_char_limits`, `has_caption`, `has_footnote`).
#' @return Named list with `row_heights` (integer vector per row), `overhead_rows`, and `total_rows_equiv`.
#' @export
estimate_table_lines <- function (arg0_df, arg1_options = NULL) {
  #Convert from parameters
  df <- as.data.frame(arg0_df, stringsAsFactors = FALSE)
  options <- if (!is.null(arg1_options)) arg1_options else list()

  #Initialise options
  col_char_limit <- if (!is.null(options$col_char_limit)) as.integer(options$col_char_limit) else 32L
  has_caption <- if (!is.null(options$has_caption)) isTRUE(options$has_caption) else TRUE
  has_footnote <- if (!is.null(options$has_footnote)) isTRUE(options$has_footnote) else FALSE

  #Declare local instance variables
  n_rows <- nrow(df)
  overhead_rows <- 2L + (if (has_caption) 2L else 0L) + (if (has_footnote) 2L else 0L)
  row_heights <- integer(n_rows)

  #Guard clauses
  if (n_rows == 0) {
    return(list(
      overhead_rows = overhead_rows,
      row_heights = integer(0),
      total_rows_equiv = overhead_rows
    ))
  }

  for (i in seq_len(n_rows)) {
    local_cells <- as.character(unlist(df[i, , drop = TRUE]))
    local_clean <- gsub("\\\\textbf\\{|\\\\mathrm\\{|\\}|\\$", "", local_cells)
    local_max_chars <- max(nchar(local_clean), na.rm = TRUE)
    row_heights[i] <- max(1L, as.integer(ceiling(local_max_chars / col_char_limit)))
  }

  #Return statement
  return(list(
    overhead_rows = overhead_rows,
    row_heights = row_heights,
    total_rows_equiv = overhead_rows + sum(row_heights)
  ))
}


#' Packs multiple named data frames (such as regional trajectories) into page-balanced groups
#' so that stacked sub-tables fill pages cleanly without excessive deadspace.
#'
#' @param arg0_tables_list List of named lists, each with `title`, `df`, and optional `subtitle`.
#' @param arg1_options Optional named list (`max_rows_per_page`, `subtable_overhead`).
#' @return List of pages, where each page is a list of sub-table items that fit together on one page.
#' @export
pack_subtables_onto_pages <- function (arg0_tables_list, arg1_options = NULL) {
  #Convert from parameters
  tables_list <- arg0_tables_list
  options <- if (!is.null(arg1_options)) arg1_options else list()

  #Initialise options
  max_rows_per_page <- if (!is.null(options$max_rows_per_page)) as.integer(options$max_rows_per_page) else 34L
  first_page_max_rows <- if (!is.null(options$first_page_max_rows)) as.integer(options$first_page_max_rows) else max_rows_per_page
  subtable_overhead <- if (!is.null(options$subtable_overhead)) as.integer(options$subtable_overhead) else 2L

  #Declare local instance variables
  current_page <- list()
  current_used <- 0L
  packed_pages <- list()

  #Guard clauses
  if (length(tables_list) == 0) return(packed_pages)

  #Pack subtables onto pages, splitting across page boundaries when >= 6 data rows fit on the current page
  for (i in seq_along(tables_list)) {
    local_item <- tables_list[[i]]
    rem_df <- as.data.frame(local_item$df, stringsAsFactors = FALSE)
    base_title <- as.character(local_item$title)
    is_cont_part <- FALSE

    while (nrow(rem_df) > 0L) {
      page_cap <- if (length(packed_pages) == 0L) first_page_max_rows else max_rows_per_page
      avail_rows <- page_cap - current_used - subtable_overhead
      if (length(current_page) > 0L && avail_rows < 6L) {
        packed_pages[[length(packed_pages) + 1L]] <- current_page
        current_page <- list()
        current_used <- 0L
        page_cap <- if (length(packed_pages) == 0L) first_page_max_rows else max_rows_per_page
        avail_rows <- page_cap - subtable_overhead
      }

      take_n <- min(nrow(rem_df), max(6L, avail_rows))
      slice_df <- rem_df[seq_len(take_n), , drop = FALSE]
      part_title <- if (!is_cont_part) base_title else paste0(base_title, " (Continued)")

      current_page[[length(current_page) + 1L]] <- list(
        df = slice_df,
        subtitle = local_item$subtitle,
        title = part_title
      )
      current_used <- current_used + take_n + subtable_overhead

      if (take_n < nrow(rem_df)) {
        rem_df <- rem_df[(take_n + 1L):nrow(rem_df), , drop = FALSE]
        is_cont_part <- TRUE
        packed_pages[[length(packed_pages) + 1L]] <- current_page
        current_page <- list()
        current_used <- 0L
      } else {
        rem_df <- rem_df[integer(0), , drop = FALSE]
      }
    }
  }

  if (length(current_page) > 0) {
    packed_pages[[length(packed_pages) + 1L]] <- current_page
  }

  #Return statement
  return(packed_pages)
}


#' Splits a data frame into page-fitted chunks based on cumulative row height budgets.
#'
#' @param arg0_df Data frame to split.
#' @param arg1_options Optional named list (`max_rows_per_page`, `first_page_max_rows`, `col_char_limit`).
#' @return List of chunk objects, each containing `chunk_index`, `total_chunks`, `is_continued`, and `df`.
#' @export
split_dataframe_for_pages <- function (arg0_df, arg1_options = NULL) {
  #Convert from parameters
  df <- as.data.frame(arg0_df, stringsAsFactors = FALSE)
  options <- if (!is.null(arg1_options)) arg1_options else list()

  #Initialise options
  budget_info <- calculate_page_budget(options)
  col_char_limit <- if (!is.null(options$col_char_limit)) as.integer(options$col_char_limit) else 36L
  max_rows_per_page <- if (!is.null(options$max_rows_per_page)) {
    as.integer(options$max_rows_per_page)
  } else {
    budget_info$max_table_rows
  }
  first_page_max_rows <- if (!is.null(options$first_page_max_rows)) {
    as.integer(options$first_page_max_rows)
  } else {
    max_rows_per_page
  }

  #Declare local instance variables
  chunks_list <- list()
  current_budget <- max(5L, first_page_max_rows)
  current_indices <- integer(0)
  current_lines <- 0L
  est_info <- estimate_table_lines(df, list(col_char_limit = col_char_limit))
  n_rows <- nrow(df)
  raw_chunks <- list()

  #Guard clauses
  if (n_rows == 0) {
    return(list(list(
      chunk_index = 1L,
      df = df,
      is_continued = FALSE,
      total_chunks = 1L
    )))
  }

  for (i in seq_len(n_rows)) {
    local_h <- est_info$row_heights[i]
    if (length(current_indices) > 0 && (current_lines + local_h > current_budget)) {
      raw_chunks[[length(raw_chunks) + 1L]] <- df[current_indices, , drop = FALSE]
      current_indices <- i
      current_lines <- local_h
      current_budget <- max(5L, max_rows_per_page)
    } else {
      current_indices <- c(current_indices, i)
      current_lines <- current_lines + local_h
    }
  }

  if (length(current_indices) > 0) {
    raw_chunks[[length(raw_chunks) + 1L]] <- df[current_indices, , drop = FALSE]
  }

  total_chunks <- length(raw_chunks)
  for (i in seq_len(total_chunks)) {
    chunks_list[[i]] <- list(
      chunk_index = i,
      df = raw_chunks[[i]],
      is_continued = (i > 1L),
      total_chunks = total_chunks
    )
  }

  #Return statement
  return(chunks_list)
}

