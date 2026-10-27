import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const OpenTUIContext = createContext({
  destroy: () => {},
  focusedId: null,
  setFocusedId: () => {},
  theme: {
    accent: "#38bdf8",
    bg: "#0b0f19",
    border: "#1e293b",
    borderActive: "#38bdf8",
    fg: "#e2e8f0",
    Green: "#10b981",
    muted: "#94a3b8",
    panelBg: "#111827",
    purple: "#a855f7",
    red: "#ef4444",
    yellow: "#f59e0b"
  }
});

/**
 * Provides the root OpenTUI context and terminal surface in the browser DOM.
 */
export function OpenTUIProvider (arg0_props) {
  //Convert from parameters
  let props = arg0_props || {};

  //Declare local instance variables
  let [focusedId, setFocusedId] = useState(props.initialFocus || "main-select");
  let value = useMemo(() => ({
    destroy: () => {
      if (typeof props.onDestroy === "function") props.onDestroy();
    },
    focusedId: focusedId,
    setFocusedId: setFocusedId
  }), [focusedId, props.onDestroy]);

  //Return statement
  return (
    <OpenTUIContext.Provider value={value}>
      <div className="opentui-root-surface">
        {props.children}
      </div>
    </OpenTUIContext.Provider>
  );
}


/**
 * Hook that listens for keyboard events and dispatches OpenTUI-compatible key objects.
 *
 * @param {Function} arg0_handler
 */
export function useKeyboard (arg0_handler) {
  //Convert from parameters
  let handler = arg0_handler;

  //Declare local instance variables
  let saved_handler = useRef(handler);

  useEffect(() => {
    saved_handler.current = handler;
  }, [handler]);

  useEffect(() => {
    let onKeyDown = (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

      let key_map = {
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        Enter: "return",
        Escape: "escape",
        Tab: "tab",
        " ": "space"
      };
      let name = key_map[e.key] || e.key.toLowerCase();
      let key_obj = {
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        name: name,
        originalEvent: e,
         preventDefault: () => e.preventDefault(),
        sequence: e.key,
        shift: e.shiftKey
      };

      if (saved_handler.current) {
        saved_handler.current(key_obj);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}


/**
 * Returns the active OpenTUI renderer instance.
 *
 * @returns {Object}
 */
export function useRenderer () {
  //Return statement
  return useContext(OpenTUIContext);
}


/**
 * Returns simulated terminal dimensions in character cells based on viewport size.
 *
 * @returns {{ columns: number, rows: number }}
 */
export function useTerminalDimensions () {
  //Declare local instance variables
  let [dims, setDims] = useState({
    columns: Math.max(80, Math.floor(window.innerWidth/8.4)),
    rows: Math.max(24, Math.floor(window.innerHeight/18))
  });

  useEffect(() => {
    let onResize = () => {
      setDims({
        columns: Math.max(80, Math.floor(window.innerWidth/8.4)),
        rows: Math.max(24, Math.floor(window.innerHeight/18))
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  //Return statement
  return dims;
}


/**
 * OpenTUI <Box> Flexbox layout primitive with terminal border and title support.
 */
export function Box (arg0_props) {
  //Convert from parameters
  let props = arg0_props || {};

  //Declare local instance variables
  let border_map = {
    bold: "2px solid",
    double: "3px double",
    none: "none",
    round: "1px solid",
    single: "1px solid"
  };
  let border_style = (props.borderStyle) ? (border_map[props.borderStyle] || "1px solid") : (props.border ? "1px solid" : "none");
  let border_color = props.borderColor || "#1e293b";
  let radius = (props.borderStyle === "round") ? "6px" : "2px";
  let style_obj = Object.assign({
    alignItems: props.alignItems || "stretch",
    backgroundColor: props.backgroundColor || props.bg || "transparent",
    border: (border_style !== "none") ? `${border_style} ${border_color}` : "none",
    borderRadius: radius,
    boxSizing: "border-box",
    color: props.color || props.fg || "inherit",
    display: "flex",
    flexDirection: props.flexDirection || "column",
    flexGrow: props.flexGrow !== undefined ? props.flexGrow : undefined,
    flexShrink: props.flexShrink !== undefined ? props.flexShrink : undefined,
    flexWrap: props.flexWrap || "nowrap",
    gap: typeof props.gap === "number" ? `${props.gap*6}px` : props.gap,
    height: props.height,
    justifyContent: props.justifyContent || "flex-start",
    minHeight: props.minHeight,
    minWidth: props.minWidth,
    padding: typeof props.padding === "number" ? `${props.padding*8}px ${props.padding*10}px` : props.padding,
    position: "relative",
    width: props.width
  }, props.style || {});

  //Return statement
  return (
    <div className={`opentui-box ${props.className || ""}`} onClick={props.onClick} style={style_obj}>
      {props.title ? (
        <div className="opentui-box-title" style={{ borderColor: border_color, color: props.titleColor || "#38bdf8" }}>
          <span className="opentui-box-title-glyph">┌─</span>
          <span className="opentui-box-title-text">{props.title}</span>
          <span className="opentui-box-title-glyph">─┐</span>
        </div>
      ) : null}
      {props.children}
    </div>
  );
}


/**
 * OpenTUI <Text> typography primitive.
 */
export function Text (arg0_props) {
  //Convert from parameters
  let props = arg0_props || {};

  //Declare local instance variables
  let style_obj = Object.assign({
    backgroundColor: props.bg || props.backgroundColor || "transparent",
    color: props.fg || props.color || "inherit",
    fontStyle: props.italic ? "italic" : "normal",
    fontWeight: props.bold ? "700" : "400",
    opacity: props.dim ? 0.68 : 1,
    textDecoration: props.underline ? "underline" : "none",
    whiteSpace: props.wrap === false ? "nowrap" : "pre-wrap"
  }, props.style || {});

  //Return statement
  return (
    <span className={`opentui-text ${props.className || ""}`} onClick={props.onClick} style={style_obj}>
      {props.content !== undefined ? props.content : props.children}
    </span>
  );
}


/**
 * OpenTUI <ScrollBox> scrollable viewport container.
 */
export function ScrollBox (arg0_props) {
  //Convert from parameters
  let props = arg0_props || {};

  //Declare local instance variables
  let style_obj = Object.assign({
    flexGrow: props.flexGrow !== undefined ? props.flexGrow : 1,
    height: props.height || "100%",
    maxHeight: props.maxHeight,
    overflowX: props.scrollX ? "auto" : "hidden",
    overflowY: props.scrollY !== false ? "auto" : "hidden",
    width: props.width || "100%"
  }, props.style || {});

  //Return statement
  return (
    <Box
      backgroundColor={props.backgroundColor}
      borderColor={props.borderColor}
      borderStyle={props.borderStyle}
      className={`opentui-scrollbox ${props.className || ""}`}
      padding={props.padding}
      style={style_obj}
      title={props.title}
    >
      {props.children}
    </Box>
  );
}


/**
 * OpenTUI <Select> vertical keyboard and mouse choice widget.
 */
export function Select (arg0_props) {
  //Convert from parameters
  let props = arg0_props || {};

  //Declare local instance variables
  let options = props.options || [];
  let selected_val = props.value;

  //Return statement
  return (
    <div className="opentui-select" role="listbox">
      {options.map((opt, idx) => {
        let is_selected = (selected_val !== undefined) ? (opt.value === selected_val) : (idx === (props.selectedIndex || 0));
        return (
          <div
            className={`opentui-select-item ${is_selected ? "selected" : ""}`}
            key={opt.value || idx}
            onClick={() => {
              if (typeof props.onChange === "function") props.onChange(opt.value, opt, idx);
              if (typeof props.onSelect === "function") props.onSelect(opt.value, opt, idx);
            }}
          >
            <span className="opentui-select-cursor">{is_selected ? "❯" : " "}</span>
            <div className="opentui-select-content">
              <div className="opentui-select-label">
                <span>{opt.label}</span>
                {opt.badge ? (
                  <span className={`opentui-badge badge-${opt.badgeType || "info"}`}>{opt.badge}</span>
                ) : null}
              </div>
              {opt.description ? (
                <div className="opentui-select-desc">{opt.description}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}


/**
 * OpenTUI <TabSelect> horizontal tab bar widget.
 */
export function TabSelect (arg0_props) {
  //Convert from parameters
  let props = arg0_props || {};

  //Declare local instance variables
  let options = props.options || [];

  //Return statement
  return (
    <div className="opentui-tab-select" role="tablist">
      {options.map((opt, idx) => {
        let is_active = opt.value === props.value;
        return (
          <button
            className={`opentui-tab-btn ${is_active ? "active" : ""}`}
            key={opt.value || idx}
            onClick={() => {
              if (typeof props.onChange === "function") props.onChange(opt.value, opt, idx);
            }}
            type="button"
          >
            <span className="opentui-tab-key">[{idx + 1}]</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}


/**
 * OpenTUI <AsciiFont> header title banner component.
 */
export function AsciiFont (arg0_props) {
  //Convert from parameters
  let props = arg0_props || {};

  //Return statement
  return (
    <div className="opentui-ascii-header" style={{ color: props.color || "#38bdf8" }}>
      {props.text || props.children}
    </div>
  );
}


/**
 * Imperative @opentui/core compatibility classes for scripts using createCliRenderer().
 */
export class TextRenderable {
  constructor (arg0_renderer, arg1_options) {
    this.renderer = arg0_renderer;
    this.options = arg1_options || {};
  }
}

export class BoxRenderable {
  constructor (arg0_renderer, arg1_options) {
    this.children = [];
    this.options = arg1_options || {};
    this.renderer = arg0_renderer;
  }
  add (arg0_child) {
    this.children.push(arg0_child);
  }
}

export async function createCliRenderer (arg0_options) {
  let options = arg0_options || {};
  let root = new BoxRenderable(null, { id: "root" });
  return {
    destroy: () => {},
    options: options,
    root: root
  };
}

