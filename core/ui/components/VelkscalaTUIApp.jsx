//Import libraries and React hooks
import React, { useMemo, useEffect, useState } from "react";


/**
 * Formats numeric values using European decimal notation (e.g. 58,88) and human abbreviations (k, M, B).
 *
 * @param {number} arg0_value
 * @param {Object} [arg1_options]
 *  @param {number} [arg1_options.decimals=2]
 *  @param {boolean} [arg1_options.is_already_percent=false]
 *  @param {boolean} [arg1_options.is_percent=false]
 *  @param {boolean} [arg1_options.is_signed=false]
 *  @param {boolean} [arg1_options.use_abbreviation=false]
 *
 * @returns {string}
 */
function formatEuroNumber (arg0_value, arg1_options) {
  //Convert from parameters
  let value = arg0_value;
  let options = (arg1_options) ? arg1_options : {};

  //Initialise options
  if (options.decimals === undefined) options.decimals = 2;
  if (options.is_already_percent === undefined) options.is_already_percent = false;
  if (options.is_percent === undefined) options.is_percent = false;
  if (options.is_signed === undefined) options.is_signed = false;
  if (options.use_abbreviation === undefined) options.use_abbreviation = false;

  //Declare local instance variables
  let abs_val;
  let formatted_str = "";
  let num_val = Number(value);
  let prefix = "";
  let scaled_val;
  let suffix = "";

  //Guard clauses
  if (value === null || value === undefined || Number.isNaN(num_val)) return "N/A";

  if (options.is_percent) {
    num_val = num_val*100;
    suffix = "%";
  } else if (options.is_already_percent) {
    suffix = "%";
  }

  abs_val = Math.abs(num_val);
  scaled_val = num_val;

  if (options.use_abbreviation && !options.is_percent && !options.is_already_percent) {
    if (abs_val >= 1e9) {
      scaled_val = num_val/1e9;
      suffix = "B";
    } else if (abs_val >= 1e6) {
      scaled_val = num_val/1e6;
      suffix = "M";
    } else if (abs_val >= 1e3) {
      scaled_val = num_val/1e3;
      suffix = "k";
    }
  }

  if (options.is_signed && scaled_val > 0) prefix = "+";
  formatted_str = scaled_val.toFixed(options.decimals).replace(".", ",");

  //Return statement
  return `${prefix}${formatted_str}${suffix}`;
}


/**
 * Formats negative calendar years as BC and positive as AD.
 *
 * @param {number} arg0_year
 * @returns {string}
 */
function formatYearBCAD (arg0_year) {
  //Convert from parameters
  let yr = Number(arg0_year);

  //Return statement
  if (yr < 0) {
    return `${Math.abs(yr)} BC`;
  } else {
    return `${yr} AD`;
  }
}


/**
 * Reusable column header component with sort direction indicators.
 *
 * @param {Object} arg0_props
 * @returns {React.ReactElement}
 */
function SortHeader (arg0_props) {
  //Convert from parameters
  let is_num = arg0_props.isNum;
  let label = arg0_props.label;
  let on_sort = arg0_props.onSort;
  let sort_config = arg0_props.sortConfig;
  let sort_key = arg0_props.sortKey;

  //Declare local instance variables
  let is_active = (sort_config?.key === sort_key);
  let indicator = is_active ? (sort_config.direction === "asc" ? " ▲" : " ▼") : "";

  //Return statement
  return (
    <th
      className={is_num ? "num" : ""}
      onClick={on_sort}
      style={{ cursor: "pointer", userSelect: "none" }}
      title={`Click to sort by ${label}`}
    >
      {label}
      {indicator && <span className="sort-indicator">{indicator}</span>}
    </th>
  );
}


/**
 * Custom hook to sort arrays ascending or descending by key or selector function.
 *
 * @param {Array} arg0_items
 * @param {Object} [arg1_initial_config]
 * @returns {Object}
 */
function useSortableData (arg0_items, arg1_initial_config) {
  //Convert from parameters
  let items = arg0_items;
  let initial_config = arg1_initial_config;

  //Declare local instance variables
  let [sort_config, setSortConfig] = useState(initial_config || { direction: "asc", key: null });

  let sorted_items = useMemo(() => {
    let sortable = (items || []).slice();
    if (sort_config?.key) {
      sortable.sort((a, b) => {
        let val_a = (typeof sort_config.selector === "function") ? sort_config.selector(a) : a[sort_config.key];
        let val_b = (typeof sort_config.selector === "function") ? sort_config.selector(b) : b[sort_config.key];
        if (val_a === null || val_a === undefined) return 1;
        if (val_b === null || val_b === undefined) return -1;
        if (typeof val_a === "string") {
          return (sort_config.direction === "asc")
            ? val_a.localeCompare(val_b)
            : val_b.localeCompare(val_a);
        }
        return (sort_config.direction === "asc") ? (val_a - val_b) : (val_b - val_a);
      });
    }
    return sortable;
  }, [items, sort_config]);

  let requestSort = function (arg0_key, arg1_selector) {
    let key = arg0_key;
    let selector = arg1_selector;
    let direction = "asc";
    if (sort_config?.key === key && sort_config.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ direction: direction, key: key, selector: selector });
  };

  //Return statement
  return { items: sorted_items, requestSort: requestSort, sortConfig: sort_config };
}


/**
 * Main dashboard component implementing the Dataview design palette for Velkscala validation.
 *
 * @returns {React.ReactElement}
 */
export function VelkscalaTUIApp () {
  //Declare local instance variables
  let [active_tab, setActiveTab] = useState(0);
  let [is_loading, setIsLoading] = useState(true);
  let [selected_pipeline_id, setSelectedPipelineId] = useState("test_cdt");
  let [state_data, setStateData] = useState(null);

  let pipelines = [];
  if (state_data?.defines?.pipelines) {
    let p_keys = Object.keys(state_data.defines.pipelines);
    for (let i = 0; i < p_keys.length; i++) {
      let key = p_keys[i];
      let p_def = state_data.defines.pipelines[key];
      let job_status = state_data.jobs?.[key]?.status || "idle";
      pipelines.push({
        description: p_def.description || "",
        id: key,
        name: p_def.name || p_def.label || key,
        status: job_status
      });
    }
  }

  let fetchState = async function () {
    try {
      let res = await fetch("/api/state");
      if (res.ok) {
        let json_data = await res.json();
        setStateData(json_data);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Failed to load /api/state:", err);
    }
  };

  let triggerPipeline = async function (arg0_pipeline_id) {
    //Convert from parameters
    let pipeline_id = arg0_pipeline_id;

    //Guard clauses
    if (!pipeline_id) return;

    try {
      await fetch("/api/run", {
        body: JSON.stringify({ pipeline_id: pipeline_id }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      await fetchState();
    } catch (err) {
      console.error("Failed to run pipeline:", err);
    }
  };

  useEffect(() => {
    fetchState();
    let poll_handle = setInterval(() => {
      fetchState();
    }, 1200);
    return () => clearInterval(poll_handle);
  }, []);

  //Compute summary metrics
  let overall_cdt = state_data?.cdt_age_sex?.overall_cdt || {};
  let bd_epochs = state_data?.cdt_births_deaths?.summary_by_epoch || [];
  let latest_bd = (bd_epochs.length > 0) ? bd_epochs[bd_epochs.length - 1] : {};
  let ndt_scorecard = state_data?.ndt_results?.scorecard || {};
  let hearth_count = Object.keys(ndt_scorecard).length;
  let geocode_count = Object.keys(state_data?.ndt_results?.tracked_geocodes || {}).length;
  let outputs_files = state_data?.outputs_files || [];

  let tabs = [
    "CDT validation (age & sex)",
    "NDT validation (paleodemography)",
    "Visualisations (R ggplot2)",
    "Reports & defines"
  ];

  //Return statement
  return (
    <div className="linear-dashboard">
      {/* Refined Dataview Header */}
      <header className="linear-header">
        <div className="linear-brand-group">
          <span className="linear-title">Velkscala</span>
          <span className="linear-subtitle">Demographic transition validation suites</span>
          <span className="linear-subtitle">·</span>
          <span className="linear-subtitle">
            SVEA {state_data?.svea_status?.exists ? "connected" : "missing"}
          </span>
        </div>

        <div className="linear-actions">
          <button
            className="linear-btn"
            onClick={() => triggerPipeline("test_cdt")}
          >
            Run CDT
          </button>
          <button
            className="linear-btn"
            onClick={() => triggerPipeline("test_ndt")}
          >
            Run NDT
          </button>
          <button
            className="linear-btn linear-btn-primary"
            onClick={() => {
              triggerPipeline("render_cdt_r");
              triggerPipeline("render_ndt_r");
            }}
          >
            Render R plots
          </button>
        </div>
      </header>

      {/* KPI Summary Cards */}
      <div className="linear-kpi-grid">
        <div className="linear-kpi-card">
          <span className="linear-kpi-label">CDT Age/Sex Geomean R²</span>
          <div className="linear-kpi-value-row">
            <span className="linear-kpi-value">
              {formatEuroNumber(overall_cdt.clamped_geomean_r2, { is_percent: true })}
            </span>
            <span className="linear-kpi-diff">
              {formatEuroNumber(overall_cdt.delta_geomean_r2, { is_percent: true, is_signed: true })} gain
            </span>
          </div>
          <span className="linear-kpi-subtext">
            Raw MNL: {formatEuroNumber(overall_cdt.raw_mnl_geomean_r2, { is_percent: true })} · Clamped to Stadestér
          </span>
        </div>

        <div className="linear-kpi-card">
          <span className="linear-kpi-label">CDT Vital Flows ({latest_bd.year || 2019})</span>
          <div className="linear-kpi-value-row">
            <span className="linear-kpi-value">
              {formatEuroNumber(latest_bd.proxy_births, { use_abbreviation: true })}
            </span>
            <span className="linear-kpi-diff">
              / {formatEuroNumber(latest_bd.proxy_deaths, { use_abbreviation: true })} deaths
            </span>
          </div>
          <span className="linear-kpi-subtext">
            Error: {formatEuroNumber(latest_bd.birth_error_pct, { is_already_percent: true, is_signed: true })} births · {formatEuroNumber(latest_bd.death_error_pct, { is_already_percent: true, is_signed: true })} deaths
          </span>
        </div>

        <div className="linear-kpi-card">
          <span className="linear-kpi-label">NDT Checks</span>
          <div className="linear-kpi-value-row">
            <span className="linear-kpi-value">
              {hearth_count} of 5 checks
            </span>
          </div>
          <span className="linear-kpi-subtext">
            10000 BC–1000 AD · {geocode_count} anchor geocodes audited
          </span>
        </div>

        <div className="linear-kpi-card">
          <span className="linear-kpi-label">Artefacts in /outputs</span>
          <div className="linear-kpi-value-row">
            <span className="linear-kpi-value">
              {outputs_files.length} files
            </span>
          </div>
          <span className="linear-kpi-subtext">
            Plots, validation tables, and summary markdown
          </span>
        </div>
      </div>

      {/* Main Split Layout: Pipelines + Logs | Tabbed Content */}
      <div className="linear-split-layout">
        {/* Left Sidebar: Pipelines & Process Log (white outline on selection for contrast) */}
        <aside className="linear-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="linear-panel-title">Pipelines</span>
            <button
              className="linear-btn linear-btn-sm"
              onClick={() => fetchState()}
            >
              Refresh
            </button>
          </div>

          <div className="linear-pipeline-list">
            {pipelines.map((p) => {
              let is_active = (selected_pipeline_id === p.id);
              let is_running = (p.status === "running");

              return (
                <button
                  className={`linear-pipeline-item ${is_active ? "active" : ""}`}
                  key={p.id}
                  onClick={() => setSelectedPipelineId(p.id)}
                >
                  <div>
                    <div className="linear-pipeline-name" style={{ fontWeight: is_active ? 700 : 500 }}>
                      {p.name}
                    </div>
                    <div className="linear-pipeline-desc">{p.description}</div>
                  </div>
                  <span className={`linear-badge ${is_running ? "linear-badge-active" : ""}`}>
                    {p.status}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            className="linear-btn linear-btn-primary"
            onClick={() => triggerPipeline(selected_pipeline_id)}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Execute selected pipeline
          </button>

          <span className="linear-panel-title" style={{ marginTop: "4px" }}>Process stream</span>
          <div className="linear-log-box">
            {(!state_data?.logs || state_data.logs.length === 0) ? (
              <div style={{ color: "rgba(255, 255, 255, 0.45)" }}>Ready. Select a pipeline to run.</div>
            ) : (
              state_data.logs.map((entry, idx) => {
                let msg = (typeof entry === "object" && entry !== null)
                  ? `[${entry.time}] ${entry.text}`
                  : String(entry);
                return (
                  <div className="linear-log-line" key={idx}>
                    {msg}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Main Panel: Tabs and Sortable Data Viewers */}
        <main className="linear-panel">
          <nav className="linear-tabs-nav">
            {tabs.map((tab_title, idx) => (
              <button
                className={`linear-tab-btn ${active_tab === idx ? "active" : ""}`}
                key={idx}
                onClick={() => setActiveTab(idx)}
              >
                {tab_title}
              </button>
            ))}
          </nav>

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: "4px" }}>
            {is_loading ? (
              <div style={{ color: "rgba(255, 255, 255, 0.45)", padding: "16px 0" }}>Loading validation data...</div>
            ) : active_tab === 0 ? (
              <CDTView
                ageSexData={state_data?.cdt_age_sex}
                birthsDeathsData={state_data?.cdt_births_deaths}
              />
            ) : active_tab === 1 ? (
              <NDTView ndtData={state_data?.ndt_results} />
            ) : active_tab === 2 ? (
              <VisualisationsView
                onRunPipeline={triggerPipeline}
                outputsFiles={outputs_files}
              />
            ) : (
              <ReportsView
                cdtMd={state_data?.cdt_md}
                definesObj={state_data?.defines}
                ndtMd={state_data?.ndt_md}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


/**
 * Tab 1: Contemporary Demographic Transition (CDT) Validation (Sortable, non-bold cells outside col 1).
 *
 * @param {Object} arg0_props
 * @returns {React.ReactElement}
 */
function CDTView (arg0_props) {
  //Convert from parameters
  let age_sex_data = arg0_props.ageSexData;
  let births_deaths_data = arg0_props.birthsDeathsData;

  //Declare local instance variables
  let age_sex_epochs_raw = age_sex_data?.summary_by_epoch || [];
  let bd_epochs_raw = births_deaths_data?.summary_by_epoch || [];
  let years_list = age_sex_data?.per_country ? Object.keys(age_sex_data.per_country) : [];
  let [country_year, setCountryYear] = useState("2019");

  //Sortable hook for Epoch Bracket table
  let { items: epoch_items, requestSort: requestEpochSort, sortConfig: epochSortCfg } = useSortableData(
    age_sex_epochs_raw,
    { direction: "asc", key: "year" }
  );

  //Sortable hook for Vital Flows table
  let { items: bd_items, requestSort: requestBdSort, sortConfig: bdSortCfg } = useSortableData(
    bd_epochs_raw,
    { direction: "asc", key: "year" }
  );

  //Prepare country breakdown entries
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

  //Sortable hook for Country table
  let { items: country_items, requestSort: requestCountrySort, sortConfig: countrySortCfg } = useSortableData(
    country_entries_raw,
    { direction: "desc", key: "delta" }
  );

  //Return statement
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Epoch Comparison (Sortable, non-bold cells outside col 1) */}
      <div>
        <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px" }}>
          Age and sex bracket fit by historical epoch
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
                  {/* Only the first column is bolded per user instructions */}
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

      {/* Vital Flows Comparison (Sortable, non-bold cells outside col 1) */}
      <div>
        <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px" }}>
          Global vital flows (empirical vs proxy births and deaths)
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
                  {/* Only the first column is bolded */}
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

      {/* Country Breakdown (Sortable, non-bold cells outside col 1) */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ fontWeight: 700, fontSize: "13px" }}>
            Country-level fit in {country_year}
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {years_list.map((yr) => (
              <button
                className={`linear-btn linear-btn-sm ${country_year === yr ? "linear-btn-primary" : ""}`}
                key={yr}
                onClick={() => setCountryYear(yr)}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
        <div className="linear-table-container">
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
                  {/* Only first column bolded */}
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
    </div>
  );
}


/**
 * Tab 2: Neolithic Demographic Transition (NDT) Validation (Sortable, non-bold cells outside col 1).
 *
 * @param {Object} arg0_props
 * @returns {React.ReactElement}
 */
function NDTView (arg0_props) {
  //Convert from parameters
  let ndt_data = arg0_props.ndtData;

  //Declare local instance variables
  let region_keys = ndt_data?.regional_data ? Object.keys(ndt_data.regional_data) : [];
  let [selected_hearth, setSelectedHearth] = useState("Southwest Asia");

  //Prepare scorecard entries
  let scorecard_raw = useMemo(() => {
    let entries = Object.entries(ndt_data?.scorecard || {});
    return entries.map(([name, sc]) => ({
      ...sc,
      name: name
    }));
  }, [ndt_data]);

  let { items: sc_items, requestSort: requestScSort, sortConfig: scSortCfg } = useSortableData(
    scorecard_raw,
    { direction: "desc", key: "peak_early_growth_rate" }
  );

  //Prepare regional trajectory epochs
  let hearth_epochs_raw = ndt_data?.regional_data?.[selected_hearth]?.epochs || [];
  let { items: traj_items, requestSort: requestTrajSort, sortConfig: trajSortCfg } = useSortableData(
    hearth_epochs_raw,
    { direction: "asc", key: "year" }
  );

  //Prepare geocodes list
  let geocodes_raw = useMemo(() => {
    let entries = Object.entries(ndt_data?.tracked_geocodes || {});
    return entries.map(([code, g]) => ({
      code: code,
      name: g.info?.name || code,
      p0: g.benchmark_epochs?.["0"]?.population ?? 0,
      p0_15p5: g.benchmark_epochs?.["0"]?.p_5_19_bocquet_pct ?? 0,
      p2000: g.benchmark_epochs?.["-2000"]?.population ?? 0,
      p2000_15p5: g.benchmark_epochs?.["-2000"]?.p_5_19_bocquet_pct ?? 0,
      p6000: g.benchmark_epochs?.["-6000"]?.population ?? 0,
      p6000_15p5: g.benchmark_epochs?.["-6000"]?.p_5_19_bocquet_pct ?? 0,
      region: g.info?.region || ""
    }));
  }, [ndt_data]);

  let { items: geo_items, requestSort: requestGeoSort, sortConfig: geoSortCfg } = useSortableData(
    geocodes_raw,
    { direction: "asc", key: "code" }
  );

  //Return statement
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Cross-Hearth Scorecard (Sortable, non-bold cells outside col 1) */}
      <div>
        <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px" }}>
          Agricultural hearth benchmarks (Bocquet-Appel &amp; Shennan priors)
        </div>
        <div className="linear-table-container">
          <table className="linear-table">
            <thead>
              <tr>
                <SortHeader label="Hearth" onSort={() => requestScSort("name")} sortConfig={scSortCfg} sortKey="name" />
                <SortHeader label="Neolithic onset" onSort={() => requestScSort("onset_label")} sortConfig={scSortCfg} sortKey="onset_label" />
                <SortHeader isNum={true} label="Pre-NDT growth" onSort={() => requestScSort("pre_growth_rate_clean")} sortConfig={scSortCfg} sortKey="pre_growth_rate_clean" />
                <SortHeader isNum={true} label="Peak boom growth" onSort={() => requestScSort("peak_early_growth_rate")} sortConfig={scSortCfg} sortKey="peak_early_growth_rate" />
                <SortHeader label="Peak interval" onSort={() => requestScSort("peak_early_interval")} sortConfig={scSortCfg} sortKey="peak_early_interval" />
                <SortHeader isNum={true} label="Pre 15P5" onSort={() => requestScSort("ijp_pre_mean")} sortConfig={scSortCfg} sortKey="ijp_pre_mean" />
                <SortHeader isNum={true} label="Peak 15P5" onSort={() => requestScSort("ijp_boom_peak")} sortConfig={scSortCfg} sortKey="ijp_boom_peak" />
                <SortHeader isNum={true} label="15P5 gain (Δ)" onSort={() => requestScSort("ijp_delta_pp")} sortConfig={scSortCfg} sortKey="ijp_delta_pp" />
              </tr>
            </thead>
            <tbody>
              {sc_items.map((sc) => (
                <tr key={sc.name}>
                  {/* Only first column bolded */}
                  <td><strong>{sc.name}</strong></td>
                  <td>{sc.onset_label}</td>
                  <td className="num">{formatEuroNumber(sc.pre_growth_rate_clean, { decimals: 3, is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(sc.peak_early_growth_rate, { decimals: 3, is_already_percent: true, is_signed: true })}</td>
                  <td>{sc.peak_early_interval}</td>
                  <td className="num">{formatEuroNumber(sc.ijp_pre_mean, { is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(sc.ijp_boom_peak, { is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(sc.ijp_delta_pp, { is_signed: true })} pp</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trajectory Table (Sortable, non-bold cells outside col 1) */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ fontWeight: 700, fontSize: "13px" }}>
            Paleodemographic trajectory (10000 BC–1000 AD) — {selected_hearth}
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {region_keys.map((k) => (
              <button
                className={`linear-btn linear-btn-sm ${selected_hearth === k ? "linear-btn-primary" : ""}`}
                key={k}
                onClick={() => setSelectedHearth(k)}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="linear-table-container">
          <table className="linear-table">
            <thead>
              <tr>
                <SortHeader label="Epoch" onSort={() => requestTrajSort("year")} sortConfig={trajSortCfg} sortKey="year" />
                <SortHeader label="Stage" onSort={() => requestTrajSort("stage")} sortConfig={trajSortCfg} sortKey="stage" />
                <SortHeader isNum={true} label="Stadestér pop" onSort={() => requestTrajSort("pop_stadester")} sortConfig={trajSortCfg} sortKey="pop_stadester" />
                <SortHeader isNum={true} label="HYDE pop" onSort={() => requestTrajSort("pop_hyde")} sortConfig={trajSortCfg} sortKey="pop_hyde" />
                <SortHeader isNum={true} label="Growth (%/yr)" onSort={() => requestTrajSort("growth_rate_pct")} sortConfig={trajSortCfg} sortKey="growth_rate_pct" />
                <SortHeader isNum={true} label="Cropland (km²)" onSort={() => requestTrajSort("cropland_km2")} sortConfig={trajSortCfg} sortKey="cropland_km2" />
                <SortHeader isNum={true} label="Under-5 share" onSort={() => requestTrajSort("p_under5_pct")} sortConfig={trajSortCfg} sortKey="p_under5_pct" />
                <SortHeader isNum={true} label="15P5 index" onSort={() => requestTrajSort("p_5_19_bocquet_pct")} sortConfig={trajSortCfg} sortKey="p_5_19_bocquet_pct" />
              </tr>
            </thead>
            <tbody>
              {traj_items.map((r) => (
                <tr key={r.year}>
                  {/* Only first column bolded */}
                  <td><strong>{formatYearBCAD(r.year)}</strong></td>
                  <td><span className="linear-badge">{r.stage}</span></td>
                  <td className="num">{formatEuroNumber(r.pop_stadester, { use_abbreviation: true })}</td>
                  <td className="num">{formatEuroNumber(r.pop_hyde, { use_abbreviation: true })}</td>
                  <td className="num">
                    {(r.growth_rate_pct !== null)
                      ? formatEuroNumber(r.growth_rate_pct, { decimals: 3, is_already_percent: true, is_signed: true })
                      : "—"}
                  </td>
                  <td className="num">{formatEuroNumber(r.cropland_km2, { use_abbreviation: true })}</td>
                  <td className="num">{formatEuroNumber(r.p_under5_pct, { is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(r.p_5_19_bocquet_pct, { is_already_percent: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geocodes Audit (Sortable, non-bold cells outside col 1) */}
      <div>
        <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px" }}>
          Anchor geocode audit (6000 BC, 2000 BC, 0 AD)
        </div>
        <div className="linear-table-container">
          <table className="linear-table">
            <thead>
              <tr>
                <SortHeader label="Geocode" onSort={() => requestGeoSort("name")} sortConfig={geoSortCfg} sortKey="name" />
                <SortHeader label="Region" onSort={() => requestGeoSort("region")} sortConfig={geoSortCfg} sortKey="region" />
                <SortHeader isNum={true} label="6000 BC Pop" onSort={() => requestGeoSort("p6000")} sortConfig={geoSortCfg} sortKey="p6000" />
                <SortHeader isNum={true} label="6000 BC 15P5" onSort={() => requestGeoSort("p6000_15p5")} sortConfig={geoSortCfg} sortKey="p6000_15p5" />
                <SortHeader isNum={true} label="2000 BC Pop" onSort={() => requestGeoSort("p2000")} sortConfig={geoSortCfg} sortKey="p2000" />
                <SortHeader isNum={true} label="2000 BC 15P5" onSort={() => requestGeoSort("p2000_15p5")} sortConfig={geoSortCfg} sortKey="p2000_15p5" />
                <SortHeader isNum={true} label="0 AD Pop" onSort={() => requestGeoSort("p0")} sortConfig={geoSortCfg} sortKey="p0" />
                <SortHeader isNum={true} label="0 AD 15P5" onSort={() => requestGeoSort("p0_15p5")} sortConfig={geoSortCfg} sortKey="p0_15p5" />
              </tr>
            </thead>
            <tbody>
              {geo_items.map((g) => (
                <tr key={g.code}>
                  {/* Only first column bolded */}
                  <td><strong>{g.name}</strong></td>
                  <td>{g.region}</td>
                  <td className="num">{formatEuroNumber(g.p6000, { use_abbreviation: true })}</td>
                  <td className="num">{formatEuroNumber(g.p6000_15p5, { is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(g.p2000, { use_abbreviation: true })}</td>
                  <td className="num">{formatEuroNumber(g.p2000_15p5, { is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(g.p0, { use_abbreviation: true })}</td>
                  <td className="num">{formatEuroNumber(g.p0_15p5, { is_already_percent: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


/**
 * Tab 3: R Render Pipelines & Plot Visualisations (Sortable files, non-bold cells outside col 1).
 *
 * @param {Object} arg0_props
 * @returns {React.ReactElement}
 */
function VisualisationsView (arg0_props) {
  //Convert from parameters
  let on_run = arg0_props.onRunPipeline;
  let files = arg0_props.outputsFiles || [];

  //Declare local instance variables
  let cdt_img = files.find((f) => f.name === "cdt_proxy_vs_empirical.png");
  let ndt_img = files.find((f) => f.name === "ndt_paleodemographic_dashboard.png");

  let { items: sorted_files, requestSort: requestFileSort, sortConfig: fileSortCfg } = useSortableData(
    files,
    { direction: "asc", key: "name" }
  );

  //Return statement
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "1fr 1fr" }}>
        <div className="linear-plot-card">
          <div className="linear-plot-header">
            <div>
              <div className="linear-plot-title">CDT Proxy vs Empirical Validation</div>
              <div className="linear-plot-meta">
                outputs/cdt_proxy_vs_empirical.png {cdt_img ? `(${formatEuroNumber(cdt_img.size_kb, { decimals: 1 })} kB)` : ""}
              </div>
            </div>
            <button
              className="linear-btn linear-btn-sm"
              onClick={() => on_run("render_cdt_r")}
            >
              Re-render plot
            </button>
          </div>
          <div className="linear-plot-image-wrap">
            {cdt_img ? (
              <img alt="CDT Validation Plot" className="linear-plot-image" src={cdt_img.url} />
            ) : (
              <span style={{ color: "rgba(255, 255, 255, 0.45)" }}>Plot not generated yet.</span>
            )}
          </div>
        </div>

        <div className="linear-plot-card">
          <div className="linear-plot-header">
            <div>
              <div className="linear-plot-title">NDT Paleodemographic Dashboard</div>
              <div className="linear-plot-meta">
                outputs/ndt_paleodemographic_dashboard.png {ndt_img ? `(${formatEuroNumber(ndt_img.size_kb, { decimals: 1 })} kB)` : ""}
              </div>
            </div>
            <button
              className="linear-btn linear-btn-sm"
              onClick={() => on_run("render_ndt_r")}
            >
              Re-render plot
            </button>
          </div>
          <div className="linear-plot-image-wrap">
            {ndt_img ? (
              <img alt="NDT Validation Plot" className="linear-plot-image" src={ndt_img.url} />
            ) : (
              <span style={{ color: "rgba(255, 255, 255, 0.45)" }}>Plot not generated yet.</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px" }}>
          Output files ({files.length})
        </div>
        <div className="linear-table-container">
          <table className="linear-table">
            <thead>
              <tr>
                <SortHeader label="File" onSort={() => requestFileSort("name")} sortConfig={fileSortCfg} sortKey="name" />
                <SortHeader isNum={true} label="Size" onSort={() => requestFileSort("size_kb")} sortConfig={fileSortCfg} sortKey="size_kb" />
                <SortHeader label="Last modified" onSort={() => requestFileSort("mtime")} sortConfig={fileSortCfg} sortKey="mtime" />
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {sorted_files.map((f) => (
                <tr key={f.name}>
                  {/* Only first column bolded */}
                  <td><strong>{f.name}</strong></td>
                  <td className="num">{formatEuroNumber(f.size_kb, { decimals: 1 })} kB</td>
                  <td>{f.mtime.replace("T", " ").slice(0, 19)}</td>
                  <td>
                    <a
                      href={f.url}
                      rel="noreferrer"
                      style={{ color: "var(--text-primary)", textDecoration: "underline" }}
                      target="_blank"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


/**
 * Tab 4: Markdown Reports & Defines.
 *
 * @param {Object} arg0_props
 * @returns {React.ReactElement}
 */
function ReportsView (arg0_props) {
  //Convert from parameters
  let cdt_md = arg0_props.cdtMd || "";
  let defines_obj = arg0_props.definesObj || {};
  let ndt_md = arg0_props.ndtMd || "";

  //Declare local instance variables
  let [doc_view, setDocView] = useState("cdt");

  //Return statement
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          className={`linear-btn linear-btn-sm ${doc_view === "cdt" ? "linear-btn-primary" : ""}`}
          onClick={() => setDocView("cdt")}
        >
          outputs/cdt.md
        </button>
        <button
          className={`linear-btn linear-btn-sm ${doc_view === "ndt" ? "linear-btn-primary" : ""}`}
          onClick={() => setDocView("ndt")}
        >
          outputs/ndt.md
        </button>
        <button
          className={`linear-btn linear-btn-sm ${doc_view === "defines" ? "linear-btn-primary" : ""}`}
          onClick={() => setDocView("defines")}
        >
          common_defines.json5
        </button>
      </div>

      <pre className="linear-doc-viewer">
        {doc_view === "cdt"
          ? cdt_md
          : doc_view === "ndt"
            ? ndt_md
            : JSON.stringify(defines_obj, null, 2)}
      </pre>
    </div>
  );
}

export default VelkscalaTUIApp;
