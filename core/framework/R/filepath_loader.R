# ==============================================================================
# Filepath Loader & Formatting Utilities (core/framework/R/filepath_loader.R)
# ==============================================================================
# Parses common/defines/filepath_defines.json5 and provides path resolution
# and European / semantic number formatting across R scripts and RStudio sessions.
# ==============================================================================


#' Converts decimal points inside numeric tokens of a text string to European commas,
#' preserving dataset version numbers (Velkscala 1.0, HYDE 3.2, HYDE 3.3) and using
#' `{,}` inside LaTeX `$...$` math blocks to prevent post-comma math spacing.
#'
#' @param arg0_text Character vector or scalar string.
#' @param arg1_in_latex_math Logical; if TRUE, formats math-mode decimals with `{,}`.
#' @return Character string with numeric decimals formatted using commas (e.g. 58,88%).
#' @export
convert_euro_decimals_in_text <- function (arg0_text, arg1_in_latex_math = FALSE) {
  #Convert from parameters
  text <- arg0_text
  in_latex_math <- isTRUE(arg1_in_latex_math)

  #Guard clauses
  if (is.null(text) || length(text) == 0) return(text)

  out_vec <- as.character(text)
  for (idx in seq_along(out_vec)) {
    s <- out_vec[idx]
    #Protect version strings (Velkscala 1.0, HYDE 3.2, HYDE 3.3)
    s <- gsub("Velkscala 1\\.0", "Velkscala_VER_1_0", s)
    s <- gsub("HYDE 3\\.2", "HYDE_VER_3_2", s)
    s <- gsub("HYDE 3\\.3", "HYDE_VER_3_3", s)

    if (in_latex_math && grepl("\\$", s)) {
      parts <- strsplit(s, "(?<=\\$)|(?=\\$)", perl = TRUE)[[1]]
      in_m <- FALSE
      for (p_i in seq_along(parts)) {
        if (identical(parts[p_i], "$")) {
          in_m <- !in_m
        } else if (in_m) {
          parts[p_i] <- gsub("([0-9])\\.([0-9])", "\\1{,}\\2", parts[p_i], perl = TRUE)
          parts[p_i] <- gsub("([0-9]),([0-9])", "\\1{,}\\2", parts[p_i], perl = TRUE)
        } else {
          parts[p_i] <- gsub("([0-9])\\.([0-9])", "\\1,\\2", parts[p_i], perl = TRUE)
        }
      }
      s <- paste(parts, collapse = "")
    } else {
      s <- gsub("([0-9])\\.([0-9])", "\\1,\\2", s, perl = TRUE)
    }

    s <- gsub("Velkscala_VER_1_0", "Velkscala 1.0", s, fixed = TRUE)
    s <- gsub("HYDE_VER_3_2", "HYDE 3.2", s, fixed = TRUE)
    s <- gsub("HYDE_VER_3_3", "HYDE 3.3", s, fixed = TRUE)
    out_vec[idx] <- s
  }

  #Return statement
  return(out_vec)
}


#' Formats a numeric vector using European decimal commas (e.g. 58,88) and optional sign/suffix.
#'
#' @param arg0_x Numeric vector.
#' @param arg1_options Optional named list (`digits`, `signed`, `suffix`, `big_mark`, `na_str`).
#' @return Character vector of formatted numbers.
#' @export
format_euro_number <- function (arg0_x, arg1_options = NULL) {
  #Convert from parameters
  x <- arg0_x
  options <- if (!is.null(arg1_options)) arg1_options else list()

  #Initialise options
  big_mark <- if (!is.null(options$big_mark)) options$big_mark else "."
  digits <- if (!is.null(options$digits)) as.integer(options$digits) else 2L
  na_str <- if (!is.null(options$na_str)) options$na_str else "---"
  signed <- if (!is.null(options$signed)) isTRUE(options$signed) else FALSE
  suffix <- if (!is.null(options$suffix)) as.character(options$suffix) else ""

  #Declare local instance variables
  out_vec <- character(length(x))

  #Guard clauses
  if (is.null(x) || length(x) == 0) return(na_str)

  for (i in seq_along(x)) {
    local_val <- suppressWarnings(as.numeric(x[i]))
    if (is.na(local_val) || !is.finite(local_val)) {
      out_vec[i] <- na_str
    } else {
      local_sign <- if (signed && local_val > 0) "+" else if (local_val < 0) "-" else ""
      local_abs <- abs(local_val)
      local_fmt <- formatC(
        local_abs,
        format = "f",
        digits = digits,
        big.mark = big_mark,
        decimal.mark = ","
      )
      out_vec[i] <- paste0(local_sign, local_fmt, suffix)
    }
  }

  #Return statement
  return(out_vec)
}


#' Formats large numbers using semantic abbreviations (k, M, B, T) and European decimals.
#'
#' @param arg0_x Numeric vector.
#' @param arg1_options Optional named list (`digits`, `unit`, `na_str`).
#' @return Character vector of semantically abbreviated numbers.
#' @export
format_semantic_number <- function (arg0_x, arg1_options = NULL) {
  #Convert from parameters
  x <- arg0_x
  options <- if (!is.null(arg1_options)) arg1_options else list()

  #Initialise options
  digits <- if (!is.null(options$digits)) as.integer(options$digits) else 2L
  na_str <- if (!is.null(options$na_str)) options$na_str else "---"
  unit_str <- if (!is.null(options$unit) && nzchar(options$unit)) paste0(" ", options$unit) else ""

  #Declare local instance variables
  out_vec <- character(length(x))

  #Guard clauses
  if (is.null(x) || length(x) == 0) return(na_str)

  for (i in seq_along(x)) {
    local_val <- suppressWarnings(as.numeric(x[i]))
    if (is.na(local_val) || !is.finite(local_val)) {
      out_vec[i] <- na_str
    } else {
      local_abs <- abs(local_val)
      local_sign <- if (local_val < 0) "-" else ""
      if (local_abs >= 1e12) {
        scaled_str <- formatC(local_abs/1e12, format = "f", digits = digits, decimal.mark = ",")
        out_vec[i] <- paste0(local_sign, scaled_str, "T", unit_str)
      } else if (local_abs >= 1e9) {
        scaled_str <- formatC(local_abs/1e9, format = "f", digits = digits, decimal.mark = ",")
        out_vec[i] <- paste0(local_sign, scaled_str, "B", unit_str)
      } else if (local_abs >= 1e6) {
        scaled_str <- formatC(local_abs/1e6, format = "f", digits = digits, decimal.mark = ",")
        out_vec[i] <- paste0(local_sign, scaled_str, "M", unit_str)
      } else if (local_abs >= 1e3) {
        scaled_str <- formatC(local_abs/1e3, format = "f", digits = digits, decimal.mark = ",")
        out_vec[i] <- paste0(local_sign, scaled_str, "k", unit_str)
      } else {
        scaled_str <- formatC(local_abs, format = "f", digits = if (local_abs == round(local_abs)) 0L else digits, decimal.mark = ",")
        out_vec[i] <- paste0(local_sign, scaled_str, unit_str)
      }
    }
  }

  #Return statement
  return(out_vec)
}


#' Resolves the Velkscala project root directory across RStudio, knitr, and CLI invocations.
#'
#' @param arg0_start_dir Optional starting directory path.
#' @return Normalised absolute path to the project root directory.
#' @export
get_project_root <- function (arg0_start_dir = NULL) {
  #Convert from parameters
  start_dir <- arg0_start_dir

  #Declare local instance variables
  candidates <- character(0)
  env_root <- Sys.getenv("VELKSCALA_ROOT", unset = "")
  marker_rel <- file.path("common", "defines", "filepath_defines.json5")

  if (nzchar(env_root) && dir.exists(env_root)) {
    candidates <- c(candidates, env_root)
  }
  if (!is.null(start_dir) && nzchar(start_dir)) {
    candidates <- c(candidates, start_dir)
  }

  #Check knitr input directory when knitting Rmd
  if (requireNamespace("knitr", quietly = TRUE)) {
    knit_in <- tryCatch(knitr::current_input(dir = TRUE), error = function (e) NULL)
    if (!is.null(knit_in) && nzchar(knit_in)) {
      candidates <- c(candidates, dirname(knit_in))
    }
  }

  #Check active RStudio document path
  if (requireNamespace("rstudioapi", quietly = TRUE) && rstudioapi::isAvailable()) {
    doc_path <- tryCatch(rstudioapi::getActiveDocumentContext()$path, error = function (e) "")
    if (nzchar(doc_path)) {
      candidates <- c(candidates, dirname(doc_path))
    }
  }

  candidates <- unique(c(candidates, getwd()))

  for (i in seq_along(candidates)) {
    local_curr <- tryCatch(normalizePath(candidates[i], winslash = "/", mustWork = FALSE), error = function (e) candidates[i])
    for (x in 1:6) {
      if (file.exists(file.path(local_curr, marker_rel))) {
        return(normalizePath(local_curr, winslash = "/", mustWork = TRUE))
      }
      local_parent <- dirname(local_curr)
      if (identical(local_parent, local_curr)) break
      local_curr <- local_parent
    }
  }

  #Return statement
  return(normalizePath(getwd(), winslash = "/", mustWork = FALSE))
}


#' Loads and parses common/defines/filepath_defines.json5 into an R list with resolved paths.
#'
#' @param arg0_project_root Optional explicit project root directory.
#' @return Named list containing `project_root`, `raw`, `directories`, and `paths`.
#' @export
load_filepath_defines <- function (arg0_project_root = NULL) {
  #Convert from parameters
  project_root <- if (!is.null(arg0_project_root)) arg0_project_root else get_project_root()

  #Declare local instance variables
  defines_path <- file.path(project_root, "common", "defines", "filepath_defines.json5")
  parsed_obj <- list()
  resolved_dirs <- list()
  resolved_paths <- list()

  #Guard clauses
  if (!file.exists(defines_path)) {
    stop(sprintf("Filepath defines not found at: %s", defines_path))
  }

  parsed_obj <- parse_json5_file(defines_path)

  if (is.list(parsed_obj$directories)) {
    all_dir_keys <- names(parsed_obj$directories)
    for (i in seq_along(all_dir_keys)) {
      local_key <- all_dir_keys[i]
      local_val <- parsed_obj$directories[[local_key]]
      resolved_dirs[[local_key]] <- normalizePath(file.path(project_root, local_val), winslash = "/", mustWork = FALSE)
    }
  }

  if (is.list(parsed_obj$paths)) {
    all_path_keys <- names(parsed_obj$paths)
    for (i in seq_along(all_path_keys)) {
      local_key <- all_path_keys[i]
      local_val <- as.character(parsed_obj$paths[[local_key]])
      if (grepl("^[A-Za-z]:[/\\\\]", local_val) || grepl("^/", local_val)) {
        resolved_paths[[local_key]] <- normalizePath(local_val, winslash = "/", mustWork = FALSE)
      } else {
        resolved_paths[[local_key]] <- normalizePath(file.path(project_root, local_val), winslash = "/", mustWork = FALSE)
      }
    }
  }

  #Return statement
  return(list(
    defines_path = normalizePath(defines_path, winslash = "/", mustWork = FALSE),
    directories = resolved_dirs,
    paths = resolved_paths,
    project_name = if (!is.null(parsed_obj$project_name)) parsed_obj$project_name else "Velkscala 1.0",
    project_root = project_root,
    raw = parsed_obj,
    rscript_path = if (!is.null(parsed_obj$rscript_path)) parsed_obj$rscript_path else "Rscript",
    svea_dir = if (!is.null(parsed_obj$svea_dir)) parsed_obj$svea_dir else ""
  ))
}


#' Parses a JSON5 file into an R list by stripping comments, trailing commas, and unquoted keys.
#'
#' @param arg0_file_path Path to the .json5 or .json file.
#' @return Parsed R list object.
#' @export
parse_json5_file <- function (arg0_file_path) {
  #Convert from parameters
  file_path <- arg0_file_path

  #Declare local instance variables
  clean_lines <- character(0)
  json_text <- ""
  raw_lines <- readLines(file_path, warn = FALSE, encoding = "UTF-8")

  #Strip full-line and inline // comments outside quotes
  for (i in seq_along(raw_lines)) {
    local_line <- raw_lines[i]
    #Remove // comments not preceded by : (to preserve http:// or C:/)
    local_line <- sub("^\\s*//.*$", "", local_line, perl = TRUE)
    local_line <- sub("(?<![:\\\\])//.*$", "", local_line, perl = TRUE)
    if (nzchar(trimws(local_line))) {
      clean_lines <- c(clean_lines, local_line)
    }
  }

  json_text <- paste(clean_lines, collapse = "\n")
  #Remove multiline /* ... */ comments
  json_text <- gsub("/\\*[\\s\\S]*?\\*/", "", json_text, perl = TRUE)
  #Quote unquoted object keys: { key: or , key:
  json_text <- gsub("([\\{,\\n]\\s*)([A-Za-z0-9_]+)\\s*:", "\\1\"\\2\":", json_text, perl = TRUE)
  #Remove trailing commas before } or ]
  json_text <- gsub(",(\\s*[\\}\\]])", "\\1", json_text, perl = TRUE)

  #Return statement
  return(jsonlite::fromJSON(json_text, simplifyVector = FALSE))
}


#' Resolves a key in `defines$paths` or `defines$directories`, or a relative path from project root.
#'
#' @param arg0_key_or_rel Key in `filepath_defines.json5` or relative path from project root.
#' @param arg1_defines Optional loaded defines list from `load_filepath_defines()`.
#' @return Normalised absolute path string with forward slashes.
#' @export
resolve_project_path <- function (arg0_key_or_rel, arg1_defines = NULL) {
  #Convert from parameters
  key_or_rel <- arg0_key_or_rel
  defines <- if (!is.null(arg1_defines)) arg1_defines else load_filepath_defines()

  #Guard clauses
  if (is.null(key_or_rel) || !nzchar(key_or_rel)) return(defines$project_root)

  if (!is.null(defines$paths[[key_or_rel]])) {
    return(defines$paths[[key_or_rel]])
  }
  if (!is.null(defines$directories[[key_or_rel]])) {
    return(defines$directories[[key_or_rel]])
  }
  if (grepl("^[A-Za-z]:[/\\\\]", key_or_rel) || grepl("^/", key_or_rel)) {
    return(normalizePath(key_or_rel, winslash = "/", mustWork = FALSE))
  }

  root_cand <- file.path(defines$project_root, key_or_rel)
  wd_cand <- file.path(getwd(), key_or_rel)
  if (!file.exists(root_cand) && file.exists(wd_cand)) {
    return(normalizePath(wd_cand, winslash = "/", mustWork = FALSE))
  }

  #Return statement
  return(normalizePath(root_cand, winslash = "/", mustWork = FALSE))
}
