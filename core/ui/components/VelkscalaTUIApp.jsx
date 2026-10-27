//Import libraries and OpenTUI wrapper primitives
import React, { useEffect, useState } from "react";
import {
  AsciiFont,
  Box,
  ScrollBox,
  Select,
  TabSelect,
  Text,
  useKeyboard,
  useTerminalDimensions
} from "../../framework/OpenTUIWrapper.jsx";


/**
 * Formats a numeric value using European decimal notation (e.g. 58,88) and semantic abbreviations (k, M, B, T).
 *
 * @param {number} arg0_value
 * @param {Object} [arg1_options]
 *  @param {number} [arg1_options.decimals=2]
 *  @param {boolean} [arg1_options.is_already_percent=false]
 *  @param {boolean} [arg1_options.is_percent=false]
 *  @param {boolean} [arg1_options.is_signed=false]
 *  @param {boolean} [arg1_options.use_semantic=false]
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
  if (options.use_semantic === undefined) options.use_semantic = false;

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

  if (options.use_semantic && !options.is_percent && !options.is_already_percent) {
    if (abs_val >= 1e12) {
      scaled_val = num_val/1e12;
      suffix = "T";
    } else if (abs_val >= 1e9) {
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
 * Formats an integer year into BC / AD notation.
 *
 * @param {number} arg0_year
 * @returns {string}
 */
function formatEpochYear (arg0_year) {
  //Convert from parameters
  let year = Number(arg0_year);

  //Return statement
  if (year < 0) {
    return `${Math.abs(year)} BC`;
  } else {
    return `${year} AD`;
  }
}


/**
 * Main OpenTUI Dashboard & Orchestrator Component for Velkscala (CDT & NDT Validation + R Visualisation).
 *
 * @returns {React.ReactElement}
 */
export function VelkscalaTUIApp () {
  //Declare local instance variables
  let [active_tab, setActiveTab] = useState(0);
  let [is_loading, setIsLoading] = useState(true);
  let [selected_pipeline_idx, setSelectedPipelineIdx] = useState(0);
  let [state_data, setStateData] = useState(null);
  let term_dims = useTerminalDimensions();

  let pipeline_entries = [];
  if (state_data?.defines?.pipelines) {
    let all_keys = Object.keys(state_data.defines.pipelines);
    for (let i = 0; i < all_keys.length; i++) {
      let key = all_keys[i];
      let cfg = state_data.defines.pipelines[key];
      let job_state = state_data.jobs?.[key]?.status || "idle";
      pipeline_entries.push({
        cfg: cfg,
        description: `[${job_state.toUpperCase()}] ${cfg.description}`,
        id: key,
        name: cfg.name || cfg.label || key,
        status: job_state,
        value: key
      });
    }
  }

  let fetchOrchestratorState = async function () {
    try {
      let res = await fetch("/api/state");
      if (res.ok) {
        let json_payload = await res.json();
        setStateData(json_payload);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Failed to fetch /api/state:", err);
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
      await fetchOrchestratorState();
    } catch (err) {
      console.error("Pipeline trigger error:", err);
    }
  };

  useEffect(() => {
    fetchOrchestratorState();
    let poll_interval = setInterval(() => {
      fetchOrchestratorState();
    }, 1500);
    return () => clearInterval(poll_interval);
  }, []);

  useKeyboard((key_evt) => {
    if (key_evt.name === "up") {
      setSelectedPipelineIdx((prev) => Math.max(0, prev - 1));
    } else if (key_evt.name === "down") {
      setSelectedPipelineIdx((prev) => Math.min(Math.max(0, pipeline_entries.length - 1), prev + 1));
    } else if (key_evt.name === "return") {
      let chosen = pipeline_entries[selected_pipeline_idx];
      if (chosen) triggerPipeline(chosen.id);
    } else if (key_evt.name === "1") {
      setActiveTab(0);
    } else if (key_evt.name === "2") {
      setActiveTab(1);
    } else if (key_evt.name === "3") {
      setActiveTab(2);
    } else if (key_evt.name === "4") {
      setActiveTab(3);
    } else if (key_evt.name === "r" || key_evt.name === "R") {
      fetchOrchestratorState();
    }
  });

  //Compute top-level KPI metrics from outputs JSON
  let overall_cdt = state_data?.cdt_age_sex?.overall_cdt || {};
  let bd_epochs = state_data?.cdt_births_deaths?.summary_by_epoch || [];
  let latest_bd = bd_epochs.length > 0 ? bd_epochs[bd_epochs.length - 1] : {};
  let ndt_scorecard = state_data?.ndt_results?.scorecard || {};
  let ndt_origins_count = Object.keys(ndt_scorecard).length;
  let ndt_geocodes_count = Object.keys(state_data?.ndt_results?.tracked_geocodes || {}).length;

  let tab_options = [
    { name: "[1] CDT Validation (Age/Sex & Vital Rates)" },
    { name: "[2] NDT Validation (Paleodemography 10000 BC–1000 AD)" },
    { name: "[3] R Render Pipelines & Plots (/outputs)" },
    { name: "[4] Markdown Reports & common_defines.json5" }
  ];

  //Return statement
  return (
    <Box
      style={{
        backgroundColor: "#070b14",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        height: "100vh",
        padding: "10px 12px",
        width: "100vw"
      }}
    >
      {/* Top OpenTUI Header Bar */}
      <Box
        border={true}
        borderColor="#1e3a8a"
        style={{
          alignItems: "center",
          backgroundColor: "#0b1324",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          padding: "8px 14px"
        }}
        title="VELKSCALA — OPENTUI DEMOGRAPHIC ORCHESTRATOR (PORT 16000 | GMT+0)"
      >
        <Box style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <AsciiFont color="#38bdf8" text="VELKSCALA // CDT & NDT VALIDATION SUITE" />
          <Text color="#94a3b8">
            SVEA Target:{" "}
            <Text bold={true} color={state_data?.svea_status?.exists ? "#34d399" : "#fb7185"}>
              {state_data?.svea_status?.svea_dir || "D:/Project 1509 - SVEA"}{" "}
              {state_data?.svea_status?.exists ? "[CONNECTED]" : "[MISSING]"}
            </Text>
            {"  |  "}Outputs: <Text color="#e2e8f0">/outputs ({state_data?.outputs_files?.length || 0} artefacts)</Text>
            {"  |  "}Viewport: <Text color="#64748b">{term_dims.width}x{term_dims.height} cells</Text>
          </Text>
        </Box>

        <Box style={{ alignItems: "flex-end", display: "flex", flexDirection: "column", gap: "4px" }}>
          <Box style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
            <button
              className="tui-btn"
              onClick={() => triggerPipeline("test_cdt")}
              title="Run CDT Validation (Quick)"
            >
              ▶ Run CDT
            </button>
            <button
              className="tui-btn"
              onClick={() => triggerPipeline("test_ndt")}
              title="Run NDT Validation"
            >
              ▶ Run NDT
            </button>
            <button
              className="tui-btn tui-btn-emerald"
              onClick={() => {
                triggerPipeline("render_cdt_r");
                triggerPipeline("render_ndt_r");
              }}
              title="Render R ggplot2 Visualisations to /outputs"
            >
              📊 Render R Plots
            </button>
          </Box>
          <Text color="#64748b">
            Keys: [↑/↓] Select Pipeline  [Enter] Execute  [1-4] Switch Tab  [R] Refresh State
          </Text>
        </Box>
      </Box>

      {/* Summary KPI Strip */}
      <Box
        style={{
          display: "grid",
          gap: "10px",
          gridTemplateColumns: "repeat(4, 1fr)"
        }}
      >
        <Box
          border={true}
          borderColor="#1e293b"
          style={{ backgroundColor: "#0d1424", padding: "8px 12px" }}
          title="CDT Age/Sex Geomean R² (1850–2019)"
        >
          <Box style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between" }}>
            <Text bold={true} color="#34d399" style={{ fontSize: "18px" }}>
              {formatEuroNumber(overall_cdt.clamped_geomean_r2, { is_percent: true })}
            </Text>
            <Text color="#38bdf8">
              Δ {formatEuroNumber(overall_cdt.delta_geomean_r2, { is_percent: true, is_signed: true })} vs Raw MNL
            </Text>
          </Box>
          <Text color="#94a3b8">
            Raw MNL Geomean R²: {formatEuroNumber(overall_cdt.raw_mnl_geomean_r2, { is_percent: true })} (Clamped to Stadestér)
          </Text>
        </Box>

        <Box
          border={true}
          borderColor="#1e293b"
          style={{ backgroundColor: "#0d1424", padding: "8px 12px" }}
          title={`CDT Global Vital Flows (${latest_bd.year || 2019})`}
        >
          <Box style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between" }}>
            <Text bold={true} color="#38bdf8" style={{ fontSize: "16px" }}>
              B: {formatEuroNumber(latest_bd.proxy_births, { use_semantic: true })}
            </Text>
            <Text bold={true} color="#a78bfa" style={{ fontSize: "16px" }}>
              D: {formatEuroNumber(latest_bd.proxy_deaths, { use_semantic: true })}
            </Text>
          </Box>
          <Text color="#94a3b8">
            Birth Err: {formatEuroNumber(latest_bd.birth_error_pct, { is_already_percent: true, is_signed: true })} | Death Err:{" "}
            {formatEuroNumber(latest_bd.death_error_pct, { is_already_percent: true, is_signed: true })} ({latest_bd.num_countries || 189} countries)
          </Text>
        </Box>

        <Box
          border={true}
          borderColor="#1e293b"
          style={{ backgroundColor: "#0d1424", padding: "8px 12px" }}
          title="NDT Paleodemographic Audit"
        >
          <Box style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between" }}>
            <Text bold={true} color="#34d399" style={{ fontSize: "18px" }}>
              {ndt_origins_count} / 5 Hearths
            </Text>
            <span className="tui-badge tui-badge-pass">10000 BC – 1000 AD</span>
          </Box>
          <Text color="#94a3b8">
            {ndt_geocodes_count} Anchor Geocodes Tracked (Bocquet-Appel Priors)
          </Text>
        </Box>

        <Box
          border={true}
          borderColor="#1e293b"
          style={{ backgroundColor: "#0d1424", padding: "8px 12px" }}
          title="R Render Pipeline Artefacts"
        >
          <Box style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between" }}>
            <Text bold={true} color="#fbbf24" style={{ fontSize: "18px" }}>
              {state_data?.outputs_files?.filter((f) => f.name.endsWith(".png")).length || 0} PNG Plots
            </Text>
            <Text color="#94a3b8">
              {state_data?.outputs_files?.filter((f) => f.name.endsWith(".json")).length || 0} JSON /{" "}
              {state_data?.outputs_files?.filter((f) => f.name.endsWith(".md")).length || 0} MD
            </Text>
          </Box>
          <Text color="#94a3b8">
            Pathed to /outputs via common_defines.json5
          </Text>
        </Box>
      </Box>

      {/* Main Content Split: Left Sidebar (Pipelines + Console) & Right Tabbed Viewport */}
      <Box
        style={{
          display: "grid",
          flex: 1,
          gap: "10px",
          gridTemplateColumns: "360px 1fr",
          minHeight: 0
        }}
      >
        {/* Left Orchestrator Sidebar */}
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            minHeight: 0
          }}
        >
          <Box
            border={true}
            borderColor="#1e293b"
            style={{
              backgroundColor: "#0d1424",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "10px"
            }}
            title="Pipelines (data/3.data_transform & R)"
          >
            <Select
              focused={true}
              onChange={(idx) => setSelectedPipelineIdx(idx)}
              onSelect={(idx, opt) => {
                if (opt?.value) triggerPipeline(opt.value);
              }}
              options={pipeline_entries}
              selectedIndex={selected_pipeline_idx}
            />
            <Box style={{ display: "flex", gap: "8px", justifyContent: "space-between", marginTop: "4px" }}>
              <button
                className="tui-btn"
                onClick={() => {
                  let chosen = pipeline_entries[selected_pipeline_idx];
                  if (chosen) triggerPipeline(chosen.id);
                }}
                style={{ flex: 1 }}
              >
                ▶ Execute Selected Pipeline
              </button>
              <button
                className="tui-btn"
                onClick={() => fetchOrchestratorState()}
                title="Refresh State"
              >
                ↻
              </button>
            </Box>
          </Box>

          {/* Live Orchestrator Console Log */}
          <ScrollBox
            border={true}
            borderColor="#1e293b"
            style={{
              backgroundColor: "#080d18",
              flex: 1,
              fontSize: "11px",
              minHeight: 0,
              padding: "8px"
            }}
            title="Orchestrator Process Stream"
          >
            {(!state_data?.logs || state_data.logs.length === 0) ? (
              <Text color="#64748b">
                [READY] OpenTUI Orchestrator initialised on 127.0.0.1:16000. Select any pipeline above or press Enter to execute.
              </Text>
            ) : (
              state_data.logs.map((entry, idx) => {
                let line_str = (typeof entry === "object" && entry !== null)
                  ? `[${entry.time || ""}] [${entry.source || "sys"}] ${entry.text || ""}`
                  : String(entry);
                let is_ok = line_str.includes("exited with code 0") || line_str.includes("saved") || line_str.includes("PASS");
                return (
                  <div
                    key={idx}
                    style={{
                      color: is_ok ? "#34d399" : "#cbd5e1",
                      marginBottom: "3px"
                    }}
                  >
                    {line_str}
                  </div>
                );
              })
            )}
          </ScrollBox>
        </Box>

        {/* Right Tabbed Viewport */}
        <Box
          border={true}
          borderColor="#1e293b"
          style={{
            backgroundColor: "#0d1424",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            minHeight: 0,
            padding: "10px"
          }}
          title="Validation Tabulation & Visualisation Viewport"
        >
          <TabSelect
            onChange={(idx) => setActiveTab(idx)}
            options={tab_options}
            selectedIndex={active_tab}
          />

          <ScrollBox style={{ flex: 1, minHeight: 0, paddingRight: "4px" }}>
            {is_loading ? (
              <Text color="#94a3b8">Loading validation artefacts from /outputs...</Text>
            ) : active_tab === 0 ? (
              <CDTValidationView
                ageSexData={state_data?.cdt_age_sex}
                birthsDeathsData={state_data?.cdt_births_deaths}
              />
            ) : active_tab === 1 ? (
              <NDTValidationView ndtData={state_data?.ndt_results} />
            ) : active_tab === 2 ? (
              <RVisualisationsView
                onTriggerPipeline={triggerPipeline}
                outputsFiles={state_data?.outputs_files || []}
              />
            ) : (
              <ReportsAndDefinesView
                cdtMd={state_data?.cdt_md}
                definesObj={state_data?.defines}
                ndtMd={state_data?.ndt_md}
              />
            )}
          </ScrollBox>
        </Box>
      </Box>
    </Box>
  );
}


/**
 * Tab 1: Contemporaneous Demographic Transition (CDT) Validation Tables.
 *
 * @param {Object} arg0_props
 * @returns {React.ReactElement}
 */
function CDTValidationView (arg0_props) {
  //Convert from parameters
  let age_sex_data = arg0_props.ageSexData;
  let births_deaths_data = arg0_props.birthsDeathsData;

  //Declare local instance variables
  let age_sex_epochs = age_sex_data?.summary_by_epoch || [];
  let bd_epochs = births_deaths_data?.summary_by_epoch || [];
  let per_country_years = age_sex_data?.per_country ? Object.keys(age_sex_data.per_country) : [];
  let [selected_year, setSelectedYear] = useState("2019");

  let country_rows = [];
  let year_obj = age_sex_data?.per_country?.[selected_year] || {};
  let iso_keys = Object.keys(year_obj);
  for (let i = 0; i < iso_keys.length; i++) {
    let iso3 = iso_keys[i];
    let c_entry = year_obj[iso3];
    let raw_r2 = c_entry?.raw_mnl?.r2_country ?? 0;
    let clamped_r2 = c_entry?.clamped?.r2_country ?? 0;
    country_rows.push({
      clamped_female: c_entry?.clamped?.r2_female,
      clamped_male: c_entry?.clamped?.r2_male,
      clamped_r2: clamped_r2,
      delta_r2: clamped_r2 - raw_r2,
      iso3: iso3,
      raw_r2: raw_r2
    });
  }
  country_rows.sort((a, b) => b.delta_r2 - a.delta_r2);

  //Return statement
  return (
    <Box style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Section 1: Age/Sex by Epoch */}
      <Box style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Text bold={true} color="#38bdf8">
          1. Age/Sex Bracket Share Validation by Historical Epoch (Raw Stage 1 MNL vs Stage 2 Clamped to Stadestér)
        </Text>
        <table className="tui-table">
          <thead>
            <tr>
              <th>Epoch</th>
              <th>Domain</th>
              <th className="num">Countries</th>
              <th className="num">Raw MNL Geomean R²</th>
              <th className="num">Clamped Geomean R²</th>
              <th className="num">Δ Geomean R²</th>
              <th className="num">Raw Mean R²</th>
              <th className="num">Clamped Mean R²</th>
              <th className="num">Clamped Male R²</th>
              <th className="num">Clamped Female R²</th>
            </tr>
          </thead>
          <tbody>
            {age_sex_epochs.map((row) => (
              <tr key={row.year}>
                <td><strong>{row.year}</strong></td>
                <td><span className="tui-badge tui-badge-idle">{row.domain}</span></td>
                <td className="num">{row.num_countries}</td>
                <td className="num">{formatEuroNumber(row.raw_mnl?.geomean_r2, { is_percent: true })}</td>
                <td className="num" style={{ color: "#34d399", fontWeight: 700 }}>
                  {formatEuroNumber(row.clamped?.geomean_r2, { is_percent: true })}
                </td>
                <td className="num" style={{ color: (row.delta_geomean >= 0) ? "#38bdf8" : "#fb7185" }}>
                  {formatEuroNumber(row.delta_geomean, { is_percent: true, is_signed: true })}
                </td>
                <td className="num">{formatEuroNumber(row.raw_mnl?.mean_r2, { is_percent: true })}</td>
                <td className="num">{formatEuroNumber(row.clamped?.mean_r2, { is_percent: true })}</td>
                <td className="num">{formatEuroNumber(row.clamped?.male_r2, { is_percent: true })}</td>
                <td className="num">{formatEuroNumber(row.clamped?.female_r2, { is_percent: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* Section 2: Births & Deaths by Epoch */}
      <Box style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Text bold={true} color="#38bdf8">
          2. Global Vital Flows Validation by Historical Epoch (Empirical vs Proxy Births, Deaths &amp; Implied Migration)
        </Text>
        <table className="tui-table">
          <thead>
            <tr>
              <th>Epoch</th>
              <th>Source</th>
              <th className="num">Countries</th>
              <th className="num">Empirical Births</th>
              <th className="num">Proxy Births</th>
              <th className="num">Birth Error</th>
              <th className="num">Empirical Deaths</th>
              <th className="num">Proxy Deaths</th>
              <th className="num">Death Error</th>
              <th className="num">Implied Migration</th>
            </tr>
          </thead>
          <tbody>
            {bd_epochs.map((row) => (
              <tr key={row.year}>
                <td><strong>{row.year}</strong></td>
                <td>{row.source}</td>
                <td className="num">{row.num_countries}</td>
                <td className="num">{formatEuroNumber(row.empirical_births, { use_semantic: true })}</td>
                <td className="num" style={{ color: "#38bdf8" }}>
                  {formatEuroNumber(row.proxy_births, { use_semantic: true })}
                </td>
                <td className="num" style={{ color: (Math.abs(row.birth_error_pct) < 15) ? "#34d399" : "#fbbf24" }}>
                  {formatEuroNumber(row.birth_error_pct, { is_already_percent: true, is_signed: true })}
                </td>
                <td className="num">{formatEuroNumber(row.empirical_deaths, { use_semantic: true })}</td>
                <td className="num" style={{ color: "#a78bfa" }}>
                  {formatEuroNumber(row.proxy_deaths, { use_semantic: true })}
                </td>
                <td className="num" style={{ color: (Math.abs(row.death_error_pct) < 18) ? "#34d399" : "#fbbf24" }}>
                  {formatEuroNumber(row.death_error_pct, { is_already_percent: true, is_signed: true })}
                </td>
                <td className="num">{formatEuroNumber(row.implied_migration, { use_semantic: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* Section 3: Country Breakdown */}
      <Box style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Box style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
          <Text bold={true} color="#38bdf8">
            3. Country-Level Age/Sex Validation in {selected_year} (Top 40 Sorted by Stadestér Clamping Gain Δ R²)
          </Text>
          <Box style={{ display: "flex", gap: "5px" }}>
            {per_country_years.map((yr) => (
              <button
                className="tui-btn"
                key={yr}
                onClick={() => setSelectedYear(yr)}
                style={{
                  backgroundColor: (selected_year === yr) ? "#1e3a6e" : "#0f192d",
                  borderColor: (selected_year === yr) ? "#38bdf8" : "#334155",
                  padding: "3px 8px"
                }}
              >
                {yr}
              </button>
            ))}
          </Box>
        </Box>
        <table className="tui-table">
          <thead>
            <tr>
              <th>ISO3</th>
              <th className="num">Raw MNL R²</th>
              <th className="num">Clamped R²</th>
              <th className="num">Δ R² Gain</th>
              <th className="num">Clamped Male R²</th>
              <th className="num">Clamped Female R²</th>
            </tr>
          </thead>
          <tbody>
            {country_rows.slice(0, 40).map((row) => (
              <tr key={row.iso3}>
                <td><strong>{row.iso3}</strong></td>
                <td className="num">{formatEuroNumber(row.raw_r2, { is_percent: true })}</td>
                <td className="num" style={{ color: "#34d399", fontWeight: 700 }}>
                  {formatEuroNumber(row.clamped_r2, { is_percent: true })}
                </td>
                <td className="num" style={{ color: "#38bdf8" }}>
                  {formatEuroNumber(row.delta_r2, { is_percent: true, is_signed: true })}
                </td>
                <td className="num">{formatEuroNumber(row.clamped_male, { is_percent: true })}</td>
                <td className="num">{formatEuroNumber(row.clamped_female, { is_percent: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}


/**
 * Tab 2: Neolithic Demographic Transition (NDT) Validation Scorecard & Regional Trajectories.
 *
 * @param {Object} arg0_props
 * @returns {React.ReactElement}
 */
function NDTValidationView (arg0_props) {
  //Convert from parameters
  let ndt_data = arg0_props.ndtData;

  //Declare local instance variables
  let geocodes_entries = ndt_data?.tracked_geocodes ? Object.entries(ndt_data.tracked_geocodes) : [];
  let reg_keys = ndt_data?.regional_data ? Object.keys(ndt_data.regional_data) : [];
  let scorecard_entries = ndt_data?.scorecard ? Object.entries(ndt_data.scorecard) : [];
  let [selected_region, setSelectedRegion] = useState("Southwest Asia");

  let active_epochs = ndt_data?.regional_data?.[selected_region]?.epochs || [];

  //Return statement
  return (
    <Box style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Scorecard Table */}
      <Box style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Text bold={true} color="#38bdf8">
          1. Cross-Regional NDT Paleodemographic Scorecard (Bocquet-Appel 2002/2008 &amp; Shennan et al. 2013 Priors)
        </Text>
        <table className="tui-table">
          <thead>
            <tr>
              <th>Agricultural Hearth</th>
              <th>Neolithic Onset</th>
              <th className="num">Pre-NDT Growth</th>
              <th className="num">Peak Early Growth</th>
              <th>Peak Interval</th>
              <th className="num">Pre-NDT 15P5 (%)</th>
              <th className="num">Peak Boom 15P5 (%)</th>
              <th className="num">Δ 15P5 Gain (pp)</th>
            </tr>
          </thead>
          <tbody>
            {scorecard_entries.map(([reg_name, sc]) => (
              <tr key={reg_name}>
                <td><strong>{reg_name}</strong></td>
                <td>{sc.onset_label}</td>
                <td className="num">{formatEuroNumber(sc.pre_growth_rate_clean, { decimals: 3, is_already_percent: true })}</td>
                <td className="num" style={{ color: "#34d399", fontWeight: 700 }}>
                  {formatEuroNumber(sc.peak_early_growth_rate, { decimals: 3, is_already_percent: true, is_signed: true })}
                </td>
                <td>{sc.peak_early_interval}</td>
                <td className="num">{formatEuroNumber(sc.ijp_pre_mean, { is_already_percent: true })}</td>
                <td className="num" style={{ color: "#38bdf8", fontWeight: 700 }}>
                  {formatEuroNumber(sc.ijp_boom_peak, { is_already_percent: true })}
                </td>
                <td className="num" style={{ color: (sc.ijp_delta_pp >= 0) ? "#34d399" : "#fbbf24" }}>
                  {formatEuroNumber(sc.ijp_delta_pp, { is_signed: true })} pp
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* Regional Trajectory Selector & Table */}
      <Box style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Box style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
          <Text bold={true} color="#38bdf8">
            2. Regional Paleodemographic Trajectory (10000 BC – 1000 AD) — {selected_region}
          </Text>
          <Box style={{ display: "flex", gap: "6px" }}>
            {reg_keys.map((reg_key) => (
              <button
                className="tui-btn"
                key={reg_key}
                onClick={() => setSelectedRegion(reg_key)}
                style={{
                  backgroundColor: (selected_region === reg_key) ? "#1e3a6e" : "#0f192d",
                  borderColor: (selected_region === reg_key) ? "#38bdf8" : "#334155"
                }}
              >
                {reg_key}
              </button>
            ))}
          </Box>
        </Box>

        <table className="tui-table">
          <thead>
            <tr>
              <th>Epoch</th>
              <th>Δt vs Onset</th>
              <th>NDT Stage</th>
              <th className="num">Stadestér Pop</th>
              <th className="num">HYDE Pop</th>
              <th className="num">Growth (%/yr)</th>
              <th className="num">Cropland (km²)</th>
              <th className="num">Grazing (km²)</th>
              <th className="num">Under-5 Share</th>
              <th className="num">15P5 Index</th>
            </tr>
          </thead>
          <tbody>
            {active_epochs.map((r) => (
              <tr key={r.year}>
                <td><strong>{formatEpochYear(r.year)}</strong></td>
                <td className="num">{formatEuroNumber(r.dt, { decimals: 0, is_signed: true })} yr</td>
                <td><span className="tui-badge tui-badge-idle">{r.stage}</span></td>
                <td className="num" style={{ color: "#38bdf8", fontWeight: 600 }}>
                  {formatEuroNumber(r.pop_stadester, { use_semantic: true })}
                </td>
                <td className="num">{formatEuroNumber(r.pop_hyde, { use_semantic: true })}</td>
                <td className="num" style={{ color: (r.growth_rate_pct >= 0) ? "#34d399" : "#fb7185" }}>
                  {(r.growth_rate_pct !== null)
                    ? formatEuroNumber(r.growth_rate_pct, { decimals: 3, is_already_percent: true, is_signed: true })
                    : "---"}
                </td>
                <td className="num">{formatEuroNumber(r.cropland_km2, { use_semantic: true })}</td>
                <td className="num">{formatEuroNumber(r.grazing_km2, { use_semantic: true })}</td>
                <td className="num">{formatEuroNumber(r.p_under5_pct, { is_already_percent: true })}</td>
                <td className="num">{formatEuroNumber(r.p_5_19_bocquet_pct, { is_already_percent: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* 19-Geocode Spatial Differentiation Audit */}
      <Box style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Text bold={true} color="#38bdf8">
          3. Spatial Differentiation Audit Across 19 Anchor Geocodes (6000 BC, 2000 BC, 0 AD, 600 AD)
        </Text>
        <table className="tui-table">
          <thead>
            <tr>
              <th>Geocode</th>
              <th>Region</th>
              <th className="num">6000 BC Pop</th>
              <th className="num">6000 BC 15P5</th>
              <th className="num">2000 BC Pop</th>
              <th className="num">2000 BC 15P5</th>
              <th className="num">0 AD Pop</th>
              <th className="num">0 AD 15P5</th>
              <th className="num">600 AD Pop</th>
              <th className="num">600 AD 15P5</th>
            </tr>
          </thead>
          <tbody>
            {geocodes_entries.map(([code, g]) => {
              let b_6000 = g.benchmark_epochs?.["-6000"] || {};
              let b_2000 = g.benchmark_epochs?.["-2000"] || {};
              let b_0 = g.benchmark_epochs?.["0"] || {};
              let b_600 = g.benchmark_epochs?.["600"] || {};
              return (
                <tr key={code}>
                  <td><strong>{g.info?.name || code}</strong></td>
                  <td>{g.info?.region}</td>
                  <td className="num">{formatEuroNumber(b_6000.population, { use_semantic: true })}</td>
                  <td className="num">{formatEuroNumber(b_6000.p_5_19_bocquet_pct, { is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(b_2000.population, { use_semantic: true })}</td>
                  <td className="num">{formatEuroNumber(b_2000.p_5_19_bocquet_pct, { is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(b_0.population, { use_semantic: true })}</td>
                  <td className="num" style={{ color: "#38bdf8" }}>
                    {formatEuroNumber(b_0.p_5_19_bocquet_pct, { is_already_percent: true })}
                  </td>
                  <td className="num">{formatEuroNumber(b_600.population, { use_semantic: true })}</td>
                  <td className="num" style={{ color: "#34d399" }}>
                    {formatEuroNumber(b_600.p_5_19_bocquet_pct, { is_already_percent: true })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}


/**
 * Tab 3: R Render Pipelines & Plot Artefacts in /outputs.
 *
 * @param {Object} arg0_props
 * @returns {React.ReactElement}
 */
function RVisualisationsView (arg0_props) {
  //Convert from parameters
  let on_trigger = arg0_props.onTriggerPipeline;
  let outputs_files = arg0_props.outputsFiles || [];

  //Declare local instance variables
  let cdt_plot = outputs_files.find((f) => f.name === "cdt_proxy_vs_empirical.png");
  let ndt_plot = outputs_files.find((f) => f.name === "ndt_paleodemographic_dashboard.png");

  //Return statement
  return (
    <Box style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Box
        style={{
          display: "grid",
          gap: "14px",
          gridTemplateColumns: "1fr 1fr"
        }}
      >
        {/* CDT Plot Card */}
        <div className="tui-plot-card">
          <Box style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Text bold={true} color="#38bdf8">CDT Proxy vs Empirical Validation Plot</Text>
              <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                outputs/cdt_proxy_vs_empirical.png ({cdt_plot ? `${formatEuroNumber(cdt_plot.size_kb, { decimals: 1 })} kB` : "Not rendered"})
              </div>
            </Box>
            <button
              className="tui-btn tui-btn-emerald"
              onClick={() => on_trigger("render_cdt_r")}
            >
              ↻ Re-render via Rscript
            </button>
          </Box>
          <div className="tui-plot-img-wrap">
            {cdt_plot ? (
              <img
                alt="CDT Proxy vs Empirical Plot"
                className="tui-plot-img"
                src={cdt_plot.url}
              />
            ) : (
              <Text color="#64748b">Plot not found. Click Re-render via Rscript.</Text>
            )}
          </div>
        </div>

        {/* NDT Plot Card */}
        <div className="tui-plot-card">
          <Box style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Text bold={true} color="#34d399">NDT Paleodemographic Dashboard Plot</Text>
              <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                outputs/ndt_paleodemographic_dashboard.png ({ndt_plot ? `${formatEuroNumber(ndt_plot.size_kb, { decimals: 1 })} kB` : "Not rendered"})
              </div>
            </Box>
            <button
              className="tui-btn tui-btn-emerald"
              onClick={() => on_trigger("render_ndt_r")}
            >
              ↻ Re-render via Rscript
            </button>
          </Box>
          <div className="tui-plot-img-wrap">
            {ndt_plot ? (
              <img
                alt="NDT Paleodemographic Dashboard Plot"
                className="tui-plot-img"
                src={ndt_plot.url}
              />
            ) : (
              <Text color="#64748b">Plot not found. Click Re-render via Rscript.</Text>
            )}
          </div>
        </div>
      </Box>

      {/* Output Directory Manifest Table */}
      <Box style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Text bold={true} color="#38bdf8">
          Generated Artefacts in /outputs ({outputs_files.length} files)
        </Text>
        <table className="tui-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th className="num">Size (kB)</th>
              <th>Last Modified (GMT+0)</th>
              <th>Direct Link</th>
            </tr>
          </thead>
          <tbody>
            {outputs_files.map((f) => (
              <tr key={f.name}>
                <td><strong>{f.name}</strong></td>
                <td className="num">{formatEuroNumber(f.size_kb, { decimals: 1 })} kB</td>
                <td>{f.mtime.replace("T", " ").slice(0, 19)} UTC</td>
                <td>
                  <a
                    href={f.url}
                    rel="noreferrer"
                    style={{ color: "#38bdf8", textDecoration: "underline" }}
                    target="_blank"
                  >
                    Open /outputs/{f.name}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}


/**
 * Tab 4: Markdown Validation Reports (cdt.md, ndt.md) & common_defines.json5 Inspector.
 *
 * @param {Object} arg0_props
 * @returns {React.ReactElement}
 */
function ReportsAndDefinesView (arg0_props) {
  //Convert from parameters
  let cdt_md = arg0_props.cdtMd || "";
  let defines_obj = arg0_props.definesObj || {};
  let ndt_md = arg0_props.ndtMd || "";

  //Declare local instance variables
  let [doc_mode, setDocMode] = useState("cdt_md");

  //Return statement
  return (
    <Box style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <Box style={{ display: "flex", gap: "8px" }}>
        <button
          className="tui-btn"
          onClick={() => setDocMode("cdt_md")}
          style={{ borderColor: (doc_mode === "cdt_md") ? "#38bdf8" : "#334155" }}
        >
          📄 outputs/cdt.md
        </button>
        <button
          className="tui-btn"
          onClick={() => setDocMode("ndt_md")}
          style={{ borderColor: (doc_mode === "ndt_md") ? "#38bdf8" : "#334155" }}
        >
          📄 outputs/ndt.md
        </button>
        <button
          className="tui-btn"
          onClick={() => setDocMode("defines")}
          style={{ borderColor: (doc_mode === "defines") ? "#38bdf8" : "#334155" }}
        >
          ⚙️ common/defines/common_defines.json5
        </button>
      </Box>

      <pre className="tui-code-block">
        {doc_mode === "cdt_md"
          ? cdt_md
          : doc_mode === "ndt_md"
            ? ndt_md
            : JSON.stringify(defines_obj, null, 2)}
      </pre>
    </Box>
  );
}

export default VelkscalaTUIApp;

