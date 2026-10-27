let { spawn } = require("child_process");
let fs = require("fs");
let path = require("path");
let DefinesLoader = require("../framework/defines_loader.js");

/**
 * Backend orchestrator for Velkscala validation suites (CDT, NDT) and R visualisation pipelines.
 * Integrates into Vite on port 16000 and is also callable directly from the terminal TUI.
 */
class OrchestratorServer {
  static active_processes = new Map();
  static jobs = {};
  static log_lines = [];


  /**
   * Appends a timestamped log line to the shared orchestrator log buffer.
   *
   * @param {string} arg0_message
   * @param {string} [arg1_source="system"]
   */
  static appendLog (arg0_message, arg1_source) {
    //Convert from parameters
    let message = arg0_message;
    let source = (arg1_source) ? arg1_source : "system";

    //Declare local instance variables
    let clean_lines;
    let timestamp = new Date().toISOString().slice(11, 19);

    //Guard clauses
    if (!message) return;

    clean_lines = String(message)
      .replace(/\x1b\[[0-9;]*m/g, "")
      .split(/\r?\n/)
      .filter(l => l.trim().length > 0);

    for (let i = 0; i < clean_lines.length; i++) {
      OrchestratorServer.log_lines.push({
        source: source,
        text: clean_lines[i],
        time: timestamp
      });
    }

    if (OrchestratorServer.log_lines.length > 400) {
      OrchestratorServer.log_lines = OrchestratorServer.log_lines.slice(-400);
    }
  }


  /**
   * Creates a Vite plugin that mounts the /api/* endpoints and /outputs/* static file handler.
   *
   * @returns {Object}
   */
  static createVitePlugin () {
    //Return statement
    return {
      configureServer (server) {
        server.middlewares.use((req, res, next) => {
          OrchestratorServer.handleHTTPRequest(req, res, next);
        });
      },
      name: "velkscala-orchestrator-plugin"
    };
  }


  /**
   * Collects the complete state payload (defines, SVEA status, CDT/NDT tabular results, outputs).
   *
   * @returns {Object}
   */
  static getStatePayload () {
    //Declare local instance variables
    let cdt_age_sex = null;
    let cdt_births_deaths = null;
    let cdt_md = "";
    let env_defines = DefinesLoader.loadDefines();
    let ndt_md = "";
    let ndt_results = null;
    let outputs_dir = env_defines.outputs_dir;
    let outputs_files = [];

    let readJSONSafe = function (arg0_file_name, arg1_fallback_dir) {
      let p1 = path.join(outputs_dir, arg0_file_name);
      let p2 = (arg1_fallback_dir) ? path.join(arg1_fallback_dir, arg0_file_name) : null;
      try {
        if (fs.existsSync(p1)) return JSON.parse(fs.readFileSync(p1, "utf8"));
        if (p2 && fs.existsSync(p2)) return JSON.parse(fs.readFileSync(p2, "utf8"));
      } catch (e) {}
      return null;
    };

    let readTextSafe = function (arg0_file_name, arg1_fallback_dir) {
      let p1 = path.join(outputs_dir, arg0_file_name);
      let p2 = (arg1_fallback_dir) ? path.join(arg1_fallback_dir, arg0_file_name) : null;
      try {
        if (fs.existsSync(p1)) return fs.readFileSync(p1, "utf8");
        if (p2 && fs.existsSync(p2)) return fs.readFileSync(p2, "utf8");
      } catch (e) {}
      return "";
    };

    cdt_age_sex = readJSONSafe("validation_age_sex_cdt.json", env_defines.test_cdt_dir);
    cdt_births_deaths = readJSONSafe("validation_births_deaths_cdt.json", env_defines.test_cdt_dir);
    ndt_results = readJSONSafe("ndt_validation_results.json", env_defines.test_ndt_dir);
    cdt_md = readTextSafe("cdt.md", env_defines.test_cdt_dir);
    ndt_md = readTextSafe("ndt.md", env_defines.test_ndt_dir);

    if (fs.existsSync(outputs_dir)) {
      let names = fs.readdirSync(outputs_dir);
      for (let i = 0; i < names.length; i++) {
        let f_path = path.join(outputs_dir, names[i]);
        let stat = fs.statSync(f_path);
        if (stat.isFile()) {
          outputs_files.push({
            mtime: stat.mtime.toISOString(),
            name: names[i],
            size_kb: +(stat.size/1024).toFixed(1),
            url: `/outputs/${names[i]}?t=${Math.floor(stat.mtimeMs)}`
          });
        }
      }
    }

    //Return statement
    return {
      cdt_age_sex: cdt_age_sex,
      cdt_births_deaths: cdt_births_deaths,
      cdt_md: cdt_md,
      defines: env_defines.defines,
      jobs: OrchestratorServer.jobs,
      logs: OrchestratorServer.log_lines.slice(-120),
      ndt_md: ndt_md,
      ndt_results: ndt_results,
      outputs_files: outputs_files,
      rscript_path: env_defines.rscript_path,
      svea_status: {
        exists: fs.existsSync(env_defines.svea_dir),
        h1_exists: fs.existsSync(env_defines.h1),
        h2_exists: fs.existsSync(env_defines.h2),
        h3_exists: fs.existsSync(env_defines.h3),
        svea_dir: env_defines.svea_dir
      }
    };
  }


  /**
   * Handles incoming HTTP requests for /api/state, /api/run, and /outputs/*.
   *
   * @param {Object} arg0_req
   * @param {Object} arg1_res
   * @param {Function} arg2_next
   */
  static handleHTTPRequest (arg0_req, arg1_res, arg2_next) {
    //Convert from parameters
    let req = arg0_req;
    let res = arg1_res;
    let next = arg2_next;

    //Declare local instance variables
    let env_defines = DefinesLoader.loadDefines();
    let parsed_url = new URL(req.url, "http://127.0.0.1:16000");
    let pathname = parsed_url.pathname;

    if (pathname === "/api/state" && req.method === "GET") {
      let payload = OrchestratorServer.getStatePayload();
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
          let job = OrchestratorServer.runPipeline(parsed.pipeline_id);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ job: job, ok: true }));
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
   * Spawns a configured validation or R visualisation pipeline asynchronously.
   *
   * @param {string} arg0_pipeline_id
   * @param {Function} [arg1_on_complete]
   *
   * @returns {Object}
   */
  static runPipeline (arg0_pipeline_id, arg1_on_complete) {
    //Convert from parameters
    let pipeline_id = arg0_pipeline_id;
    let on_complete = arg1_on_complete;

    //Declare local instance variables
    let child_proc;
    let cmd_bin;
    let env_defines = DefinesLoader.loadDefines();
    let job_obj;
    let pipeline_cfg = env_defines.defines.pipelines?.[pipeline_id];

    //Guard clauses
    if (!pipeline_cfg) {
      console.error(`Unknown pipeline_id: ${pipeline_id}`);
      return { error: `Unknown pipeline: ${pipeline_id}`, status: "error" };
    }
    if (OrchestratorServer.jobs[pipeline_id]?.status === "running") {
      return OrchestratorServer.jobs[pipeline_id];
    }

    cmd_bin = (pipeline_cfg.command === "Rscript") ?
      env_defines.rscript_path :
      process.execPath;

    job_obj = {
      id: pipeline_id,
      name: pipeline_cfg.name,
      started_at: new Date().toISOString(),
      status: "running"
    };
    OrchestratorServer.jobs[pipeline_id] = job_obj;
    OrchestratorServer.appendLog(`Starting pipeline [${pipeline_cfg.name}]...`, pipeline_id);

    child_proc = spawn(cmd_bin, pipeline_cfg.args, {
      cwd: env_defines.project_root,
      env: Object.assign({}, process.env, { FORCE_COLOR: "0" }),
      windowsHide: true
    });

    OrchestratorServer.active_processes.set(pipeline_id, child_proc);

    child_proc.stdout.on("data", (data) => {
      OrchestratorServer.appendLog(data.toString(), pipeline_id);
    });

    child_proc.stderr.on("data", (data) => {
      OrchestratorServer.appendLog(data.toString(), pipeline_id);
    });

    child_proc.on("close", (code) => {
      OrchestratorServer.active_processes.delete(pipeline_id);
      job_obj.completed_at = new Date().toISOString();
      job_obj.exit_code = code;
      job_obj.status = (code === 0) ? "completed" : "failed";
      OrchestratorServer.appendLog(
        `Pipeline [${pipeline_cfg.name}] finished with exit code ${code}.`,
        pipeline_id
      );
      if (typeof on_complete === "function") on_complete(job_obj);
    });

    //Return statement
    return job_obj;
  }
}

module.exports = OrchestratorServer;

