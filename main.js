//Suppress Vite CJS Node API notice so stdout remains clean for the local TUI
process.env.VITE_CJS_IGNORE_WARNING = "true";

//Import libraries and framework modules
let { execSync } = require("child_process");
let net = require("net");
let path = require("path");
let react = require("@vitejs/plugin-react");
let DefinesLoader = require("./core/framework/defines_loader.js");
let OpenTUITerminal = require("./core/framework/OpenTUITerminal.js");
let OrchestratorServer = require("./core/server/OrchestratorServer.js");


/**
 * Checks whether a TCP port is currently occupied on the specified host.
 *
 * @param {number} arg0_port
 * @param {string} arg1_host
 * @returns {Promise<boolean>}
 */
function isPortInUse (arg0_port, arg1_host) {
  //Convert from parameters
  let port = arg0_port;
  let host = arg1_host;

  //Return statement
  return new Promise((resolve) => {
    let tester = net.createServer()
      .once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once("listening", () => {
        tester.once("close", () => resolve(false)).close();
      })
      .listen(port, host);
  });
}


/**
 * Frees a TCP port on Windows if an orphaned previous server instance is occupying it.
 *
 * @param {number} arg0_port
 */
function freeOrphanedPortOnWindows (arg0_port) {
  //Convert from parameters
  let port = arg0_port;

  //Guard clauses
  if (process.platform !== "win32") return;

  try {
    let netstat_out = execSync(`netstat -ano -p tcp`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    let lines = netstat_out.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (line.includes(`:${port}`) && line.includes("LISTENING")) {
        let parts = line.split(/\s+/);
        let pid = Number(parts[parts.length - 1]);
        if (pid && pid > 0 && pid !== process.pid) {
          OrchestratorServer.appendLog(`Reclaiming port ${port} from previous PID ${pid}...`, "startup");
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}


/**
 * Starts both the Vite Dev Server on port 16000 and the local OpenTUI terminal interface in the current window.
 */
async function startVelkscalaOrchestrator () {
  //Declare local instance variables
  let args = process.argv.slice(2);
  let custom_logger;
  let env_defines = DefinesLoader.loadDefines();
  let host = env_defines.defines.server?.host || "127.0.0.1";
  let is_headless = args.includes("--headless") || args.includes("--no-tui");
  let port = env_defines.defines.server?.port || 16000;
  let port_busy;
  let tui_terminal;
  let vite_mod;
  let vite_server;
  let vite_status = "ONLINE";
  let vite_url = `http://${host}:${port}`;

  OrchestratorServer.appendLog(
    `Initialising Velkscala OpenTUI Orchestrator (SVEA: ${env_defines.svea_dir})`,
    "startup"
  );

  //Create a custom Vite logger that routes Vite output into the TUI log stream instead of corrupting stdout
  custom_logger = {
    clearScreen: () => {},
    error: (msg) => OrchestratorServer.appendLog(msg, "vite-err"),
    hasErrorLogged: () => false,
    hasWarned: false,
    info: (msg) => OrchestratorServer.appendLog(msg, "vite"),
    warn: (msg) => OrchestratorServer.appendLog(msg, "vite-warn"),
    warnOnce: (msg) => OrchestratorServer.appendLog(msg, "vite-warn")
  };

  port_busy = await isPortInUse(port, host);
  if (port_busy) {
    freeOrphanedPortOnWindows(port);
    await new Promise((r) => setTimeout(r, 350));
  }

  try {
    vite_mod = await import("vite");
    vite_server = await vite_mod.createServer({
      clearScreen: false,
      configFile: false,
      customLogger: custom_logger,
      plugins: [
        react(),
        OrchestratorServer.createVitePlugin()
      ],
      resolve: {
        alias: {
          "@opentui/core": path.resolve(__dirname, "core/framework/OpenTUIWrapper.jsx"),
          "@opentui/react": path.resolve(__dirname, "core/framework/OpenTUIWrapper.jsx")
        }
      },
      root: __dirname,
      server: {
        host: host,
        port: port,
        strictPort: true
      }
    });
    await vite_server.listen();
    OrchestratorServer.appendLog(`Vite OpenTUI dev server active at ${vite_url}`, "vite");
  } catch (err) {
    vite_status = "EXTERNAL INSTANCE ON :16000";
    OrchestratorServer.appendLog(`Vite port ${port} note: ${err.message}`, "vite");
  }

  tui_terminal = new OpenTUITerminal({
    headless: is_headless,
    vite_status: vite_status,
    vite_url: vite_url
  });
  tui_terminal.start();
}

process.on("uncaughtException", (err) => {
  OrchestratorServer.appendLog(`Uncaught error: ${err.message}`, "error");
});

startVelkscalaOrchestrator();
