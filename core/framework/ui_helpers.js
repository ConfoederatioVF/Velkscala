//Import React hooks
import { useMemo, useState } from "react";


/**
 * Builds the nested file-explorer tree structure for the 3 top-level folders:
 * Tabulation, Tests, and Figures, with inline stage and pipeline triggers.
 *
 * @param {Object} arg0_defines
 * @param {Object} [arg1_jobs]
 * @param {Array} [arg2_outputs]
 *
 * @returns {Array<Object>}
 */
export function buildExplorerTree (arg0_defines, arg1_jobs, arg2_outputs) {
  //Convert from parameters
  let defines_obj = (arg0_defines) ? arg0_defines : {};
  let jobs_obj = (arg1_jobs) ? arg1_jobs : {};
  let outputs_array = (arg2_outputs) ? arg2_outputs : [];

  //Declare local instance variables
  let figures_array = defines_obj.figures || [];
  let pipelines_obj = defines_obj.pipelines || {};
  let root_nodes = [];
  let tab_children = [];
  let table_suite_groups = {};
  let tables_array = defines_obj.tables || [];
  let test_children = [];
  let vis_children = [];

  let getJobStatus = function (arg0_pipeline_id, arg1_file_name) {
    let p_id = arg0_pipeline_id;
    let f_name = arg1_file_name;
    let job_state = jobs_obj[p_id]?.status;
    if (job_state) return job_state;
    if (f_name) {
      let exists = outputs_array.some((f) => f.name === f_name);
      if (exists) return "ready";
    }
    return "idle";
  };

  let getStageStatus = function (arg0_stage_id) {
    let stage_id = arg0_stage_id;
    let stage_pids = defines_obj.stages?.[stage_id]?.pipeline_ids || [];
    for (let i = 0; i < stage_pids.length; i++) {
      if (jobs_obj[stage_pids[i]]?.status === "running") return "running";
    }
    return "idle";
  };

  //1. Build Tabulation top-level folder (inline button: Generate Data)
  for (let i = 0; i < tables_array.length; i++) {
    let tbl = tables_array[i];
    let suite_key = tbl.suite || "general";
    if (!table_suite_groups[suite_key]) {
      table_suite_groups[suite_key] = {
        action_label: "Compile",
        artefact_type: "folder",
        category: "tabulation",
        children: [],
        description: (suite_key === "cdt")
          ? "Contemporary Demographic Transition (1850–2019) binned validation tables and Markdown audit report."
          : "Neolithic Demographic Transition (10000 BC–1000 AD) regional trajectories, scorecard, and geocode audit.",
        id: `folder_tab_${suite_key}`,
        is_folder: true,
        label: tbl.suite_title || suite_key.toUpperCase(),
        path_label: `common/tabulation/${suite_key}_tabulation.json5`,
        pipeline_id: tbl.pipeline_id,
        status: jobs_obj[tbl.pipeline_id]?.status || "idle",
        suite: suite_key
      };
    }

    let base_file = (tbl.source_file) ? tbl.source_file.split(/[\\/]/).pop() : "";
    table_suite_groups[suite_key].children.push({
      artefact_type: "table",
      category: "tabulation",
      description: tbl.description || "",
      file_name: base_file,
      id: tbl.id,
      is_folder: false,
      label: `${tbl.number} — ${tbl.name}`,
      number: tbl.number,
      path_label: `outputs/${base_file}`,
      pipeline_id: tbl.pipeline_id,
      report_file: tbl.report_file,
      source_file: tbl.source_file,
      status: getJobStatus(tbl.pipeline_id, base_file),
      suite: suite_key
    });
  }

  if (table_suite_groups.cdt) {
    table_suite_groups.cdt.children.push({
      artefact_type: "markdown",
      category: "tabulation",
      description: "Compiled GitHub-Flavored Markdown validation report for the Contemporary Demographic Transition (1850–2019).",
      file_name: "cdt.md",
      id: "doc_cdt_md",
      is_folder: false,
      label: "cdt.md — CDT Validation Report",
      number: "cdt.md",
      path_label: "outputs/cdt.md",
      pipeline_id: "tab_cdt",
      status: getJobStatus("tab_cdt", "cdt.md"),
      suite: "cdt"
    });
  }

  if (table_suite_groups.ndt) {
    table_suite_groups.ndt.children.push({
      artefact_type: "markdown",
      category: "tabulation",
      description: "Compiled GitHub-Flavored Markdown validation report for the Neolithic Demographic Transition (10000 BC–1000 AD).",
      file_name: "ndt.md",
      id: "doc_ndt_md",
      is_folder: false,
      label: "ndt.md — NDT Validation Report",
      number: "ndt.md",
      path_label: "outputs/ndt.md",
      pipeline_id: "tab_ndt",
      status: getJobStatus("tab_ndt", "ndt.md"),
      suite: "ndt"
    });
  }

  let tab_suite_keys = Object.keys(table_suite_groups);
  for (let i = 0; i < tab_suite_keys.length; i++) {
    tab_children.push(table_suite_groups[tab_suite_keys[i]]);
  }

  root_nodes.push({
    action_label: "Generate Data",
    artefact_type: "folder",
    category: "tabulation",
    children: tab_children,
    description: defines_obj.stages?.generate_data?.description || "Compiles and bins demographic validation data into .json and .md files in outputs/ from common/tabulation/.",
    id: "root_tabulation",
    is_folder: true,
    label: "Tabulation",
    path_label: "common/tabulation/",
    stage_id: "generate_data",
    status: getStageStatus("generate_data")
  });

  //2. Build Tests top-level folder (inline button: Run Tests)
  let all_p_keys = Object.keys(pipelines_obj);
  for (let i = 0; i < all_p_keys.length; i++) {
    let p_key = all_p_keys[i];
    let p_def = pipelines_obj[p_key];
    if (p_def.category === "testing" || p_def.category === "validation") {
      let suite_Guess = p_key.includes("ndt") ? "ndt" : "cdt";
      let out_list = Array.isArray(p_def.outputs) ? p_def.outputs : [];
      let primary_out = (out_list.length > 0) ? out_list[0].split(/[\\/]/).pop() : "";
      test_children.push({
        action_label: "Run",
        artefact_type: "test",
        args: p_def.args || [],
        category: "testing",
        command: p_def.command || "node",
        description: p_def.description || "",
        file_name: primary_out,
        id: p_def.id || p_key,
        is_folder: false,
        label: p_def.name || p_key,
        outputs: out_list,
        path_label: `common/testing/${suite_Guess}_testing.json5`,
        pipeline_id: p_def.id || p_key,
        status: getJobStatus(p_key, primary_out),
        suite: suite_Guess
      });
    }
  }

  root_nodes.push({
    action_label: "Run Tests",
    artefact_type: "folder",
    category: "testing",
    children: test_children,
    description: defines_obj.stages?.run_tests?.description || "Executes Contemporary (CDT) and Neolithic (NDT) validation and model verification suites from common/testing/.",
    id: "root_testing",
    is_folder: true,
    label: "Tests",
    path_label: "common/testing/",
    stage_id: "run_tests",
    status: getStageStatus("run_tests")
  });

  //3. Build Figures top-level folder (inline button: Generate Figures)
  for (let i = 0; i < figures_array.length; i++) {
    let fig = figures_array[i];
    let suite_key = fig.suite || "general";
    vis_children.push({
      action_label: "Render",
      artefact_type: "figure",
      category: "visualisation",
      description: fig.description || "",
      file_name: fig.file_name,
      id: fig.id,
      is_folder: false,
      label: `${fig.number} — ${fig.name}`,
      number: fig.number,
      output_path: fig.output_path,
      path_label: `outputs/${fig.file_name}`,
      pipeline_id: fig.pipeline_id,
      script_path: fig.script_path,
      status: getJobStatus(fig.pipeline_id, fig.file_name),
      suite: suite_key
    });
  }

  root_nodes.push({
    action_label: "Generate Figures",
    artefact_type: "folder",
    category: "visualisation",
    children: vis_children,
    description: defines_obj.stages?.generate_figures?.description || "Renders numbered R ggplot2 validation figures from compiled .json datasets via common/visualisation/.",
    id: "root_visualisation",
    is_folder: true,
    label: "Figures",
    path_label: "common/visualisation/",
    stage_id: "generate_figures",
    status: getStageStatus("generate_figures")
  });

  //Return statement
  return root_nodes;
}


/**
 * Filters a nested explorer tree by a search query string, preserving parent branches
 * for any matching child nodes.
 *
 * @param {Array<Object>} arg0_nodes
 * @param {string} arg1_query
 *
 * @returns {Array<Object>}
 */
export function filterExplorerTree (arg0_nodes, arg1_query) {
  //Convert from parameters
  let nodes = (arg0_nodes) ? arg0_nodes : [];
  let query = (arg1_query) ? String(arg1_query).trim().toLowerCase() : "";

  //Declare local instance variables
  let filtered_nodes = [];

  //Guard clauses
  if (!query) return nodes;

  for (let i = 0; i < nodes.length; i++) {
    let local_node = nodes[i];
    let hay = [
      local_node.label,
      local_node.number,
      local_node.description,
      local_node.file_name,
      local_node.id,
      local_node.path_label,
      local_node.category
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    let self_matches = hay.includes(query);

    if (Array.isArray(local_node.children) && local_node.children.length > 0) {
      let matching_children = filterExplorerTree(local_node.children, query);
      if (self_matches || matching_children.length > 0) {
        filtered_nodes.push(Object.assign({}, local_node, {
          children: (matching_children.length > 0) ? matching_children : local_node.children
        }));
      }
    } else if (self_matches) {
      filtered_nodes.push(local_node);
    }
  }

  //Return statement
  return filtered_nodes;
}


/**
 * Recursively searches a nested explorer tree for a node matching the specified ID.
 *
 * @param {Array<Object>} arg0_nodes
 * @param {string} arg1_node_id
 *
 * @returns {Object|null}
 */
export function findTreeNodeById (arg0_nodes, arg1_node_id) {
  //Convert from parameters
  let nodes = (arg0_nodes) ? arg0_nodes : [];
  let node_id = arg1_node_id;

  //Guard clauses
  if (!node_id) return null;

  for (let i = 0; i < nodes.length; i++) {
    let local_node = nodes[i];
    if (local_node.id === node_id) return local_node;
    if (Array.isArray(local_node.children) && local_node.children.length > 0) {
      let found_child = findTreeNodeById(local_node.children, node_id);
      if (found_child) return found_child;
    }
  }

  //Return statement
  return null;
}


/**
 * Formats numeric values using European decimal notation (e.g. 58,88) and human abbreviations (k, M, B, T).
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
export function formatEuroNumber (arg0_value, arg1_options) {
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
 * Formats negative calendar years as BC and positive as AD.
 *
 * @param {number} arg0_year
 *
 * @returns {string}
 */
export function formatYearBCAD (arg0_year) {
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
 * Custom hook to sort arrays ascending or descending by key or selector function.
 *
 * @param {Array} arg0_items
 * @param {Object} [arg1_initial_config]
 *
 * @returns {Object}
 */
export function useSortableData (arg0_items, arg1_initial_config) {
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
 * Namespace export for UI helper functions.
 */
export let UIHelpers = {
  buildExplorerTree: buildExplorerTree,
  filterExplorerTree: filterExplorerTree,
  findTreeNodeById: findTreeNodeById,
  formatEuroNumber: formatEuroNumber,
  formatYearBCAD: formatYearBCAD,
  useSortableData: useSortableData
};
