/**
 * Moteur d'impression PDF Haute Définition "Niveau Claude" pour CampusSphere
 *
 * Utilise le moteur vectoriel CSS Paged Media du navigateur avec :
 * - Typographie éditoriale Inter haute lisibilité
 * - Rendu mathématique KaTeX vectoriel pur (LaTeX & formules scientifiques)
 * - Callout boxes modernes (Midnight / Indigo / Émeraude / Ambre)
 * - Respect strict des sauts de page (break-inside: avoid)
 * - Numérotation automatique et en-tête éditorial
 */

interface GenerateFicheOptions {
  fiche: any;
  sourceName?: string;
}

interface GenerateAnnaleOptions {
  annale: any;
  sourceName?: string;
}

const KATEX_CDN_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
const KATEX_CDN_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
const KATEX_CDN_AUTO = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js";

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function markdownToHtml(text: string): string {
  if (!text || typeof text !== "string") return "";

  let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  const lines = formatted.split("\n");
  const result: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("|") && line.endsWith("|")) {
      inTable = true;
      tableRows.push(line);
    } else {
      if (inTable) {
        result.push(renderTable(tableRows));
        tableRows = [];
        inTable = false;
      }
      if (line === "") {
        result.push('<div class="spacer"></div>');
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        result.push(`<li class="list-item">${line.slice(2)}</li>`);
      } else {
        result.push(`<p class="paragraph">${line}</p>`);
      }
    }
  }

  if (inTable) {
    result.push(renderTable(tableRows));
  }

  return result.join("\n");
}

function renderTable(rows: string[]): string {
  if (rows.length < 2) return "";
  const headerCells = rows[0].split("|").filter((c) => c.trim() !== "");
  const dataRows = rows.slice(1).filter((r) => !r.replace(/[-|:\s]/g, "").length === false);

  let html = '<div class="table-container"><table class="doc-table"><thead><tr>';
  for (const cell of headerCells) {
    html += `<th>${cell.trim()}</th>`;
  }
  html += "</tr></thead><tbody>";

  for (const row of dataRows) {
    const cells = row.split("|").filter((_, idx, arr) => !(idx === 0 || idx === arr.length - 1));
    html += "<tr>";
    for (const cell of cells) {
      html += `<td>${cell.trim()}</td>`;
    }
    html += "</tr>";
  }

  html += "</tbody></table></div>";
  return html;
}

function buildBaseStyle(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 16mm 15mm 18mm 15mm;
      @bottom-right {
        content: "Page " counter(page) " sur " counter(pages);
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.6;
      font-size: 10pt;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .page-break-avoid {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .page-break-before {
        break-before: page !important;
        page-break-before: always !important;
      }
    }

    .doc-container {
      max-width: 100%;
    }

    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 12px;
      margin-bottom: 20px;
      border-bottom: 2px solid #0f172a;
    }

    .doc-brand {
      font-size: 9pt;
      font-weight: 800;
      color: #22c55e;
    }

    .doc-meta-badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      background: #f1f5f9;
      color: #475569;
      padding: 3px 8px;
      border-radius: 999px;
      margin-top: 4px;
    }

    .doc-date {
      font-size: 8pt;
      color: #64748b;
      text-align: right;
    }

    .doc-title {
      font-size: 19pt;
      font-weight: 800;
      line-height: 1.25;
      color: #0f172a;
      margin-bottom: 18px;
      letter-spacing: -0.02em;
    }

    .callout-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 18px;
    }

    .callout-title {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #2563eb;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .section-title {
      font-size: 12pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 20px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }

    .section-icon {
      color: #ea580c;
    }

    .points-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 18px;
    }

    .point-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fdfdfd;
      border: 1px solid #f1f5f9;
      padding: 8px 12px;
      border-radius: 6px;
    }

    .point-number {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      background: #ffedd5;
      color: #c2410c;
      font-weight: 700;
      font-size: 8pt;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1px;
    }

    .definitions-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      margin-bottom: 18px;
    }

    .def-card {
      background: #fdfdfd;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
    }

    .def-term {
      font-weight: 700;
      color: #0f172a;
      font-size: 9.5pt;
      margin-bottom: 3px;
    }

    .def-desc {
      color: #475569;
      font-size: 9pt;
      line-height: 1.5;
    }

    .formula-card {
      background: #fdfbf7;
      border: 1px solid #fed7aa;
      border-left: 4px solid #ea580c;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 14px;
    }

    .formula-content {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10pt;
      color: #9a3412;
      background: #fff;
      border: 1px solid #ffedd5;
      padding: 8px 12px;
      border-radius: 6px;
      margin: 6px 0;
      overflow-x: auto;
    }

    .warning-card {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 14px;
    }

    .warning-title {
      font-size: 8.5pt;
      font-weight: 700;
      color: #b45309;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .question-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 14px;
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .question-badge {
      font-size: 8pt;
      font-weight: 700;
      background: #0f172a;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .question-points {
      font-size: 8pt;
      font-weight: 600;
      color: #64748b;
    }

    .question-enonce {
      font-weight: 600;
      color: #0f172a;
      font-size: 10pt;
      margin-bottom: 10px;
    }

    .answer-block {
      background: #f8fafc;
      border-left: 3px solid #10b981;
      padding: 8px 12px;
      border-radius: 0 6px 6px 0;
      margin-top: 8px;
    }

    .answer-title {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #059669;
      margin-bottom: 4px;
    }

    .bareme-table {
      width: 100%;
      margin-top: 8px;
      border-collapse: collapse;
      font-size: 8.5pt;
    }

    .bareme-table td {
      padding: 4px 8px;
      border-top: 1px solid #e2e8f0;
    }

    .bareme-table td:last-child {
      text-align: right;
      font-weight: 600;
      color: #ea580c;
    }

    .inline-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .table-container {
      margin: 12px 0;
      overflow-x: auto;
    }

    .doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
    }

    .doc-table th {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      text-align: left;
      font-weight: 600;
      color: #334155;
    }

    .doc-table td {
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      color: #475569;
    }

    .doc-table tr:nth-child(even) td {
      background: #fafafa;
    }

    .paragraph {
      margin-bottom: 6px;
      color: #334155;
    }

    .spacer {
      height: 8px;
    }
  `;
}

export function generateFicheHtml(options: GenerateFicheOptions): string {
  const f = options.fiche?.fiche || options.fiche || {};
  const title = f.titre || "Fiche de Révision";
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  let html = `<!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${KATEX_CDN_CSS}">
    <style>${buildBaseStyle()}</style>
  </head>
  <body>
    <div class="doc-container">
      <div class="doc-header">
        <div>
          <div class="doc-brand">Sphera by CampusSphere</div>
          <span class="doc-meta-badge">Fiche de Révision</span>
        </div>
        <div class="doc-date">
          <div>Généré le ${escapeHtml(dateStr)}</div>
          <div style="font-size:7pt; color:#94a3b8; margin-top:2px;">sphera.campussphere.app</div>
        </div>
      </div>

      <h1 class="doc-title">${escapeHtml(title)}</h1>
  `;

  if (f.resume) {
    html += `
      <div class="callout-card page-break-avoid">
        <div class="callout-title">Résumé Exécutif</div>
        <div style="font-size:9.5pt; color:#334155;">${markdownToHtml(f.resume)}</div>
      </div>
    `;
  }

  if (Array.isArray(f.points_cles) && f.points_cles.length > 0) {
    html += `
      <div class="section-title">
        <span class="section-icon">•</span> Points Clés à Maîtriser
      </div>
      <div class="points-list">
    `;
    f.points_cles.forEach((p: string, i: number) => {
      html += `
        <div class="point-item page-break-avoid">
          <span class="point-number">${i + 1}</span>
          <div style="flex:1; font-size:9.5pt; color:#334155;">${markdownToHtml(p)}</div>
        </div>
      `;
    });
    html += `</div>`;
  }

  if (Array.isArray(f.formules) && f.formules.length > 0) {
    html += `
      <div class="section-title">
        <span class="section-icon">∑</span> Formules & Démonstrations Clés
      </div>
    `;
    f.formules.forEach((item: any) => {
      const isObj = typeof item === "object" && item !== null;
      const nom = isObj ? item.nom || item.formule : "";
      const form = isObj ? item.formule || item.nom : item;
      const expl = isObj ? item.explication || item.application : "";

      html += `
        <div class="formula-card page-break-avoid">
          ${nom ? `<div style="font-weight:700; color:#9a3412; font-size:9pt; margin-bottom:4px;">${escapeHtml(nom)}</div>` : ""}
          <div class="formula-content">${escapeHtml(form)}</div>
          ${expl ? `<div style="font-size:8.5pt; color:#475569; margin-top:4px;">${markdownToHtml(expl)}</div>` : ""}
        </div>
      `;
    });
  }

  if (Array.isArray(f.definitions) && f.definitions.length > 0) {
    html += `
      <div class="section-title">
        <span class="section-icon">•</span> Lexique & Définitions Essentielles
      </div>
      <div class="definitions-grid">
    `;
    f.definitions.forEach((d: any) => {
      const terme = d.terme || d.nom || "";
      const def = d.definition || d.explication || "";
      html += `
        <div class="def-card page-break-avoid">
          <div class="def-term">${escapeHtml(terme)}</div>
          <div class="def-desc">${markdownToHtml(def)}</div>
        </div>
      `;
    });
    html += `</div>`;
  }

  if (Array.isArray(f.exemples) && f.exemples.length > 0) {
    html += `
      <div class="section-title">
        <span class="section-icon">•</span> Exemples Concrets d'Application
      </div>
    `;
    f.exemples.forEach((ex: any) => {
      const titreEx = typeof ex === "object" ? ex.titre || ex.concept || "Exemple" : "Exemple";
      const descEx = typeof ex === "object" ? ex.description || ex.exemple || "" : ex;
      html += `
        <div class="callout-card page-break-avoid" style="border-left-color:#8b5cf6; background:#faf5ff;">
          <div class="callout-title" style="color:#7c3aed;">${escapeHtml(titreEx)}</div>
          <div style="font-size:9pt; color:#334155;">${markdownToHtml(descEx)}</div>
        </div>
      `;
    });
  }

  if (Array.isArray(f.pieges) && f.pieges.length > 0) {
    html += `
      <div class="section-title">
        <span class="section-icon">•</span> Pièges d'Examen & Confusions Fréquentes
      </div>
    `;
    f.pieges.forEach((piege: any) => {
      const text = typeof piege === "object" ? piege.piege || piege.description || JSON.stringify(piege) : piege;
      html += `
        <div class="warning-card page-break-avoid">
          <div class="warning-title">Attention</div>
          <div style="font-size:9pt; color:#451a03;">${markdownToHtml(text)}</div>
        </div>
      `;
    });
  }

  if (Array.isArray(f.questions_examen) && f.questions_examen.length > 0) {
    html += `
      <div class="section-title">
        <span class="section-icon">•</span> Questions Types d'Épreuve
      </div>
    `;
    f.questions_examen.forEach((q: any, idx: number) => {
      const question = typeof q === "object" ? q.question : q;
      const reponse = typeof q === "object" ? q.reponse || q.elements_reponse : "";
      html += `
        <div class="question-card page-break-avoid">
          <div class="question-header">
            <span class="question-badge">Question Type #${idx + 1}</span>
          </div>
          <div class="question-enonce">${markdownToHtml(question)}</div>
          ${reponse ? `
            <div class="answer-block">
              <div class="answer-title">Éléments de réponse attendus</div>
              <div style="font-size:8.5pt; color:#1e293b;">${markdownToHtml(reponse)}</div>
            </div>
          ` : ""}
        </div>
      `;
    });
  }

  html += `
    </div>
    <script src="${KATEX_CDN_JS}"></script>
    <script src="${KATEX_CDN_AUTO}"></script>
    <script>
      document.addEventListener("DOMContentLoaded", function() {
        if (window.renderMathInElement) {
          renderMathInElement(document.body, {
            delimiters: [
              {left: "$$", right: "$$", display: true},
              {left: "$", right: "$", display: false},
              {left: "\\\\[", right: "\\\\]", display: true},
              {left: "\\\\(", right: "\\\\)", display: false}
            ],
            throwOnError: false
          });
        }
      });
    </script>
  </body>
  </html>
  `;

  return html;
}

export function generateAnnaleHtml(options: GenerateAnnaleOptions): string {
  let raw = options.annale || {};
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch {}
  }
  let a = raw?.content?.annale || raw?.annale || raw?.content || raw;
  if (typeof a === "string") {
    try { a = JSON.parse(a); } catch {}
  }
  const title = a?.titre || raw?.titre || raw?.source_title || raw?.source_filename || options.sourceName || "Correction d'Annale d'Examen";
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const isRawArray = Array.isArray(a);
  const rawSections = !isRawArray && (Array.isArray(a?.sections) ? a.sections : (Array.isArray(a?.parties) ? a.parties : []));
  const hasSections = Array.isArray(rawSections) && rawSections.length > 0;
  const hasCorrections = !isRawArray && Array.isArray(a?.corrections) && a.corrections.length > 0;
  const hasQuestions = !isRawArray && Array.isArray(a?.questions) && a.questions.length > 0;
  const questionsList = isRawArray ? a : hasCorrections ? a.corrections : hasQuestions ? a.questions : [];

  let html = `<!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${KATEX_CDN_CSS}">
    <style>${buildBaseStyle()}</style>
  </head>
  <body>
    <div class="doc-container">
      <div class="doc-header">
        <div>
          <div class="doc-brand">Sphera by CampusSphere</div>
          <span class="doc-meta-badge">Corrigé d'annale</span>
        </div>
        <div class="doc-date">
          <div>Édité le ${escapeHtml(dateStr)}</div>
          <div style="font-size:7pt; color:#94a3b8; margin-top:2px;">sphera.campussphere.app</div>
        </div>
      </div>

      <h1 class="doc-title">${escapeHtml(title)}</h1>
  `;

  const renderQuestion = (q: any, qIdx: number) => {
    const num = q.numero || qIdx + 1;
    const pts = q.points ? `${q.points} pt${q.points > 1 ? "s" : ""}` : "";
    const typeLabel = (q.type || "Question").toUpperCase();

    let qHtml = `
      <div class="question-card page-break-avoid">
        <div class="question-header">
          <span class="question-badge">Question ${num} • ${escapeHtml(typeLabel)}</span>
          ${pts ? `<span class="question-points">${pts}</span>` : ""}
        </div>
        <div class="question-enonce">${markdownToHtml(q.enonce || q.question || "")}</div>
    `;

    const rep = q.reponse_attendue || q.reponse_courte || q.reponse || q.correction || q.answer || q.solution;
    if (rep) {
      qHtml += `
        <div class="answer-block">
          <div class="answer-title">Corrigé & Solution Attendue</div>
          <div style="font-size:9pt; color:#0f172a; line-height:1.5;">${markdownToHtml(rep)}</div>
        </div>
      `;
    }

    const expl = q.explication || q.justification || q.raisonnement;
    if (expl) {
      qHtml += `
        <div style="margin-top:8px; padding:8px 12px; background:#f0fdf4; border-left:3px solid #10b981; border-radius:6px;">
          <div style="font-size:8pt; font-weight:700; color:#047857; text-transform:uppercase; margin-bottom:3px;">Explication détaillée & Raisonnement</div>
          <div style="font-size:8.5pt; color:#1e293b; line-height:1.5;">${markdownToHtml(expl)}</div>
        </div>
      `;
    }

    if (q.source_cours || q.chapitre) {
      qHtml += `
        <div style="margin-top:6px; font-size:8pt; color:#6b21a8; background:#faf5ff; padding:4px 8px; border-radius:4px; display:inline-block;">
          <strong>Référence cours :</strong> ${escapeHtml(q.source_cours || q.chapitre)}
        </div>
      `;
    }

    if (Array.isArray(q.etapes_resolution) && q.etapes_resolution.length > 0) {
      qHtml += `
        <div style="margin-top:8px;">
          <div style="font-size:8pt; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Étapes de Résolution Détaillées</div>
          <ol style="padding-left:16px; font-size:8.5pt; color:#334155; line-height:1.5;">
      `;
      q.etapes_resolution.forEach((etape: string) => {
        qHtml += `<li>${markdownToHtml(etape)}</li>`;
      });
      qHtml += `</ol></div>`;
    }

    if (Array.isArray(q.bareme) && q.bareme.length > 0) {
      qHtml += `
        <div style="margin-top:8px;">
          <div style="font-size:8pt; font-weight:700; color:#64748b; text-transform:uppercase;">Barème Détaillé</div>
          <table class="bareme-table">
      `;
      q.bareme.forEach((b: any) => {
        const crit = b.critere || b.element || "";
        const bPts = b.points !== undefined ? `${b.points} pt${b.points > 1 ? "s" : ""}` : "";
        qHtml += `<tr><td>${escapeHtml(crit)}</td><td>${escapeHtml(bPts)}</td></tr>`;
      });
      qHtml += `</table></div>`;
    }

    if (q.piege_frequent || q.pieges_frequents || q.a_retenir) {
      const pText = q.piege_frequent || (Array.isArray(q.pieges_frequents) ? q.pieges_frequents.join(" • ") : q.pieges_frequents) || q.a_retenir;
      qHtml += `
        <div class="warning-card" style="margin-top:8px; padding:6px 10px;">
          <span style="font-weight:700; color:#b45309; font-size:8pt;">À retenir / Piège : </span>
          <span style="font-size:8.5pt; color:#451a03;">${markdownToHtml(pText)}</span>
        </div>
      `;
    }

    qHtml += `</div>`;
    return qHtml;
  };

  if (hasSections) {
    rawSections.forEach((sec: any, secIdx: number) => {
      html += `
        <div class="section-title">
          <span class="section-icon">${secIdx + 1}.</span> ${escapeHtml(sec.nom || sec.titre || sec.section || `Section ${secIdx + 1}`)}
        </div>
      `;
      if (Array.isArray(sec.questions)) {
        sec.questions.forEach((q: any, qIdx: number) => {
          html += renderQuestion(q, qIdx);
        });
      }
    });
  } else if (questionsList.length > 0) {
    questionsList.forEach((q: any, qIdx: number) => {
      html += renderQuestion(q, qIdx);
    });
  }

  const conseils = a?.conseils_generaux || raw?.conseils_generaux || [];
  if (Array.isArray(conseils) && conseils.length > 0) {
    html += `
      <div class="callout-card page-break-avoid" style="margin-top:20px; border-left-color:#ea580c; background:#fffaf0;">
        <div class="callout-title" style="color:#c2410c;">Conseils Stratégiques pour l'Épreuve</div>
        <ul style="padding-left:16px; font-size:9pt; color:#334155;">
    `;
    conseils.forEach((c: string) => {
      html += `<li style="margin-bottom:4px;">${markdownToHtml(c)}</li>`;
    });
    html += `</ul></div>`;
  }


  html += `
    </div>
    <script src="${KATEX_CDN_JS}"></script>
    <script src="${KATEX_CDN_AUTO}"></script>
    <script>
      document.addEventListener("DOMContentLoaded", function() {
        if (window.renderMathInElement) {
          renderMathInElement(document.body, {
            delimiters: [
              {left: "$$", right: "$$", display: true},
              {left: "$", right: "$", display: false},
              {left: "\\\\[", right: "\\\\]", display: true},
              {left: "\\\\(", right: "\\\\)", display: false}
            ],
            throwOnError: false
          });
        }
      });
    </script>
  </body>
  </html>
  `;

  return html;
}

export function printHtmlDocument(htmlContent: string, documentTitle: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      resolve();
      return;
    }

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        const originalTitle = document.title;
        document.title = documentTitle;
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.title = originalTitle;
          document.body.removeChild(iframe);
          resolve();
        }, 1000);
      } catch (err) {
        console.error("[PDF Print Engine Error]", err);
        try {
          document.body.removeChild(iframe);
        } catch (_) {}
        resolve();
      }
    };

    if (iframe.contentWindow) {
      iframe.contentWindow.onload = () => {
        setTimeout(triggerPrint, 350);
      };
    } else {
      setTimeout(triggerPrint, 600);
    }
  });
}
