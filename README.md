> [!NOTE]
> You can download Velkscala data from [Confoederatio Datavault](https://datavault.confoederatio.org/s/44Pfgt7ya8wE77b), and can be viewed at https://dataview.confoederatio.org/.

## Abstract.

> [!WARNING]
> This README as well as the contents of this repository are a **work-in-progress**. It is currently being worked on as part of Intellte.

This is the testing and validation repository for **Velkscala**, a geospatial database on population and demographics from 10000BC to 2025AD. Figures and methods reports are prepared here, sorted by version.

For the actual data pipelines involved in generating Velkscala data, please check [Collation](https://github.com/ConfoederatioVF/Collation).

## Data Structure.

**Velkscala** is a geospatial database of demographic and land use indicators from 10000BC-2025AD, at 5-arcmin resolution. Most rasters are WGS84 Equirectangular, 4320×2160, and split into 127 timesteps: 1000-year intervals from 10000BC to 1AD, 100-year intervals from 1AD-1700AD, at 10-year intervals from 1700AD to 1950AD, and at 1-year intervals from 1950AD-2025AD.

`population_density`, `population_rural`, `population_total`, `population_urban` are major indicators, and as such, have been modelled at 100-year intervals between 10000BC to 1AD, using radiocarbon-watershed binning and disaggregation methodologies. 

Using an anchoring methodology with cropland, pasture, and urban population, each watershed’s cumulative population was then backcalculated using summed probability distributions. All watersheds are anchored to 1AD due to [ArchaeoGLOBE](https://doi.org/10.1126/science.aax1192) constraints.

**Stadestér**, which includes individual city databases, has also been included in this dataset release; unlike raster datasets, it is primarily in `.json` form to model discrete city information. Since rasters are encoded as GeoPNG, `app.R` contains an R Shiny app able to decode GeoPNGs.

**Note.**

For socioeconomic researchers, the following open datasets may also prove valuable:

1. Stadestér (Cities, part of Velkscala) | [Projects (1.1)](https://projects.confoederatio.org/c/Stadester)
2. Velkscala (Demographics) | [Datavault (1.0)](https://datavault.confoederatio.org/s/44Pfgt7ya8wE77b)
3. Eoscala (Economics) | [Datavault (1.5)](https://datavault.confoederatio.org/s/2Kytdej7ABpw4rr) - Subadministrative divisions used in certain demographic models may be found here, in `admin_modern/`.
4. Atlas (Polities) | [Datavault (0.6)](https://datavault.confoederatio.org/s/aBeY4JP4QGFjqRL)

### Data Structure.

**Cities.**

- `capital_cities/` - Contains all capital city information as well as the state IDs they are part of. State IDs are defined by Atlas (Polities), specifically the Detailed branch.
  - `capital_cities/chunk_<#>.txt` - Contains a given state ID range alongside their capital city history. States with no fixed capitals are marked ‘ACAPITAL’, and have a corresponding `.reason` field as to why this is.
- `city_metadata.json` - Contains city metadata for the present version, including historical city names and capital city status (along with the state IDs they are the capital of). Optional.
- `stadester_1.1_base.json` - Base cities without satellite merging. Contains only city populations and names.
- `stadester_1.1_extended.json` - Hybrid cities, merged with satellite data. Contains city populations, names, area, extents, density, rate of natural increase, and modelled density at city centre.

**Demographics.**

- `age_sex/` - Age/sex cohort structures, aggregates.
  - The following age cohorts are available: 
    - `00`: 0-1 year olds.
    - `01`: 1-5 year olds.
    - `05` - `75`: 5-year age bands from 5 years of age to 75 years of age.
    - `80+`: Those aged 80 and older.
  - `f/m_<age>_<year>.png` - Contains total populations stratified by age and sex.
- `births/` - Total aggregate births.
- `deaths/` - Total aggregate deaths, stratified by sex.
  - `female_deaths_<year>.png` - Total female deaths modelled for this year.
  - `male_deaths_<year>.png` - Total male deaths modelled for this year.
- `migration/` - Net migration flows, stratified by sex.
  - `female_net_migration_<year>.png` - Total female net migration.
  - `male_net_migration_<year>.png` - Total male net migration.
  - `net_migration_<year>.png` - Lump-sum net migration, both sexes.
- `population_density/` - Population density by ihb/km².
- `population_rural/` - Total rural and periurban populations.
- `population_total/` - Total aggregate populations.
- `population_urban/` - Total urban populations.

  
**Land Use.**

- `landuse/` - Landuse covariates, largely processed from the [History Database of the Global Environment (HYDE)](https://hyde-portal.geo.uu.nl/). HYDE suffixes are given as `<year>AD/BC.png` for legacy compatibility. Note that we use the latest internal version of HYDE3.5, which contains information for 2024-2025.
  - `alcc/` - Anthropogenic Land Cover Change, modelled from [KK10](https://journals.sagepub.com/doi/10.1177/0959683610386983) and [LUH2](https://luh.umd.edu/).
  - `conv_rangeland`: Converted Rangeland (km^2/cell)
  - `cropland`: Cropland (km^2/cell)
  - `grazing`: Grazing Land (km^2/cell)
  - `ir_norice`: Irrigated Non-Rice Cropland (km^2/cell)
  - `ir_rice`: Irrigated Rice Cropland (km^2/cell)
  - `pasture`: Pasture Area (km^2/cell)
  - `rangeland`: Rangeland Area (km^2/cell)
  - `rf_norice`: Rainfed Non-Rice Cropland (km^2/cell)
  - `rf_rice`: Rice Cropland (km^2/cell)
  - `shifting`: Shifting Cultivation (km^2/cell)
  - `tot_irri`: Irrigated Area (km^2/cell)
  - `tot_rainfed`: Rainfed Non-Rice Cropland (km^2/cell)
  - `tot_rice`: Rice Cropland (km^2/cell) 
  - These population artefacts are for internal/developer use only in **Partial Substrata Modelling**. Please use top-level variables under **Demographics** for actual population work.
  - `popc_`: Total Population (pop/cell)
  - `popd_`: Population Density (pop/km^2)
  - `rurc_`: Rural Population (pop/cell)
  - `uopp_`: Built-Up Area (km^2/cell)
  - `urbc_`: Urban Population (pop/cell)
