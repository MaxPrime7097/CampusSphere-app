import React, { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, Lightbulb, Target, BookMarked, Zap, Award } from "lucide-react";
import type { AnnaleSession, AnnaleCorrection } from "../types/sphera.types";

interface AnnaleCorrectionProps {
  annale: AnnaleSession;
}

function CorrectionCard({
  correction,
  index,
  mode,
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
      {/* Question header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-accent/20 transition-colors"
      >
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff9800]/15 text-[#ff9800] text-xs font-bold flex items-center justify-center ring-1 ring-[#ff9800]/25 mt-0.5">
          {index + 1}
        </span>
        <p className="flex-1 text-sm font-medium text-foreground leading-relaxed">{correction.question}</p>
        {open ? (
          <ChevronUp className="flex-shrink-0 w-4 h-4 text-muted-foreground mt-0.5" />
        ) : (
          <ChevronDown className="flex-shrink-0 w-4 h-4 text-muted-foreground mt-0.5" />
        )}
      </button>

      {/* Détails accordéon */}
      {open && (
        <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Réponse */}
          <div className="flex gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Target className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Réponse</p>
              <p className="text-sm text-foreground leading-relaxed">{correction.reponse}</p>
            </div>
          </div>

          {/* Explication */}
          {correction.explication && (
            <div className="flex gap-2.5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Explication</p>
                <p className="text-sm text-foreground leading-relaxed">{correction.explication}</p>
              </div>
            </div>
          )}

          {/* Chapitre / Source cours */}
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

          {/* À retenir */}
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

export function AnnaleCorrection({ annale }: AnnaleCorrectionProps) {
  const { content, mode } = annale;
  const corrections = content?.corrections || [];
  const conseils = content?.conseils_generaux || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">{content?.titre || "Correction d'annale"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {corrections.length} question{corrections.length > 1 ? "s" : ""} corrigée{corrections.length > 1 ? "s" : ""}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ${
            mode === "complete"
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20"
              : "bg-[#ff9800]/10 text-[#ff9800] ring-[#ff9800]/20"
          }`}
        >
          {mode === "complete" ? (
            <>
              <BookOpen className="w-3.5 h-3.5" />
              Correction complète
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              Correction rapide
            </>
          )}
        </span>
      </div>

      {/* Corrections */}
      {corrections.length > 0 ? (
        <div className="space-y-3">
          {corrections.map((correction, i) => (
            <CorrectionCard key={i} correction={correction} index={i} mode={mode} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucune correction disponible.</p>
        </div>
      )}

      {/* Conseils généraux */}
      {mode === "complete" && conseils.length > 0 && (
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
