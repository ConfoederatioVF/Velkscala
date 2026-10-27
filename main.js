//Import libraries and framework modules
let path = require("path");
let DefinesLoader = require("./core/framework/defines_loader.js");
let OpenTUITerminal = require("./core/framework/OpenTUITerminal.js");
let OrchestratorServer = require("./core/server/OrchestratorServer.js");


/**
 * Starts the Velkscala OpenTUI Orchestrator & Vite Web Mirror on port 16000.
 */
async function startVelkscalaOrchestrator () {
  //Declare local instance variables
  let args = process.argv.slice(2);
  let env_defines = DefinesLoader.loadDefines();
  let host = env_defines.defines.server?.host || "127.0.0.1";
  let is_headless = args.includes("--headless") || args.includes("--no-tui");
  let port = env_defines.defines.server?.port || 16000;
  let tui_terminal;
  let vite_mod;
  let vite_server;
  let vite_url = `http://${host}:${port}`;

  OrchestratorServer.appendLog(
    `Initialising Velkscala OpenTUI Orchestrator (SVEA: ${env_defines.svea_dir})`,
    "startup"
  );

  try {
    vite_mod = await import("vite");
    vite_server = await vite_mod.createServer({
      configFile: path.join(__dirname, "vite.config.js"),
      root: __dirname,
      server: {
        host: host,
        port: port,
        strictPort: true
      }
    });
    await vite_server.listen();
    OrchestratorServer.appendLog(`Vite OpenTUI server listening at ${vite_url}`, "vite");
  } catch (err) {
    console.error("Failed to start Vite server on port 16000:", err.message);
    process.exit(1);
  }

  tui_terminal = new OpenTUITerminal({
    headless: is_headless,
    vite_url: vite_url
  });
  tui_terminal.start();
}

startVelkscalaOrchestrator();

