//Import React hooks
import React, { useMemo } from "react";


/**
 * Converts inline LaTeX math ($...$), Markdown formatting (**bold**, *italic*, `code`, links),
 * and safe inline HTML into a renderable HTML string.
 *
 * @param {string} arg0_text
 *
 * @returns {string}
 */
function formatInlineMarkdownAndHTML (arg0_text) {
  //Convert from parameters
  let text = arg0_text;

  //Declare local instance variables
  let processed;

  //Guard clauses
  if (!text || typeof text !== "string") return "";

  processed = text;

  //1. Convert inline LaTeX math ($...$) into clean typographic HTML
  processed = processed.replace(/\$([^$]+)\$/g, (match, math_body) => {
    let clean_math = math_body
      .replace(/\\text\{([^}]*)\}/g, "$1")
      .replace(/\\Delta\s*/g, "Δ")
      .replace(/\\approx\s*/g, "≈")
      .replace(/\\sim\s*/g, "∼")
      .replace(/\\to\s*/g, "→")
      .replace(/\\times\s*/g, "×")
      .replace(/\\%/g, "%")
      .replace(/--/g, "–")
      .replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>")
      .replace(/\^([0-9a-zA-Z+-]+)/g, "<sup>$1</sup>")
      .replace(/_\{([^}]+)\}/g, "<sub>$1</sub>")
      .replace(/_([0-9a-zA-Z+-]+)/g, "<sub>$1</sub>");
    return `<span class="gfm-math">${clean_math}</span>`;
  });

  //2. Inline code spans (`code`)
  processed = processed.replace(/`([^`]+)`/g, '<code class="gfm-inline-code">$1</code>');

  //3. Markdown images ![alt](src)
  processed = processed.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img alt="$1" class="linear-plot-image gfm-img" src="$2" />'
  );

  //4. Markdown links [label](href)
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a class="gfm-link" href="$2" target="_blank" rel="noreferrer">$1</a>'
  );

  //5. Bold (**text**) and italic (*text*)
  processed = processed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  processed = processed.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  //Return statement
  return processed;
}


/**
 * Parses a mixed GitHub-Flavored Markdown (GFM) and HTML document into structured block descriptors.
 *
 * @param {string} arg0_markdown
 *
 * @returns {Array<Object>}
 */
function parseGitHubMarkdownBlocks (arg0_markdown) {
  //Convert from parameters
  let markdown = arg0_markdown;

  //Declare local instance variables
  let blocks_array = [];
  let i = 0;
  let lines;

  //Guard clauses
  if (!markdown || typeof markdown !== "string") return blocks_array;

  lines = markdown.replace(/\r\n/g, "\n").split("\n");

  for (; i < lines.length; i++) {
    let line = lines[i];
    let trimmed = line.trim();

    if (trimmed.length === 0) continue;

    //Fenced code block (```lang)
    if (trimmed.startsWith("```")) {
      let code_lines = [];
      let lang = trimmed.slice(3).trim();
      i++;
      for (; i < lines.length; i++) {
        if (lines[i].trim().startsWith("```")) break;
        code_lines.push(lines[i]);
      }
      blocks_array.push({
        code: code_lines.join("\n"),
        lang: lang,
        type: "code"
      });
      continue;
    }

    //Horizontal rule (--- or ***)
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks_array.push({ type: "hr" });
      continue;
    }

    //Headings (# to ####)
    let heading_match = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading_match) {
      blocks_array.push({
        level: heading_match[1].length,
        text: heading_match[2],
        type: "heading"
      });
      continue;
    }

    //GitHub Callout Alerts (> [!NOTE], > [!WARNING], > [!IMPORTANT], > [!TIP], > [!CAUTION]) or Blockquotes
    if (trimmed.startsWith(">")) {
      let quote_lines = [];
      for (; i < lines.length; i++) {
        let q_trim = lines[i].trim();
        if (!q_trim.startsWith(">")) {
          i--;
          break;
        }
        quote_lines.push(q_trim.replace(/^>\s?/, ""));
      }
      let first_line = quote_lines[0] || "";
      let alert_match = first_line.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);
      if (alert_match) {
        let alert_kind = alert_match[1].toUpperCase();
        let body_lines = [];
        if (alert_match[2]) body_lines.push(alert_match[2]);
        for (let x = 1; x < quote_lines.length; x++) body_lines.push(quote_lines[x]);
        blocks_array.push({
          alert_type: alert_kind.toLowerCase(),
          body: body_lines.join(" "),
          title: alert_kind,
          type: "alert"
        });
      } else {
        blocks_array.push({
          body: quote_lines.join(" "),
          type: "blockquote"
        });
      }
      continue;
    }

    //GFM Pipe Tables (| col1 | col2 |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      let table_lines = [];
      for (; i < lines.length; i++) {
        let t_trim = lines[i].trim();
        if (!t_trim.startsWith("|")) {
          i--;
          break;
        }
        table_lines.push(t_trim);
      }

      if (table_lines.length >= 2) {
        let splitCells = (row_str) => row_str
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());

        let headers = splitCells(table_lines[0]);
        let align_cells = splitCells(table_lines[1]);
        let alignments = align_cells.map((a) => {
          if (a.startsWith(":") && a.endsWith(":")) return "center";
          if (a.endsWith(":")) return "right";
          return "left";
        });
        let rows = [];
        for (let x = 2; x < table_lines.length; x++) {
          rows.push(splitCells(table_lines[x]));
        }
        blocks_array.push({
          alignments: alignments,
          headers: headers,
          rows: rows,
          type: "table"
        });
        continue;
      }
    }

    //Unordered or Ordered Lists
    if (/^([-*+]|\d+\.)\s+/.test(trimmed)) {
      let is_ordered = /^\d+\.\s+/.test(trimmed);
      let list_items = [];
      for (; i < lines.length; i++) {
        let l_trim = lines[i].trim();
        if (!/^([-*+]|\d+\.)\s+/.test(l_trim)) {
          i--;
          break;
        }
        list_items.push(l_trim.replace(/^([-*+]|\d+\.)\s+/, ""));
      }
      blocks_array.push({
        items: list_items,
        ordered: is_ordered,
        type: "list"
      });
      continue;
    }

    //Raw HTML Block (<div>, <table>, <details>, <figure>, <p>, <section>)
    if (/^<(div|table|details|figure|section|p|ul|ol|blockquote)\b/i.test(trimmed)) {
      let html_lines = [line];
      for (i = i + 1; i < lines.length; i++) {
        if (lines[i].trim().length === 0) break;
        html_lines.push(lines[i]);
      }
      blocks_array.push({
        html: html_lines.join("\n"),
        type: "raw_html"
      });
      continue;
    }

    //Standard Paragraph
    let para_lines = [trimmed];
    for (i = i + 1; i < lines.length; i++) {
      let p_trim = lines[i].trim();
      if (
        p_trim.length === 0 ||
        p_trim.startsWith("#") ||
        p_trim.startsWith(">") ||
        p_trim.startsWith("|") ||
        p_trim.startsWith("```") ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(p_trim) ||
        /^([-*+]|\d+\.)\s+/.test(p_trim)
      ) {
        i--;
        break;
      }
      para_lines.push(p_trim);
    }
    blocks_array.push({
      text: para_lines.join(" "),
      type: "paragraph"
    });
  }

  //Return statement
  return blocks_array;
}


/**
 * Renders mixed GitHub-Flavored Markdown (GFM), LaTeX math notation, and HTML blocks
 * styled to the Project 1431/1436 Dataview palette.
 *
 * @param {Object} arg0_props
 *  @param {string} arg0_props.content
 *  @param {string} [arg0_props.className]
 *
 * @returns {React.ReactElement}
 */
export function MarkdownRenderer (arg0_props) {
  //Convert from parameters
  let props = (arg0_props) ? arg0_props : {};

  //Declare local instance variables
  let class_name = props.className || "";
  let content_str = props.content || "";

  let blocks = useMemo(() => {
    return parseGitHubMarkdownBlocks(content_str);
  }, [content_str]);

  //Guard clauses
  if (!content_str) {
    return (
      <div className={`gfm-markdown-body ${class_name}`}>
        <span style={{ color: "var(--text-muted)" }}>No document content available.</span>
      </div>
    );
  }

  //Return statement
  return (
    <div className={`gfm-markdown-body ${class_name}`}>
      {blocks.map((blk, idx) => {
        if (blk.type === "heading") {
          let Tag = `h${blk.level}`;
          return (
            <Tag
              className={`gfm-heading gfm-h${blk.level}`}
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdownAndHTML(blk.text) }}
              key={idx}
            />
          );
        } else if (blk.type === "hr") {
          return <hr className="gfm-hr" key={idx} />;
        } else if (blk.type === "alert") {
          return (
            <div className={`gfm-alert gfm-alert-${blk.alert_type}`} key={idx}>
              <div className="gfm-alert-title">{blk.title}</div>
              <div
                className="gfm-alert-body"
                dangerouslySetInnerHTML={{ __html: formatInlineMarkdownAndHTML(blk.body) }}
              />
            </div>
          );
        } else if (blk.type === "blockquote") {
          return (
            <blockquote
              className="gfm-blockquote"
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdownAndHTML(blk.body) }}
              key={idx}
            />
          );
        } else if (blk.type === "code") {
          return (
            <pre className="linear-doc-viewer gfm-code-block" key={idx}>
              <code>{blk.code}</code>
            </pre>
          );
        } else if (blk.type === "list") {
          let ListTag = blk.ordered ? "ol" : "ul";
          return (
            <ListTag className="gfm-list" key={idx}>
              {blk.items.map((item_str, item_idx) => (
                <li
                  dangerouslySetInnerHTML={{ __html: formatInlineMarkdownAndHTML(item_str) }}
                  key={item_idx}
                />
              ))}
            </ListTag>
          );
        } else if (blk.type === "table") {
          return (
            <div className="linear-table-container gfm-table-wrap" key={idx}>
              <table className="linear-table">
                <thead>
                  <tr>
                    {blk.headers.map((hdr, h_idx) => (
                      <th
                        className={blk.alignments[h_idx] === "right" ? "num" : ""}
                        dangerouslySetInnerHTML={{ __html: formatInlineMarkdownAndHTML(hdr) }}
                        key={h_idx}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blk.rows.map((row_cells, r_idx) => (
                    <tr key={r_idx}>
                      {row_cells.map((cell_str, c_idx) => {
                        let cleaned_cell = (c_idx > 0) ? cell_str.replace(/\*\*/g, "") : cell_str;
                        return (
                          <td
                            className={c_idx === 0 ? "col-entity" : (blk.alignments[c_idx] === "right" || blk.alignments[c_idx] === "center" ? "num" : "")}
                            dangerouslySetInnerHTML={{ __html: formatInlineMarkdownAndHTML(cleaned_cell) }}
                            key={c_idx}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        } else if (blk.type === "raw_html") {
          return (
            <div
              className="gfm-raw-html"
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdownAndHTML(blk.html) }}
              key={idx}
            />
          );
        } else {
          return (
            <p
              className="gfm-paragraph"
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdownAndHTML(blk.text) }}
              key={idx}
            />
          );
        }
      })}
    </div>
  );
}

export default MarkdownRenderer;

