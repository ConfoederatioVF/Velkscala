//Import React hooks, core/framework library, and validation views
import React, { useEffect, useMemo, useState } from "react";
import {
  buildExplorerTree,
  findTreeNodeById,
  FlexPartition,
  formatEuroNumber,
  MarkdownRenderer,
  SortHeader,
  TreeExplorer,
  useBridgeAPI,
  useSortableData
} from "../../framework/index_ui.js";
import { CDTValidationView } from "./CDTValidationView.jsx";
import { NDTValidationView } from "./NDTValidationView.jsx";


/**
 * Tab 4: Mixed-Markdown/HTML Reports (GitHub GFM + LaTeX + HTML) & common/ JSON5 Defines.
 *
 * @param {Object} arg0_props
 *  @param {string} arg0_props.cdtMd
 *  @param {Object} arg0_props.definesObj
 *  @param {string} arg0_props.ndtMd
 *
 * @returns {React.ReactElement}
 */
function ReportsView (arg0_props) {
  //Convert from parameters
  let cdt_md = arg0_props.cdtMd || "";
  let defines_obj = arg0_props.definesObj || {};
  let ndt_md = arg0_props.ndtMd || "";

  //Declare local instance variables
  let [doc_view, setDocView] = useState("cdt");
  let [show_raw_md, setShowRawMd] = useState(false);

  let active_markdown = (doc_view === "cdt") ? cdt_md : ndt_md;
  let is_markdown_doc = (doc_view === "cdt" || doc_view === "ndt");

  //Return statement
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            className={`linear-btn linear-btn-sm ${doc_view === "cdt" ? "linear-btn-primary" : ""}`}
            onClick={() => setDocView("cdt")}
            type="button"
          >
            outputs/cdt.md
          </button>
          <button
            className={`linear-btn linear-btn-sm ${doc_view === "ndt" ? "linear-btn-primary" : ""}`}
            onClick={() => setDocView("ndt")}
            type="button"
          >
            outputs/ndt.md
          </button>
          <button
            className={`linear-btn linear-btn-sm ${doc_view === "defines" ? "linear-btn-primary" : ""}`}
            onClick={() => setDocView("defines")}
            type="button"
          >
            common/ configs (.json5)
          </button>
        </div>

        {is_markdown_doc ? (
          <button
            className="linear-btn linear-btn-sm"
            onClick={() => setShowRawMd(!show_raw_md)}
            type="button"
          >
            {show_raw_md ? "Rendered GitHub view" : "Raw Markdown"}
          </button>
        ) : null}
      </div>

      {is_markdown_doc && !show_raw_md ? (
        <MarkdownRenderer content={active_markdown} />
      ) : (
        <pre className="linear-doc-viewer">
          {is_markdown_doc
            ? active_markdown
            : JSON.stringify(defines_obj, null, 2)}
        </pre>
      )}
    </div>
  );
}


/**
 * Main dashboard component implementing the Dataview design palette for Velkscala validation.
 *
 * @returns {React.ReactElement}
 */
export function VelkscalaTUIApp () {
  //Declare local instance variables
  let [active_tab, setActiveTab] = useState(0);
  let {
    isLoading: is_loading,
    refreshState,
    stateData: state_data,
    triggerPipeline,
    triggerStage
  } = useBridgeAPI({ poll_ms: 1200 });
  let [selected_node_id, setSelectedNodeId] = useState("fig_1_cdt_dashboard");

  let explorer_tree = useMemo(() => {
    return buildExplorerTree(
      state_data?.defines,
      state_data?.jobs,
      state_data?.outputs_files
    );
  }, [state_data]);

  let selected_node = useMemo(() => {
    return findTreeNodeById(explorer_tree, selected_node_id);
  }, [explorer_tree, selected_node_id]);

  let handleTreeSelect = function (arg0_node) {
    let node = arg0_node;
    if (!node) return;
    setSelectedNodeId(node.id);
    if (node.tab_index !== undefined) {
      setActiveTab(node.tab_index);
    }
  };

  let handleExecuteSelected = function () {
    if (!selected_node) {
      triggerPipeline("render_cdt_r");
      return;
    }
    if (selected_node.stage_id) {
      triggerStage(selected_node.stage_id);
    } else if (selected_node.pipeline_id) {
      triggerPipeline(selected_node.pipeline_id);
    }
  };

  //Compute summary metrics
  let bd_epochs = state_data?.cdt_births_deaths?.summary_by_epoch || [];
  let geocode_count = Object.keys(state_data?.ndt_results?.tracked_geocodes || {}).length;
  let hearth_count = Object.keys(state_data?.ndt_results?.scorecard || {}).length;
  let latest_bd = (bd_epochs.length > 0) ? bd_epochs[bd_epochs.length - 1] : {};
  let outputs_files = state_data?.outputs_files || [];
  let overall_cdt = state_data?.cdt_age_sex?.overall_cdt || {};

  let tabs = [
    "CDT validation (age & sex)",
    "NDT validation (paleodemography)",
    "Visualisations (R ggplot2)",
    "Reports & defines"
  ];

  //Return statement
  return (
    <div className="linear-dashboard">
      {/* Refined Dataview Header with 3 Top-Right Stage Buttons */}
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
            onClick={() => triggerStage("generate_data")}
            title="Compiles and bins demographic data into .json and .md files via common/tabulation/"
            type="button"
          >
            Generate Data
          </button>
          <button
            className="linear-btn"
            onClick={() => triggerStage("run_tests")}
            title="Executes CDT and NDT validation suites via common/testing/"
            type="button"
          >
            Run Tests
          </button>
          <button
            className="linear-btn linear-btn-primary"
            onClick={() => triggerStage("generate_figures")}
            title="Renders numbered R ggplot2 figures via common/visualisation/"
            type="button"
          >
            Generate Figures
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
            Numbered figures, binned JSON tables, and GitHub Markdown
          </span>
        </div>
      </div>

      {/* Main Resizable Horizontal Partition: Left Sidebar (Data Explorer) | Right Main Panel */}
      <FlexPartition
        className="linear-workspace-partition"
        direction="horizontal"
        initialRatio={0.25}
        maxFirstPct={55}
        minFirstPct={15}
      >
        {/* Left Sidebar: Data Explorer & Process Stream split vertically */}
        <aside className="linear-panel" style={{ height: "100%", width: "100%" }}>
          <FlexPartition
            direction="vertical"
            initialRatio={0.58}
            maxFirstPct={85}
            minFirstPct={25}
          >
            {/* Top Pane: Data Explorer */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%", minHeight: 0 }}>
              <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                <span className="linear-panel-title">Data Explorer</span>
                <button
                  className="linear-btn linear-btn-sm"
                  onClick={() => refreshState()}
                  type="button"
                >
                  Refresh
                </button>
              </div>

              <TreeExplorer
                nodes={explorer_tree}
                onSelect={handleTreeSelect}
                selectedId={selected_node_id}
              />

              {selected_node ? (
                <div className="linear-selected-node-meta">
                  <div className="linear-selected-node-title">{selected_node.label}</div>
                  {selected_node.description ? (
                    <div className="linear-selected-node-desc">{selected_node.description}</div>
                  ) : null}
                </div>
              ) : null}

              <button
                className="linear-btn linear-btn-primary"
                onClick={handleExecuteSelected}
                style={{ flexShrink: 0, justifyContent: "center", width: "100%" }}
                type="button"
              >
                {selected_node?.stage_id
                  ? `Run ${selected_node.label}`
                  : `Execute ${selected_node?.number || selected_node?.id || "selected"}`}
              </button>
            </div>

            {/* Bottom Pane: Process Stream */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", height: "100%", minHeight: 0 }}>
              <span className="linear-panel-title">Process stream</span>
              <div className="linear-log-box">
                {(!state_data?.logs || state_data.logs.length === 0) ? (
                  <div style={{ color: "rgba(255, 255, 255, 0.45)" }}>Ready. Select a figure or pipeline node above.</div>
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
            </div>
          </FlexPartition>
        </aside>

        {/* Right Main Panel: Tabs and Sortable Data Viewers */}
        <main className="linear-panel" style={{ height: "100%", width: "100%" }}>
          <nav className="linear-tabs-nav">
            {tabs.map((tab_title, idx) => (
              <button
                className={`linear-tab-btn ${active_tab === idx ? "active" : ""}`}
                key={idx}
                onClick={() => setActiveTab(idx)}
                type="button"
              >
                {tab_title}
              </button>
            ))}
          </nav>

          <div style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0, overflowY: "auto", paddingRight: "4px" }}>
            {is_loading ? (
              <div style={{ color: "rgba(255, 255, 255, 0.45)", padding: "16px 0" }}>Loading validation data...</div>
            ) : active_tab === 0 ? (
              <CDTValidationView
                ageSexData={state_data?.cdt_age_sex}
                birthsDeathsData={state_data?.cdt_births_deaths}
              />
            ) : active_tab === 1 ? (
              <NDTValidationView ndtData={state_data?.ndt_results} />
            ) : active_tab === 2 ? (
              <VisualisationsView
                figuresConfig={state_data?.defines?.figures}
                jobsObj={state_data?.jobs}
                onRefreshState={refreshState}
                onRunPipeline={triggerPipeline}
                outputsFiles={outputs_files}
                renderVersion={state_data?.render_version}
                selectedNode={selected_node}
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
      </FlexPartition>
    </div>
  );
}


/**
 * Tab 3: Numbered R Render Pipelines & Plot Visualisations with resizable flex partitions.
 *
 * @param {Object} arg0_props
 *  @param {Array} arg0_props.figuresConfig
 *  @param {Object} arg0_props.jobsObj
 *  @param {Function} arg0_props.onRefreshState
 *  @param {Function} arg0_props.onRunPipeline
 *  @param {Array} arg0_props.outputsFiles
 *  @param {number} arg0_props.renderVersion
 *  @param {Object} arg0_props.selectedNode
 *
 * @returns {React.ReactElement}
 */
function VisualisationsView (arg0_props) {
  //Convert from parameters
  let figures_cfg = arg0_props.figuresConfig || [];
  let jobs_obj = arg0_props.jobsObj || {};
  let on_refresh = arg0_props.onRefreshState;
  let on_run = arg0_props.onRunPipeline;
  let files = arg0_props.outputsFiles || [];
  let render_version = arg0_props.renderVersion || 1;
  let selected_node = arg0_props.selectedNode;

  //Declare local instance variables
  let cdt_fig = figures_cfg.find((f) => f.suite === "cdt") || {
    file_name: "cdt_proxy_vs_empirical.png",
    name: "CDT 2x2 Proxy vs Empirical Validation",
    number: "Fig. 1",
    pipeline_id: "render_cdt_r"
  };
  let cdt_img = files.find((f) => f.name === cdt_fig.file_name);
  let cdt_status = jobs_obj?.[cdt_fig.pipeline_id]?.status || "idle";
  let cdt_completed_at = jobs_obj?.[cdt_fig.pipeline_id]?.completed_at || "";

  let [img_nonce, setImgNonce] = useState(() => Date.now());

  let ndt_fig = figures_cfg.find((f) => f.suite === "ndt") || {
    file_name: "ndt_paleodemographic_dashboard.png",
    name: "NDT Paleodemographic Dashboard",
    number: "Fig. 2",
    pipeline_id: "render_ndt_r"
  };
  let ndt_img = files.find((f) => f.name === ndt_fig.file_name);
  let ndt_status = jobs_obj?.[ndt_fig.pipeline_id]?.status || "idle";
  let ndt_completed_at = jobs_obj?.[ndt_fig.pipeline_id]?.completed_at || "";

  //Force fresh cache-busted image reload whenever a plot render job finishes
  useEffect(() => {
    setImgNonce(Date.now());
    let timer_handle = setTimeout(() => {
      setImgNonce(Date.now());
    }, 450);
    return () => clearTimeout(timer_handle);
  }, [cdt_status, cdt_completed_at, ndt_status, ndt_completed_at, render_version, cdt_img?.mtime, ndt_img?.mtime]);

  let handleRerender = async function (arg0_pipeline_id) {
    let pipeline_id = arg0_pipeline_id;
    await on_run(pipeline_id);
    setImgNonce(Date.now());
  };

  let handleImageError = function () {
    setTimeout(() => {
      setImgNonce(Date.now());
      if (typeof on_refresh === "function") on_refresh();
    }, 600);
  };

  let { items: sorted_files, requestSort: requestFileSort, sortConfig: fileSortCfg } = useSortableData(
    files,
    { direction: "asc", key: "name" }
  );

  let cdt_src = cdt_img ? `${cdt_img.url}&v=${img_nonce}` : "";
  let ndt_src = ndt_img ? `${ndt_img.url}&v=${img_nonce}` : "";

  //Return statement
  return (
    <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "10px", height: "100%", minHeight: 0 }}>
      {selected_node && selected_node.category === "visualisation" ? (
        <div className="linear-selected-figure-banner" style={{ flexShrink: 0 }}>
          <div>
            <strong>{selected_node.label}</strong>
            {selected_node.description ? (
              <span style={{ color: "var(--text-secondary)", marginLeft: "8px" }}>
                — {selected_node.description}
              </span>
            ) : null}
          </div>
          {selected_node.pipeline_id ? (
            <button
              className="linear-btn linear-btn-sm"
              onClick={() => handleRerender(selected_node.pipeline_id)}
              type="button"
            >
              {jobs_obj?.[selected_node.pipeline_id]?.status === "running"
                ? "Rendering..."
                : `Re-render ${selected_node.number || "figure"}`}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Vertical Flex Partition: Main Figure Display Area (Top) vs Output Files Table (Bottom) */}
      <FlexPartition
        direction="vertical"
        initialRatio={0.68}
        maxFirstPct={92}
        minFirstPct={25}
        style={{ flex: 1, minHeight: 0 }}
      >
        {/* Horizontal Flex Partition: Fig. 1 (Left) vs Fig. 2 (Right) */}
        <FlexPartition
          direction="horizontal"
          initialRatio={0.5}
          maxFirstPct={82}
          minFirstPct={18}
          style={{ height: "100%", width: "100%" }}
        >
          <div className="linear-plot-card" style={{ height: "100%", width: "100%" }}>
            <div className="linear-plot-header">
              <div>
                <div className="linear-plot-title">{cdt_fig.number} — {cdt_fig.name}</div>
                <div className="linear-plot-meta">
                  outputs/{cdt_fig.file_name} {cdt_img ? `(${formatEuroNumber(cdt_img.size_kb, { decimals: 1 })} kB)` : ""}
                </div>
              </div>
              <button
                className="linear-btn linear-btn-sm"
                onClick={() => handleRerender(cdt_fig.pipeline_id)}
                type="button"
              >
                {cdt_status === "running" ? "Rendering..." : `Re-render ${cdt_fig.number}`}
              </button>
            </div>
            <div className="linear-plot-image-wrap">
              {cdt_img ? (
                <img
                  alt={cdt_fig.name}
                  className="linear-plot-image"
                  key={cdt_src}
                  onError={handleImageError}
                  src={cdt_src}
                />
              ) : (
                <span style={{ color: "rgba(255, 255, 255, 0.45)" }}>Plot not generated yet.</span>
              )}
            </div>
          </div>

          <div className="linear-plot-card" style={{ height: "100%", width: "100%" }}>
            <div className="linear-plot-header">
              <div>
                <div className="linear-plot-title">{ndt_fig.number} — {ndt_fig.name}</div>
                <div className="linear-plot-meta">
                  outputs/{ndt_fig.file_name} {ndt_img ? `(${formatEuroNumber(ndt_img.size_kb, { decimals: 1 })} kB)` : ""}
                </div>
              </div>
              <button
                className="linear-btn linear-btn-sm"
                onClick={() => handleRerender(ndt_fig.pipeline_id)}
                type="button"
              >
                {ndt_status === "running" ? "Rendering..." : `Re-render ${ndt_fig.number}`}
              </button>
            </div>
            <div className="linear-plot-image-wrap">
              {ndt_img ? (
                <img
                  alt={ndt_fig.name}
                  className="linear-plot-image"
                  key={ndt_src}
                  onError={handleImageError}
                  src={ndt_src}
                />
              ) : (
                <span style={{ color: "rgba(255, 255, 255, 0.45)" }}>Plot not generated yet.</span>
              )}
            </div>
          </div>
        </FlexPartition>

        {/* Bottom Pane: Output Files Table */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflowY: "auto" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
            Output files ({files.length})
          </div>
          <div className="linear-table-container" style={{ flex: 1, overflowY: "auto" }}>
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
      </FlexPartition>
    </div>
  );
}

export default VelkscalaTUIApp;
