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

## Abstract.

- E-mail: [vf@confoederatio.org](mailto:vf@confoederatio.org)
- Dataview: https://dataview.confoederatio.org/
- <ins>Download:</ins>
- - Stadestér (Cities, part of Velkscala) | [Projects (1.1)](https://projects.confoederatio.org/c/Stadester)
- - **Velkscala (Demographics)** | [Datavault (1.0)](https://datavault.confoederatio.org/s/44Pfgt7ya8wE77b)
- - Eoscala (Economics) | [Datavault (1.5)](https://datavault.confoederatio.org/s/2Kytdej7ABpw4rr)
- - Atlas (Polities) | [Datavault (0.7)](https://datavault.confoederatio.org/s/rPntqXwCxzXg4Bk)

**Velkscala** is a geospatial database of demographic and land use indicators from 10000BC-2025AD, at 5-arcmin resolution. Most rasters are WGS84 Equirectangular, 4320×2160, and split into 127 timesteps: 1000-year intervals from 10000BC to 1AD, 100-year intervals from 1AD-1700AD, at 10-year intervals from 1700AD to 1950AD, and at 1-year intervals from 1950AD-2025AD.

`population_density`, `population_rural`, `population_total`, `population_urban` are major indicators, and as such, have been modelled at 100-year intervals between 10000BC to 1AD, using radiocarbon-watershed binning and disaggregation methodologies. 

Using an anchoring methodology with cropland, pasture, and urban population, each watershed’s cumulative population was then backcalculated using summed probability distributions. All watersheds are anchored to 1AD due to [ArchaeoGLOBE](https://doi.org/10.1126/science.aax1192) constraints.

**Stadestér**, which includes individual city databases, has also been included in this dataset release; unlike raster datasets, it is primarily in `.json` form to model discrete city information. Since rasters are encoded as GeoPNG, `app.R` contains an R Shiny app able to decode GeoPNGs.

---

This is the testing and validation repository for **Velkscala**, a geospatial database on population and demographics from 10000BC to 2025AD. Figures and methods reports are prepared here, sorted by version. For the actual data pipelines involved in generating Velkscala data, please check [Collation](https://github.com/ConfoederatioVF/Collation).

## File Structures (Velkscala/Stadestér).

<details>
  <summary><h3>Stadestér Metadata.</h3></summary>

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
<summary><h3>Velkscala Metadata.</h3></summary>

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
<details>
  <summary><h2>Methodology.</h2></summary>
  <details open>
<summary><h3>Age/Sex (Total)</h3></summary>

Aggregate populations per age/sex cohort. Age bands are 0-1, 1-5, 5-year age bands until 80+, and 80+ respectively, isomorphic to WorldPop. Sexes as calculated are male/female. You can view the individual population pyramid of a country by clicking on it.

#### Methodology

Multinomial logit regression across covariates as specified below; logits for age/sex bands are normalised to 0-1 and then multiplied across **Population (Total)**. This was broadly modelled after the methodology that [WorldPop used](https://www.worldpop.org/current-projects/completed-projects/mapping-population-age-and-sex-structures-at-high-resolution/). 
- Source code: [Github](https://github.com/ConfoederatioVF/Collation/tree/main/histmap/3.data_transform/age_sex) | [Projects](https://projects.confoederatio.org/Confoederatio/Collation/src/branch/main/histmap/3.data_transform/age_sex)

Normalisation periods are separated out into three phases:

1. Prior to 1750, decreasing PAVA/isotonic regression is used at the global and ISO3 levels, ensuring monotonicity.
2. Between 1750-1850, a logistic kernel regime (transition between PAVA and Whittaker-Henderson) is applied with a steepness of `8` [1].
3. After 1850, we use coupled Whittaker-Henderson graduations with Huber loss.
- Mathematical description: [Velkscala Modelling Report, 8 October 2026](https://confoederatio.org/papers/Velkscala%20Modelling%20Report%20-%208%20October%202026.pdf)
  - This includes descriptions of parameters used.

__Sources:__
These list sources for direct training data only.
1. [WorldPop (2019)](https://hub.worldpop.org/geodata/summary?id=24798), methodology described by [Pezzulo et al. (2017)](https://dx.doi.org/10.1038/sdata.2017.89)
2. [UN World Population Prospects (2024)](https://population.un.org/wpp/). Backcalculated/projected forwards using WorldPop/Velkscala distributions. See **Population (Total)** for more information on Velkscala.
3. [Human Mortality Database](https://www.mortality.org/). Used for countries prior to 1950AD.

__Covariates:__
Covariates are used for both consistent training and hindcasting.
- [HYDE 3.3 (LU)](https://landuse.sites.uu.nl/hyde-project/): `conv_rangeland`, `cropland`, `grazing`, `ir_norice`, `ir_rice`, `pasture`, `rangeland`, `rf_norice`, `rf_rice`, `shifting`, `tot_irri`, `tot_rainfed`, `tot_rice`, `uopp_`
- [Velkscala 1.0](https://datavault.confoederatio.org/s/44Pfgt7ya8wE77b): `popc_`, `popd_`, `rurc_`, `urbc_`
- [Eoscala 1.5](https://datavault.confoederatio.org/s/2Kytdej7ABpw4rr): `discretionary_income`, `disposable_income`, `gdp_nominal`, `gdp_pc`, `gdp_ppp`, `gdp_ppp_pc`, `gini`, `net_income`, `net_wealth`
- Delta covariates (annualised changes in Eoscala/Velkscala rasters).

**Confused about how covariates were calculated?** Click the corresponding mapmode to highlight their methodology.

__Footnotes:__
1. This is because 1750-1850 has 8 time-steps in between at decadal resolution. It begins at 1750, since this is the first year with an HMD entry.

</details>

<details open>
<summary><h3>Births (Total)</h3></summary>

Aggregate annualised births per gridcell.

#### Methodology

Calculated as a residual of the demographic balancing equation after reconciliation for net migration and infant mortality, the former of which is estimated first. Births weighted least squares model (share of 0-1yo age band attributable to births rather than migration).
**Note.** Deaths are hindcasted in the same logical turn and reconciled to fulfil the demographic balancing equation.
- Mathematical description: [Velkscala Modelling Report, 8 October 2026](https://confoederatio.org/papers/Velkscala%20Modelling%20Report%20-%208%20October%202026.pdf)
- Source code: [Github](https://github.com/ConfoederatioVF/Collation/tree/main/histmap/2.data_cleaning/births_deaths_OLS) | [Projects](https://projects.confoederatio.org/Confoederatio/Collation/src/histmap/2.data_cleaning/births_deaths_OLS)

__Sources:__
These list sources for direct training data only.
1. [Niva et al. (2023)](https://doi.org/10.1038/s41562-023-01689-4)
2. [UN World Population Prospects (2024)](https://population.un.org/wpp/). Backcalculated/projected forwards using Niva et al./Velkscala distributions. See **Population (Total)** for more information on Velkscala.
3. [Human Mortality Database](https://www.mortality.org/). Used for countries prior to 1950AD.

__Covariates:__
Covariates are used for both consistent training and hindcasting.
- [HYDE 3.3 (LU)](https://landuse.sites.uu.nl/hyde-project/): `conv_rangeland`, `cropland`, `grazing`, `ir_norice`, `ir_rice`, `pasture`, `rangeland`, `rf_norice`, `rf_rice`, `shifting`, `tot_irri`, `tot_rainfed`, `tot_rice`, `uopp_`
- [Velkscala 1.0](https://datavault.confoederatio.org/s/44Pfgt7ya8wE77b): `popc_`, `popd_`, `rurc_`, `urbc_`
- [Eoscala 1.5](https://datavault.confoederatio.org/s/2Kytdej7ABpw4rr): `discretionary_income`, `disposable_income`, `gdp_nominal`, `gdp_pc`, `gdp_ppp`, `gdp_ppp_pc`, `gini`, `net_income`, `net_wealth`
- Delta covariates (annualised changes in Eoscala/Velkscala rasters).

**Confused about how covariates were calculated?** Click the corresponding mapmode to highlight their methodology.

</details>

<details open>
<summary><h3>Deaths (Total)</h3></summary>

Aggregate annualised deaths per gridcell.

#### Methodology

Calculated as a residual of the demographic balancing equation after reconciliation for net migration and births, the former of which is estimated first. Deaths weighted least squares model (share of cohort declines attributable to births rather than migration), after Euler-Lotka normalisation, i.e. for changes in births affecting decline of subsequent cohorts.
**Note.** Births are hindcasted in the same logical turn and reconciled to fulfil the demographic balancing equation.
- Mathematical description: [Velkscala Modelling Report, 8 October 2026](https://confoederatio.org/papers/Velkscala%20Modelling%20Report%20-%208%20October%202026.pdf)
- Source code: [Github](https://github.com/ConfoederatioVF/Collation/tree/main/histmap/2.data_cleaning/births_deaths_OLS) | [Projects](https://projects.confoederatio.org/Confoederatio/Collation/src/histmap/2.data_cleaning/births_deaths_OLS)

__Sources:__
These list sources for direct training data only.
1. [Niva et al. (2023)](https://doi.org/10.1038/s41562-023-01689-4)
2. [UN World Population Prospects (2024)](https://population.un.org/wpp/). Backcalculated/projected forwards using Niva et al./Velkscala distributions. See **Population (Total)** for more information on Velkscala.
3. [Human Mortality Database](https://www.mortality.org/). Used for countries prior to 1950AD.

__Covariates:__
Covariates are used for both consistent training and hindcasting.
- [HYDE 3.3 (LU)](https://landuse.sites.uu.nl/hyde-project/): `conv_rangeland`, `cropland`, `grazing`, `ir_norice`, `ir_rice`, `pasture`, `rangeland`, `rf_norice`, `rf_rice`, `shifting`, `tot_irri`, `tot_rainfed`, `tot_rice`, `uopp_`
- [Velkscala 1.0](https://datavault.confoederatio.org/s/44Pfgt7ya8wE77b): `popc_`, `popd_`, `rurc_`, `urbc_`
- [Eoscala 1.5](https://datavault.confoederatio.org/s/2Kytdej7ABpw4rr): `discretionary_income`, `disposable_income`, `gdp_nominal`, `gdp_pc`, `gdp_ppp`, `gdp_ppp_pc`, `gini`, `net_income`, `net_wealth`
- Delta covariates (annualised changes in Eoscala/Velkscala rasters).

**Confused about how covariates were calculated?** Click the corresponding mapmode to highlight their methodology.

</details>

<details open>
<summary><h3>Migration (Gender) (Total)</h3></summary>

Aggregate annualised net migration, stratified by sex per gridcell. See **Net Migration** for more information on the methodology used.

</details>

<details open>
<summary><h3>Net Migration (Total)</h3></summary>

Aggregate annualised net migration of both sexes per gridcell.

#### Methodology

Raw aggregates estimated by weighted least squares (WLS) over covariates, with Tukey's fences/log-tail normalisation used to preserve spatial variance.
- Mathematical description: [Velkscala Modelling Report, 8 October 2026](https://confoederatio.org/papers/Velkscala%20Modelling%20Report%20-%208%20October%202026.pdf)
- Source code: [Github](https://github.com/ConfoederatioVF/Collation/tree/main/histmap/2.data_cleaning/migration_OLS) | [Projects](https://projects.confoederatio.org/Confoederatio/Collation/src/histmap/2.data_cleaning/migration_OLS)

(1,2) are sources for direct training data only; (3) was the model specification used during clamping.
1. [Niva et al. (2023)](https://doi.org/10.1038/s41562-023-01689-4)
2. [UN World Population Prospects (2024)](https://population.un.org/wpp/). Backcalculated/projected forwards using Niva et al./Velkscala distributions. See **Age/Sex**, **Population (Total)** for more information on Velkscala.
3. [Rogers and Castro (1981)](https://pure.iiasa.ac.at/id/eprint/1543/1/RR-81-030.pdf) via [Husinger (2022)](https://raw.githubusercontent.com/AppliedDemogToolbox/Hunsinger_MMSRCode/master/MMSRCode.R)

__Covariates:__
Covariates are used for both consistent training and hindcasting.
- [HYDE 3.3 (LU)](https://landuse.sites.uu.nl/hyde-project/): `conv_rangeland`, `cropland`, `grazing`, `ir_norice`, `ir_rice`, `pasture`, `rangeland`, `rf_norice`, `rf_rice`, `shifting`, `tot_irri`, `tot_rainfed`, `tot_rice`, `uopp_`
- [Velkscala 1.0](https://datavault.confoederatio.org/s/44Pfgt7ya8wE77b): `popc_`, `popd_`, `rurc_`, `urbc_`
- [Eoscala 1.5](https://datavault.confoederatio.org/s/2Kytdej7ABpw4rr): `discretionary_income`, `disposable_income`, `gdp_nominal`, `gdp_pc`, `gdp_ppp`, `gdp_ppp_pc`, `gini`, `net_income`, `net_wealth`
- Delta covariates (annualised changes in Eoscala/Velkscala rasters).

**Confused about how covariates were calculated?** Click the corresponding mapmode to highlight their methodology.

</details>

<details open>
<summary><h3>Population Density (ihb/km^2)</h3></summary>

Population density per gridcell in terms of inhabitants per square kilometre, i.e. total population divided by land area.

</details>

<details open>
<summary><h3>Population (Total)</h3></summary>

Total inhabitants per gridcell, not adjusted for landarea. Fractional inhabitants represent a population density thinner than one per gridcell, i.e. for semi-sedentary or nomadic populations, or accounting for intra-year migration.

#### Methodology

- Source code: [Github](https://github.com/ConfoederatioVF/Collation/tree/main/histmap/2.data_cleaning/population_Velkscala) | [Projects](https://projects.confoederatio.org/Confoederatio/Collation/src/branch/main/histmap/2.data_cleaning/population_Velkscala)

Dasymetric allocation model based on a HYDE substrata with manual outlier masking (see the [Stadester repository](https://projects.confoederatio.org/c/Stadester)) for more information on specific outliers and clamps. Outliers were then replaced using a regional/globally scaled ALCC model from [Hurtt et al. (2020)](https://doi.org/10.5194/gmd-13-5425-2020) and [Kaplan and Krumhardt (2010)](https://doi.org/10.1594/PANGAEA.871369).

The anthropogenic land use fraction per gridcell was then summed up for both models respectively, and the two were averaged over their common domain. Where the domain was not shared, it fell back to the most recent model with availability for the target year; LUH2 after 850AD, KK10 prior to 850AD.

---

- Source code (Radiocarbon): [Github](https://github.com/ConfoederatioVF/Collation/tree/main/histmap/2.data_cleaning/population_c14bazAAR) | [Projects](https://projects.confoederatio.org/Confoederatio/Collation/src/branch/main/histmap/2.data_cleaning/population_c14bazAAR)

Before 1AD, we model population in 100-year increments using radiocarbon dates as a proxy for population density. Dates were taken from 28 databanks in [c14bazAAR](https://github.com/ropensci/c14bazAAR) and deduplicated. Dates were then binned to [WMO Watersheds](https://grdc.bafg.de/products/basin_layers/wmo_basins/), allowing for the estimation of prehistoric demography via summed probability distributions, see [Kelly et al. (2025)](https://doi.org/10.1073/pnas.2419454122) and [Price et al. (2021)](https://doi.org/10.1016/j.jas.2021.105473) for a discussion of the technique.

Calibration was done via IntCal20 and SHCal20, see [OxCal](https://c14.arch.ox.ac.uk/oxcalhelp/hlp_curves.html). 1AD is the recommended global cutoff by [ArchaeoGLOBE](https://www.science.org/doi/10.1126/science.aax1192). Individual corrections were issued for populations in Northern America, see [Tacitus and Kätzchen (2025)](https://doi.org/10.5281/zenodo.17180328).

Urban population was then overlaid on top of the substrata. Watersheds served as areal masks for underlying HYDE estimations of rural population.

</details>

<details open>
<summary><h3>Population (Rural) (Rural and periurban population, total)</h3></summary>

Defined as the residual of total population minus the urban population, i.e. both rural and periurban populations. See **Population (Total)** and **Population (Urban)** for more information on their respective methodologies.

</details>

<details open>
<summary><h3>Population (Urban) (Urban population, total)</h3></summary>

Defined as populations directly attached to an identifiable historical city, scanline allocation and buffering using ensemble regional modelling from [Angel (2010)](https://www.lincolninst.edu/app/uploads/legacy-files/pubfiles/1861_1171_angel_iii_final.pdf), [Clark (1951)](https://doi.org/10.2307/2981088) and [Stanilov and Sykora (2014)](https://doi.org/10.1002/9781118295861) via [Pénzes et al. (2023)](https://doi.org/10.3390/land12091682). Clark's law was used unconditionally prior to 1945AD.

See **Stadestér** for more information on the specific methodology used to assemble databanks of historical cities.

</details>

<details open>
<summary><h3>Anthropogenic Land Cover Change (ALCC) (km^2/cell)</h3></summary>

Anthropogenic land use area per gridcell (cropland, managed pasture, and built-up land) in km^2/cell, dervied from KK10 and LUH2.

#### Methodology

Globally scaled ALCC model from [Hurtt et al. (2020)](https://doi.org/10.5194/gmd-13-5425-2020) and [Kaplan and Krumhardt (2010)](https://doi.org/10.1594/PANGAEA.871369). Referred to internally as KK10LUH2.

The anthropogenic land use fraction per gridcell was then summed up for both models respectively, and the two were averaged over their common domain. Where the domain was not shared, it fell back to the most recent model with availability for the target year; LUH2 after 850AD, KK10 prior to 850AD.
- Source code: [Github](https://github.com/ConfoederatioVF/Collation/tree/main/histmap/2.data_cleaning/population_KK10LUH2) | [Projects](https://projects.confoederatio.org/Confoederatio/Collation/src/2.data_cleaning/population_KK10LUH2)

</details>

<details open>
<summary><h3>Converted Rangeland (km^2/cell)</h3></summary>

Defined as rangeland being placed on a potential forest area, and thus being converted; relevant to DVGM and climate models.

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>

<details open>
<summary><h3>Cropland (km^2/cell)</h3></summary>

Total cropland area, after 1960 identical to FAO's category 'Arable land and permanent crops'.

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>

<details open>
<summary><h3>Grazing (km^2/cell)</h3></summary>

Total land used for grazing, after 1960 identical to FAO's category 'Permanent meadows and pastures'.

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>

<details open>
<summary><h3>Irrigated Non-Rice Cropland (km^2/cell)</h3></summary>

All crops cultivated under irrigation, with the exception of rice.

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>

<details open>
<summary><h3>Irrigated Rice Cropland (km^2/cell)</h3></summary>

All rice crops cultivated under irrigation.

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>

<details open>
<summary><h3>Pasture (km^2/cell)</h3></summary>

Defined as grazing land with an aridity index >0,5; assumed to be more intensively managed. (Converted in climate models).

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>

<details open>
<summary><h3>Rangeland (km^2/cell)</h3></summary>

Defined as grazing land with an aridity index <0,5; defined as grazing land with an aridity index <0,5; assumed to be less or not managed. (Not converted in climate models).

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>

<details open>
<summary><h3>Rainfed Non-Rice Cropland (km^2/cell)</h3></summary>

Cropland reliant upon being rainfed (rather than irrigated), excluding rice cultivation.

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>

<details open>
<summary><h3>Rainfed Rice Cropland (km^2/cell)</h3></summary>

Rice cropland reliant upon being rainfed (rather than irrigated).

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>

<details open>
<summary><h3>Shifting Cultivation (km^2/cell)</h3></summary>

Unlike other HYDE variables, this was assessed in 1deg cells. Described as temporary agriculture in which cultivation occurs for a short period and is then fallowed post-exhaustion.

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>

<details open>
<summary><h3>Total Irrigated Area (km^2/cell)</h3></summary>

Total actual irrigated area, including both rice and non-rice areas.

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>

<details open>
<summary><h3>Total Rainfed Area (km^2/cell)</h3></summary>

Total area reliant upon being rainfed, not including rice areas.

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>

<details open>
<summary><h3>Total Rice Cultivation (km^2/cell)</h3></summary>

Total rice cultivation including both rainfed and irrigated varieties.

Taken directly from [HYDE](https://landuse.sites.uu.nl/datasets/).

</details>
</details>
