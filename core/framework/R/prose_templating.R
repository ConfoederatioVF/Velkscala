# ==============================================================================
# Markdown Prose Templating Framework (core/framework/R/prose_templating.R)
# ==============================================================================
# Provides prose variable interpolation (£1£ / £key£), Markdown AST segmentation
# (separating prose from pipe tables so tables never trigger Pandoc longtable
# errors in two-column layouts), and deadspace-aware prose rendering.
# ==============================================================================


#' Interpolates variables into a prose template using £1£, £2£ or £key£ delimiters.
#'
#' @param arg0_template_text Character string or vector containing `£...£` placeholders.
#' @param arg1_vars_list List or vector of replacement values.
#' @return Interpolated character string.
#' @export
interpolate_prose_template <- function (arg0_template_text, arg1_vars_list = NULL) {
  #Convert from parameters
  template_text <- paste(as.character(arg0_template_text), collapse = "\n")
  vars_list <- if (!is.null(arg1_vars_list)) arg1_vars_list else list()

  #Guard clauses
  if (!nzchar(template_text) || length(vars_list) == 0) return(template_text)

  out_text <- template_text
  var_names <- names(vars_list)

  #Replace positional £1£, £2£, ...
  for (i in seq_along(vars_list)) {
    pos_token <- paste0("\u00a3", i, "\u00a3")
    val_str <- as.character(vars_list[[i]])
    out_text <- gsub(pos_token, val_str, out_text, fixed = TRUE)
  }

  #Replace named £key£ and {{key}}
  if (!is.null(var_names)) {
    for (i in seq_along(var_names)) {
      k <- var_names[i]
      if (nzchar(k)) {
        named_pound <- paste0("\u00a3", k, "\u00a3")
        named_brace <- paste0("{{", k, "}}")
        val_str <- as.character(vars_list[[i]])
        out_text <- gsub(named_pound, val_str, out_text, fixed = TRUE)
        out_text <- gsub(named_brace, val_str, out_text, fixed = TRUE)
      }
    }
  }

  #Return statement
  return(out_text)
}


#' Parses a Markdown string or file into alternating prose blocks and structured data.frame tables.
#'
#' @param arg0_md_source Path to a `.md` file or raw Markdown character string.
#' @return List of block objects (`list(type = "prose", text = ...)` or `list(type = "table", caption = ..., df = ..., align = ...)`).
#' @export
parse_markdown_document <- function (arg0_md_source) {
  #Convert from parameters
  md_source <- arg0_md_source

  #Declare local instance variables
  blocks <- list()
  i <- 1L
  lines_vec <- character(0)
  n_lines <- 0L
  pending_caption <- ""
  prose_buffer <- character(0)

  #Guard clauses
  if (is.null(md_source) || length(md_source) == 0) return(blocks)

  if (length(md_source) == 1L && !grepl("\n", md_source) && file.exists(md_source)) {
    lines_vec <- readLines(md_source, warn = FALSE, encoding = "UTF-8")
  } else {
    lines_vec <- unlist(strsplit(paste(md_source, collapse = "\n"), "\r?\n"))
  }

  n_lines <- length(lines_vec)

  flush_prose <- function () {
    if (length(prose_buffer) > 0) {
      joined <- trimws(paste(prose_buffer, collapse = "\n"))
      if (nzchar(joined)) {
        blocks[[length(blocks) + 1L]] <<- list(
          text = joined,
          type = "prose"
        )
      }
      prose_buffer <<- character(0)
    }
  }

  while (i <= n_lines) {
    curr_line <- lines_vec[i]
    trimmed <- trimws(curr_line)

    #Check if this is a "### Table X: ..." or "### A. Region ..." heading right before a pipe table
    if (grepl("^#{2,4}\\s+", trimmed, perl = TRUE)) {
      #Look ahead skipping blank lines to see if a pipe table follows immediately
      look_idx <- i + 1L
      while (look_idx <= n_lines && !nzchar(trimws(lines_vec[look_idx]))) {
        look_idx <- look_idx + 1L
      }
      if (look_idx < n_lines &&
          grepl("^\\|.*\\|$", trimws(lines_vec[look_idx]), perl = TRUE) &&
          grepl("^\\|[\\s:\\-\\|]+\\|$", trimws(lines_vec[look_idx + 1L]), perl = TRUE)) {
        pending_caption <- sub("^#{2,4}\\s+", "", trimmed, perl = TRUE)
        i <- look_idx
        next
      }
    }

    #Detect pipe table start: header line + separator line | :---: | ... |
    if (i < n_lines &&
        grepl("^\\|.*\\|$", trimmed, perl = TRUE) &&
        grepl("^\\|[\\s:\\-\\|]+\\|$", trimws(lines_vec[i + 1L]), perl = TRUE)) {
      flush_prose()

      header_raw <- trimmed
      sep_raw <- trimws(lines_vec[i + 1L])
      i <- i + 2L

      row_lines <- character(0)
      while (i <= n_lines && grepl("^\\|.*\\|$", trimws(lines_vec[i]), perl = TRUE)) {
        row_lines <- c(row_lines, trimws(lines_vec[i]))
        i <- i + 1L
      }

      split_pipe <- function (line_str) {
        inner <- sub("^\\|\\s*", "", sub("\\s*\\|$", "", line_str))
        trimws(strsplit(inner, "\\|", fixed = FALSE)[[1]])
      }

      col_headers <- split_pipe(header_raw)
      sep_cells <- split_pipe(sep_raw)
      n_cols <- length(col_headers)

      align_vec <- vapply(sep_cells, function (sc) {
        if (grepl("^:.*:$", sc)) return("c")
        if (grepl(":$", sc)) return("r")
        return("l")
      }, character(1))
      if (length(align_vec) != n_cols) {
        align_vec <- c("l", rep("r", max(0L, n_cols - 1L)))
      }

      mat_rows <- lapply(row_lines, function (rl) {
        cells <- split_pipe(rl)
        if (length(cells) < n_cols) {
          cells <- c(cells, rep("", n_cols - length(cells)))
        } else if (length(cells) > n_cols) {
          cells <- cells[seq_len(n_cols)]
        }
        cells
      })

      df_out <- if (length(mat_rows) > 0) {
        as.data.frame(do.call(rbind, mat_rows), stringsAsFactors = FALSE)
      } else {
        as.data.frame(matrix(character(0), nrow = 0, ncol = n_cols), stringsAsFactors = FALSE)
      }
      colnames(df_out) <- col_headers

      blocks[[length(blocks) + 1L]] <- list(
        align = unname(align_vec),
        caption = pending_caption,
        col_names = col_headers,
        df = df_out,
        type = "table"
      )
      pending_caption <- ""
      next
    }

    prose_buffer <- c(prose_buffer, curr_line)
    i <- i + 1L
  }

  flush_prose()

  #Return statement
  return(blocks)
}


#' Renders Markdown prose (from a file or string) into RMarkdown/LaTeX output,
#' routing any embedded pipe tables through `render_table_template()` so Pandoc
#' never emits two-column-incompatible `longtable` environments.
#'
#' @param arg0_md_source Path to a `.md` file, defines key, or raw Markdown string.
#' @param arg1_options Optional named list (`include_tables`, `euro_decimals`, `strip_top_h1`,
#'   `strip_hr`, `strip_generated_footer`, `vars`, `table_options`).
#' @return A `knitr::asis_output` object.
#' @export
render_markdown_prose <- function (arg0_md_source, arg1_options = NULL) {
  #Convert from parameters
  options <- if (!is.null(arg1_options)) arg1_options else list()

  #Initialise options
  euro_decimals <- if (!is.null(options$euro_decimals)) isTRUE(options$euro_decimals) else TRUE
  include_tables <- if (!is.null(options$include_tables)) isTRUE(options$include_tables) else TRUE
  is_latex <- if (requireNamespace("knitr", quietly = TRUE)) knitr::is_latex_output() else FALSE
  strip_generated_footer <- if (!is.null(options$strip_generated_footer)) isTRUE(options$strip_generated_footer) else TRUE
  strip_hr <- if (!is.null(options$strip_hr)) isTRUE(options$strip_hr) else TRUE
  strip_top_h1 <- if (!is.null(options$strip_top_h1)) isTRUE(options$strip_top_h1) else TRUE
  table_options <- if (!is.null(options$table_options)) options$table_options else list()
  vars_list <- options$vars

  #Declare local instance variables
  blocks <- list()
  out_pieces <- character(0)
  resolved_source <- arg0_md_source
  table_counter <- 0L

  if (length(arg0_md_source) == 1L && !grepl("\n", arg0_md_source)) {
    cand_path <- tryCatch(resolve_project_path(arg0_md_source), error = function (e) arg0_md_source)
    if (file.exists(cand_path)) {
      resolved_source <- cand_path
    }
  }

  blocks <- parse_markdown_document(resolved_source)

  for (b_idx in seq_along(blocks)) {
    blk <- blocks[[b_idx]]
    if (identical(blk$type, "prose")) {
      txt <- blk$text
      if (!is.null(vars_list)) {
        txt <- interpolate_prose_template(txt, vars_list)
      }
      p_lines <- unlist(strsplit(txt, "\r?\n"))
      if (strip_top_h1 && b_idx == 1L && length(p_lines) > 0 && grepl("^#\\s+", p_lines[1])) {
        p_lines <- p_lines[-1]
      }
      if (strip_hr) {
        p_lines <- p_lines[!grepl("^\\s*---\\s*$", p_lines)]
      }
      if (strip_generated_footer) {
        p_lines <- p_lines[!grepl("^\\*Generated autonomously by Project", trimws(p_lines))]
      }
      if (!include_tables) {
        #Also remove standalone "### Table X..." lines if tables are excluded
        p_lines <- p_lines[!grepl("^#{2,4}\\s+Table\\s+[0-9]", trimws(p_lines))]
      }

      clean_txt <- trimws(paste(p_lines, collapse = "\n"))
      if (nzchar(clean_txt)) {
        if (euro_decimals) {
          clean_txt <- convert_euro_decimals_in_text(clean_txt, is_latex)
        }
        if (is_latex) {
          #Replace Unicode arrows, multiplication, delta, and superscripts so pdflatex compiles cleanly
          clean_txt <- gsub("\u2192", "\\rightarrow ", clean_txt, fixed = TRUE)
          clean_txt <- gsub("\u00d7", "\\times ", clean_txt, fixed = TRUE)
          clean_txt <- gsub("\u0394", "\\Delta ", clean_txt, fixed = TRUE)
          clean_txt <- gsub("km\u00b2", "$\\text{km}^2$", clean_txt, fixed = TRUE)
          clean_txt <- gsub("m\u00b2", "$\\text{m}^2$", clean_txt, fixed = TRUE)
          clean_txt <- gsub("R\u00b2", "$R^2$", clean_txt, fixed = TRUE)
          clean_txt <- gsub("\u2013", "--", clean_txt, fixed = TRUE)
          clean_txt <- gsub("\u2014", "---", clean_txt, fixed = TRUE)
        }
        out_pieces <- c(out_pieces, clean_txt)
      }
    } else if (identical(blk$type, "table") && include_tables) {
      table_counter <- table_counter + 1L
      t_opts <- modifyList(
        list(
          align = blk$align,
          caption = blk$caption,
          col_names = blk$col_names,
          euro_decimals = euro_decimals,
          font_size = if (ncol(blk$df) >= 8L) "scriptsize" else "footnotesize",
          scale_to_fit = (ncol(blk$df) >= 6L),
          span_columns = (ncol(blk$df) >= 6L)
        ),
        table_options
      )
      rendered_tbl <- render_table_template(blk$df, t_opts)
      out_pieces <- c(out_pieces, as.character(rendered_tbl))
    }
  }

  #Return statement
  return(knitr::asis_output(paste(out_pieces, collapse = "\n\n")))
}

