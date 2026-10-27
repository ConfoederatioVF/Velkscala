let fs = require("fs");
let path = require("path");


/**
 * Provides JSON and JSON5 configuration loading, merging, and tokenised path resolution
 * across common/defines/, common/tabulation/, common/testing/, and common/visualisation/.
 */
class ConfigLoader {
  /**
   * Replaces path tokens (e.g. $PROJECT_ROOT, $SVEA_DIR, $OUTPUTS_DIR) in a string.
   *
   * @param {string} arg0_text
   * @param {Object} arg1_tokens
   *
   * @returns {string}
   */
  static interpolateString (arg0_text, arg1_tokens) {
    //Convert from parameters
    let text = arg0_text;
    let tokens = (arg1_tokens) ? arg1_tokens : {};

    //Declare local instance variables
    let all_token_keys;
    let resolved_text;

    //Guard clauses
    if (typeof text !== "string") return text;

    all_token_keys = Object.keys(tokens).sort((a, b) => b.length - a.length);
    resolved_text = text;

    for (let i = 0; i < all_token_keys.length; i++) {
      let local_key = all_token_keys[i];
      let local_val = tokens[local_key];
      if (local_val !== undefined && local_val !== null) {
        resolved_text = resolved_text.split(local_key).join(String(local_val));
      }
    }

    //Return statement
    return resolved_text;
  }


  /**
   * Recursively interpolates path tokens across strings, arrays, and objects.
   *
   * @param {*} arg0_value
   * @param {Object} arg1_tokens
   *
   * @returns {*}
   */
  static interpolateValue (arg0_value, arg1_tokens) {
    //Convert from parameters
    let value = arg0_value;
    let tokens = (arg1_tokens) ? arg1_tokens : {};

    //Guard clauses
    if (value === null || value === undefined) return value;

    if (typeof value === "string") {
      return ConfigLoader.interpolateString(value, tokens);
    } else if (Array.isArray(value)) {
      let out_array = [];
      for (let i = 0; i < value.length; i++) {
        out_array.push(ConfigLoader.interpolateValue(value[i], tokens));
      }
      return out_array;
    } else if (typeof value === "object") {
      let all_keys = Object.keys(value);
      let out_obj = {};
      for (let i = 0; i < all_keys.length; i++) {
        let local_key = all_keys[i];
        out_obj[local_key] = ConfigLoader.interpolateValue(value[local_key], tokens);
      }
      return out_obj;
    }

    //Return statement
    return value;
  }


  /**
   * Scans a configuration category directory for .json and .json5 files and parses them.
   *
   * @param {string} arg0_category_dir
   * @param {Object} arg1_tokens
   * @param {string} [arg2_svea_hint]
   *
   * @returns {Array<Object>}
   */
  static loadCategoryConfigs (arg0_category_dir, arg1_tokens, arg2_svea_hint) {
    //Convert from parameters
    let category_dir = arg0_category_dir;
    let tokens = (arg1_tokens) ? arg1_tokens : {};
    let svea_hint = arg2_svea_hint;

    //Declare local instance variables
    let all_files;
    let configs_array = [];

    //Guard clauses
    if (!category_dir || !fs.existsSync(category_dir)) return configs_array;

    all_files = fs.readdirSync(category_dir)
      .filter((f) => f.endsWith(".json5") || f.endsWith(".json"))
      .sort();

    for (let i = 0; i < all_files.length; i++) {
      let local_file = all_files[i];
      let local_path = path.join(category_dir, local_file);
      try {
        let raw_text = fs.readFileSync(local_path, "utf8");
        let parsed_obj = ConfigLoader.parseJSON5(raw_text, svea_hint);
        let interpolated_obj = ConfigLoader.interpolateValue(parsed_obj, tokens);
        interpolated_obj._source_file = local_file;
        interpolated_obj._source_path = local_path;
        configs_array.push(interpolated_obj);
      } catch (err) {
        console.error(`Failed to parse config file ${local_path}:`, err);
      }
    }

    //Return statement
    return configs_array;
  }


  /**
   * Loads common/defines/common_defines.json5 alongside common/tabulation/,
   * common/testing/, and common/visualisation/ configs, resolving all paths and tokens.
   *
   * @param {Object} [arg0_options]
   *  @param {string} [arg0_options.project_root]
   *
   * @returns {Object}
   */
  static loadDefines (arg0_options) {
    //Convert from parameters
    let options = (arg0_options) ? arg0_options : {};

    //Declare local instance variables
    let all_categories = ["tabulation", "testing", "visualisation"];
    let category_configs_obj = {
      tabulation: [],
      testing: [],
      visualisation: []
    };
    let defines_obj = {};
    let defines_path;
    let figures_array = [];
    let merged_pipelines_obj = {};
    let outputs_dir;
    let project_root = (options.project_root) ?
      path.resolve(options.project_root) :
      path.resolve(__dirname, "../..");
    let raw_text;
    let svea_dir;
    let tables_array = [];
    let test_cdt_dir;
    let test_ndt_dir;
    let tokens_obj;

    defines_path = path.join(project_root, "common/defines/common_defines.json5");
    if (fs.existsSync(defines_path)) {
      raw_text = fs.readFileSync(defines_path, "utf8");
      defines_obj = ConfigLoader.parseJSON5(raw_text);
    }

    svea_dir = (defines_obj.svea_dir) ? defines_obj.svea_dir : "D:/Project 1509 - SVEA";
    outputs_dir = path.resolve(project_root, (defines_obj.outputs_dir) ? defines_obj.outputs_dir : "outputs");
    test_cdt_dir = path.resolve(project_root, defines_obj.paths?.test_cdt_dir || "data/3.data_transform/test_cdt");
    test_ndt_dir = path.resolve(project_root, defines_obj.paths?.test_ndt_dir || "data/3.data_transform/test_ndt");

    if (!fs.existsSync(outputs_dir)) {
      fs.mkdirSync(outputs_dir, { recursive: true });
    }

    tokens_obj = {
      $H1: path.join(svea_dir, "histmap/1.data_raw/"),
      $H2: path.join(svea_dir, "histmap/2.data_cleaning/"),
      $H3: path.join(svea_dir, "histmap/3.data_transform/"),
      $H4: path.join(svea_dir, "histmap/4.data_exports/"),
      $H5: path.join(svea_dir, "histmap/5.data_visualisation/"),
      $OUTPUTS_DIR: outputs_dir,
      $PROJECT_ROOT: project_root,
      $SVEA_DIR: svea_dir,
      $TEST_CDT_DIR: defines_obj.paths?.test_cdt_dir || "data/3.data_transform/test_cdt",
      $TEST_NDT_DIR: defines_obj.paths?.test_ndt_dir || "data/3.data_transform/test_ndt"
    };

    if (defines_obj.pipelines) {
      let base_keys = Object.keys(defines_obj.pipelines);
      for (let i = 0; i < base_keys.length; i++) {
        let local_key = base_keys[i];
        merged_pipelines_obj[local_key] = ConfigLoader.interpolateValue(defines_obj.pipelines[local_key], tokens_obj);
      }
    }

    for (let i = 0; i < all_categories.length; i++) {
      let local_cat = all_categories[i];
      let rel_cat_dir = defines_obj.config_dirs?.[local_cat] || `common/${local_cat}`;
      let full_cat_dir = path.resolve(project_root, rel_cat_dir);
      let loaded_list = ConfigLoader.loadCategoryConfigs(full_cat_dir, tokens_obj, svea_dir);

      category_configs_obj[local_cat] = loaded_list;

      for (let x = 0; x < loaded_list.length; x++) {
        let local_cfg = loaded_list[x];
        if (local_cfg.pipelines) {
          let p_keys = Object.keys(local_cfg.pipelines);
          for (let y = 0; y < p_keys.length; y++) {
            let p_id = p_keys[y];
            merged_pipelines_obj[p_id] = local_cfg.pipelines[p_id];
          }
        }
        if (Array.isArray(local_cfg.figures)) {
          for (let y = 0; y < local_cfg.figures.length; y++) {
            figures_array.push(Object.assign({ suite: local_cfg.suite, suite_title: local_cfg.title }, local_cfg.figures[y]));
          }
        }
        if (Array.isArray(local_cfg.tables)) {
          for (let y = 0; y < local_cfg.tables.length; y++) {
            tables_array.push(Object.assign({ suite: local_cfg.suite, suite_title: local_cfg.title }, local_cfg.tables[y]));
          }
        }
      }
    }

    defines_obj.categories = category_configs_obj;
    defines_obj.figures = figures_array;
    defines_obj.pipelines = merged_pipelines_obj;
    defines_obj.tables = tables_array;

    //Return statement
    return {
      categories: category_configs_obj,
      defines: defines_obj,
      defines_path: defines_path,
      figures: figures_array,
      h1: tokens_obj.$H1,
      h2: tokens_obj.$H2,
      h3: tokens_obj.$H3,
      h4: tokens_obj.$H4,
      h5: tokens_obj.$H5,
      outputs_dir: outputs_dir,
      project_root: project_root,
      rscript_path: ConfigLoader.resolveRscriptPath(defines_obj.rscript_path),
      svea_dir: svea_dir,
      tables: tables_array,
      test_cdt_dir: test_cdt_dir,
      test_ndt_dir: test_ndt_dir,
      tokens: tokens_obj
    };
  }


  /**
   * Parses a JSON5 string using the json5 library if available, or a fallback parser.
   *
   * @param {string} arg0_raw_text
   * @param {string} [arg1_svea_hint]
   *
   * @returns {Object}
   */
  static parseJSON5 (arg0_raw_text, arg1_svea_hint) {
    //Convert from parameters
    let raw_text = arg0_raw_text;
    let svea_hint = (arg1_svea_hint) ? arg1_svea_hint : "D:/Project 1509 - SVEA";

    //Declare local instance variables
    let cleaned_text;
    let json5_lib = null;

    //Guard clauses
    if (!raw_text || typeof raw_text !== "string") return {};

    try {
      json5_lib = require("json5");
    } catch (e) {
      try {
        json5_lib = require(path.join(svea_hint, "node_modules/json5"));
      } catch (e2) {}
    }

    if (json5_lib) {
      return json5_lib.parse(raw_text);
    }

    cleaned_text = raw_text
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

    //Return statement
    return JSON.parse(cleaned_text);
  }


  /**
   * Resolves pngjs from either the local project or the SVEA node_modules directory.
   *
   * @param {string} [arg0_svea_dir]
   *
   * @returns {Object}
   */
  static requirePNGJS (arg0_svea_dir) {
    //Convert from parameters
    let svea_dir = (arg0_svea_dir) ? arg0_svea_dir : "D:/Project 1509 - SVEA";

    try {
      return require("pngjs");
    } catch (e) {
      return require(path.join(svea_dir, "node_modules/pngjs"));
    }
  }


  /**
   * Resolves a working Rscript binary path from common_defines.json5 or standard Windows R locations.
   *
   * @param {string} [arg0_configured_path]
   *
   * @returns {string}
   */
  static resolveRscriptPath (arg0_configured_path) {
    //Convert from parameters
    let configured_path = arg0_configured_path;

    //Declare local instance variables
    let r_base_dir = "C:/Program Files/R";

    //Guard clauses
    if (configured_path && fs.existsSync(configured_path)) return configured_path;

    if (fs.existsSync(r_base_dir)) {
      let versions = fs.readdirSync(r_base_dir).sort().reverse();
      for (let i = 0; i < versions.length; i++) {
        let candidate = path.join(r_base_dir, versions[i], "bin/Rscript.exe");
        if (fs.existsSync(candidate)) return candidate;
      }
    }

    //Return statement
    return "Rscript";
  }
}

module.exports = ConfigLoader;

