let readline = require("readline");
let DefinesLoader = require("./defines_loader.js");
let OrchestratorServer = require("../server/OrchestratorServer.js");

/**
 * Terminal OpenTUI renderer and interactive keyboard controller for Node.js.
 * Renders the Velkscala orchestration dashboard directly in the console window whilst Vite serves port 16000.
 */
class OpenTUITerminal {
  constructor (arg0_options) {
    //Convert from parameters
    let options = (arg0_options) ? arg0_options : {};

    //Declare local instance variables
    let env_defines = DefinesLoader.loadDefines();

    this.active_view = 0;
    this.defines = env_defines.defines;
    this.has_tty = Boolean(process.stdin && process.stdin.isTTY);
    this.headless = Boolean(options.headless);
    this.last_frame_str = "";
    this.pipeline_keys = Object.keys(this.defines.pipelines || {});
    this.refresh_timer = null;
    this.selected_index = 0;
    this.vite_status = options.vite_status || "ONLINE";
    this.vite_url = options.vite_url || "http://127.0.0.1:16000";
  }


  /**
   * Formats a number using European decimals (e.g. 58,88) and optional semantic suffixes.
   *
   * @param {number} arg0_val
   * @param {number} [arg1_decimals=2]
   * @returns {string}
   */
  formatEuro (arg0_val, arg1_decimals) {
    //Convert from parameters
    let val = Number(arg0_val);
    let decimals = (arg1_decimals !== undefined) ? arg1_decimals : 2;

    //Guard clauses
    if (arg0_val === null || arg0_val === undefined || Number.isNaN(val)) return "N/A";

    //Return statement
    return val.toFixed(decimals).replace(".", ",");
  }


  /**
   * Renders the current OpenTUI frame into the terminal stdout without flicker.
   *
   * @param {boolean} [arg0_force=false]
   */
  renderFrame (arg0_force) {
    //Convert from parameters
    let force = Boolean(arg0_force);

    //Guard clauses
    if (this.headless) return;

    //Declare local instance variables
    let ANSI = {
      bold: "\x1b[1m",
      clearEnd: "\x1b[K",
      crimson: "\x1b[38;2;200;40;40m",
      dim: "\x1b[2m",
      green: "\x1b[32m",
      red: "\x1b[31m",
      reset: "\x1b[0m",
      white: "\x1b[37m",
      yellow: "\x1b[33m"
    };
    let cdt_clamped_str = "N/A";
    let cdt_delta_str = "N/A";
    let cdt_raw_str = "N/A";
    let frame_str = "";
    let lines = [];
    let ndt_regions_count = 0;
    let state = OrchestratorServer.getStatePayload();

    if (state.cdt_age_sex?.overall_cdt) {
      let ov = state.cdt_age_sex.overall_cdt;
      cdt_raw_str = `${this.formatEuro(ov.raw_mnl_geomean_r2*100, 2)}%`;
      cdt_clamped_str = `${this.formatEuro(ov.clamped_geomean_r2*100, 2)}%`;
      cdt_delta_str = `+${this.formatEuro(ov.delta_geomean_r2*100, 2)}%`;
    }
    if (state.ndt_results?.scorecard) {
      ndt_regions_count = Object.keys(state.ndt_results.scorecard).length;
    }

    lines.push(`${ANSI.dim}────────────────────────────────────────────────────────────────────────────────────────────────────${ANSI.reset}`);
    lines.push(
      `  ${ANSI.bold}Velkscala${ANSI.reset} ${ANSI.dim}— Demographic Transition Validation (CDT & NDT)${ANSI.reset}`
    );
    lines.push(
      `  ${ANSI.dim}Web mirror:${ANSI.reset} ${this.vite_url} [${this.vite_status}]   ${ANSI.dim}| SVEA:${ANSI.reset} ${state.svea_status.svea_dir} ${state.svea_status.exists ? "[Connected]" : "[Missing]"}`
    );
    lines.push(`${ANSI.dim}────────────────────────────────────────────────────────────────────────────────────────────────────${ANSI.reset}`);

    lines.push(
      `  CDT Geomean R²: ${cdt_clamped_str} (${ANSI.bold}${cdt_delta_str}${ANSI.reset} vs raw ${cdt_raw_str})  |  ` +
      `NDT Hearths: ${ndt_regions_count}/5  |  ` +
      `Outputs: ${state.outputs_files.length} files`
    );
    lines.push("");

    //Pipelines selector section
    lines.push(
      `  ${ANSI.bold}Pipelines${ANSI.reset} ${ANSI.dim}(↑/↓ or 1-6 to select, Enter to run, Tab to switch view, Q to quit)${ANSI.reset}`
    );

    for (let i = 0; i < this.pipeline_keys.length; i++) {
      let key = this.pipeline_keys[i];
      let p = this.defines.pipelines[key];
      let job = state.jobs[key];
      let status_str = job ? job.status.toUpperCase() : "IDLE";
      let status_col = ANSI.dim;
      if (status_str === "RUNNING") {
        status_col = ANSI.yellow;
      } else if (status_str === "COMPLETED") {
        status_col = ANSI.bold;
      } else if (status_str === "FAILED") {
        status_col = ANSI.red;
      }

      let is_sel = (i === this.selected_index);
      let cursor = is_sel ? `${ANSI.crimson}❯${ANSI.reset}` : " ";
      let p_title = p.name || p.label || key;
      let label_fmt = is_sel ? `${ANSI.bold}${p_title}${ANSI.reset}` : p_title;
      lines.push(`  ${cursor} [${i + 1}] [${status_col}${status_str.padEnd(9)}${ANSI.reset}] ${label_fmt}`);
      if (is_sel && p.description) {
        lines.push(`        ${ANSI.dim}${p.description}${ANSI.reset}`);
      }
    }

    lines.push("");

    //Tabbed data summary panel inside the terminal TUI
    let view_tabs = [
      "1: CDT Epoch R² Summary",
      "2: NDT Paleodemographic Scorecard",
      "3: Output Artefacts"
    ];
    let tab_bar = "  ";
    for (let i = 0; i < view_tabs.length; i++) {
      if (i === this.active_view) {
        tab_bar += `${ANSI.bold}[${view_tabs[i]}]${ANSI.reset}  `;
      } else {
        tab_bar += `${ANSI.dim}${view_tabs[i]}${ANSI.reset}  `;
      }
    }
    lines.push(`${tab_bar}${ANSI.dim}(Tab to cycle)${ANSI.reset}`);

    if (this.active_view === 0) {
      let epochs = state.cdt_age_sex?.summary_by_epoch || [];
      lines.push(
        `  ${ANSI.dim}${"Epoch".padEnd(8)}${"Domain".padEnd(10)}${"Countries".padEnd(12)}${"Raw Geomean R²".padEnd(18)}${"Clamped R²".padEnd(16)}${"Gain".padEnd(12)}${ANSI.reset}`
      );
      for (let i = 0; i < epochs.length; i++) {
        let ep = epochs[i];
        let raw_s = `${this.formatEuro((ep.raw_mnl?.geomean_r2 || 0)*100, 2)}%`;
        let clp_s = `${this.formatEuro((ep.clamped?.geomean_r2 || 0)*100, 2)}%`;
        let dlt_s = `+${this.formatEuro((ep.delta_geomean || 0)*100, 2)}%`;
        lines.push(
          `  ${String(ep.year).padEnd(8)}${String(ep.domain).padEnd(10)}${String(ep.num_countries).padEnd(12)}` +
          `${raw_s.padEnd(18)}${ANSI.bold}${clp_s.padEnd(16)}${ANSI.reset}${dlt_s.padEnd(12)}`
        );
      }
    } else if (this.active_view === 1) {
      let sc_entries = Object.entries(state.ndt_results?.scorecard || {});
      lines.push(
        `  ${ANSI.dim}${"Hearth".padEnd(22)}${"Neolithic Onset".padEnd(28)}${"Peak Growth".padEnd(15)}${"Pre 15P5".padEnd(12)}${"Peak 15P5".padEnd(12)}${ANSI.reset}`
      );
      for (let i = 0; i < sc_entries.length; i++) {
        let [reg_name, sc] = sc_entries[i];
        let pk_g = `+${this.formatEuro(sc.peak_early_growth_rate, 3)}%/yr`;
        let pre_ijp = `${this.formatEuro(sc.ijp_pre_mean, 1)}%`;
        let pk_ijp = `${this.formatEuro(sc.ijp_boom_peak, 1)}%`;
        lines.push(
          `  ${reg_name.padEnd(22)}${String(sc.onset_label || "").slice(0, 26).padEnd(28)}` +
          `${ANSI.bold}${pk_g.padEnd(15)}${ANSI.reset}${pre_ijp.padEnd(12)}${pk_ijp.padEnd(12)}`
        );
      }
    } else {
      let out_files = state.outputs_files || [];
      lines.push(
        `  ${ANSI.dim}${"File".padEnd(42)}${"Size".padEnd(12)}${"Last Modified".padEnd(24)}${ANSI.reset}`
      );
      for (let i = 0; i < out_files.length; i++) {
        let f = out_files[i];
        let sz = `${this.formatEuro(f.size_kb, 1)} kB`;
        let mt = f.mtime.replace("T", " ").slice(0, 19);
        lines.push(`  ${f.name.padEnd(42)}${sz.padEnd(12)}${ANSI.dim}${mt.padEnd(24)}${ANSI.reset}`);
      }
    }

    lines.push("");
    lines.push(`  ${ANSI.bold}Process Log${ANSI.reset}`);
    let recent_logs = state.logs.slice(-5);
    if (recent_logs.length === 0) {
      lines.push(`  ${ANSI.dim}Ready. Select a pipeline above or browse to ${this.vite_url}.${ANSI.reset}`);
    } else {
      for (let i = 0; i < recent_logs.length; i++) {
        let l = recent_logs[i];
        lines.push(`  ${ANSI.dim}[${l.time}]${ANSI.reset} ${String(l.text || "").slice(0, 88)}`);
      }
    }

    frame_str = "\x1b[H" + lines.map((ln) => ln + ANSI.clearEnd).join("\n") + "\x1b[J\n";
    if (force || frame_str !== this.last_frame_str) {
      this.last_frame_str = frame_str;
      process.stdout.write(frame_str);
    }
  }


  /**
   * Handles a key input action from either raw TTY keypress or line input.
   *
   * @param {string} arg0_name
   * @param {boolean} [arg1_ctrl=false]
   */
  handleKeyAction (arg0_name, arg1_ctrl) {
    //Convert from parameters
    let name = arg0_name;
    let ctrl = Boolean(arg1_ctrl);

    //Guard clauses
    if (!name) return;

    if ((ctrl && name === "c") || name === "q" || name === "Q") {
      this.stop();
      process.exit(0);
    } else if (name === "up" || name === "k") {
      this.selected_index = (this.selected_index - 1 + this.pipeline_keys.length) % this.pipeline_keys.length;
      this.renderFrame(true);
    } else if (name === "down" || name === "j") {
      this.selected_index = (this.selected_index + 1) % this.pipeline_keys.length;
      this.renderFrame(true);
    } else if (name === "tab" || name === "t" || name === "T") {
      this.active_view = (this.active_view + 1) % 3;
      this.renderFrame(true);
    } else if (name === "r" || name === "R") {
      this.renderFrame(true);
    } else if (name >= "1" && name <= "6") {
      let idx = Number(name) - 1;
      if (idx >= 0 && idx < this.pipeline_keys.length) {
        this.selected_index = idx;
        this.renderFrame(true);
      }
    } else if (name === "return" || name === "enter") {
      let selected_key = this.pipeline_keys[this.selected_index];
      if (selected_key) {
        OrchestratorServer.runPipeline(selected_key, () => this.renderFrame(true));
        this.renderFrame(true);
      }
    }
  }


  /**
   * Starts the terminal OpenTUI loop and binds keyboard navigation.
   */
  start () {
    if (this.headless) {
      console.log(`[Velkscala OpenTUI] Headless mode active. Web UI listening at ${this.vite_url}`);
      return;
    }

    //Clear screen and hide cursor for clean TUI rendering
    process.stdout.write("\x1b[2J\x1b[H\x1b[?25l");

    if (this.has_tty) {
      readline.emitKeypressEvents(process.stdin);
      try {
        process.stdin.setRawMode(true);
      } catch (e) {}
      process.stdin.resume();

      process.stdin.on("keypress", (str, key) => {
        if (!key) {
          if (str) this.handleKeyAction(str, false);
          return;
        }
        this.handleKeyAction(key.name || str, key.ctrl);
      });
    } else if (process.stdin) {
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => {
        let trimmed = String(chunk || "").trim();
        if (trimmed.length === 0) {
          this.handleKeyAction("return", false);
        } else {
          this.handleKeyAction(trimmed[0], false);
        }
      });
    }

    process.on("SIGINT", () => {
      this.stop();
      process.exit(0);
    });

    this.renderFrame(true);
    this.refresh_timer = setInterval(() => {
      this.renderFrame(false);
    }, 1000);
  }


  /**
   * Cleans up interval handles and restores terminal state.
   */
  stop () {
    if (this.refresh_timer) {
      clearInterval(this.refresh_timer);
      this.refresh_timer = null;
    }
    if (this.has_tty) {
      try {
        process.stdin.setRawMode(false);
      } catch (e) {}
    }
    process.stdout.write("\x1b[?25h\n");
  }
}

module.exports = OpenTUITerminal;
