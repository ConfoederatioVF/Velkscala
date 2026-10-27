//Import React hooks and core/framework UI helpers
import React, { useMemo, useState } from "react";
import { FlexPartition, formatEuroNumber, SortHeader, useSortableData } from "../../framework/index_ui.js";


/**
 * Tab 1: Contemporary Demographic Transition (CDT) Validation with resizable flex partitions.
 *
 * @param {Object} arg0_props
 *  @param {Object} arg0_props.ageSexData
 *  @param {Object} arg0_props.birthsDeathsData
 *
 * @returns {React.ReactElement}
 */
export function CDTValidationView (arg0_props) {
  //Convert from parameters
  let age_sex_data = arg0_props.ageSexData;
  let births_deaths_data = arg0_props.birthsDeathsData;

  //Declare local instance variables
  let age_sex_epochs_raw = age_sex_data?.summary_by_epoch || [];
  let bd_epochs_raw = births_deaths_data?.summary_by_epoch || [];
  let [country_year, setCountryYear] = useState("2019");
  let years_list = age_sex_data?.per_country ? Object.keys(age_sex_data.per_country) : [];

  let { items: epoch_items, requestSort: requestEpochSort, sortConfig: epochSortCfg } = useSortableData(
    age_sex_epochs_raw,
    { direction: "asc", key: "year" }
  );

  let { items: bd_items, requestSort: requestBdSort, sortConfig: bdSortCfg } = useSortableData(
    bd_epochs_raw,
    { direction: "asc", key: "year" }
  );

  let country_entries_raw = useMemo(() => {
    let yr_bucket = age_sex_data?.per_country?.[country_year] || {};
    let iso_keys = Object.keys(yr_bucket);
    let rows = [];
    for (let i = 0; i < iso_keys.length; i++) {
      let iso3 = iso_keys[i];
      let row = yr_bucket[iso3];
      let raw = row?.raw_mnl?.r2_country ?? 0;
      let clp = row?.clamped?.r2_country ?? 0;
      rows.push({
        clamped: clp,
        clamped_female: row?.clamped?.r2_female ?? 0,
        clamped_male: row?.clamped?.r2_male ?? 0,
        delta: clp - raw,
        iso3: iso3,
        raw: raw
      });
    }
    return rows;
  }, [age_sex_data, country_year]);

  let { items: country_items, requestSort: requestCountrySort, sortConfig: countrySortCfg } = useSortableData(
    country_entries_raw,
    { direction: "desc", key: "delta" }
  );

  //Return statement
  return (
    <FlexPartition
      direction="vertical"
      initialRatio={0.58}
      maxFirstPct={85}
      minFirstPct={25}
      style={{ flex: 1, height: "100%", minHeight: 0 }}
    >
      {/* Top Pane: Epoch & Vital Flows Summary Tables */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%", minHeight: 0, overflowY: "auto", paddingRight: "4px" }}>
        {/* Table 1.1: Epoch Comparison */}
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
            Table 1.1 — Age and sex bracket fit by historical epoch
          </div>
          <div className="linear-table-container">
            <table className="linear-table">
              <thead>
                <tr>
                  <SortHeader label="Epoch" onSort={() => requestEpochSort("year")} sortConfig={epochSortCfg} sortKey="year" />
                  <SortHeader label="Source" onSort={() => requestEpochSort("domain")} sortConfig={epochSortCfg} sortKey="domain" />
                  <SortHeader isNum={true} label="Countries" onSort={() => requestEpochSort("num_countries")} sortConfig={epochSortCfg} sortKey="num_countries" />
                  <SortHeader isNum={true} label="Raw MNL R²" onSort={() => requestEpochSort("raw_r2", (r) => r.raw_mnl?.geomean_r2 ?? 0)} sortConfig={epochSortCfg} sortKey="raw_r2" />
                  <SortHeader isNum={true} label="Clamped R²" onSort={() => requestEpochSort("clamped_r2", (r) => r.clamped?.geomean_r2 ?? 0)} sortConfig={epochSortCfg} sortKey="clamped_r2" />
                  <SortHeader isNum={true} label="Gain (Δ)" onSort={() => requestEpochSort("delta_geomean")} sortConfig={epochSortCfg} sortKey="delta_geomean" />
                  <SortHeader isNum={true} label="Male R²" onSort={() => requestEpochSort("male_r2", (r) => r.clamped?.male_r2 ?? 0)} sortConfig={epochSortCfg} sortKey="male_r2" />
                  <SortHeader isNum={true} label="Female R²" onSort={() => requestEpochSort("female_r2", (r) => r.clamped?.female_r2 ?? 0)} sortConfig={epochSortCfg} sortKey="female_r2" />
                </tr>
              </thead>
              <tbody>
                {epoch_items.map((row) => (
                  <tr key={row.year}>
                    <td><strong>{row.year}</strong></td>
                    <td><span className="linear-badge">{row.domain}</span></td>
                    <td className="num">{row.num_countries}</td>
                    <td className="num">{formatEuroNumber(row.raw_mnl?.geomean_r2, { is_percent: true })}</td>
                    <td className="num">{formatEuroNumber(row.clamped?.geomean_r2, { is_percent: true })}</td>
                    <td className="num">{formatEuroNumber(row.delta_geomean, { is_percent: true, is_signed: true })}</td>
                    <td className="num">{formatEuroNumber(row.clamped?.male_r2, { is_percent: true })}</td>
                    <td className="num">{formatEuroNumber(row.clamped?.female_r2, { is_percent: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 1.2: Vital Flows Comparison */}
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
            Table 1.2 — Global vital flows (empirical vs proxy births and deaths)
          </div>
          <div className="linear-table-container">
            <table className="linear-table">
              <thead>
                <tr>
                  <SortHeader label="Epoch" onSort={() => requestBdSort("year")} sortConfig={bdSortCfg} sortKey="year" />
                  <SortHeader label="Source" onSort={() => requestBdSort("source")} sortConfig={bdSortCfg} sortKey="source" />
                  <SortHeader isNum={true} label="Countries" onSort={() => requestBdSort("num_countries")} sortConfig={bdSortCfg} sortKey="num_countries" />
                  <SortHeader isNum={true} label="Empirical births" onSort={() => requestBdSort("empirical_births")} sortConfig={bdSortCfg} sortKey="empirical_births" />
                  <SortHeader isNum={true} label="Proxy births" onSort={() => requestBdSort("proxy_births")} sortConfig={bdSortCfg} sortKey="proxy_births" />
                  <SortHeader isNum={true} label="Birth error" onSort={() => requestBdSort("birth_error_pct")} sortConfig={bdSortCfg} sortKey="birth_error_pct" />
                  <SortHeader isNum={true} label="Empirical deaths" onSort={() => requestBdSort("empirical_deaths")} sortConfig={bdSortCfg} sortKey="empirical_deaths" />
                  <SortHeader isNum={true} label="Proxy deaths" onSort={() => requestBdSort("proxy_deaths")} sortConfig={bdSortCfg} sortKey="proxy_deaths" />
                  <SortHeader isNum={true} label="Death error" onSort={() => requestBdSort("death_error_pct")} sortConfig={bdSortCfg} sortKey="death_error_pct" />
                </tr>
              </thead>
              <tbody>
                {bd_items.map((row) => (
                  <tr key={row.year}>
                    <td><strong>{row.year}</strong></td>
                    <td>{row.source}</td>
                    <td className="num">{row.num_countries}</td>
                    <td className="num">{formatEuroNumber(row.empirical_births, { use_abbreviation: true })}</td>
                    <td className="num">{formatEuroNumber(row.proxy_births, { use_abbreviation: true })}</td>
                    <td className="num">{formatEuroNumber(row.birth_error_pct, { is_already_percent: true, is_signed: true })}</td>
                    <td className="num">{formatEuroNumber(row.empirical_deaths, { use_abbreviation: true })}</td>
                    <td className="num">{formatEuroNumber(row.proxy_deaths, { use_abbreviation: true })}</td>
                    <td className="num">{formatEuroNumber(row.death_error_pct, { is_already_percent: true, is_signed: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Pane: Table 1.3 Country Breakdown */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflowY: "auto", paddingRight: "4px" }}>
        <div style={{ alignItems: "center", display: "flex", flexShrink: 0, justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700 }}>
            Table 1.3 — Country-level fit in {country_year}
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {years_list.map((yr) => (
              <button
                className={`linear-btn linear-btn-sm ${country_year === yr ? "linear-btn-primary" : ""}`}
                key={yr}
                onClick={() => setCountryYear(yr)}
                type="button"
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
        <div className="linear-table-container" style={{ flex: 1, overflowY: "auto" }}>
          <table className="linear-table">
            <thead>
              <tr>
                <SortHeader label="ISO3" onSort={() => requestCountrySort("iso3")} sortConfig={countrySortCfg} sortKey="iso3" />
                <SortHeader isNum={true} label="Raw MNL R²" onSort={() => requestCountrySort("raw")} sortConfig={countrySortCfg} sortKey="raw" />
                <SortHeader isNum={true} label="Clamped R²" onSort={() => requestCountrySort("clamped")} sortConfig={countrySortCfg} sortKey="clamped" />
                <SortHeader isNum={true} label="Gain (Δ)" onSort={() => requestCountrySort("delta")} sortConfig={countrySortCfg} sortKey="delta" />
                <SortHeader isNum={true} label="Male R²" onSort={() => requestCountrySort("clamped_male")} sortConfig={countrySortCfg} sortKey="clamped_male" />
                <SortHeader isNum={true} label="Female R²" onSort={() => requestCountrySort("clamped_female")} sortConfig={countrySortCfg} sortKey="clamped_female" />
              </tr>
            </thead>
            <tbody>
              {country_items.map((row) => (
                <tr key={row.iso3}>
                  <td><strong>{row.iso3}</strong></td>
                  <td className="num">{formatEuroNumber(row.raw, { is_percent: true })}</td>
                  <td className="num">{formatEuroNumber(row.clamped, { is_percent: true })}</td>
                  <td className="num">{formatEuroNumber(row.delta, { is_percent: true, is_signed: true })}</td>
                  <td className="num">{formatEuroNumber(row.clamped_male, { is_percent: true })}</td>
                  <td className="num">{formatEuroNumber(row.clamped_female, { is_percent: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </FlexPartition>
  );
}

export default CDTValidationView;
