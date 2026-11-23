import katex from "katex";

const KATEX_CDN_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";

const ICONS = {
  resume: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
  chapitres: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  pointsCles: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  definitions: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  formules: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="18"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="8" y1="18" x2="8" y2="18"/></svg>`,
  pieges: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  aRetenir: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  exemples: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  questions: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderLatexExpression(expr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expr.trim(), {
      displayMode,
      throwOnError: false,
      strict: false,
      output: "html",
    });
  } catch {
    return `<code>${escapeHtml(expr)}</code>`;
  }
}

/**
 * Renders inline Markdown + LaTeX safely (escapes raw HTML first, then converts LaTeX,
 * inline code, bold, and italic).
 */
function renderInline(raw: string): string {
  if (!raw) return "";
  const placeholders: string[] = [];
  const stash = (html: string): string => {
    const idx = placeholders.push(html) - 1;
    return `@@SPHERA_TOKEN_${idx}@@`;
  };

  let text = String(raw);

  // 1. Display math $$...$$ or \[...\]
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) =>
    stash(`<div class="math-display">${renderLatexExpression(expr, true)}</div>`),
  );
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, expr) =>
    stash(`<div class="math-display">${renderLatexExpression(expr, true)}</div>`),
  );

  // 2. Inline math $...$ or \(...\)
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, expr) =>
    stash(renderLatexExpression(expr, false)),
  );
  text = text.replace(/(?<!\$)\$(?!\$)([^\n$]+?)(?<!\$)\$(?!\$)/g, (_, expr) =>
    stash(renderLatexExpression(expr, false)),
  );

  // 3. Inline code `...`
  text = text.replace(/`([^`]+)`/g, (_, code) =>
    stash(`<code class="inline-code">${escapeHtml(code)}</code>`),
  );

  // 4. Escape any remaining HTML
  text = escapeHtml(text);

  // 5. Bold **...** and italic *...*
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");

  // 6. Restore stashed HTML tokens
  text = text.replace(/@@SPHERA_TOKEN_(\d+)@@/g, (_, i) => placeholders[Number(i)] ?? "");
  return text;
}

function splitTableRow(rowStr: string): string[] {
  let s = rowStr.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("-")) return false;
  const cells = splitTableRow(trimmed);
  if (cells.length === 0) return false;
  return cells.every((c) => /^:?-{2,}:?$/.test(c.trim()));
}

function renderMarkdown(raw: unknown): string {
  if (!raw || typeof raw !== "string") return "";

  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (listType && listItems.length > 0) {
      const tag = listType;
      out.push(
        `<${tag} class="md-${tag}">${listItems.map((it) => `<li>${renderInline(it)}</li>`).join("")}</${tag}>`,
      );
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        out.push(`<pre class="code-block"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Standalone display math block starting with $$
    if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
      flushList();
      out.push(`<div class="math-display">${renderLatexExpression(trimmed.slice(2, -2), true)}</div>`);
      continue;
    }

    // Multi-line $$ block
    if (trimmed === "$$") {
      flushList();
      const mathLines: string[] = [];
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== "$$") {
        mathLines.push(lines[j]);
        j++;
      }
      out.push(`<div class="math-display">${renderLatexExpression(mathLines.join("\n"), true)}</div>`);
      i = j;
      continue;
    }

    // GFM Tables
    if (trimmed.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushList();
      const headers = splitTableRow(trimmed);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().includes("|") && lines[j].trim() !== "") {
        rows.push(splitTableRow(lines[j].trim()));
        j++;
      }
      let tbl = `<div class="table-wrap"><table class="doc-table"><thead><tr>`;
      headers.forEach((h) => {
        tbl += `<th>${renderInline(h)}</th>`;
      });
      tbl += `</tr></thead><tbody>`;
      rows.forEach((r) => {
        tbl += `<tr>`;
        headers.forEach((_, ci) => {
          tbl += `<td>${renderInline(r[ci] ?? "")}</td>`;
        });
        tbl += `</tr>`;
      });
      tbl += `</tbody></table></div>`;
      out.push(tbl);
      i = j - 1;
      continue;
    }

    // Bullet lists
    if (/^[-*•]\s+/.test(trimmed)) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(trimmed.replace(/^[-*•]\s+/, ""));
      continue;
    }

    // Numbered lists
    const numMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(numMatch[1]);
      continue;
    }

    flushList();

    if (trimmed === "") {
      continue;
    } else if (trimmed.startsWith("### ")) {
      out.push(`<h4 class="md-h4">${renderInline(trimmed.slice(4))}</h4>`);
    } else if (trimmed.startsWith("## ")) {
      out.push(`<h3 class="md-h3">${renderInline(trimmed.slice(3))}</h3>`);
    } else if (trimmed.startsWith("# ")) {
      out.push(`<h3 class="md-h3">${renderInline(trimmed.slice(2))}</h3>`);
    } else if (trimmed.startsWith("> ")) {
      out.push(`<blockquote class="md-quote">${renderInline(trimmed.slice(2))}</blockquote>`);
    } else if (trimmed === "---" || trimmed === "***") {
      out.push(`<hr class="md-hr" />`);
    } else {
      out.push(`<p class="md-p">${renderInline(line)}</p>`);
    }
  }

  flushList();
  if (inCodeBlock && codeLines.length > 0) {
    out.push(`<pre class="code-block"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }

  return out.join("\n");
}

function renderFormulaBox(rawFormula: string): string {
  const trimmed = String(rawFormula || "").trim();
  if (!trimmed) return "";

  // If already wrapped in $$...$$ or $...$ or contains LaTeX commands, render directly via KaTeX
  const displayMatch = trimmed.match(/^\$\$([\s\S]+)\$\$$/) || trimmed.match(/^\\\[([\s\S]+)\\\]$/);
  if (displayMatch) {
    return `<div class="formula-math">${renderLatexExpression(displayMatch[1], true)}</div>`;
  }
  const inlineMatch = trimmed.match(/^\$([^$]+)\$$/) || trimmed.match(/^\\\(([\s\S]+)\\\)$/);
  if (inlineMatch) {
    return `<div class="formula-math">${renderLatexExpression(inlineMatch[1], true)}</div>`;
  }
  if (/\\(frac|sum|int|sqrt|Delta|alpha|beta|gamma|sigma|mu|lambda|theta|pi|times|cdot|leq|geq|neq|approx|infty|vec|bar|hat|text|lim|log|ln|sin|cos)/.test(trimmed)) {
    return `<div class="formula-math">${renderLatexExpression(trimmed, true)}</div>`;
  }
  return `<div class="formula-text">${renderInline(trimmed)}</div>`;
}

function buildEditorialStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 9.8pt;
      line-height: 1.58;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .avoid-break {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .keep-with-next {
      break-after: avoid;
      page-break-after: avoid;
    }

    /* Editorial Top Hero Banner */
    .hero {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      border-radius: 12px;
      padding: 20px 24px 18px 24px;
      margin-bottom: 18px;
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #10b981 0%, #22c55e 50%, #06b6d4 100%);
    }

    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #34d399;
      background: rgba(16, 185, 129, 0.14);
      border: 1px solid rgba(52, 211, 153, 0.3);
      padding: 3px 9px;
      border-radius: 999px;
    }

    .hero-date {
      font-size: 7.8pt;
      color: #94a3b8;
    }

    .hero-title {
      font-size: 17.5pt;
      font-weight: 800;
      line-height: 1.22;
      letter-spacing: -0.02em;
      color: #ffffff;
      margin-bottom: 10px;
    }

    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .meta-chip {
      font-size: 7.5pt;
      font-weight: 600;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 2px 8px;
      border-radius: 6px;
    }

    /* Executive Summary Card */
    .summary-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #10b981;
      border-radius: 10px;
      padding: 13px 16px;
      margin-bottom: 16px;
    }

    .card-kicker {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #047857;
      margin-bottom: 6px;
    }

    /* Mini Table of Contents */
    .toc-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 18px;
    }

    .toc-title {
      font-size: 7.8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 8px;
    }

    .toc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px 16px;
    }

    .toc-item {
      display: flex;
      align-items: baseline;
      gap: 7px;
      font-size: 8.6pt;
      color: #334155;
    }

    .toc-num {
      font-size: 7.6pt;
      font-weight: 700;
      color: #059669;
      min-width: 18px;
    }

    /* Section Headings */
    .section-heading {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 20px;
      margin-bottom: 11px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e2e8f0;
    }

    .section-count {
      margin-left: auto;
      font-size: 7.8pt;
      font-weight: 700;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 7px;
      border-radius: 999px;
    }

    /* Chapters — open flow (no forced giant gaps!) */
    .chapter-block {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 14px;
      background: #ffffff;
    }

    .chapter-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 8px;
      margin-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
    }

    .chapter-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 7px;
      background: #0f172a;
      color: #34d399;
      font-weight: 800;
      font-size: 8.5pt;
      flex-shrink: 0;
    }

    .chapter-title {
      font-size: 10.8pt;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
    }

    .chapter-body {
      color: #334155;
      font-size: 9.4pt;
    }

    .chapter-takeaways {
      margin-top: 11px;
      background: #f8fafc;
      border-left: 3px solid #10b981;
      border-radius: 0 7px 7px 0;
      padding: 9px 12px;
    }

    .chapter-takeaways-label {
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #059669;
      margin-bottom: 5px;
    }

    .takeaways-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .takeaways-list li {
      position: relative;
      padding-left: 13px;
      font-size: 8.8pt;
      color: #1e293b;
      line-height: 1.48;
    }

    .takeaways-list li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 6px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #10b981;
    }

    /* Definitions 2-column editorial glossary */
    .defs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
      margin-bottom: 14px;
    }

    .def-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-top: 2.5px solid #0284c7;
      border-radius: 8px;
      padding: 9px 11px;
    }

    .def-term {
      font-size: 9pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 3px;
    }

    .def-body {
      font-size: 8.5pt;
      color: #334155;
      line-height: 1.48;
    }

    /* Formulas */
    .formula-card {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-left: 4px solid #7c3aed;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 10px;
    }

    .formula-name {
      font-size: 9pt;
      font-weight: 700;
      color: #5b21b6;
      margin-bottom: 5px;
    }

    .formula-math, .formula-text {
      background: #ffffff;
      border: 1px solid #ddd6fe;
      border-radius: 6px;
      padding: 8px 12px;
      text-align: center;
      color: #0f172a;
      font-size: 10pt;
      margin-bottom: 5px;
      overflow-x: auto;
    }

    .formula-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      text-align: left;
    }

    .formula-expl {
      font-size: 8.4pt;
      color: #475569;
      line-height: 1.45;
    }

    /* Examples */
    .example-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #2563eb;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 10px;
    }

    .example-title {
      font-size: 9pt;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 4px;
    }

    /* Traps & Takeaways */
    .trap-card {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #d97706;
      border-radius: 8px;
      padding: 9px 13px;
      margin-bottom: 8px;
      font-size: 8.8pt;
      color: #451a03;
    }

    .tip-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #059669;
      border-radius: 8px;
      padding: 9px 13px;
      margin-bottom: 8px;
      font-size: 8.8pt;
      color: #064e3b;
    }

    /* Exam Questions & Annales */
    .question-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      padding: 12px 14px;
      margin-bottom: 11px;
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 7px;
    }

    .question-badge {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: #0f172a;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 5px;
    }

    .question-points {
      font-size: 8pt;
      font-weight: 700;
      color: #059669;
    }

    .question-enonce {
      font-weight: 600;
      color: #0f172a;
      font-size: 9.4pt;
      margin-bottom: 8px;
    }

    .answer-box {
      background: #f8fafc;
      border-left: 3px solid #10b981;
      border-radius: 0 6px 6px 0;
      padding: 8px 11px;
      font-size: 8.8pt;
      color: #1e293b;
    }

    .answer-label {
      font-size: 7.4pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #059669;
      margin-bottom: 4px;
    }

    .bareme-table {
      width: 100%;
      margin-top: 8px;
      border-collapse: collapse;
      font-size: 8.3pt;
    }

    .bareme-table td {
      padding: 4px 8px;
      border-top: 1px solid #e2e8f0;
    }

    .bareme-table td:last-child {
      text-align: right;
      font-weight: 700;
      color: #d97706;
    }

    /* Markdown Typography */
    .md-p { margin-bottom: 6px; }
    .md-p:last-child { margin-bottom: 0; }
    .md-h3 { font-size: 10pt; font-weight: 700; color: #0f172a; margin: 9px 0 4px 0; }
    .md-h4 { font-size: 9.3pt; font-weight: 700; color: #1e293b; margin: 7px 0 3px 0; }
    .md-ul, .md-ol { padding-left: 17px; margin: 5px 0 7px 0; }
    .md-ul li, .md-ol li { margin-bottom: 3px; }
    .md-quote {
      margin: 7px 0;
      padding: 6px 11px;
      background: #f8fafc;
      border-left: 3px solid #94a3b8;
      color: #475569;
      font-style: italic;
      border-radius: 0 6px 6px 0;
    }
    .md-hr { border: none; border-top: 1px solid #e2e8f0; margin: 8px 0; }

    .inline-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.3pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .code-block {
      background: #0f172a;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      padding: 9px 11px;
      border-radius: 7px;
      margin: 7px 0;
      overflow-x: auto;
      line-height: 1.45;
    }

    .math-display {
      margin: 7px 0;
      text-align: center;
      overflow-x: auto;
    }

    /* Tables */
    .table-wrap {
      margin: 9px 0;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      overflow: hidden;
    }

    .doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.4pt;
    }

    .doc-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: left;
      padding: 6px 9px;
      border-bottom: 1.5px solid #cbd5e1;
      border-right: 1px solid #e2e8f0;
    }

    .doc-table th:last-child, .doc-table td:last-child { border-right: none; }

    .doc-table td {
      padding: 5.5px 9px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
    }

    .doc-table tr:last-child td { border-bottom: none; }
    .doc-table tbody tr:nth-child(even) td { background: #f8fafc; }

    /* KaTeX fine tuning */
    .katex { font-size: 1.02em; }
    .katex-display { margin: 4px 0 !important; }
  `;
}

export function generateFichePdfHtml(rawFiche: any, sourceName?: string): { html: string; title: string } {
  const f = rawFiche?.fiche || rawFiche || {};
  const title: string = f.titre || sourceName || "Fiche de Révision";
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const chapitres: any[] = Array.isArray(f.chapitres) ? f.chapitres : [];
  const definitions: any[] = Array.isArray(f.definitions) ? f.definitions : [];
  const formules: any[] = Array.isArray(f.formules) ? f.formules : [];
  const exemples: any[] = Array.isArray(f.exemples) ? f.exemples : [];
  const pieges: any[] = Array.isArray(f.pieges) ? f.pieges : [];
  const aRetenir: any[] = Array.isArray(f.a_retenir) ? f.a_retenir : [];
  const questionsExamen: any[] = Array.isArray(f.questions_examen) ? f.questions_examen : [];
  const legacyPoints: any[] = Array.isArray(f.points_cles) ? f.points_cles : [];

  const metaChips: string[] = [];
  if (chapitres.length > 0) metaChips.push(`${chapitres.length} chapitre${chapitres.length > 1 ? "s" : ""}`);
  if (definitions.length > 0) metaChips.push(`${definitions.length} définition${definitions.length > 1 ? "s" : ""}`);
  if (formules.length > 0) metaChips.push(`${formules.length} formule${formules.length > 1 ? "s" : ""}`);
  if (exemples.length > 0) metaChips.push(`${exemples.length} exemple${exemples.length > 1 ? "s" : ""}`);
  if (questionsExamen.length > 0) metaChips.push(`${questionsExamen.length} question${questionsExamen.length > 1 ? "s" : ""} d'examen`);

  let body = `
    <div class="hero avoid-break">
      <div class="hero-top">
        <span class="brand-pill">Sphera • Fiche de Révision</span>
        <span class="hero-date">${escapeHtml(dateStr)}</span>
      </div>
      <h1 class="hero-title">${escapeHtml(title)}</h1>
      ${
        metaChips.length > 0
          ? `<div class="hero-meta">${metaChips.map((c) => `<span class="meta-chip">${escapeHtml(c)}</span>`).join("")}</div>`
          : ""
      }
    </div>
  `;

  if (f.resume) {
    body += `
      <div class="summary-card avoid-break">
        <div class="card-kicker">${ICONS.resume} Synthèse Express</div>
        <div class="chapter-body">${renderMarkdown(f.resume)}</div>
      </div>
    `;
  }

  // Mini Table of Contents for 3+ chapters
  if (chapitres.length >= 3) {
    body += `
      <div class="toc-box avoid-break">
        <div class="toc-title">Plan du cours</div>
        <div class="toc-grid">
          ${chapitres
            .map((chap, idx) => {
              const num = String(chap.numero || idx + 1).padStart(2, "0");
              return `<div class="toc-item"><span class="toc-num">${num}</span><span>${escapeHtml(chap.titre || `Chapitre ${idx + 1}`)}</span></div>`;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  // Chapters
  if (chapitres.length > 0) {
    body += `
      <div class="section-heading keep-with-next">
        ${ICONS.chapitres}
        <span>Chapitres & Développement</span>
        <span class="section-count">${chapitres.length}</span>
      </div>
    `;

    chapitres.forEach((chap, idx) => {
      const num = String(chap.numero || idx + 1).padStart(2, "0");
      const cTitle = chap.titre || `Chapitre ${idx + 1}`;
      const cPoints: string[] = Array.isArray(chap.points_cles) ? chap.points_cles : [];

      body += `
        <section class="chapter-block">
          <div class="chapter-header keep-with-next">
            <span class="chapter-num">${escapeHtml(num)}</span>
            <h2 class="chapter-title">${escapeHtml(cTitle)}</h2>
          </div>
          ${chap.resume ? `<div class="chapter-body">${renderMarkdown(chap.resume)}</div>` : ""}
          ${
            cPoints.length > 0
              ? `
                <div class="chapter-takeaways avoid-break">
                  <div class="chapter-takeaways-label">À retenir du chapitre</div>
                  <ul class="takeaways-list">
                    ${cPoints.map((pt) => `<li>${renderInline(String(pt))}</li>`).join("")}
                  </ul>
                </div>
              `
              : ""
          }
        </section>
      `;
    });
  } else if (legacyPoints.length > 0) {
    body += `
      <div class="section-heading keep-with-next">
        ${ICONS.pointsCles}
        <span>Points Essentiels du Cours</span>
        <span class="section-count">${legacyPoints.length}</span>
      </div>
      <div class="chapter-takeaways" style="margin-top:0; margin-bottom:14px;">
        <ul class="takeaways-list">
          ${legacyPoints.map((pt) => `<li>${renderInline(String(pt))}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  // Definitions (2-col editorial glossary)
  if (definitions.length > 0) {
    body += `
      <div class="section-heading keep-with-next">
        ${ICONS.definitions}
        <span>Lexique & Définitions Clés</span>
        <span class="section-count">${definitions.length}</span>
      </div>
      <div class="defs-grid">
        ${definitions
          .map((d) => {
            const terme = d?.terme || d?.nom || "";
            const def = d?.definition || d?.explication || "";
            return `
              <div class="def-card avoid-break">
                <div class="def-term">${renderInline(String(terme))}</div>
                <div class="def-body">${renderMarkdown(String(def))}</div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  // Formulas
  if (formules.length > 0) {
    body += `
      <div class="section-heading keep-with-next">
        ${ICONS.formules}
        <span>Formules, Lois & Règles Clés</span>
        <span class="section-count">${formules.length}</span>
      </div>
    `;
    formules.forEach((item) => {
      const isObj = typeof item === "object" && item !== null;
      const nom = isObj ? item.nom || "" : "";
      const form = isObj ? item.formule || item.nom || "" : String(item);
      const expl = isObj ? item.explication || item.application || "" : "";
      body += `
        <div class="formula-card avoid-break">
          ${nom ? `<div class="formula-name">${renderInline(String(nom))}</div>` : ""}
          ${renderFormulaBox(String(form))}
          ${expl ? `<div class="formula-expl">${renderMarkdown(String(expl))}</div>` : ""}
        </div>
      `;
    });
  }

  // Concrete Examples
  if (exemples.length > 0) {
    body += `
      <div class="section-heading keep-with-next">
        ${ICONS.exemples}
        <span>Exemples Concrets & Applications</span>
        <span class="section-count">${exemples.length}</span>
      </div>
    `;
    exemples.forEach((ex, idx) => {
      const isObj = typeof ex === "object" && ex !== null;
      const exTitle = isObj ? ex.titre || ex.concept || `Exemple ${idx + 1}` : `Exemple ${idx + 1}`;
      const exDesc = isObj ? ex.description || ex.exemple || "" : String(ex);
      body += `
        <div class="example-card avoid-break">
          <div class="example-title">${renderInline(String(exTitle))}</div>
          <div class="chapter-body" style="font-size:8.8pt;">${renderMarkdown(String(exDesc))}</div>
        </div>
      `;
    });
  }

  // Exam Traps
  if (pieges.length > 0) {
    body += `
      <div class="section-heading keep-with-next">
        ${ICONS.pieges}
        <span>Pièges d'Examen & Confusions Fréquentes</span>
        <span class="section-count">${pieges.length}</span>
      </div>
    `;
    pieges.forEach((p) => {
      const txt = typeof p === "object" && p !== null ? p.piege || p.description || "" : String(p);
      body += `<div class="trap-card avoid-break">${renderInline(String(txt))}</div>`;
    });
  }

  // Revision tips / À retenir
  if (aRetenir.length > 0) {
    body += `
      <div class="section-heading keep-with-next">
        ${ICONS.aRetenir}
        <span>À Retenir & Stratégies pour le Partiel</span>
        <span class="section-count">${aRetenir.length}</span>
      </div>
    `;
    aRetenir.forEach((r) => {
      body += `<div class="tip-card avoid-break">${renderInline(String(r))}</div>`;
    });
  }

  // Exam self-check questions
  if (questionsExamen.length > 0) {
    body += `
      <div class="section-heading keep-with-next">
        ${ICONS.questions}
        <span>Auto-évaluation — Questions Types d'Examen</span>
        <span class="section-count">${questionsExamen.length}</span>
      </div>
    `;
    questionsExamen.forEach((q, idx) => {
      const isObj = typeof q === "object" && q !== null;
      const question = isObj ? q.question || "" : String(q);
      const reponse = isObj ? q.reponse || q.elements_reponse || "" : "";
      body += `
        <div class="question-card avoid-break">
          <div class="question-header">
            <span class="question-badge">Question Type #${idx + 1}</span>
          </div>
          <div class="question-enonce">${renderMarkdown(String(question))}</div>
          ${
            reponse
              ? `
                <div class="answer-box">
                  <div class="answer-label">Éléments de réponse attendus</div>
                  <div>${renderMarkdown(String(reponse))}</div>
                </div>
              `
              : ""
          }
        </div>
      `;
    });
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${KATEX_CDN_CSS}" />
  <style>${buildEditorialStyles()}</style>
</head>
<body>${body}</body>
</html>`;

  return { html, title };
}

export function generateAnnalePdfHtml(rawAnnale: any, sourceName?: string): { html: string; title: string } {
  let raw = rawAnnale || {};
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {}
  }
  let a = raw?.content?.annale || raw?.annale || raw?.content || raw;
  if (typeof a === "string") {
    try {
      a = JSON.parse(a);
    } catch {}
  }

  const title: string =
    a?.titre ||
    raw?.titre ||
    raw?.source_title ||
    raw?.source_filename ||
    sourceName ||
    "Correction d'Annale d'Examen";

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isRawArray = Array.isArray(a);
  const rawSections = !isRawArray
    ? Array.isArray(a?.sections)
      ? a.sections
      : Array.isArray(a?.parties)
        ? a.parties
        : []
    : [];
  const hasSections = rawSections.length > 0;
  const questionsList = isRawArray
    ? a
    : Array.isArray(a?.corrections) && a.corrections.length > 0
      ? a.corrections
      : Array.isArray(a?.questions) && a.questions.length > 0
        ? a.questions
        : [];

  const renderQuestion = (q: any, qIdx: number): string => {
    const num = q.numero || qIdx + 1;
    const pts = q.points ? `${q.points} pt${Number(q.points) > 1 ? "s" : ""}` : "";
    const typeLabel = String(q.type || "Question").toUpperCase();
    const rep = q.reponse_attendue || q.reponse_courte || q.reponse || q.correction || q.answer || q.solution;
    const expl = q.explication || q.justification || q.raisonnement;

    let qHtml = `
      <div class="question-card avoid-break">
        <div class="question-header">
          <span class="question-badge">Question ${escapeHtml(num)} • ${escapeHtml(typeLabel)}</span>
          ${pts ? `<span class="question-points">${escapeHtml(pts)}</span>` : ""}
        </div>
        <div class="question-enonce">${renderMarkdown(String(q.enonce || q.question || ""))}</div>
    `;

    if (rep) {
      qHtml += `
        <div class="answer-box">
          <div class="answer-label">Corrigé & Solution Attendue</div>
          <div>${renderMarkdown(String(rep))}</div>
        </div>
      `;
    }

    if (expl) {
      qHtml += `
        <div class="tip-card" style="margin-top:8px; margin-bottom:0;">
          <div class="answer-label" style="color:#047857;">Explication détaillée & Raisonnement</div>
          <div>${renderMarkdown(String(expl))}</div>
        </div>
      `;
    }

    if (Array.isArray(q.etapes_resolution) && q.etapes_resolution.length > 0) {
      qHtml += `
        <div style="margin-top:8px;">
          <div class="toc-title" style="margin-bottom:4px;">Étapes de Résolution</div>
          <ol class="md-ol" style="font-size:8.5pt;">
            ${q.etapes_resolution.map((et: string) => `<li>${renderInline(String(et))}</li>`).join("")}
          </ol>
        </div>
      `;
    }

    if (Array.isArray(q.bareme) && q.bareme.length > 0) {
      qHtml += `
        <div style="margin-top:8px;">
          <div class="toc-title" style="margin-bottom:3px;">Barème Détaillé</div>
          <table class="bareme-table">
            ${q.bareme
              .map((b: any) => {
                const crit = b.critere || b.element || "";
                const bPts = b.points !== undefined ? `${b.points} pt${Number(b.points) > 1 ? "s" : ""}` : "";
                return `<tr><td>${renderInline(String(crit))}</td><td>${escapeHtml(bPts)}</td></tr>`;
              })
              .join("")}
          </table>
        </div>
      `;
    }

    if (q.piege_frequent || q.pieges_frequents || q.a_retenir) {
      const pText =
        q.piege_frequent ||
        (Array.isArray(q.pieges_frequents) ? q.pieges_frequents.join(" • ") : q.pieges_frequents) ||
        q.a_retenir;
      qHtml += `
        <div class="trap-card" style="margin-top:8px; margin-bottom:0;">
          <strong>Piège / À retenir :</strong> ${renderInline(String(pText))}
        </div>
      `;
    }

    qHtml += `</div>`;
    return qHtml;
  };

  let body = `
    <div class="hero avoid-break">
      <div class="hero-top">
        <span class="brand-pill">Sphera • Corrigé d'Annale</span>
        <span class="hero-date">${escapeHtml(dateStr)}</span>
      </div>
      <h1 class="hero-title">${escapeHtml(title)}</h1>
    </div>
  `;

  if (hasSections) {
    rawSections.forEach((sec: any, secIdx: number) => {
      body += `
        <div class="section-heading keep-with-next">
          <span>${secIdx + 1}. ${escapeHtml(sec.nom || sec.titre || sec.section || `Section ${secIdx + 1}`)}</span>
        </div>
      `;
      if (Array.isArray(sec.questions)) {
        sec.questions.forEach((q: any, qIdx: number) => {
          body += renderQuestion(q, qIdx);
        });
      }
    });
  } else if (questionsList.length > 0) {
    questionsList.forEach((q: any, qIdx: number) => {
      body += renderQuestion(q, qIdx);
    });
  }

  const conseils = a?.conseils_generaux || raw?.conseils_generaux || [];
  if (Array.isArray(conseils) && conseils.length > 0) {
    body += `
      <div class="summary-card avoid-break" style="margin-top:16px;">
        <div class="card-kicker">${ICONS.aRetenir} Conseils Stratégiques pour l'Épreuve</div>
        <ul class="takeaways-list">
          ${conseils.map((c: string) => `<li>${renderInline(String(c))}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${KATEX_CDN_CSS}" />
  <style>${buildEditorialStyles()}</style>
</head>
<body>${body}</body>
</html>`;

  return { html, title };
}
