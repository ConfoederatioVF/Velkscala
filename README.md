# Velkscala

<div align = "center">
<img src = "https://i.postimg.cc/3ND2B1zL/crd-coat-of-arms-logo.png" height = "64">
<br><br>
<img src = "https://i.postimg.cc/jKCkw0M7/83-velkscala.jpg" width = "100%">
<br><br>
<div align = "center">
  Figure 1. Estimated aggregate populations for males aged 15-30yo in 1400AD, with corresponding population pyramids.
</div>
<br>

[![Join our community (Element Matrix)!](https://img.shields.io/badge/chat-on%20matrix-51bb9c?style=for-the-badge)](https://matrix.to/#/#confoederatio:matrix.confoederatio.org) [![Join our community!](https://img.shields.io/discord/548994743925997570?label=Discord&style=for-the-badge)](https://discord.gg/89kQY2KFQz) ![](https://img.shields.io/github/languages/code-size/ConfoederatioVF/Velkscala?style=for-the-badge)

</div>

> [!NOTE]
> You can download Velkscala data from [Confoederatio Datavault](https://datavault.confoederatio.org/s/44Pfgt7ya8wE77b). It can be viewed at https://dataview.confoederatio.org/.

## Abstract.

> [!WARNING]
> This README as well as the contents of this repository are a **work-in-progress**. It is currently being worked on as part of Intellte.

**Velkscala** is a geospatial database of demographic and land use indicators from 10000BC-2025AD, at 5-arcmin resolution. Most rasters are WGS84 Equirectangular, 4320×2160, and split into 127 timesteps: 1000-year intervals from 10000BC to 1AD, 100-year intervals from 1AD-1700AD, at 10-year intervals from 1700AD to 1950AD, and at 1-year intervals from 1950AD-2025AD.

`population_density`, `population_rural`, `population_total`, `population_urban` are major indicators, and as such, have been modelled at 100-year intervals between 10000BC to 1AD, using radiocarbon-watershed binning and disaggregation methodologies. 

Using an anchoring methodology with cropland, pasture, and urban population, each watershed’s cumulative population was then backcalculated using summed probability distributions. All watersheds are anchored to 1AD due to [ArchaeoGLOBE](https://doi.org/10.1126/science.aax1192) constraints.

**Stadestér**, which includes individual city databases, has also been included in this dataset release; unlike raster datasets, it is primarily in `.json` form to model discrete city information. Since rasters are encoded as GeoPNG, `app.R` contains an R Shiny app able to decode GeoPNGs.

---

This is the testing and validation repository for **Velkscala**, a geospatial database on population and demographics from 10000BC to 2025AD. Figures and methods reports are prepared here, sorted by version.

For the actual data pipelines involved in generating Velkscala data, please check [Collation](https://github.com/ConfoederatioVF/Collation).

**Note.**

For socioeconomic researchers, the following open datasets may also prove valuable:

1. Stadestér (Cities, part of Velkscala) | [Projects (1.1)](https://projects.confoederatio.org/c/Stadester)
2. Velkscala (Demographics) | [Datavault (1.0)](https://datavault.confoederatio.org/s/44Pfgt7ya8wE77b)
3. Eoscala (Economics) | [Datavault (1.5)](https://datavault.confoederatio.org/s/2Kytdej7ABpw4rr) - Subadministrative divisions used in certain demographic models may be found here, in `admin_modern/`.
4. Atlas (Polities) | [Datavault (0.7)](https://datavault.confoederatio.org/s/aBeY4JP4QGFjqRL)

<details>
  <summary><h3>Data Structure (Stadestér).</h3></summary>

## Stadestér 1.0

See <https://doi.org/10.5281/zenodo.17180328> for more information on Stadestér 1.0 usage.

## Stadestér 1.1

### Base Files.

JSON data structures for base/extended files. Satellite data refers to the use of [GHS-POP](https://human-settlement.emergency.copernicus.eu/ghs_pop.php)/[GHS-UCDB](https://doi.org/10.1038/s41597-023-02691-1) modelling.

<details>
<summary><kbd>stadester_1.1_base.json</kbd> - Contains base Stadestér cities without satellite data.</summary>
  
`<city_name>-<country_name>`: Object

- `.name`: string
- `.other_names`: string\[\]
- `.population`: Object
  - `<year>`: number
- `.coords`: number\[lat, lng\]
- `.country`: string
- `.key`: string
- `.original_names`: string\[\]
- `.type`: string - The original source this city came from.

</details>
<details>
<summary><kbd>stadester_1.1_extended.json</kbd> - Contains Stadestér cities plus satellite data.</summary>
  
`stadester/ghsl-<city_name>-<country_name>`: Object

- `.name`: string
- `.population`: Object
  - `<year>`: number
- `.coords`: number\[lat, lng\]
- `.country`: string
- `.key`: string
- `.original_names`: string\[\]
- `.type`: string - The original source this city came from.
- Extra fields:
- `.area`: Object
  - `<year>`: number
- `.centre_density`: Object - Estimated density at city centre.
  - `<year>`: number
- `.density`: Object
  - `<year>`: number
- `.radial_buffers`: Object
  - `<year>`: number\[\] - In 5-arcmin gridcells, estimated dropoffs in ihb/gridcell, based off radial distance.
- `.rni`: Object - Rate of Natural Increase.
  - `<year>`: number
- `.region`: string - The Eoscala region the city belongs to.
- `.pixel_coords`: number\[\] - X, Y coords on a Cartesian plane, assuming 4320×2160 WGS84 Equirectangular.
- `.colour`: number\[\] - The R, G, B colour for the given region.

</details>

### City Metadata.

Rich metadata can also be included for individual cities. Note that the use of `<state_id>` implies the `.state_id` field from [Atlas 0.6b Detailed](https://datavault.confoederatio.org/s/rPntqXwCxzXg4Bk). City metadata is contained in `city_metadata.json` starting from Stadestér 1.1 forwards.

Metadata is meant to function as an injected layer, with Stadestér Objects being mapped onto `city_metadata.json` spatially, i.e. via nearest distance. It is formatted as an Object\[\] in JSON terms.

- `.name`: string
- `.coords`: number\[lng, lat\]
- `.historical_names`: Object\[\]:
  - `[n]`: Object:
    - `.date`: string - Formatted as `yyyy.mm.dd`, negative years represent BC.
    - `.name`: string - The historical name of the city at this date.
- `.capital`: Object
  - `<yyyy.mm.dd>`: number|null - Where the value is the same as `<state_id>` from Atlas 0.6b Detailed. If the value is null, the city stops being a capital at that date.

### Extended Fields.

Angel, Clark, and Eoscala all use different regions. Note that `.region` is the same as Eoscala regions. These regions are defined as follows for statistical and modelling purposes:

`.angel_region`: east_asia, eu_and_japan, latin_america, lrdc, mena, sub_saharan_africa

`.clark_region`: anglo_settler, eu_and_east_asia, global_south, socialist_world

`.region`: central_asia, eastasia, eastern_europe_and_russia, europe, indian_subcontinent, latin_america, maghreb_egypt, middle_east, northern_america, oceania, southeast_asia, sub_saharan_africa.

### State-centred Metadata (Capital Cities):

Data structured around individual `<state_id>` values are available in the `/capital_cities/` folder and are structured as follows.

`acapital_states.json`: Object\[n\]:

- `.state_id`: number
- `.name`: string
- `.reason`: string - The reason why the polity is listed as an acapital state.

`chunk_<#>.txt`: 

```
# Format:
#   STATE: [ID] Name (start_date -> stop_date) [fill: #HEX]
#   STATUS: CAPITAL | ACAPITAL
#   TIMELINE: (for CAPITAL)
#     <y.m.d> start_date -> <y.m.d> stop_date: City Name [city_key]
#   REASON: (for ACAPITAL) Reason for acapital status
```

Example of individual entry:

```
STATE: [7573] Vijayanagara Empire (1336.1.1 -> 1647.1.1) [fill: #4E825E]
STATUS: CAPITAL
TIMELINE:
  1336.1.1 -> 1565.1.26: Hampi
  1565.1.26 -> 1592.1.1: Penukonda
  1592.1.1 -> 1646.1.1: Chandragiri
---
```

Because historical names are already encoded in `city_metadata.json` via nearest-coordinate name timelines, capital city chunks utilise consistent Stadestér keys, which reflect the names such cities had at their peak population.
  
</details>

<details open>
<summary><h3>Data Structure (Velkscala).</h3></summary>

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
 
<div align = "center">
  <img src = "https://i.postimg.cc/VkhQL7Cp/17-velkscala.png" width = "50%"><br><br>
  Figure 2. Land-use reconstructions for Velkscala vs. LUH2.
</div>
<br>

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
 
</details>
