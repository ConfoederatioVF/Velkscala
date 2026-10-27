let readline = require("readline");
let DefinesLoader = require("./defines_loader.js");
let OrchestratorServer = require("../server/OrchestratorServer.js");

/**
 * Terminal OpenTUI renderer and interactive keyboard controller for Node.js.
 * Renders the Velkscala orchestration dashboard in the console whilst Vite serves port 16000.
 */
class OpenTUITerminal {
  constructor (arg0_options) {
    //Convert from parameters
    let options = (arg0_options) ? arg0_options : {};

    //Declare local instance variables
    let env_defines = DefinesLoader.loadDefines();

    this.active_tab = 0;
    this.defines = env_defines.defines;
    this.is_interactive = Boolean(process.stdin.isTTY && !options.headless);
    this.pipeline_keys = Object.keys(this.defines.pipelines || {});
    this.refresh_timer = null;
    this.selected_index = 0;
    this.vite_url = options.vite_url || "http://127.0.0.1:16000";
  }


  /**
   * Renders the current OpenTUI frame into the terminal stdout.
   */
  renderFrame () {
    //Guard clauses
    if (!this.is_interactive) return;

    //Declare local instance variables
    let ANSI = {
      bgBlue: "\x1b[44m",
      bold: "\x1b[1m",
      cyan: "\x1b[36m",
      dim: "\x1b[2m",
      green: "\x1b[32m",
      magenta: "\x1b[35m",
      red: "\x1b[31m",
      reset: "\x1b[0m",
      white: "\x1b[37m",
      yellow: "\x1b[33m"
    };
    let cdt_clamped_str = "N/A";
    let cdt_raw_str = "N/A";
    let lines = [];
    let ndt_regions_count = 0;
    let state = OrchestratorServer.getStatePayload();

    if (state.cdt_age_sex?.overall_cdt) {
      cdt_raw_str = `${(state.cdt_age_sex.overall_cdt.raw_mnl_geomean_r2*100).toFixed(2)}%`.replace(".", ",");
      cdt_clamped_str = `${(state.cdt_age_sex.overall_cdt.clamped_geomean_r2*100).toFixed(2)}%`.replace(".", ",");
    }
    if (state.ndt_results?.scorecard) {
      ndt_regions_count = Object.keys(state.ndt_results.scorecard).length;
    }

    lines.push("\x1b[2J\x1b[H");
    lines.push(`${ANSI.cyan}┌──────────────────────────────────────────────────────────────────────────────────────────────┐${ANSI.reset}`);
    lines.push(`${ANSI.cyan}│${ANSI.reset} ${ANSI.bold}${ANSI.magenta}VELKSCALA 1.0 - OPENTUI DEMOGRAPHIC VALIDATION & R VISUALISATION ORCHESTRATOR${ANSI.reset}                ${ANSI.cyan}│${ANSI.reset}`);
    lines.push(`${ANSI.cyan}│${ANSI.reset} ${ANSI.dim}Web Mirror (Vite + OpenTUI):${ANSI.reset} ${ANSI.bold}${ANSI.green}${this.vite_url}${ANSI.reset}  ${ANSI.dim}| SVEA:${ANSI.reset} ${state.svea_status.svea_dir} ${ANSI.cyan}│${ANSI.reset}`);
    lines.push(`${ANSI.cyan}└──────────────────────────────────────────────────────────────────────────────────────────────┘${ANSI.reset}`);

    lines.push(
      `  ${ANSI.bold}CDT Geomean R²:${ANSI.reset} Raw MNL ${ANSI.yellow}${cdt_raw_str}${ANSI.reset} → Clamped ${ANSI.green}${cdt_clamped_str}${ANSI.reset}   |   ` +
      `${ANSI.bold}NDT Origins Audited:${ANSI.reset} ${ANSI.cyan}${ndt_regions_count}/5${ANSI.reset}   |   ` +
      `${ANSI.bold}Outputs:${ANSI.reset} ${ANSI.magenta}${state.outputs_files.length} files in /outputs${ANSI.reset}`
    );
    lines.push("");
    lines.push(`${ANSI.bold}  PIPELINES & R RENDER TASKS (Use ↑/↓ to select, ENTER to execute, Q to quit):${ANSI.reset}`);
    lines.push("  ──────────────────────────────────────────────────────────────────────────────────────────────");

    for (let i = 0; i < this.pipeline_keys.length; i++) {
      let key = this.pipeline_keys[i];
      let p = this.defines.pipelines[key];
      let job = state.jobs[key];
      let status_str = job ? job.status.toUpperCase() : "IDLE";
      let status_col = ANSI.dim;
      if (status_str === "RUNNING") {
        status_col = ANSI.yellow;
      } else if (status_str === "COMPLETED") {
        status_col = ANSI.green;
      } else if (status_str === "FAILED") {
        status_col = ANSI.red;
      }

      let cursor = (i === this.selected_index) ? `${ANSI.cyan}❯${ANSI.reset}` : " ";
      let label_fmt = (i === this.selected_index) ? `${ANSI.bold}${ANSI.white}${p.name}${ANSI.reset}` : p.name;
      lines.push(`  ${cursor} [${status_col}${status_str.padEnd(9)}${ANSI.reset}] ${label_fmt}`);
      if (i === this.selected_index) {
        lines.push(`      ${ANSI.dim}${p.description}${ANSI.reset}`);
      }
    }

    lines.push("");
    lines.push(`${ANSI.bold}  RECENT ORCHESTRATOR LOGS:${ANSI.reset}`);
    lines.push("  ──────────────────────────────────────────────────────────────────────────────────────────────");
    let recent_logs = state.logs.slice(-8);
    if (recent_logs.length === 0) {
      lines.push(`  ${ANSI.dim}Ready. Select a pipeline above or open ${this.vite_url} in your browser.${ANSI.reset}`);
    } else {
      for (let i = 0; i < recent_logs.length; i++) {
        let l = recent_logs[i];
        lines.push(`  ${ANSI.dim}[${l.time}]${ANSI.reset} ${ANSI.cyan}[${l.source}]${ANSI.reset} ${l.text.slice(0, 88)}`);
      }
    }

    process.stdout.write(lines.join("\n") + "\n");
  }


  /**
   * Starts the terminal OpenTUI loop and binds keyboard navigation if running in a TTY.
   */
  start () {
    if (!this.is_interactive) {
      console.log(`[Velkscala OpenTUI] Running in non-TTY mode. Web UI active at ${this.vite_url}`);
      return;
    }

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdin.on("keypress", (str, key) => {
      if (!key) return;
      if ((key.ctrl && key.name === "c") || key.name === "q") {
        this.stop();
        process.exit(0);
      } else if (key.name === "up" || key.name === "k") {
        this.selected_index = (this.selected_index - 1 + this.pipeline_keys.length) % this.pipeline_keys.length;
        this.renderFrame();
      } else if (key.name === "down" || key.name === "j") {
        this.selected_index = (this.selected_index + 1) % this.pipeline_keys.length;
        this.renderFrame();
      } else if (key.name === "return") {
        let selected_key = this.pipeline_keys[this.selected_index];
        if (selected_key) {
          OrchestratorServer.runPipeline(selected_key, () => this.renderFrame());
          this.renderFrame();
        }
      }
    });

    this.renderFrame();
    this.refresh_timer = setInterval(() => {
      this.renderFrame();
    }, 1500);
  }


  /**
   * Cleans up interval handles and restores terminal state.
   */
  stop () {
    if (this.refresh_timer) {
      clearInterval(this.refresh_timer);
      this.refresh_timer = null;
    }
    if (this.is_interactive && process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  }
}

module.exports = OpenTUITerminal;

