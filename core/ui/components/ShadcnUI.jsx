//Import React and hooks
import React, { useEffect, useRef, useState } from "react";


/**
 * Shadcn/UI Badge component styled with the Dataview palette.
 *
 * @param {Object} arg0_props
 *  @param {React.ReactNode} arg0_props.children
 *  @param {string} [arg0_props.className]
 *  @param {string} [arg0_props.variant="default"]
 *
 * @returns {React.ReactElement}
 */
export function Badge (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Declare local instance variables
  let class_name = props.className || "";
  let variant = props.variant || "default";
  let variant_class = (variant === "active")
    ? "shadcn-badge-active"
    : (variant === "outline")
      ? "shadcn-badge-outline"
      : "shadcn-badge-default";

  //Return statement
  return (
    <span className={`shadcn-badge ${variant_class} ${class_name}`} style={props.style}>
      {props.children}
    </span>
  );
}


/**
 * Shadcn/UI Button component implementing the Dataview Crimson Red primary button and neutral secondary variants.
 *
 * @param {Object} arg0_props
 *  @param {React.ReactNode} arg0_props.children
 *  @param {string} [arg0_props.className]
 *  @param {boolean} [arg0_props.disabled]
 *  @param {Function} [arg0_props.onClick]
 *  @param {string} [arg0_props.size="default"]
 *  @param {Object} [arg0_props.style]
 *  @param {string} [arg0_props.title]
 *  @param {string} [arg0_props.type="button"]
 *  @param {string} [arg0_props.variant="secondary"]
 *
 * @returns {React.ReactElement}
 */
export function Button (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Declare local instance variables
  let class_name = props.className || "";
  let size = props.size || "default";
  let size_class = (size === "xs")
    ? "shadcn-btn-xs"
    : (size === "sm")
      ? "shadcn-btn-sm"
      : (size === "icon")
        ? "shadcn-btn-icon"
        : "";
  let type_str = props.type || "button";
  let variant = props.variant || "secondary";
  let variant_class = (variant === "primary" || variant === "default")
    ? "shadcn-btn-primary"
    : (variant === "ghost")
      ? "shadcn-btn-ghost"
      : (variant === "outline")
        ? "shadcn-btn-outline"
        : "shadcn-btn-secondary";

  //Return statement
  return (
    <button
      aria-pressed={props["aria-pressed"]}
      className={`shadcn-btn ${variant_class} ${size_class} ${class_name}`}
      disabled={props.disabled}
      onClick={props.onClick}
      style={props.style}
      title={props.title}
      type={type_str}
    >
      {props.children}
    </button>
  );
}


/**
 * Shadcn/UI Card container component.
 *
 * @param {Object} arg0_props
 *  @param {React.ReactNode} arg0_props.children
 *  @param {string} [arg0_props.className]
 *  @param {Function} [arg0_props.onClick]
 *  @param {Object} [arg0_props.style]
 *
 * @returns {React.ReactElement}
 */
export function Card (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Return statement
  return (
    <div
      className={`shadcn-card ${props.className || ""}`}
      onClick={props.onClick}
      style={props.style}
    >
      {props.children}
    </div>
  );
}


/**
 * Shadcn/UI CardContent component.
 *
 * @param {Object} arg0_props
 *  @param {React.ReactNode} arg0_props.children
 *  @param {string} [arg0_props.className]
 *  @param {Object} [arg0_props.style]
 *
 * @returns {React.ReactElement}
 */
export function CardContent (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Return statement
  return (
    <div className={`shadcn-card-content ${props.className || ""}`} style={props.style}>
      {props.children}
    </div>
  );
}


/**
 * Shadcn/UI CardDescription component.
 *
 * @param {Object} arg0_props
 *  @param {React.ReactNode} arg0_props.children
 *  @param {string} [arg0_props.className]
 *  @param {Object} [arg0_props.style]
 *
 * @returns {React.ReactElement}
 */
export function CardDescription (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Return statement
  return (
    <div className={`shadcn-card-description ${props.className || ""}`} style={props.style}>
      {props.children}
    </div>
  );
}


/**
 * Shadcn/UI CardHeader component.
 *
 * @param {Object} arg0_props
 *  @param {React.ReactNode} arg0_props.children
 *  @param {string} [arg0_props.className]
 *  @param {Object} [arg0_props.style]
 *
 * @returns {React.ReactElement}
 */
export function CardHeader (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Return statement
  return (
    <div className={`shadcn-card-header ${props.className || ""}`} style={props.style}>
      {props.children}
    </div>
  );
}


/**
 * Shadcn/UI CardTitle component.
 *
 * @param {Object} arg0_props
 *  @param {React.ReactNode} arg0_props.children
 *  @param {string} [arg0_props.className]
 *  @param {Object} [arg0_props.style]
 *
 * @returns {React.ReactElement}
 */
export function CardTitle (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Return statement
  return (
    <div className={`shadcn-card-title ${props.className || ""}`} style={props.style}>
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
 * Shadcn/UI Input component with optional search icon and clear button.
 *
 * @param {Object} arg0_props
 *  @param {string} [arg0_props.className]
 *  @param {Function} [arg0_props.onChange]
 *  @param {Function} [arg0_props.onClear]
 *  @param {string} [arg0_props.placeholder]
 *  @param {Object} [arg0_props.style]
 *  @param {string} [arg0_props.type="text"]
 *  @param {string} [arg0_props.value]
 *
 * @returns {React.ReactElement}
 */
export function Input (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Declare local instance variables
  let has_value = Boolean(props.value && String(props.value).length > 0);

  //Return statement
  return (
    <div className={`shadcn-input-wrapper ${props.className || ""}`} style={props.style}>
      <span aria-hidden="true" className="shadcn-input-icon">⌕</span>
      <input
        className="shadcn-input"
        onChange={props.onChange}
        placeholder={props.placeholder || "Search..."}
        type={props.type || "text"}
        value={props.value || ""}
      />
      {has_value && typeof props.onClear === "function" ? (
        <button
          aria-label="Clear search"
          className="shadcn-input-clear"
          onClick={props.onClear}
          title="Clear search"
          type="button"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}


/**
 * Reusable column header component with sort direction indicators (▲ / ▼).
 *
 * @param {Object} arg0_props
 *  @param {boolean} [arg0_props.isNum]
 *  @param {string} arg0_props.label
 *  @param {Function} arg0_props.onSort
 *  @param {Object} arg0_props.sortConfig
 *  @param {string} arg0_props.sortKey
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
 * Shadcn/UI Table wrapper component.
 *
 * @param {Object} arg0_props
 *  @param {React.ReactNode} arg0_props.children
 *  @param {string} [arg0_props.className]
 *  @param {Object} [arg0_props.containerStyle]
 *
 * @returns {React.ReactElement}
 */
export function Table (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Return statement
  return (
    <div className="linear-table-container" style={props.containerStyle}>
      <table className={`linear-table ${props.className || ""}`}>
        {props.children}
      </table>
    </div>
  );
}


/**
 * File-explorer style nested tree widget for Tabulation, Tests, and Figures.
 * Supports inline stage/pipeline execution buttons, search auto-expansion, and white (#ffffff) selection outlines.
 *
 * @param {Object} arg0_props
 *  @param {Array<Object>} arg0_props.nodes
 *  @param {Function} [arg0_props.onRunPipeline]
 *  @param {Function} [arg0_props.onRunStage]
 *  @param {Function} arg0_props.onSelect
 *  @param {string} [arg0_props.searchQuery]
 *  @param {string} arg0_props.selectedId
 *
 * @returns {React.ReactElement}
 */
export function TreeExplorer (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Declare local instance variables
  let [collapsed_map, setCollapsedMap] = useState({});
  let has_search = Boolean(props.searchQuery && String(props.searchQuery).trim().length > 0);
  let nodes = props.nodes || [];
  let on_run_pipeline = props.onRunPipeline;
  let on_run_stage = props.onRunStage;
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
      let is_collapsed = has_search ? false : Boolean(collapsed_map[node.id]);
      let is_running = (node.status === "running");
      let is_selected = (selected_id === node.id);
      let is_top_stage = Boolean(node.stage_id && depth === 0);

      return (
        <div className="linear-tree-branch" key={node.id}>
          <div
            className={`linear-tree-node ${is_selected ? "active" : ""} ${has_children ? "is-folder" : "is-leaf"}`}
            onClick={() => {
              if (has_children && is_collapsed) {
                setCollapsedMap((prev) => Object.assign({}, prev, { [node.id]: false }));
              }
              if (typeof on_select === "function") on_select(node);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (typeof on_select === "function") on_select(node);
              }
            }}
            role="treeitem"
            style={{ paddingLeft: `${8 + depth*14}px` }}
            tabIndex={0}
            title={node.description || node.label}
          >
            <div className="linear-tree-node-left">
              {has_children ? (
                <span
                  className="linear-tree-caret"
                  onClick={(e) => toggleFolder(node.id, e)}
                  title={is_collapsed ? "Expand folder" : "Collapse folder"}
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

            <div className="linear-tree-node-right">
              {is_top_stage && typeof on_run_stage === "function" ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    on_run_stage(node.stage_id);
                  }}
                  size="xs"
                  title={node.description || node.action_label}
                  variant="primary"
                >
                  {is_running ? "Running..." : (node.action_label || "Run")}
                </Button>
              ) : node.action_label && node.pipeline_id && typeof on_run_pipeline === "function" ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    on_run_pipeline(node.pipeline_id);
                  }}
                  size="xs"
                  title={`Execute ${node.label}`}
                  variant={is_running ? "primary" : "secondary"}
                >
                  {is_running ? "Running..." : node.action_label}
                </Button>
              ) : node.status ? (
                <Badge variant={is_running ? "active" : "default"}>
                  {node.status}
                </Badge>
              ) : null}
            </div>
          </div>

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
      {nodes.length === 0 ? (
        <div className="shadcn-tree-empty">
          No matching artefacts found.
        </div>
      ) : (
        renderNodeList(nodes, 0)
      )}
    </div>
  );
}


/**
 * Namespace export for Shadcn/UI components.
 */
export let ShadcnUI = {
  Badge: Badge,
  Button: Button,
  Card: Card,
  CardContent: CardContent,
  CardDescription: CardDescription,
  CardHeader: CardHeader,
  CardTitle: CardTitle,
  FlexPartition: FlexPartition,
  Input: Input,
  SortHeader: SortHeader,
  Table: Table,
  TreeExplorer: TreeExplorer
};

