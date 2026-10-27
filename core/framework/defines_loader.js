let fs = require("fs");
let path = require("path");

/**
 * Provides configuration loading and path resolution for Velkscala pipelines
 * from common/defines/common_defines.json5.
 */
class DefinesLoader {
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

    //Fallback lightweight JSON5 parser for unquoted keys, comments, and trailing commas
    let cleaned = raw_text
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

    //Return statement
    return JSON.parse(cleaned);
  }


  /**
   * Loads common/defines/common_defines.json5 and resolves project and SVEA paths.
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
    let defines_obj = {};
    let defines_path;
    let outputs_dir;
    let project_root = (options.project_root) ?
      path.resolve(options.project_root) :
      path.resolve(__dirname, "../..");
    let raw_text;
    let svea_dir;

    defines_path = path.join(project_root, "common/defines/common_defines.json5");
    if (fs.existsSync(defines_path)) {
      raw_text = fs.readFileSync(defines_path, "utf8");
      defines_obj = DefinesLoader.parseJSON5(raw_text);
    }

    svea_dir = (defines_obj.svea_dir) ? defines_obj.svea_dir : "D:/Project 1509 - SVEA";
    outputs_dir = path.resolve(project_root, (defines_obj.outputs_dir) ? defines_obj.outputs_dir : "outputs");

    if (!fs.existsSync(outputs_dir)) {
      fs.mkdirSync(outputs_dir, { recursive: true });
    }

    //Return statement
    return {
      defines: defines_obj,
      defines_path: defines_path,
      h1: path.join(svea_dir, "histmap/1.data_raw/"),
      h2: path.join(svea_dir, "histmap/2.data_cleaning/"),
      h3: path.join(svea_dir, "histmap/3.data_transform/"),
      h4: path.join(svea_dir, "histmap/4.data_exports/"),
      h5: path.join(svea_dir, "histmap/5.data_visualisation/"),
      outputs_dir: outputs_dir,
      project_root: project_root,
      rscript_path: DefinesLoader.resolveRscriptPath(defines_obj.rscript_path),
      svea_dir: svea_dir,
      test_cdt_dir: path.resolve(project_root, defines_obj.paths?.test_cdt_dir || "data/3.data_transform/test_cdt"),
      test_ndt_dir: path.resolve(project_root, defines_obj.paths?.test_ndt_dir || "data/3.data_transform/test_ndt")
    };
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

module.exports = DefinesLoader;

