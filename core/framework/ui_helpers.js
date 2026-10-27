//Import React hooks
import { useMemo, useState } from "react";


/**
 * Builds the nested file-explorer tree structure from common/visualisation/,
 * common/tabulation/, and common/testing/ definitions, attaching live job statuses and output files.
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
  let figure_suite_groups = {};
  let pipelines_obj = defines_obj.pipelines || {};
  let root_nodes = [];
  let tables_array = defines_obj.tables || [];
  let table_suite_groups = {};
  let test_children = [];
  let vis_children = [];
  let tab_children = [];

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

  //1. Build common/visualisation/ nested figure explorer tree
  for (let i = 0; i < figures_array.length; i++) {
    let fig = figures_array[i];
    let suite_key = fig.suite || "general";
    if (!figure_suite_groups[suite_key]) {
      figure_suite_groups[suite_key] = {
        children: [],
        id: `folder_vis_${suite_key}`,
        is_folder: true,
        label: fig.suite_title || suite_key.toUpperCase(),
        path_label: `common/visualisation/${suite_key}_figures.json5`
      };
    }

    figure_suite_groups[suite_key].children.push({
      category: "visualisation",
      description: fig.description || "",
      file_name: fig.file_name,
      id: fig.id,
      is_folder: false,
      label: `${fig.number} — ${fig.name}`,
      number: fig.number,
      output_path: fig.output_path,
      pipeline_id: fig.pipeline_id,
      script_path: fig.script_path,
      status: getJobStatus(fig.pipeline_id, fig.file_name),
      suite: suite_key,
      tab_index: (fig.tab_index !== undefined) ? fig.tab_index : 2
    });
  }

  let vis_suite_keys = Object.keys(figure_suite_groups);
  for (let i = 0; i < vis_suite_keys.length; i++) {
    vis_children.push(figure_suite_groups[vis_suite_keys[i]]);
  }

  root_nodes.push({
    category: "visualisation",
    children: vis_children,
    id: "root_visualisation",
    is_folder: true,
    label: "common/visualisation/",
    stage_id: "generate_figures"
  });

  //2. Build common/tabulation/ nested table compilation tree
  for (let i = 0; i < tables_array.length; i++) {
    let tbl = tables_array[i];
    let suite_key = tbl.suite || "general";
    if (!table_suite_groups[suite_key]) {
      table_suite_groups[suite_key] = {
        children: [],
        id: `folder_tab_${suite_key}`,
        is_folder: true,
        label: tbl.suite_title || suite_key.toUpperCase(),
        path_label: `common/tabulation/${suite_key}_tabulation.json5`,
        pipeline_id: tbl.pipeline_id
      };
    }

    let base_file = (tbl.source_file) ? tbl.source_file.split(/[\\/]/).pop() : "";
    table_suite_groups[suite_key].children.push({
      category: "tabulation",
      description: tbl.description || "",
      file_name: base_file,
      id: tbl.id,
      is_folder: false,
      label: `${tbl.number} — ${tbl.name}`,
      number: tbl.number,
      pipeline_id: tbl.pipeline_id,
      report_file: tbl.report_file,
      source_file: tbl.source_file,
      status: getJobStatus(tbl.pipeline_id, base_file),
      suite: suite_key,
      tab_index: (tbl.tab_index !== undefined) ? tbl.tab_index : 0
    });
  }

  let tab_suite_keys = Object.keys(table_suite_groups);
  for (let i = 0; i < tab_suite_keys.length; i++) {
    tab_children.push(table_suite_groups[tab_suite_keys[i]]);
  }

  root_nodes.push({
    category: "tabulation",
    children: tab_children,
    id: "root_tabulation",
    is_folder: true,
    label: "common/tabulation/",
    stage_id: "generate_data"
  });

  //3. Build common/testing/ validation suites tree
  let all_p_keys = Object.keys(pipelines_obj);
  for (let i = 0; i < all_p_keys.length; i++) {
    let p_key = all_p_keys[i];
    let p_def = pipelines_obj[p_key];
    if (p_def.category === "testing" || p_def.category === "validation") {
      test_children.push({
        category: "testing",
        description: p_def.description || "",
        id: p_def.id || p_key,
        is_folder: false,
        label: p_def.name || p_key,
        pipeline_id: p_def.id || p_key,
        status: jobs_obj[p_key]?.status || "idle",
        tab_index: (p_def.tab_index !== undefined) ? p_def.tab_index : 0
      });
    }
  }

  root_nodes.push({
    category: "testing",
    children: test_children,
    id: "root_testing",
    is_folder: true,
    label: "common/testing/",
    stage_id: "run_tests"
  });

  //Return statement
  return root_nodes;
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
  findTreeNodeById: findTreeNodeById,
  formatEuroNumber: formatEuroNumber,
  formatYearBCAD: formatYearBCAD,
  useSortableData: useSortableData
};

