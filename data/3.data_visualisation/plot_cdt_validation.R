# ==============================================================================
# Contemporary Demographic Transition (CDT) Validation Plotter (2x2 Dashboard)
# ==============================================================================
# Resolves paths via common/defines/filepath_defines.json5 and exports both
# high-DPI PNG and vector PDF embeddings to data/3.data_visualisation/images/
# and visuals/.
# ==============================================================================

# 1. Package Management & Framework Setup --------------------------------------
required_packages <- c("jsonlite", "ggplot2", "patchwork", "scales", "dplyr")

for (pkg in required_packages) {
  if (!requireNamespace(pkg, quietly = TRUE)) {
    message(sprintf("Installing required package: %s ...", pkg))
    install.packages(pkg, repos = "https://cloud.r-project.org")
  }
  library(pkg, character.only = TRUE)
}

# Locate and source core/framework/R/framework_init.R
find_framework_init <- function () {
  candidates <- c(
    file.path(getwd(), "core", "framework", "R", "framework_init.R"),
    file.path(getwd(), "..", "core", "framework", "R", "framework_init.R"),
    file.path(getwd(), "..", "..", "core", "framework", "R", "framework_init.R"),
    file.path(getwd(), "..", "..", "..", "core", "framework", "R", "framework_init.R"),
    file.path(getwd(), "..", "..", "..", "..", "core", "framework", "R", "framework_init.R")
  )
  if (requireNamespace("rstudioapi", quietly = TRUE) && rstudioapi::isAvailable()) {
    doc_path <- tryCatch(rstudioapi::getActiveDocumentContext()$path, error = function (e) "")
    if (nzchar(doc_path)) {
      d <- dirname(doc_path)
      candidates <- c(
        file.path(d, "..", "core", "framework", "R", "framework_init.R"),
        file.path(d, "..", "..", "core", "framework", "R", "framework_init.R"),
        file.path(d, "..", "..", "..", "core", "framework", "R", "framework_init.R"),
        file.path(d, "..", "..", "..", "..", "core", "framework", "R", "framework_init.R"),
        candidates
      )
    }
  }
  for (cand in candidates) {
    if (file.exists(cand)) return(normalizePath(cand, winslash = "/"))
  }
  stop("Could not locate core/framework/R/framework_init.R")
}

source(find_framework_init())

as_json_path <- velkscala_defines$paths$cdt_age_sex_json
bd_json_path <- velkscala_defines$paths$cdt_births_deaths_json

if (!file.exists(as_json_path) || !file.exists(bd_json_path)) {
  stop("CDT validation JSON files not found in data/2.data_testing/test_cdt/.")
}

# 2. Data Ingestion & Transformation -------------------------------------------
message("Ingesting CDT validation datasets...")
as_root <- jsonlite::fromJSON(as_json_path)
bd_root <- jsonlite::fromJSON(bd_json_path)

# --- 2A. Age/Sex Dataset (Left Column) ---
as_data_list <- list()
for (yr in names(as_root$per_country)) {
  yr_obj <- as_root$per_country[[yr]]
  for (iso in names(yr_obj)) {
    item <- yr_obj[[iso]]
    as_data_list[[length(as_data_list) + 1]] <- data.frame(
      year = as.numeric(yr),
      iso3 = iso,
      raw_r2 = if (!is.null(item$raw_mnl$r2_country)) as.numeric(item$raw_mnl$r2_country) else NA,
      clamped_r2 = if (!is.null(item$clamped$r2_country)) as.numeric(item$clamped$r2_country) else NA
    )
  }
}
df_age_sex <- do.call(rbind, as_data_list)
df_as_summary <- data.frame(
  year = as.numeric(as_root$summary_by_epoch$year),
  raw_geomean = as.numeric(as_root$summary_by_epoch$raw_mnl$geomean_r2),
  clamped_geomean = as.numeric(as_root$summary_by_epoch$clamped$geomean_r2)
)

# --- 2B. Births & Deaths Dataset (Right Column: Normalised) ---
bd_data_list <- list()
for (yr in names(bd_root$per_country)) {
  yr_obj <- bd_root$per_country[[yr]]
  for (iso in names(yr_obj)) {
    item <- yr_obj[[iso]]
    b_emp <- if (!is.null(item$empirical_births)) as.numeric(item$empirical_births) else 0
    d_emp <- if (!is.null(item$empirical_deaths)) as.numeric(item$empirical_deaths) else 0

    b_err <- if (b_emp > 0) as.numeric(item$diff_births) / b_emp else NA
    d_err <- if (d_emp > 0) as.numeric(item$diff_deaths) / d_emp else NA

    bd_data_list[[length(bd_data_list) + 1]] <- data.frame(
      year = as.numeric(yr),
      iso3 = iso,
      birth_err_pct = b_err,
      death_err_pct = d_err
    )
  }
}
df_bd <- do.call(rbind, bd_data_list)

df_bd_summary <- df_bd %>%
  group_by(year) %>%
  summarise(
    median_birth_err = median(birth_err_pct, na.rm = TRUE),
    median_death_err = median(death_err_pct, na.rm = TRUE),
    .groups = "drop"
  )

# 3. Theme & Aesthetics (Karla Typography) -------------------------------------
fonts_dir <- file.path(velkscala_defines$directories$rticles_intellte_resources, "fonts")
if (requireNamespace("sysfonts", quietly = TRUE) && requireNamespace("showtext", quietly = TRUE)) {
  karla_reg <- file.path(fonts_dir, "Karla-Regular.ttf")
  karla_bold <- file.path(fonts_dir, "Karla-Bold.ttf")
  karla_it <- file.path(fonts_dir, "Karla-Italic.ttf")
  karla_bi <- file.path(fonts_dir, "Karla-BoldItalic.ttf")
  if (file.exists(karla_reg) && !("Karla" %in% sysfonts::font_families())) {
    sysfonts::font_add("Karla", regular = karla_reg, bold = karla_bold, italic = karla_it, bolditalic = karla_bi)
  }
  showtext::showtext_opts(dpi = 220)
  showtext::showtext_auto(enable = TRUE)
}

cdt_theme <- theme_minimal(base_size = 12, base_family = "Karla") +
  theme(
    text             = element_text(family = "Karla"),
    plot.title       = element_text(family = "Karla", face = "bold", size = 13, colour = "#1E293B", margin = margin(b = 4)),
    plot.subtitle    = element_text(family = "Karla", size = 10, colour = "#64748B", margin = margin(b = 20)),
    axis.title       = element_text(family = "Karla", face = "bold", size = 10.5, colour = "#334155"),
    axis.text        = element_text(family = "Karla"),
    panel.grid.major = element_line(colour = "#E2E8F0", linewidth = 0.5),
    panel.background = element_rect(fill = "#FAFAFA", colour = NA),
    plot.background  = element_rect(fill = "#FFFFFF", colour = NA),
    plot.margin      = margin(t = 8, r = 6, b = 8, l = 6)
  )

euro_pct_label <- function (x) gsub("\\.", ",", sprintf("%.1f%%", x * 100))
euro_signed_pct_label <- function (x) gsub("\\.", ",", sprintf("%+.1f%%", x * 100))

# 4. Construct Subplots --------------------------------------------------------
p1_raw <- ggplot() +
  geom_point(data = df_age_sex, aes(x = year, y = raw_r2), colour = "#3B82F6", alpha = 0.4, position = position_jitter(width = 0.8, seed = 42)) +
  geom_line(data = df_as_summary, aes(x = year, y = raw_geomean), colour = "#3B82F6", linewidth = 1.2) +
  geom_label(data = df_as_summary, aes(x = year, y = raw_geomean, label = euro_pct_label(raw_geomean)), family = "Karla", colour = "black", size = 3, fontface = "bold", vjust = -0.7, label.size = 0) +
  scale_y_continuous(labels = percent_format(decimal.mark = ","), limits = c(0, 1.05)) +
  coord_cartesian(clip = "off") +
  labs(title = "Multinomial Logit, R^2", x = "Year", y = "R^2") + cdt_theme

p3_births <- ggplot() +
  geom_hline(yintercept = 0, linetype = "dashed", colour = "#475569") +
  geom_point(data = df_bd, aes(x = year, y = birth_err_pct), colour = "#F59E0B", alpha = 0.4, position = position_jitter(width = 0.8, seed = 42)) +
  geom_line(data = df_bd_summary, aes(x = year, y = median_birth_err), colour = "#F59E0B", linewidth = 1.2) +
  geom_label(data = df_bd_summary, aes(x = year, y = median_birth_err, label = euro_signed_pct_label(median_birth_err)), family = "Karla", colour = "black", size = 3, fontface = "bold", vjust = -0.7, label.size = 0) +
  scale_y_continuous(labels = percent_format(decimal.mark = ","), limits = c(-0.6, 0.6), oob = scales::squish) +
  coord_cartesian(clip = "off") +
  labs(title = "Births Relative Error (%)", subtitle = "Median Country Deviation", x = "Year", y = "% Difference") + cdt_theme

p2_clamped <- ggplot() +
  geom_point(data = df_age_sex, aes(x = year, y = clamped_r2), colour = "#10B981", alpha = 0.4, position = position_jitter(width = 0.8, seed = 42)) +
  geom_line(data = df_as_summary, aes(x = year, y = clamped_geomean), colour = "#10B981", linewidth = 1.2) +
  geom_label(data = df_as_summary, aes(x = year, y = clamped_geomean, label = euro_pct_label(clamped_geomean)), family = "Karla", colour = "black", size = 3, fontface = "bold", vjust = -0.7, label.size = 0) +
  scale_y_continuous(labels = percent_format(decimal.mark = ","), limits = c(0, 1.05)) +
  coord_cartesian(clip = "off") +
  labs(title = "MNL Clamping, R^2", subtitle = "PAVA/Whittaker-Henderson (logistic kernel)", x = "Year", y = "R^2") + cdt_theme

p4_deaths <- ggplot() +
  geom_hline(yintercept = 0, linetype = "dashed", colour = "#475569") +
  geom_point(data = df_bd, aes(x = year, y = death_err_pct), colour = "#8B5CF6", alpha = 0.4, position = position_jitter(width = 0.8, seed = 42)) +
  geom_line(data = df_bd_summary, aes(x = year, y = median_death_err), colour = "#8B5CF6", linewidth = 1.2) +
  geom_label(data = df_bd_summary, aes(x = year, y = median_death_err, label = euro_signed_pct_label(median_death_err)), family = "Karla", colour = "black", size = 3, fontface = "bold", vjust = -0.7, label.size = 0) +
  scale_y_continuous(labels = percent_format(decimal.mark = ","), limits = c(-0.6, 0.6), oob = scales::squish) +
  coord_cartesian(clip = "off") +
  labs(title = "Deaths Relative Error (%)", subtitle = "Median Country Deviation", x = "Year", y = "% Difference") + cdt_theme

# 5. Assemble Dashboard --------------------------------------------------------
cdt_2x2_dashboard <- (p1_raw | p3_births) / (p2_clamped | p4_deaths) +
  plot_annotation(
    title    = "Velkscala 1.0: CDT Proxy vs. CDT Empirical",
    subtitle = "Out-of-sample testing | Age/Sex: 69,2% Acc. | Births: 83,1% Acc. | Deaths: 78,9% Acc.",
    caption  = "CDT: Contemporary Demographic Transition. Data: HMD, UNWPP, Niva et al. (2023); Velkscala 1.0 (2026)\nAccuracy rates reflect R^2 and 1 - MAPE for age/sex vs. births/deaths respectively.\n\nProxy models are discarded after 1950AD in final composites; UN data is used by Velkscala 1.0 after that period.",
    theme    = theme(
      text          = element_text(family = "Karla"),
      plot.title    = element_text(family = "Karla", face = "bold", size = 21, margin = margin(t = 6, b = 6)),
      plot.subtitle = element_text(family = "Karla", size = 14, colour = "#64748B", margin = margin(b = 16)),
      plot.caption  = element_text(family = "Karla", size = 10.5, colour = "#64748B", margin = margin(t = 8)),
      plot.margin   = margin(t = 6, r = 14, b = 6, l = 14)
    )
  )

# 6. Export High-DPI PNG to data/3.data_visualisation/images & visuals ---------
saved_cdt <- save_dual_plot(
  cdt_2x2_dashboard,
  "cdt_proxy_vs_empirical",
  list(
    defines = velkscala_defines,
    dpi = 220L,
    extra_dirs = c(velkscala_defines$paths$test_cdt_dir),
    height = 6.4,
    width = 16.0
  )
)
message(sprintf("✔ CDT dashboard exported to: %s", saved_cdt$png))
