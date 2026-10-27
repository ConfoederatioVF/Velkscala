let ConfigLoader = require("./ConfigLoader.js");


/**
 * Backwards-compatible DefinesLoader facade delegating to ConfigLoader.
 */
let DefinesLoader = {
  interpolateString: ConfigLoader.interpolateString,
  interpolateValue: ConfigLoader.interpolateValue,
  loadCategoryConfigs: ConfigLoader.loadCategoryConfigs,
  loadDefines: ConfigLoader.loadDefines,
  parseJSON5: ConfigLoader.parseJSON5,
  requirePNGJS: ConfigLoader.requirePNGJS,
  resolveRscriptPath: ConfigLoader.resolveRscriptPath
};

module.exports = DefinesLoader;
