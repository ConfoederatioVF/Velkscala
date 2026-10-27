//Suppress Vite CJS Node API notice
process.env.VITE_CJS_IGNORE_WARNING = "true";

//Import framework library and backend orchestrator
let { ConfigLoader, LocalhostBridge } = require("./core/framework/index.js");
let OrchestratorServer = require("./core/server/OrchestratorServer.js");


/**
 * Starts the Velkscala React web application server on port 16000 via LocalhostBridge.
 */
async function startVelkscalaOrchestrator () {
  //Declare local instance variables
  let bridge_info;
  let env_defines = ConfigLoader.loadDefines();

  OrchestratorServer.appendLog(
    `Initialising Velkscala Web Orchestrator (SVEA: ${env_defines.svea_dir})`,
    "startup"
  );

  bridge_info = await LocalhostBridge.startServer({
    orchestrator: OrchestratorServer,
    project_root: __dirname
  });

  console.log(`[Velkscala] Web application listening at ${bridge_info.url} (${bridge_info.status})`);
}

process.on("uncaughtException", (err) => {
  OrchestratorServer.appendLog(`Uncaught error: ${err.message}`, "error");
});

startVelkscalaOrchestrator();
