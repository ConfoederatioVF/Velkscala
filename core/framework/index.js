let ConfigLoader = require("./ConfigLoader.js");
let DefinesLoader = require("./defines_loader.js");
let LocalhostBridge = require("./LocalhostBridge.js");
let OpenTUITerminal = require("./OpenTUITerminal.js");


/**
 * Node.js / CommonJS barrel entry point for the Velkscala core/framework library.
 */
module.exports = {
  ConfigLoader: ConfigLoader,
  DefinesLoader: DefinesLoader,
  LocalhostBridge: LocalhostBridge,
  OpenTUITerminal: OpenTUITerminal
};

