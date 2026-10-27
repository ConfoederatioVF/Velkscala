//Import libraries and React hooks
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

let OpenTUIContext = createContext({
  destroy: () => {},
  focusedId: null,
  setFocusedId: () => {},
  theme: {
    accent: "#c82828",
    bg: "#111113",
    border: "rgba(255, 255, 255, 0.12)",
    borderActive: "#ffffff",
    fg: "#ffffff",
    Green: "#10b981",
    muted: "rgba(255, 255, 255, 0.65)",
    panelBg: "#18181b",
    purple: "#a855f7",
    red: "#f03c3c",
    yellow: "#f59e0b"
  }
});


/**
 * OpenTUI <AsciiFont> header title banner component.
 *
 * @param {Object} arg0_props
 *
 * @returns {React.ReactElement}
 */
export function AsciiFont (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Return statement
  return (
    <div className="opentui-ascii-header" style={{ color: props.color || "#ffffff" }}>
      {props.text || props.children}
    </div>
  );
}


/**
 * OpenTUI <Box> Flexbox layout primitive with terminal border and title support.
 *
 * @param {Object} arg0_props
 *
 * @returns {React.ReactElement}
 */
export function Box (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Declare local instance variables
  let border_color = props.borderColor || "rgba(255, 255, 255, 0.12)";
  let border_map = {
    bold: "2px solid",
    double: "3px double",
    none: "none",
    round: "1px solid",
    single: "1px solid"
  };
  let border_style = (props.borderStyle) ? (border_map[props.borderStyle] || "1px solid") : (props.border ? "1px solid" : "none");
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
        <div className="opentui-box-title" style={{ borderColor: border_color, color: props.titleColor || "#ffffff" }}>
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
 * Interactive draggable flex partition container (horizontal or vertical split).
 * Double-clicking the sash resets the partition to its initial ratio.
 *
 * @param {Object} arg0_props
 *  @param {Array<React.ReactNode>} arg0_props.children
 *  @param {string} [arg0_props.className]
 *  @param {string} [arg0_props.direction="horizontal"]
 *  @param {number} [arg0_props.initialRatio=0.5]
 *  @param {number} [arg0_props.maxFirstPct=85]
 *  @param {number} [arg0_props.minFirstPct=15]
 *  @param {Object} [arg0_props.style]
 *
 * @returns {React.ReactElement}
 */
export function FlexPartition (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Declare local instance variables
  let children_arr = React.Children.toArray(props.children);
  let container_ref = useRef(null);
  let direction = props.direction || "horizontal";
  let initial_pct = (props.initialRatio !== undefined) ? props.initialRatio*100 : 50;
  let [is_dragging, setIsDragging] = useState(false);
  let is_horizontal = (direction === "horizontal");
  let max_pct = (props.maxFirstPct !== undefined) ? props.maxFirstPct : 85;
  let min_pct = (props.minFirstPct !== undefined) ? props.minFirstPct : 15;
  let [split_pct, setSplitPct] = useState(initial_pct);

  useEffect(() => {
    if (!is_dragging) return;

    let onMouseMove = (e) => {
      if (!container_ref.current) return;
      let rect = container_ref.current.getBoundingClientRect();
      let raw_pct = is_horizontal
        ? ((e.clientX - rect.left)/Math.max(1, rect.width))*100
        : ((e.clientY - rect.top)/Math.max(1, rect.height))*100;
      let clamped_pct = Math.max(min_pct, Math.min(max_pct, raw_pct));
      setSplitPct(clamped_pct);
    };

    let onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [is_dragging, is_horizontal, max_pct, min_pct]);

  //Return statement
  return (
    <div
      className={`linear-flex-partition ${is_horizontal ? "partition-horizontal" : "partition-vertical"} ${is_dragging ? "is-dragging" : ""} ${props.className || ""}`}
      ref={container_ref}
      style={props.style}
    >
      <div
        className="linear-partition-pane linear-partition-first"
        style={is_horizontal
          ? { flexBasis: `${split_pct}%`, width: `${split_pct}%` }
          : { flexBasis: `${split_pct}%`, height: `${split_pct}%` }}
      >
        {children_arr[0]}
      </div>

      <div
        className={`linear-partition-sash ${is_horizontal ? "sash-horizontal" : "sash-vertical"} ${is_dragging ? "active" : ""}`}
        onDoubleClick={() => setSplitPct(initial_pct)}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        title="Drag to resize partition (double-click to reset)"
      >
        <span className="linear-partition-grip" />
      </div>

      <div
        className="linear-partition-pane linear-partition-second"
        style={is_horizontal
          ? { flexBasis: `${100 - split_pct}%`, width: `${100 - split_pct}%` }
          : { flexBasis: `${100 - split_pct}%`, height: `${100 - split_pct}%` }}
      >
        {children_arr[1]}
      </div>
    </div>
  );
}


/**
 * Provides the root OpenTUI context and terminal surface in the browser DOM.
 *
 * @param {Object} arg0_props
 *
 * @returns {React.ReactElement}
 */
export function OpenTUIProvider (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

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
 * OpenTUI <ScrollBox> scrollable viewport container.
 *
 * @param {Object} arg0_props
 *
 * @returns {React.ReactElement}
 */
export function ScrollBox (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

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
 *
 * @param {Object} arg0_props
 *
 * @returns {React.ReactElement}
 */
export function Select (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

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
 * Reusable column header component with sort direction indicators (▲ / ▼).
 *
 * @param {Object} arg0_props
 *
 * @returns {React.ReactElement}
 */
export function SortHeader (arg0_props) {
  //Convert from parameters
  let is_num = arg0_props.isNum;
  let label = arg0_props.label;
  let on_sort = arg0_props.onSort;
  let sort_config = arg0_props.sortConfig;
  let sort_key = arg0_props.sortKey;

  //Declare local instance variables
  let indicator = "";
  let is_active = (sort_config?.key === sort_key);

  if (is_active) {
    indicator = (sort_config.direction === "asc") ? " ▲" : " ▼";
  }

  //Return statement
  return (
    <th
      className={is_num ? "num" : ""}
      onClick={on_sort}
      style={{ cursor: "pointer", userSelect: "none" }}
      title={`Click to sort by ${label}`}
    >
      {label}
      {indicator && <span className="sort-indicator">{indicator}</span>}
    </th>
  );
}


/**
 * OpenTUI <TabSelect> horizontal tab bar widget.
 *
 * @param {Object} arg0_props
 *
 * @returns {React.ReactElement}
 */
export function TabSelect (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

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
 * OpenTUI <Text> typography primitive.
 *
 * @param {Object} arg0_props
 *
 * @returns {React.ReactElement}
 */
export function Text (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

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
 * File-explorer style nested tree widget for numbered figures, tables, and test suites.
 * Enforces white (#ffffff) outline on active selection per Dataview design rules.
 *
 * @param {Object} arg0_props
 *  @param {Array<Object>} arg0_props.nodes
 *  @param {string} arg0_props.selectedId
 *  @param {Function} arg0_props.onSelect
 *
 * @returns {React.ReactElement}
 */
export function TreeExplorer (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Declare local instance variables
  let [collapsed_map, setCollapsedMap] = useState({});
  let nodes = props.nodes || [];
  let on_select = props.onSelect;
  let selected_id = props.selectedId;

  let toggleFolder = function (arg0_folder_id, arg1_event) {
    let folder_id = arg0_folder_id;
    let ev = arg1_event;
    if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation();
    setCollapsedMap((prev) => Object.assign({}, prev, { [folder_id]: !prev[folder_id] }));
  };

  let renderNodeList = function (arg0_list, arg1_depth) {
    let list = arg0_list || [];
    let depth = arg1_depth || 0;

    return list.map((node) => {
      let has_children = Array.isArray(node.children) && node.children.length > 0;
      let is_collapsed = Boolean(collapsed_map[node.id]);
      let is_running = (node.status === "running");
      let is_selected = (selected_id === node.id);

      return (
        <div className="linear-tree-branch" key={node.id}>
          <button
            className={`linear-tree-node ${is_selected ? "active" : ""} ${has_children ? "is-folder" : "is-leaf"}`}
            onClick={() => {
              if (has_children && !node.pipeline_id && !node.number) {
                toggleFolder(node.id);
              }
              if (typeof on_select === "function") on_select(node);
            }}
            style={{ paddingLeft: `${8 + depth*14}px` }}
            title={node.description || node.label}
            type="button"
          >
            <div className="linear-tree-node-left">
              {has_children ? (
                <span
                  className="linear-tree-caret"
                  onClick={(e) => toggleFolder(node.id, e)}
                >
                  {is_collapsed ? "▸" : "▾"}
                </span>
              ) : (
                <span className="linear-tree-leaf-bullet">·</span>
              )}
              <span
                className="linear-tree-label"
                style={{ fontWeight: is_selected || (has_children && depth === 0) ? 700 : 500 }}
              >
                {node.label}
              </span>
            </div>

            {node.status ? (
              <span className={`linear-badge ${is_running ? "linear-badge-active" : ""}`}>
                {node.status}
              </span>
            ) : null}
          </button>

          {has_children && !is_collapsed ? (
            <div className="linear-tree-children">
              {renderNodeList(node.children, depth + 1)}
            </div>
          ) : null}
        </div>
      );
    });
  };

  //Return statement
  return (
    <div className="linear-tree-explorer" role="tree">
      {renderNodeList(nodes, 0)}
    </div>
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
  let options = (arg0_options) ? arg0_options : {};
  let root = new BoxRenderable(null, { id: "root" });

  //Return statement
  return {
    destroy: () => {},
    options: options,
    root: root
  };
}
