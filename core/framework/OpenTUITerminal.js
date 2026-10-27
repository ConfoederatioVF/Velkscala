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
    this.in_alternate_buffer = false;
    this.pipeline_keys = Object.keys(this.defines.pipelines || {});
    this.refresh_timer = null;
    this.selected_index = 0;
    this.sort_asc = false;
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
   * Renders the current OpenTUI frame cleanly into the terminal stdout without flicker or scroll ghosting.
   */
  renderFrame () {
    //Guard clauses
    if (this.headless) return;

    //Declare local instance variables
    let ANSI = {
      blue: "\x1b[34m",
      bold: "\x1b[1m",
      clearEnd: "\x1b[K",
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
    let cdt_delta_str = "N/A";
    let cdt_raw_str = "N/A";
    let frame_str = "";
    let lines = [];
    let max_lines = (process.stdout.rows && process.stdout.rows > 10) ? process.stdout.rows - 1 : 24;
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

    lines.push(`${ANSI.cyan}────────────────────────────────────────────────────────────────────────────────────────────────────${ANSI.reset}`);
    lines.push(
      `  ${ANSI.bold}${ANSI.white}Velkscala${ANSI.reset} ${ANSI.dim}— Demographic Transition Validation (CDT & NDT)${ANSI.reset}`
    );
    lines.push(
      `  ${ANSI.dim}Web mirror:${ANSI.reset} ${ANSI.green}${this.vite_url}${ANSI.reset} [${this.vite_status}]   ${ANSI.dim}| SVEA:${ANSI.reset} ${state.svea_status.svea_dir} ${state.svea_status.exists ? `${ANSI.green}[Connected]${ANSI.reset}` : `${ANSI.red}[Missing]${ANSI.reset}`}`
    );
    lines.push(`${ANSI.cyan}────────────────────────────────────────────────────────────────────────────────────────────────────${ANSI.reset}`);

    lines.push(
      `  CDT Geomean R²: ${ANSI.green}${cdt_clamped_str}${ANSI.reset} (${ANSI.cyan}${cdt_delta_str}${ANSI.reset} vs raw ${cdt_raw_str})  |  ` +
      `NDT Checks: ${ANSI.cyan}${ndt_regions_count}/5${ANSI.reset}  |  ` +
      `Outputs: ${ANSI.magenta}${state.outputs_files.length} files${ANSI.reset}`
    );
    lines.push("");

    //Pipelines selector section
    lines.push(
      `  ${ANSI.bold}Pipelines${ANSI.reset} ${ANSI.dim}(↑/↓ or 1-6 select, Enter run, Tab view, S sort, Q quit)${ANSI.reset}`
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
        status_col = ANSI.green;
      } else if (status_str === "FAILED") {
        status_col = ANSI.red;
      }

      let is_sel = (i === this.selected_index);
      let cursor = is_sel ? `${ANSI.white}❯${ANSI.reset}` : " ";
      let p_title = p.name || p.label || key;
      let label_fmt = is_sel ? `${ANSI.bold}${ANSI.white}${p_title}${ANSI.reset}` : p_title;
      lines.push(`  ${cursor} [${i + 1}] [${status_col}${status_str.padEnd(9)}${ANSI.reset}] ${label_fmt}`);
      if (is_sel && p.description) {
        lines.push(`        ${ANSI.dim}${p.description}${ANSI.reset}`);
      }
    }

    lines.push("");

    //Tabbed data summary panel inside the terminal TUI
    let sort_dir_str = this.sort_asc ? "▲ asc" : "▼ desc";
    let view_tabs = [
      "1: CDT Epoch R² Summary",
      "2: NDT Paleodemographic Scorecard",
      "3: Output Artefacts"
    ];
    let tab_bar = "  ";
    for (let i = 0; i < view_tabs.length; i++) {
      if (i === this.active_view) {
        tab_bar += `${ANSI.bold}${ANSI.cyan}[${view_tabs[i]}]${ANSI.reset}  `;
      } else {
        tab_bar += `${ANSI.dim}${view_tabs[i]}${ANSI.reset}  `;
      }
    }
    lines.push(`${tab_bar}${ANSI.dim}(Tab cycle | S sort: ${sort_dir_str})${ANSI.reset}`);

    //Notice: Outside the first column, cells are NOT bolded per user instructions
    if (this.active_view === 0) {
      let epochs = (state.cdt_age_sex?.summary_by_epoch || []).slice();
      epochs.sort((a, b) => {
        let diff = (a.clamped?.geomean_r2 || 0) - (b.clamped?.geomean_r2 || 0);
        return this.sort_asc ? diff : -diff;
      });

      lines.push(
        `  ${ANSI.dim}${"Epoch".padEnd(8)}${"Domain".padEnd(10)}${"Countries".padEnd(12)}${"Raw Geomean R²".padEnd(18)}${"Clamped R²".padEnd(16)}${"Gain".padEnd(12)}${ANSI.reset}`
      );
      for (let i = 0; i < epochs.length && lines.length < max_lines - 4; i++) {
        let ep = epochs[i];
        let raw_s = `${this.formatEuro((ep.raw_mnl?.geomean_r2 || 0)*100, 2)}%`;
        let clp_s = `${this.formatEuro((ep.clamped?.geomean_r2 || 0)*100, 2)}%`;
        let dlt_s = `+${this.formatEuro((ep.delta_geomean || 0)*100, 2)}%`;
        lines.push(
          `  ${ANSI.bold}${String(ep.year).padEnd(8)}${ANSI.reset}${String(ep.domain).padEnd(10)}${String(ep.num_countries).padEnd(12)}` +
          `${raw_s.padEnd(18)}${clp_s.padEnd(16)}${dlt_s.padEnd(12)}`
        );
      }
    } else if (this.active_view === 1) {
      let sc_entries = Object.entries(state.ndt_results?.scorecard || {});
      sc_entries.sort((a, b) => {
        let diff = (a[1].peak_early_growth_rate || 0) - (b[1].peak_early_growth_rate || 0);
        return this.sort_asc ? diff : -diff;
      });

      lines.push(
        `  ${ANSI.dim}${"Hearth".padEnd(22)}${"Neolithic Onset".padEnd(28)}${"Peak Growth".padEnd(15)}${"Pre 15P5".padEnd(12)}${"Peak 15P5".padEnd(12)}${ANSI.reset}`
      );
      for (let i = 0; i < sc_entries.length && lines.length < max_lines - 4; i++) {
        let [reg_name, sc] = sc_entries[i];
        let pk_g = `+${this.formatEuro(sc.peak_early_growth_rate, 3)}%/yr`;
        let pre_ijp = `${this.formatEuro(sc.ijp_pre_mean, 1)}%`;
        let pk_ijp = `${this.formatEuro(sc.ijp_boom_peak, 1)}%`;
        lines.push(
          `  ${ANSI.bold}${reg_name.padEnd(22)}${ANSI.reset}${String(sc.onset_label || "").slice(0, 26).padEnd(28)}` +
          `${pk_g.padEnd(15)}${pre_ijp.padEnd(12)}${pk_ijp.padEnd(12)}`
        );
      }
    } else {
      let out_files = (state.outputs_files || []).slice();
      out_files.sort((a, b) => {
        let diff = (a.size_kb || 0) - (b.size_kb || 0);
        return this.sort_asc ? diff : -diff;
      });

      lines.push(
        `  ${ANSI.dim}${"File".padEnd(42)}${"Size".padEnd(12)}${"Last Modified".padEnd(24)}${ANSI.reset}`
      );
      for (let i = 0; i < out_files.length && lines.length < max_lines - 4; i++) {
        let f = out_files[i];
        let sz = `${this.formatEuro(f.size_kb, 1)} kB`;
        let mt = f.mtime.replace("T", " ").slice(0, 19);
        lines.push(`  ${ANSI.bold}${f.name.padEnd(42)}${ANSI.reset}${sz.padEnd(12)}${ANSI.dim}${mt.padEnd(24)}${ANSI.reset}`);
      }
    }

    if (lines.length < max_lines - 2) {
      lines.push("");
      lines.push(`  ${ANSI.bold}Process Log${ANSI.reset}`);
      let log_budget = Math.max(1, max_lines - lines.length);
      let recent_logs = state.logs.slice(-log_budget);
      if (recent_logs.length === 0) {
        lines.push(`  ${ANSI.dim}Ready. Select a pipeline above or browse to ${this.vite_url}.${ANSI.reset}`);
      } else {
        for (let i = 0; i < recent_logs.length && lines.length < max_lines; i++) {
          let l = recent_logs[i];
          lines.push(`  ${ANSI.dim}[${l.time}]${ANSI.reset} ${String(l.text || "").slice(0, 88)}`);
        }
      }
    }

    //Clamp strictly to max_lines to prevent any terminal scrolling
    if (lines.length > max_lines) lines = lines.slice(0, max_lines);

    //Draw to screen using cursor home and erase to end of line without trailing scroll
    frame_str = "\x1b[H" + lines.map((ln) => ln + ANSI.clearEnd).join("\n") + "\x1b[J";
    process.stdout.write(frame_str);
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
      this.renderFrame();
    } else if (name === "down" || name === "j") {
      this.selected_index = (this.selected_index + 1) % this.pipeline_keys.length;
      this.renderFrame();
    } else if (name === "tab" || name === "t" || name === "T") {
      this.active_view = (this.active_view + 1) % 3;
      this.renderFrame();
    } else if (name === "s" || name === "S") {
      this.sort_asc = !this.sort_asc;
      this.renderFrame();
    } else if (name === "r" || name === "R") {
      this.renderFrame();
    } else if (name >= "1" && name <= "6") {
      let idx = Number(name) - 1;
      if (idx >= 0 && idx < this.pipeline_keys.length) {
        this.selected_index = idx;
        this.renderFrame();
      }
    } else if (name === "return" || name === "enter") {
      let selected_key = this.pipeline_keys[this.selected_index];
      if (selected_key) {
        OrchestratorServer.runPipeline(selected_key, () => this.renderFrame());
        this.renderFrame();
      }
    }
  }


  /**
   * Starts the terminal OpenTUI loop in Alternate Screen Buffer and binds keyboard navigation.
   */
  start () {
    if (this.headless) {
      console.log(`[Velkscala OpenTUI] Headless mode active. Web UI listening at ${this.vite_url}`);
      return;
    }

    //Enter Alternate Screen Buffer to eliminate scrollback ghosting & hide cursor
    process.stdout.write("\x1b[?1049h\x1b[2J\x1b[H\x1b[?25l");
    this.in_alternate_buffer = true;

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

    //Handle window resize cleanly
    if (process.stdout.on) {
      process.stdout.on("resize", () => {
        process.stdout.write("\x1b[2J\x1b[H");
        this.renderFrame();
      });
    }

    process.on("SIGINT", () => {
      this.stop();
      process.exit(0);
    });

    this.renderFrame();
    this.refresh_timer = setInterval(() => {
      this.renderFrame();
    }, 1000);
  }


  /**
   * Restores terminal state and exits the Alternate Screen Buffer cleanly.
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

    if (this.in_alternate_buffer) {
      //Exit Alternate Screen Buffer and restore cursor
      process.stdout.write("\x1b[?1049l\x1b[?25h\n");
      this.in_alternate_buffer = false;
    } else {
      process.stdout.write("\x1b[?25h\n");
    }
  }
}

module.exports = OpenTUITerminal;
