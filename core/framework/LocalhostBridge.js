let { execSync } = require("child_process");
let fs = require("fs");
let net = require("net");
let path = require("path");
let ConfigLoader = require("./ConfigLoader.js");


/**
 * Server-side Bridge API that connects Node.js pipelines, common/ JSON5 configurations,
 * and static outputs to the Vite React/HTML localhost portal on port 16000.
 */
class LocalhostBridge {
  /**
   * Creates a Vite-compatible logger that routes server events into the orchestrator log buffer
   * so stdout remains uncorrupted during terminal TUI rendering.
   *
   * @param {Object} arg0_orchestrator
   *
   * @returns {Object}
   */
  static createCustomLogger (arg0_orchestrator) {
    //Convert from parameters
    let orchestrator = arg0_orchestrator;

    //Return statement
    return {
      clearScreen: () => {},
      error: (msg) => orchestrator.appendLog(msg, "vite-err"),
      hasErrorLogged: () => false,
      hasWarned: false,
      info: (msg) => orchestrator.appendLog(msg, "vite"),
      warn: (msg) => orchestrator.appendLog(msg, "vite-warn"),
      warnOnce: (msg) => orchestrator.appendLog(msg, "vite-warn")
    };
  }


  /**
   * Creates a Vite plugin mounting the /api/* Bridge endpoints and /outputs/* static file handler.
   *
   * @param {Object} arg0_orchestrator
   *
   * @returns {Object}
   */
  static createVitePlugin (arg0_orchestrator) {
    //Convert from parameters
    let orchestrator = arg0_orchestrator;

    //Return statement
    return {
      configureServer (server) {
        server.middlewares.use((req, res, next) => {
          LocalhostBridge.handleHTTPRequest(req, res, next, orchestrator);
        });
      },
      name: "velkscala-localhost-bridge-plugin"
    };
  }


  /**
   * Frees a TCP port on Windows if an orphaned previous server instance is occupying it.
   *
   * @param {number} arg0_port
   * @param {Object} [arg1_orchestrator]
   */
  static freeOrphanedPortOnWindows (arg0_port, arg1_orchestrator) {
    //Convert from parameters
    let port = arg0_port;
    let orchestrator = arg1_orchestrator;

    //Guard clauses
    if (process.platform !== "win32") return;

    try {
      let netstat_out = execSync("netstat -ano -p tcp", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      let lines = netstat_out.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.includes(`:${port}`) && line.includes("LISTENING")) {
          let parts = line.split(/\s+/);
          let pid = Number(parts[parts.length - 1]);
          if (pid && pid > 0 && pid !== process.pid) {
            if (orchestrator && typeof orchestrator.appendLog === "function") {
              orchestrator.appendLog(`Reclaiming port ${port} from previous PID ${pid}...`, "startup");
            }
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
  }


  /**
   * Handles incoming HTTP requests for /api/state, /api/run, /api/run-stage, and /outputs/*.
   *
   * @param {Object} arg0_req
   * @param {Object} arg1_res
   * @param {Function} arg2_next
   * @param {Object} arg3_orchestrator
   */
  static handleHTTPRequest (arg0_req, arg1_res, arg2_next, arg3_orchestrator) {
    //Convert from parameters
    let req = arg0_req;
    let res = arg1_res;
    let next = arg2_next;
    let orchestrator = arg3_orchestrator;

    //Declare local instance variables
    let env_defines = ConfigLoader.loadDefines();
    let parsed_url = new URL(req.url, "http://127.0.0.1:16000");
    let pathname = parsed_url.pathname;

    if (pathname === "/api/state" && req.method === "GET") {
      let payload = orchestrator.getStatePayload();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(payload));
      return;
    }

    if (pathname === "/api/run" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        try {
          let parsed = JSON.parse(body || "{}");
          let job = orchestrator.runPipeline(parsed.pipeline_id);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ job: job, ok: true }));
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: err.message, ok: false }));
        }
      });
      return;
    }

    if (pathname === "/api/run-stage" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        try {
          let parsed = JSON.parse(body || "{}");
          let stage_jobs = orchestrator.runStage(parsed.stage_id);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ jobs: stage_jobs, ok: true }));
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: err.message, ok: false }));
        }
      });
      return;
    }

    if (pathname.startsWith("/outputs/")) {
      let rel_file = path.basename(decodeURIComponent(pathname));
      let full_file = path.join(env_defines.outputs_dir, rel_file);
      if (fs.existsSync(full_file) && fs.statSync(full_file).isFile()) {
        let ext = path.extname(full_file).toLowerCase();
        let mime = "application/octet-stream";
        if (ext === ".png") {
          mime = "image/png";
        } else if (ext === ".json") {
          mime = "application/json; charset=utf-8";
        } else if (ext === ".md") {
          mime = "text/markdown; charset=utf-8";
        }
        res.writeHead(200, {
          "Cache-Control": "no-store",
          "Content-Type": mime
        });
        fs.createReadStream(full_file).pipe(res);
        return;
      }
    }

    next();
  }


  /**
   * Checks whether a TCP port is currently occupied on the specified host.
   *
   * @param {number} arg0_port
   * @param {string} arg1_host
   *
   * @returns {Promise<boolean>}
   */
  static isPortInUse (arg0_port, arg1_host) {
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
   * Starts the Vite React/HTML localhost bridge server with automatic port reclamation.
   *
   * @param {Object} arg0_options
   *  @param {Object} arg0_options.orchestrator
   *  @param {string} [arg0_options.project_root]
   *
   * @returns {Promise<Object>}
   */
  static async startServer (arg0_options) {
    //Convert from parameters
    let options = (arg0_options) ? arg0_options : {};

    //Declare local instance variables
    let custom_logger;
    let env_defines = ConfigLoader.loadDefines({ project_root: options.project_root });
    let host = env_defines.defines.server?.host || "127.0.0.1";
    let orchestrator = options.orchestrator;
    let port = env_defines.defines.server?.port || 16000;
    let port_busy;
    let project_root = env_defines.project_root;
    let react_plugin = require("@vitejs/plugin-react");
    let vite_mod;
    let vite_server = null;
    let vite_status = "ONLINE";
    let vite_url = `http://${host}:${port}`;

    custom_logger = LocalhostBridge.createCustomLogger(orchestrator);
    port_busy = await LocalhostBridge.isPortInUse(port, host);

    if (port_busy) {
      LocalhostBridge.freeOrphanedPortOnWindows(port, orchestrator);
      await new Promise((r) => setTimeout(r, 350));
    }

    try {
      vite_mod = await import("vite");
      vite_server = await vite_mod.createServer({
        clearScreen: false,
        configFile: false,
        customLogger: custom_logger,
        plugins: [
          react_plugin(),
          LocalhostBridge.createVitePlugin(orchestrator)
        ],
        resolve: {
          alias: {
            "@opentui/core": path.resolve(project_root, "core/framework/OpenTUIWrapper.jsx"),
            "@opentui/react": path.resolve(project_root, "core/framework/OpenTUIWrapper.jsx"),
            "@velkscala/framework": path.resolve(project_root, "core/framework/index_ui.js")
          }
        },
        root: project_root,
        server: {
          host: host,
          port: port,
          strictPort: true
        }
      });
      await vite_server.listen();
      orchestrator.appendLog(`Vite OpenTUI bridge server active at ${vite_url}`, "vite");
    } catch (err) {
      vite_status = "EXTERNAL INSTANCE ON :16000";
      orchestrator.appendLog(`Vite port ${port} note: ${err.message}`, "vite");
    }

    //Return statement
    return {
      host: host,
      port: port,
      server: vite_server,
      status: vite_status,
      url: vite_url
    };
  }
}

module.exports = LocalhostBridge;

