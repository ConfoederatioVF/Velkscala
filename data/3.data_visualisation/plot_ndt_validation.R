# ==============================================================================
# Neolithic Demographic Transition (NDT) Validation Plotter (2x2 Dashboard)
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

ndt_json_path <- velkscala_defines$paths$ndt_results_json

if (!file.exists(ndt_json_path)) {
  stop("NDT validation JSON not found in data/2.data_testing/test_ndt/.")
}

# 2. Data Ingestion & Transformation -------------------------------------------
message("Ingesting NDT validation dataset...")
ndt_root <- jsonlite::fromJSON(ndt_json_path, simplifyVector = FALSE)

epoch_rows <- list()
for (reg_name in names(ndt_root$regional_data)) {
  reg_obj <- ndt_root$regional_data[[reg_name]]
  for (ep in reg_obj$epochs) {
    epoch_rows[[length(epoch_rows) + 1]] <- data.frame(
      region = reg_name,
      year = as.numeric(ep$year),
      dt = as.numeric(ep$dt),
      pop = as.numeric(ep$pop_stadester),
      growth_r = if (!is.null(ep$growth_rate_pct)) as.numeric(ep$growth_rate_pct) else NA,
      ijp = as.numeric(ep$p_5_19_bocquet_pct) / 100,
      under5 = as.numeric(ep$p_under5_pct) / 100,
      crop_pc = as.numeric(ep$cropland_per_capita_m2),
      stringsAsFactors = FALSE
    )
  }
}
df_epochs <- do.call(rbind, epoch_rows)

geocode_rows <- list()
for (geo_code in names(ndt_root$tracked_geocodes)) {
  g_obj <- ndt_root$tracked_geocodes[[geo_code]]
  ep0 <- g_obj$benchmark_epochs[["0"]]
  ep600 <- g_obj$benchmark_epochs[["600"]]
  if (!is.null(ep0) && !is.null(ep600)) {
    geocode_rows[[length(geocode_rows) + 1]] <- data.frame(
      code = geo_code,
      region = g_obj$info$region,
      ijp_0AD = as.numeric(ep0$p_5_19_bocquet_pct) / 100,
      ijp_600AD = as.numeric(ep600$p_5_19_bocquet_pct) / 100,
      u5_0AD = as.numeric(ep0$p_under5_pct) / 100,
      stringsAsFactors = FALSE
    )
  }
}
df_geocodes <- do.call(rbind, geocode_rows)

# 3. Theme & Palette (Karla Typography) ----------------------------------------
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

region_palette <- c(
  "Southwest Asia" = "#D97706",
  "Europe" = "#2563EB",
  "East Asia" = "#DC2626",
  "Southeast Asia" = "#059669",
  "American Southwest" = "#7C3AED"
)

ndt_theme <- theme_minimal(base_size = 12, base_family = "Karla") +
  theme(
    text             = element_text(family = "Karla"),
    plot.title       = element_text(family = "Karla", face = "bold", size = 13, colour = "#1E293B", margin = margin(b = 4)),
    plot.subtitle    = element_text(family = "Karla", size = 10, colour = "#64748B", margin = margin(b = 14)),
    axis.title       = element_text(family = "Karla", face = "bold", size = 10.5, colour = "#334155"),
    axis.text        = element_text(family = "Karla"),
    legend.text      = element_text(family = "Karla"),
    panel.grid.major = element_line(colour = "#E2E8F0", linewidth = 0.5),
    panel.background = element_rect(fill = "#FAFAFA", colour = NA),
    plot.background  = element_rect(fill = "#FFFFFF", colour = NA),
    legend.position  = "bottom",
    legend.title     = element_blank(),
    plot.margin      = margin(t = 8, r = 6, b = 8, l = 6)
  )

# 4. Construct Subplots --------------------------------------------------------
p1_ijp <- ggplot(df_epochs %>% filter(dt >= -3000 & dt <= 3500), aes(x = dt, y = ijp, colour = region)) +
  geom_vline(xintercept = 0, linetype = "dashed", colour = "#475569", linewidth = 0.7) +
  geom_line(linewidth = 1.1) +
  geom_point(size = 2) +
  scale_colour_manual(values = region_palette) +
  scale_y_continuous(labels = percent_format(accuracy = 1, decimal.mark = ",")) +
  labs(
    title = "Bocquet-Appel Juvenile Proportion p(5-19) / p(5+)",
    subtitle = "Aligned to regional agricultural onset (dt = 0)",
    x = "Years Relative to Onset (dt)",
    y = "Juvenile Ratio (IJP)"
  ) + ndt_theme

p2_growth <- ggplot(df_epochs %>% filter(!is.na(growth_r) & dt >= -3000 & dt <= 3500), aes(x = dt, y = growth_r / 100, colour = region)) +
  geom_hline(yintercept = 0, linetype = "dotted", colour = "#64748B") +
  geom_vline(xintercept = 0, linetype = "dashed", colour = "#475569", linewidth = 0.7) +
  geom_line(linewidth = 1.0) +
  geom_point(size = 2) +
  scale_colour_manual(values = region_palette) +
  scale_y_continuous(labels = percent_format(accuracy = 0.01, decimal.mark = ",")) +
  labs(
    title = "Annualised Population Growth Rate (r %/yr)",
    subtitle = "Transient Neolithic boom vs. LBK boom-bust cycles",
    x = "Years Relative to Onset (dt)",
    y = "Annual Growth Rate"
  ) + ndt_theme

p3_cropland <- ggplot(df_epochs %>% filter(year >= -8000), aes(x = year, y = crop_pc, colour = region)) +
  geom_line(linewidth = 1.1) +
  geom_point(size = 1.8) +
  scale_colour_manual(values = region_palette) +
  scale_y_continuous(labels = comma_format(suffix = " m2", big.mark = ".", decimal.mark = ",")) +
  labs(
    title = "Per-Capita Arable Cropland Trajectory (8000 BC - 1000 AD)",
    subtitle = "HYDE 3.3 / Velkscala 1.0 agricultural intensification",
    x = "Calendar Year (BC/AD)",
    y = "Cropland / Capita (m2)"
  ) + ndt_theme

p4_geocodes <- ggplot(df_geocodes, aes(x = reorder(code, ijp_0AD), y = ijp_0AD, fill = region)) +
  geom_col(alpha = 0.88, width = 0.72) +
  coord_flip() +
  scale_fill_manual(values = region_palette) +
  scale_y_continuous(labels = percent_format(accuracy = 1, decimal.mark = ","), limits = c(0, 0.55)) +
  labs(
    title = "Spatial Age-Structure Differentiation (0 AD Benchmark)",
    subtitle = "Endogenous per-geocode Bocquet-Appel IJP variation across 19 jurisdictions",
    x = "Geocode",
    y = "Bocquet-Appel IJP (0 AD)"
  ) + ndt_theme

# 5. Assemble 2x2 Dashboard ----------------------------------------------------
ndt_dashboard <- (p1_ijp | p2_growth) / (p3_cropland | p4_geocodes) +
  plot_annotation(
    title    = "Velkscala 1.0: Neolithic Demographic Transition (NDT) Empirical Audit",
    subtitle = "10000 BC - 1000 AD | 5 Agricultural Origins & 19 Subnational/National Geocodes",
    caption  = "Priors: Bocquet-Appel (2002, 2008), Shennan et al. (2013), HYDE 3.3 & Stadester/Velkscala 1.0 (2026).",
    theme    = theme(
      text          = element_text(family = "Karla"),
      plot.title    = element_text(family = "Karla", face = "bold", size = 20, margin = margin(t = 6, b = 6)),
      plot.subtitle = element_text(family = "Karla", size = 14, colour = "#64748B", margin = margin(b = 16)),
      plot.caption  = element_text(family = "Karla", size = 10.5, colour = "#64748B", margin = margin(t = 8)),
      plot.margin   = margin(t = 4, r = 2, b = 4, l = 2)
    )
  )

# 6. Export High-DPI PNG to data/3.data_visualisation/images & visuals ---------
saved_ndt <- save_dual_plot(
  ndt_dashboard,
  "ndt_paleodemographic_dashboard",
  list(
    defines = velkscala_defines,
    dpi = 220L,
    extra_dirs = c(velkscala_defines$paths$test_ndt_dir),
    height = 8.8,
    width = 16.0
  )
)
message(sprintf("✔ NDT dashboard exported to: %s", saved_ndt$png))
