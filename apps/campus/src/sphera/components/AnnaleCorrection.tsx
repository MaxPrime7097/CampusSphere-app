import React, { useState } from "react";
import { CaretDown as ChevronDown, CaretUp as ChevronUp, BookOpen, Lightbulb, Target, BookmarkSimple as BookMarked, Lightning as Zap, Medal as Award, Code as Code2, Calculator, AlignLeft, CheckCircle as CheckCircle2, Stack as SquareStack, Download, Spinner as Loader2 } from "@phosphor-icons/react";
import { useDownloadPDF } from "../hooks/useDownloadPDF";
import type {
  AnnaleSession, AnnaleCorrection, AnnaleQuestion, AnnaleSection,
} from "../types/sphera.types";

// ────────────────────────────────────────────────────────────────────────────
// Helpers — type badge
// ────────────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  qcm: {
    label: "QCM",
    icon: <CheckCircle2 className="w-3 h-3" />,
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/25",
  },
  code: {
    label: "Code",
    icon: <Code2 className="w-3 h-3" />,
    color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-violet-500/25",
  },
  preuve: {
    label: "Preuve",
    icon: <Calculator className="w-3 h-3" />,
    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/25",
  },
  ouvert: {
    label: "Ouvert",
    icon: <AlignLeft className="w-3 h-3" />,
    color: "bg-[#ff9800]/15 text-[#ff9800] ring-[#ff9800]/25",
  },
} as const;

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.ouvert;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// QCM renderer
// ────────────────────────────────────────────────────────────────────────────

function QcmAnswer({ reponse, explication }: { reponse: string; explication?: string }) {
  // Extraire la lettre si présente (ex: "A", "B. Explication…", "La bonne réponse est C")
  const letterMatch = reponse.match(/\b([A-Da-d])\b/);
  const letter = letterMatch ? letterMatch[1].toUpperCase() : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {letter && (
          <span className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 text-white text-lg font-bold flex items-center justify-center shadow-md shadow-emerald-500/30">
            {letter}
          </span>
        )}
        <p className="text-sm text-foreground leading-relaxed">{reponse}</p>
      </div>
      {explication && (
        <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-emerald-500/40 pl-3 ml-1">
          {explication}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Code renderer
// ────────────────────────────────────────────────────────────────────────────

function CodeAnswer({ reponse, explication }: { reponse: string; explication?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reponse).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border border-border/40 bg-zinc-950">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-border/30">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <button
            onClick={handleCopy}
            className="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors font-mono"
          >
            {copied ? "✓ Copié" : "Copier"}
          </button>
        </div>
        <pre className="p-4 text-xs text-emerald-300 font-mono leading-relaxed overflow-x-auto">
          <code>{reponse}</code>
        </pre>
      </div>
      {explication && (
        <div className="flex gap-2.5 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <Code2 className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">{explication}</p>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Preuve renderer — étapes numérotées
// ────────────────────────────────────────────────────────────────────────────

function ProofAnswer({ reponse, explication }: { reponse: string; explication?: string }) {
  // Découpe par saut de ligne pour afficher les étapes
  const steps = reponse.split(/\n+/).filter(Boolean);

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
        {steps.length > 1 ? (
          steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-foreground font-mono leading-relaxed">{step}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-foreground font-mono leading-relaxed">{reponse}</p>
        )}
      </div>
      {explication && (
        <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-blue-500/40 pl-3">
          {explication}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Ouvert / default renderer
// ────────────────────────────────────────────────────────────────────────────

function OpenAnswer({ reponse, explication }: { reponse: string; explication?: string }) {
  return (
    <div className="space-y-2.5">
      <div className="flex gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <Target className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Réponse</p>
          <p className="text-sm text-foreground leading-relaxed">{reponse}</p>
        </div>
      </div>
      {explication && (
        <div className="flex gap-2.5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Explication</p>
            <p className="text-sm text-foreground leading-relaxed">{explication}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Adaptive answer dispatcher
// ────────────────────────────────────────────────────────────────────────────

function AdaptiveAnswer({ type, reponse, explication }: {
  type: string;
  reponse: string;
  explication?: string;
}) {
  switch (type) {
    case "qcm":    return <QcmAnswer reponse={reponse} explication={explication} />;
    case "code":   return <CodeAnswer reponse={reponse} explication={explication} />;
    case "preuve": return <ProofAnswer reponse={reponse} explication={explication} />;
    default:       return <OpenAnswer reponse={reponse} explication={explication} />;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// QuestionCard — nouveau format
// ────────────────────────────────────────────────────────────────────────────

function QuestionCard({ question }: { question: AnnaleQuestion }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 overflow-hidden hover:border-[#ff9800]/30 transition-all duration-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-accent/20 transition-colors"
      >
        <span className="flex-shrink-0 min-w-[1.5rem] h-6 rounded-full bg-[#ff9800]/15 text-[#ff9800] text-xs font-bold flex items-center justify-center ring-1 ring-[#ff9800]/25 mt-0.5 px-1.5">
          {question.numero}
        </span>
        <p className="flex-1 text-sm font-medium text-foreground leading-relaxed">{question.enonce}</p>
        <div className="flex-shrink-0 flex items-center gap-2 mt-0.5">
          <TypeBadge type={question.type} />
          {open
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <AdaptiveAnswer type={question.type} reponse={question.reponse} explication={question.explication} />

          {question.source_cours && (
            <div className="flex gap-2.5 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <BookMarked className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">Référence cours</p>
                <p className="text-sm text-foreground">{question.source_cours}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SectionBlock — nouveau format
// ────────────────────────────────────────────────────────────────────────────

function SectionBlock({ section, index }: { section: AnnaleSection; index: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const totalQuestions = section.questions.length;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-[#ff9800]/8 to-transparent hover:from-[#ff9800]/15 transition-all"
      >
        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#ff9800]/20 text-[#ff9800] text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-sm text-foreground">{section.nom}</h3>
          <p className="text-xs text-muted-foreground">
            {totalQuestions} question{totalQuestions > 1 ? "s" : ""}
          </p>
        </div>
        {collapsed
          ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 pt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {section.questions.map((q) => (
            <QuestionCard key={q.numero} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Legacy CorrectionCard — ancien format rétrocompat
// ────────────────────────────────────────────────────────────────────────────

function LegacyCorrectionCard({
  correction, index, mode,
}: {
  correction: AnnaleCorrection;
  index: number;
  mode: "complete" | "rapide";
}) {
  const [open, setOpen] = useState(false);

  if (mode === "rapide") {
    return (
      <div className="rounded-xl border border-border/40 bg-card/50 p-4 hover:bg-card/80 transition-colors">
        <div className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff9800]/15 text-[#ff9800] text-xs font-bold flex items-center justify-center ring-1 ring-[#ff9800]/25">
            {index + 1}
          </span>
          <div className="flex-1 space-y-1.5">
            <p className="text-sm font-medium text-foreground leading-relaxed">{correction.question}</p>
            <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-[#ff9800]/40 pl-3">
              {correction.reponse}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 overflow-hidden hover:border-[#ff9800]/30 transition-all duration-200">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-accent/20 transition-colors"
      >
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff9800]/15 text-[#ff9800] text-xs font-bold flex items-center justify-center ring-1 ring-[#ff9800]/25 mt-0.5">
          {index + 1}
        </span>
        <p className="flex-1 text-sm font-medium text-foreground leading-relaxed">{correction.question}</p>
        {open
          ? <ChevronUp className="flex-shrink-0 w-4 h-4 text-muted-foreground mt-0.5" />
          : <ChevronDown className="flex-shrink-0 w-4 h-4 text-muted-foreground mt-0.5" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Target className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Réponse</p>
              <p className="text-sm text-foreground leading-relaxed">{correction.reponse}</p>
            </div>
          </div>
          {correction.explication && (
            <div className="flex gap-2.5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Explication</p>
                <p className="text-sm text-foreground leading-relaxed">{correction.explication}</p>
              </div>
            </div>
          )}
          {(correction.chapitre || correction.source_cours) && (
            <div className="flex gap-2.5 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <BookMarked className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                  {correction.source_cours ? "Référence cours" : "Chapitre"}
                </p>
                <p className="text-sm text-foreground">{correction.source_cours || correction.chapitre}</p>
              </div>
            </div>
          )}
          {correction.a_retenir && (
            <div className="flex gap-2.5 p-3 rounded-lg bg-[#ff9800]/10 border border-[#ff9800]/20">
              <Lightbulb className="w-4 h-4 text-[#ff9800] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#ff9800] mb-1">À retenir</p>
                <p className="text-sm text-foreground leading-relaxed">{correction.a_retenir}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main export — dual-format dispatcher
// ────────────────────────────────────────────────────────────────────────────

interface AnnaleCorrectionProps {
  annale: AnnaleSession;
}

export function AnnaleCorrection({ annale }: AnnaleCorrectionProps) {
  const { content, mode } = annale;
  const { isDownloading, generateAnnale } = useDownloadPDF();

  const hasSections = Array.isArray(content?.sections) && content.sections.length > 0;
  const hasLegacy   = Array.isArray(content?.corrections) && content.corrections.length > 0;
  const conseils    = content?.conseils_generaux || [];

  // Stats pour le header
  const totalQuestions = hasSections
    ? content.sections!.reduce((acc, s) => acc + s.questions.length, 0)
    : (content?.corrections?.length ?? 0);

  const totalSections = hasSections ? content.sections!.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">{content?.titre || "Correction d'annale"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {hasSections
              ? `${totalSections} section${totalSections > 1 ? "s" : ""} · ${totalQuestions} question${totalQuestions > 1 ? "s" : ""} corrigée${totalQuestions > 1 ? "s" : ""}`
              : `${totalQuestions} question${totalQuestions > 1 ? "s" : ""} corrigée${totalQuestions > 1 ? "s" : ""}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {hasSections && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <SquareStack className="w-3 h-3" />
              Structurée
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ${
              mode === "complete"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20"
                : "bg-[#ff9800]/10 text-[#ff9800] ring-[#ff9800]/20"
            }`}
          >
            {mode === "complete"
              ? <><BookOpen className="w-3.5 h-3.5" /> Correction complète</>
              : <><Zap className="w-3.5 h-3.5" /> Correction rapide</>
            }
          </span>
          <button
            type="button"
            onClick={() => generateAnnale(content, content?.titre || "Correction d'annale")}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#ff9800]/10 text-[#ff9800] hover:bg-[#ff9800]/20 border border-[#ff9800]/30 transition-all disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Télécharger PDF
          </button>
        </div>
      </div>

      {/* ── Nouveau format : sections + questions typées ── */}
      {hasSections && (
        <div className="space-y-4">
          {content.sections!.map((section, i) => (
            <SectionBlock key={i} section={section} index={i} />
          ))}
        </div>
      )}

      {/* ── Ancien format legacy (rétrocompatibilité) ── */}
      {!hasSections && hasLegacy && (
        <div className="space-y-3">
          {content.corrections!.map((correction, i) => (
            <LegacyCorrectionCard key={i} correction={correction} index={i} mode={mode} />
          ))}
        </div>
      )}

      {/* ── Aucun contenu ── */}
      {!hasSections && !hasLegacy && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucune correction disponible.</p>
        </div>
      )}

      {/* Conseils généraux */}
      {conseils.length > 0 && (
        <div className="rounded-xl border border-[#ff9800]/20 bg-[#ff9800]/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-[#ff9800]" />
            <h3 className="font-semibold text-foreground">Conseils généraux</h3>
          </div>
          <ul className="space-y-2">
            {conseils.map((conseil, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-foreground">
                <span className="text-[#ff9800] font-bold flex-shrink-0">→</span>
                {conseil}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
