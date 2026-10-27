//Import React hooks, core/framework library, and validation views
import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  buildExplorerTree,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  filterExplorerTree,
  findTreeNodeById,
  FlexPartition,
  formatEuroNumber,
  Input,
  MarkdownRenderer,
  SortHeader,
  Table,
  TreeExplorer,
  useBridgeAPI,
  useSortableData
} from "../../framework/index_ui.js";
import { CDTValidationView } from "./CDTValidationView.jsx";
import { NDTValidationView } from "./NDTValidationView.jsx";


/**
 * Renders the selected Data Explorer node in the main scene, acting like a true file explorer.
 *
 * @param {Object} arg0_props
 *  @param {number} arg0_props.imgNonce
 *  @param {Function} arg0_props.onImageError
 *  @param {Function} arg0_props.onRunPipeline
 *  @param {Function} arg0_props.onSelectNode
 *  @param {Object} arg0_props.selectedNode
 *  @param {boolean} arg0_props.showRawSource
 *  @param {Object} arg0_props.stateData
 *
 * @returns {React.ReactElement}
 */
function ArtefactSceneView (arg0_props) {
  //Convert from parameters
  let img_nonce = arg0_props.imgNonce;
  let on_image_error = arg0_props.onImageError;
  let on_run_pipeline = arg0_props.onRunPipeline;
  let on_select_node = arg0_props.onSelectNode;
  let selected_node = arg0_props.selectedNode;
  let show_raw_source = Boolean(arg0_props.showRawSource);
  let state_data = arg0_props.stateData || {};

  //Declare local instance variables
  let files = state_data.outputs_files || [];
  let jobs_obj = state_data.jobs || {};

  let { items: sorted_files, requestSort: requestFileSort, sortConfig: fileSortCfg } = useSortableData(
    files,
    { direction: "asc", key: "name" }
  );

  //Guard clauses
  if (!selected_node) {
    return (
      <div style={{ color: "var(--text-muted)", padding: "16px 0" }}>
        Select an artefact from the Data Explorer on the left to inspect it.
      </div>
    );
  }

  //1. Single Figure Artefact (Fig. 1 or Fig. 2)
  if (selected_node.artefact_type === "figure") {
    let fig_file = files.find((f) => f.name === selected_node.file_name);
    let fig_src = fig_file ? `${fig_file.url}&v=${img_nonce}` : "";

    return (
      <div className="shadcn-single-figure-scene">
        <div className="linear-plot-image-wrap" style={{ flex: 1, minHeight: 0 }}>
          {fig_file ? (
            <img
              alt={selected_node.label}
              className="linear-plot-image"
              key={fig_src}
              onError={on_image_error}
              src={fig_src}
            />
          ) : (
            <span style={{ color: "var(--text-muted)" }}>
              Figure file ({selected_node.file_name}) not generated yet. Click Render above to generate it.
            </span>
          )}
        </div>

        <div className="shadcn-artefact-footer">
          <span>
            File: <strong>outputs/{selected_node.file_name}</strong>
          </span>
          {fig_file ? (
            <>
              <span>Size: {formatEuroNumber(fig_file.size_kb, { decimals: 1 })} kB</span>
              <span>Modified: {fig_file.mtime.replace("T", " ").slice(0, 19)}</span>
              <a
                className="gfm-link"
                href={fig_file.url}
                rel="noreferrer"
                target="_blank"
              >
                Open raw PNG
              </a>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  //2. Markdown Report Artefact (cdt.md or ndt.md)
  if (selected_node.artefact_type === "markdown") {
    let md_content = (selected_node.suite === "ndt") ? (state_data.ndt_md || "") : (state_data.cdt_md || "");
    return (
      <div style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0, overflowY: "auto" }}>
        {show_raw_source ? (
          <pre className="linear-doc-viewer" style={{ flex: 1 }}>
            {md_content || "No Markdown content available."}
          </pre>
        ) : (
          <MarkdownRenderer content={md_content} />
        )}
      </div>
    );
  }

  //3. Individual Table Artefact (Table 1.1, 1.2, 1.3, 2.1, 2.2, 2.3)
  if (selected_node.artefact_type === "table") {
    if (show_raw_source) {
      let raw_json_obj = (selected_node.suite === "ndt")
        ? state_data.ndt_results
        : (selected_node.id === "table_cdt_vital_flows")
          ? state_data.cdt_births_deaths
          : state_data.cdt_age_sex;
      return (
        <pre className="linear-doc-viewer" style={{ flex: 1, overflowY: "auto" }}>
          {JSON.stringify(raw_json_obj || {}, null, 2)}
        </pre>
      );
    }

    if (selected_node.suite === "ndt") {
      return (
        <NDTValidationView
          ndtData={state_data.ndt_results}
          tableId={selected_node.id}
        />
      );
    } else {
      return (
        <CDTValidationView
          ageSexData={state_data.cdt_age_sex}
          birthsDeathsData={state_data.cdt_births_deaths}
          tableId={selected_node.id}
        />
      );
    }
  }

  //4. Individual Test Suite Artefact (test_cdt, test_cdt_full, test_ndt, test_piecewise_ndt)
  if (selected_node.artefact_type === "test") {
    let cmd_str = `${selected_node.command || "node"} ${(selected_node.args || []).join(" ")}`;
    let job_info = jobs_obj[selected_node.pipeline_id];

    return (
      <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "12px", minHeight: 0, overflowY: "auto" }}>
        <Card style={{ flexShrink: 0 }}>
          <CardHeader>
            <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
              <CardTitle>Pipeline specification</CardTitle>
              <Badge variant={job_info?.status === "running" ? "active" : "default"}>
                {job_info?.status || selected_node.status || "idle"}
              </Badge>
            </div>
            <CardDescription>
              Command: <code className="gfm-inline-code">{cmd_str}</code>
              {job_info?.completed_at ? ` · Last finished: ${job_info.completed_at.replace("T", " ").slice(0, 19)}` : ""}
            </CardDescription>
          </CardHeader>
        </Card>

        {selected_node.id === "test_piecewise_ndt" ? (
          <Card>
            <CardHeader>
              <CardTitle>Piecewise &amp; unified model architecture verification (1500/1750 AD cutoff)</CardTitle>
              <CardDescription>
                Audits the premodern 34-covariate multinomial logit architecture, unified coverage-weighted ensemble, and post-1750 rolling transition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <thead>
                  <tr>
                    <th>Verification check</th>
                    <th>Target model / cohort</th>
                    <th>Specification</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>1. Premodern multinomial logit</strong></td>
                    <td>premodern_multinomial_logit.json</td>
                    <td>34 covariates including shifting, grazing, rangeland, conv_rangeland, cropland, tot_rice</td>
                    <td><Badge>Verified</Badge></td>
                  </tr>
                  <tr>
                    <td><strong>2. Unified coverage ensemble</strong></td>
                    <td>multinomial_model_unified.json</td>
                    <td>Coverage-weighted historical blending across pre-1750 anchor epochs</td>
                    <td><Badge>Verified</Badge></td>
                  </tr>
                  <tr>
                    <td><strong>3. Post-1750 modern rolling</strong></td>
                    <td>multinomial_model_1760..1940.json</td>
                    <td>Rolling modern demographic transition parameterization (1760, 1850, 1940)</td>
                    <td><Badge>Verified</Badge></td>
                  </tr>
                  <tr>
                    <td><strong>4. Agricultural logit differential</strong></td>
                    <td>Infant male cohort (m_00)</td>
                    <td>Positive shift under Neolithic cropland &amp; shifting cultivation expansion (8000 BC to 0 AD)</td>
                    <td><Badge>Verified</Badge></td>
                  </tr>
                </tbody>
              </Table>
            </CardContent>
          </Card>
        ) : selected_node.suite === "ndt" ? (
          <div style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: "420px" }}>
            <NDTValidationView ndtData={state_data.ndt_results} />
          </div>
        ) : (
          <div style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: "420px" }}>
            <CDTValidationView
              ageSexData={state_data.cdt_age_sex}
              birthsDeathsData={state_data.cdt_births_deaths}
            />
          </div>
        )}
      </div>
    );
  }

  //5. Folder Views (Tabulation, Tests, Figures, or CDT/NDT Suite Folders)
  if (selected_node.id === "root_visualisation") {
    let figures_cfg = state_data.defines?.figures || [];
    let cdt_fig = figures_cfg.find((f) => f.suite === "cdt") || {
      file_name: "cdt_proxy_vs_empirical.png",
      id: "fig_1_cdt_dashboard",
      name: "CDT 2x2 Proxy vs Empirical Validation",
      number: "Fig. 1",
      pipeline_id: "render_cdt_r"
    };
    let ndt_fig = figures_cfg.find((f) => f.suite === "ndt") || {
      file_name: "ndt_paleodemographic_dashboard.png",
      id: "fig_2_ndt_dashboard",
      name: "NDT Paleodemographic Dashboard",
      number: "Fig. 2",
      pipeline_id: "render_ndt_r"
    };
    let cdt_img = files.find((f) => f.name === cdt_fig.file_name);
    let ndt_img = files.find((f) => f.name === ndt_fig.file_name);
    let cdt_src = cdt_img ? `${cdt_img.url}&v=${img_nonce}` : "";
    let ndt_src = ndt_img ? `${ndt_img.url}&v=${img_nonce}` : "";

    return (
      <FlexPartition
        direction="vertical"
        initialRatio={0.68}
        maxFirstPct={92}
        minFirstPct={25}
        style={{ flex: 1, height: "100%", minHeight: 0 }}
      >
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
              <div style={{ display: "flex", gap: "6px" }}>
                <Button onClick={() => on_select_node("fig_1_cdt_dashboard")} size="sm" variant="secondary">
                  Open
                </Button>
                <Button onClick={() => on_run_pipeline(cdt_fig.pipeline_id)} size="sm" variant="primary">
                  {jobs_obj?.[cdt_fig.pipeline_id]?.status === "running" ? "Rendering..." : "Render"}
                </Button>
              </div>
            </div>
            <div
              className="linear-plot-image-wrap"
              onClick={() => on_select_node("fig_1_cdt_dashboard")}
              style={{ cursor: "pointer" }}
              title="Click to inspect Fig. 1"
            >
              {cdt_img ? (
                <img
                  alt={cdt_fig.name}
                  className="linear-plot-image"
                  key={cdt_src}
                  onError={on_image_error}
                  src={cdt_src}
                />
              ) : (
                <span style={{ color: "var(--text-muted)" }}>Plot not generated yet.</span>
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
              <div style={{ display: "flex", gap: "6px" }}>
                <Button onClick={() => on_select_node("fig_2_ndt_dashboard")} size="sm" variant="secondary">
                  Open
                </Button>
                <Button onClick={() => on_run_pipeline(ndt_fig.pipeline_id)} size="sm" variant="primary">
                  {jobs_obj?.[ndt_fig.pipeline_id]?.status === "running" ? "Rendering..." : "Render"}
                </Button>
              </div>
            </div>
            <div
              className="linear-plot-image-wrap"
              onClick={() => on_select_node("fig_2_ndt_dashboard")}
              style={{ cursor: "pointer" }}
              title="Click to inspect Fig. 2"
            >
              {ndt_img ? (
                <img
                  alt={ndt_fig.name}
                  className="linear-plot-image"
                  key={ndt_src}
                  onError={on_image_error}
                  src={ndt_src}
                />
              ) : (
                <span style={{ color: "var(--text-muted)" }}>Plot not generated yet.</span>
              )}
            </div>
          </div>
        </FlexPartition>

        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflowY: "auto" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
            Compiled artefacts in /outputs ({files.length})
          </div>
          <Table containerStyle={{ flex: 1, overflowY: "auto" }}>
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
                      className="gfm-link"
                      href={f.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </FlexPartition>
    );
  }

  if (selected_node.id === "folder_tab_cdt") {
    return (
      <CDTValidationView
        ageSexData={state_data.cdt_age_sex}
        birthsDeathsData={state_data.cdt_births_deaths}
      />
    );
  }

  if (selected_node.id === "folder_tab_ndt") {
    return (
      <NDTValidationView ndtData={state_data.ndt_results} />
    );
  }

  //Default Folder Explorer Grid (for root_tabulation, root_testing, or general folders)
  let folder_children = selected_node.children || [];

  //Return statement
  return (
    <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "14px", minHeight: 0, overflowY: "auto" }}>
      <div className="shadcn-folder-grid">
        {folder_children.map((child) => (
          <Card
            className="shadcn-folder-card"
            key={child.id}
            onClick={() => on_select_node(child.id)}
            style={{ cursor: "pointer" }}
          >
            <CardHeader>
              <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <CardTitle>{child.label}</CardTitle>
                {child.status ? (
                  <Badge variant={child.status === "running" ? "active" : "default"}>
                    {child.status}
                  </Badge>
                ) : null}
              </div>
              {child.path_label ? (
                <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>{child.path_label}</div>
              ) : null}
            </CardHeader>
            {child.description ? (
              <CardContent>
                <CardDescription>{child.description}</CardDescription>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>

      {selected_node.id === "root_tabulation" ? (
        <div style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: "380px" }}>
          <CDTValidationView
            ageSexData={state_data.cdt_age_sex}
            birthsDeathsData={state_data.cdt_births_deaths}
          />
        </div>
      ) : null}
    </div>
  );
}


/**
 * Main web application component implementing the React + shadcn/ui Dataview interface for Velkscala.
 *
 * @returns {React.ReactElement}
 */
export function VelkscalaTUIApp () {
  //Declare local instance variables
  let [img_nonce, setImgNonce] = useState(() => Date.now());
  let [is_scene_expanded, setIsSceneExpanded] = useState(false);
  let {
    isLoading: is_loading,
    refreshState,
    stateData: state_data,
    triggerPipeline,
    triggerStage
  } = useBridgeAPI({ poll_ms: 1200 });
  let [search_query, setSearchQuery] = useState("");
  let [selected_node_id, setSelectedNodeId] = useState("table_cdt_age_sex_epochs");
  let [show_raw_source, setShowRawSource] = useState(false);

  let explorer_tree = useMemo(() => {
    return buildExplorerTree(
      state_data?.defines,
      state_data?.jobs,
      state_data?.outputs_files
    );
  }, [state_data]);

  let filtered_tree = useMemo(() => {
    return filterExplorerTree(explorer_tree, search_query);
  }, [explorer_tree, search_query]);

  let selected_node = useMemo(() => {
    return findTreeNodeById(explorer_tree, selected_node_id) || explorer_tree[0] || null;
  }, [explorer_tree, selected_node_id]);

  //Update image cache-busting nonce when render version or jobs change
  useEffect(() => {
    setImgNonce(Date.now());
  }, [state_data?.render_version, state_data?.outputs_files?.length]);

  //Allow Escape key to exit full-screen scene mode
  useEffect(() => {
    if (!is_scene_expanded) return;
    let onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSceneExpanded(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [is_scene_expanded]);

  let handleTreeSelect = function (arg0_node) {
    let node = arg0_node;
    if (!node) return;
    setSelectedNodeId(node.id);
    setShowRawSource(false);
  };

  let handleSelectNodeById = function (arg0_id) {
    let id = arg0_id;
    if (!id) return;
    setSelectedNodeId(id);
    setShowRawSource(false);
  };

  let handleRunPipeline = async function (arg0_pipeline_id) {
    let pipeline_id = arg0_pipeline_id;
    if (!pipeline_id) return;
    await triggerPipeline(pipeline_id);
    setImgNonce(Date.now());
  };

  let handleRunStage = async function (arg0_stage_id) {
    let stage_id = arg0_stage_id;
    if (!stage_id) return;
    await triggerStage(stage_id);
    setImgNonce(Date.now());
  };

  let handleImageError = function () {
    setTimeout(() => {
      setImgNonce(Date.now());
      refreshState();
    }, 600);
  };

  let has_raw_toggle = Boolean(
    selected_node &&
    (selected_node.artefact_type === "table" || selected_node.artefact_type === "markdown")
  );

  //Return statement
  return (
    <div className="linear-dashboard">
      {/* Minimal Dataview Header */}
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
          <Button onClick={() => refreshState()} size="sm" variant="secondary">
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Workspace Split: Left Data Explorer | Right Artefact Scene */}
      <FlexPartition
        className="linear-workspace-partition"
        direction="horizontal"
        initialRatio={0.27}
        maxFirstPct={55}
        minFirstPct={16}
      >
        {/* Left Sidebar: Data Explorer with Searchbar and 3 Top-Level Folders */}
        <aside className="linear-panel" style={{ height: "100%", width: "100%" }}>
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
            <span className="linear-panel-title">Data Explorer</span>
            <Badge>{(state_data?.outputs_files || []).length} outputs</Badge>
          </div>

          <Input
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
            placeholder="Search Tabulation, Tests, Figures..."
            value={search_query}
          />

          <TreeExplorer
            nodes={filtered_tree}
            onRunPipeline={handleRunPipeline}
            onRunStage={handleRunStage}
            onSelect={handleTreeSelect}
            searchQuery={search_query}
            selectedId={selected_node?.id}
          />
        </aside>

        {/* Right Main Scene: Displays selected Data Explorer artefact with Full-Screen Expand Toggle */}
        <main
          className={`linear-panel shadcn-scene-panel ${is_scene_expanded ? "is-fullscreen" : ""}`}
          style={{ height: "100%", width: "100%" }}
        >
          <div className="shadcn-scene-header">
            <div className="shadcn-scene-title-group">
              <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selected_node?.category ? (
                  <Badge>{selected_node.category}</Badge>
                ) : null}
                <h2 className="shadcn-scene-title">
                  {selected_node ? selected_node.label : "Scene"}
                </h2>
                {selected_node?.path_label ? (
                  <span className="shadcn-scene-path">{selected_node.path_label}</span>
                ) : null}
              </div>
              {selected_node?.description ? (
                <p className="shadcn-scene-description">{selected_node.description}</p>
              ) : null}
            </div>

            <div className="shadcn-scene-actions">
              {has_raw_toggle ? (
                <Button
                  onClick={() => setShowRawSource(!show_raw_source)}
                  size="sm"
                  variant="secondary"
                >
                  {show_raw_source
                    ? "Formatted view"
                    : selected_node.artefact_type === "markdown"
                      ? "Raw Markdown"
                      : "Raw JSON"}
                </Button>
              ) : null}

              {selected_node?.stage_id ? (
                <Button
                  onClick={() => handleRunStage(selected_node.stage_id)}
                  size="sm"
                  variant="primary"
                >
                  {selected_node.status === "running"
                    ? "Running..."
                    : (selected_node.action_label || "Run stage")}
                </Button>
              ) : selected_node?.pipeline_id ? (
                <Button
                  onClick={() => handleRunPipeline(selected_node.pipeline_id)}
                  size="sm"
                  variant="primary"
                >
                  {state_data?.jobs?.[selected_node.pipeline_id]?.status === "running"
                    ? "Running..."
                    : (selected_node.action_label
                      ? `${selected_node.action_label} ${selected_node.number || ""}`.trim()
                      : "Execute")}
                </Button>
              ) : null}

              <Button
                aria-pressed={is_scene_expanded}
                className={is_scene_expanded ? "shadcn-btn-active-toggle" : ""}
                onClick={() => setIsSceneExpanded(!is_scene_expanded)}
                size="sm"
                title={is_scene_expanded ? "Restore scene from full screen (Esc)" : "Expand artefact to full screen"}
                variant="secondary"
              >
                <span>{is_scene_expanded ? "⤡" : "⤢"}</span>
                <span>{is_scene_expanded ? "Collapse" : "Expand"}</span>
              </Button>
            </div>
          </div>

          <div className="shadcn-scene-body">
            {is_loading ? (
              <div style={{ color: "var(--text-muted)", padding: "16px 0" }}>
                Loading validation data...
              </div>
            ) : (
              <ArtefactSceneView
                imgNonce={img_nonce}
                onImageError={handleImageError}
                onRunPipeline={handleRunPipeline}
                onSelectNode={handleSelectNodeById}
                selectedNode={selected_node}
                showRawSource={show_raw_source}
                stateData={state_data}
              />
            )}
          </div>
        </main>
      </FlexPartition>
    </div>
  );
}

export default VelkscalaTUIApp;
