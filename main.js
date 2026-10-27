//Suppress Vite CJS Node API notice so stdout remains clean for the local TUI
process.env.VITE_CJS_IGNORE_WARNING = "true";

//Import framework library and backend orchestrator
let { ConfigLoader, LocalhostBridge, OpenTUITerminal } = require("./core/framework/index.js");
let OrchestratorServer = require("./core/server/OrchestratorServer.js");


/**
 * Starts both the Vite Dev Server on port 16000 via LocalhostBridge and the local OpenTUI terminal interface.
 */
async function startVelkscalaOrchestrator () {
  //Declare local instance variables
  let args = process.argv.slice(2);
  let bridge_info;
  let env_defines = ConfigLoader.loadDefines();
  let is_headless = args.includes("--headless") || args.includes("--no-tui");
  let tui_terminal;

  OrchestratorServer.appendLog(
    `Initialising Velkscala OpenTUI Orchestrator (SVEA: ${env_defines.svea_dir})`,
    "startup"
  );

  bridge_info = await LocalhostBridge.startServer({
    orchestrator: OrchestratorServer,
    project_root: __dirname
  });

  tui_terminal = new OpenTUITerminal({
    headless: is_headless,
    vite_status: bridge_info.status,
    vite_url: bridge_info.url
  });
  tui_terminal.start();
}

process.on("uncaughtException", (err) => {
  OrchestratorServer.appendLog(`Uncaught error: ${err.message}`, "error");
});

startVelkscalaOrchestrator();
