import React, { useState } from "react";
import { GitFork, Sparkle as Sparkles, FolderPlus, FolderMinus, ArrowSquareOut as ExternalLink, CaretRight as ChevronRight, Stack as Layers } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { SPHERA_ORIGINS } from "@cs/sso";
import type { MindMapContent } from "../../types/sphera.types";

interface MindMapViewProps {
  data: MindMapContent;
  sessionId?: string | number;
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  vert: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-500", badge: "bg-emerald-500/20 text-emerald-400" },
  bleu: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500", badge: "bg-blue-500/20 text-blue-400" },
  orange: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500", badge: "bg-amber-500/20 text-amber-400" },
  violet: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-500", badge: "bg-purple-500/20 text-purple-400" },
  rose: { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-500", badge: "bg-pink-500/20 text-pink-400" },
};

function getColorStyle(c?: string) {
  if (!c) return COLOR_MAP.bleu;
  const key = c.toLowerCase();
  for (const [k, v] of Object.entries(COLOR_MAP)) {
    if (key.includes(k)) return v;
  }
  return COLOR_MAP.bleu;
}

export const MindMapView: React.FC<MindMapViewProps> = ({ data, sessionId }) => {
  const [collapsedBranches, setCollapsedBranches] = useState<Record<number, boolean>>({});

  const branches = data?.branches || [];
  const noeudCentral = data?.noeud_central || data?.titre || "Carte Mentale";

  const toggleBranch = (idx: number) => {
    setCollapsedBranches((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const expandAll = () => setCollapsedBranches({});
  const collapseAll = () => {
    const all: Record<number, boolean> = {};
    branches.forEach((_, i) => {
      all[i] = true;
    });
    setCollapsedBranches(all);
  };

  const envUrl = (import.meta.env.VITE_SPHERA_STANDALONE_URL as string)?.trim();
  const isLocal = ["localhost", "127.0.0.1"].some((host) => window.location.hostname.includes(host));
  const spheraBase = envUrl || (isLocal ? "http://localhost:4173" : SPHERA_ORIGINS[0]);
  const spheraLink = sessionId ? `${spheraBase}/sessions/${sessionId}` : `${spheraBase}/dashboard`;

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* ─── Hero Sphera CTA ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#ff9800]/20 bg-gradient-to-br from-[#ff9800]/10 via-background to-background p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#ff9800] to-[#ff5722] flex items-center justify-center shadow-lg shadow-orange-500/20 text-white shrink-0">
              <SpheraIcon size="md" variant="white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground text-base">Carte Conceptuelle Interactive</h4>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ff9800]/20 text-[#ff9800]">
                  Sphera App
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Pour une navigation fluide en plein écran, zoom 2D et réorganisation des nœuds, ouvre cette session dans Sphera.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => window.open(spheraLink, "_blank")}
            className="shrink-0 gap-2 bg-gradient-to-r from-[#ff9800] to-[#ff5722] hover:opacity-95 text-white shadow-md shadow-orange-500/20"
          >
            <span>Ouvrir dans Sphera</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ─── Central Node Concept ─── */}
      <div className="text-center py-4 px-6 rounded-2xl border border-primary/20 bg-card shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cœur du sujet</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{noeudCentral}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {branches.length} branche{branches.length > 1 ? "s" : ""} principale{branches.length > 1 ? "s" : ""} identifiée{branches.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* ─── Controls ─── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="w-3.5 h-3.5" />
          <span>Structure arborescente</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll} className="h-8 text-xs gap-1.5 text-muted-foreground">
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Tout déplier</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll} className="h-8 text-xs gap-1.5 text-muted-foreground">
            <FolderMinus className="w-3.5 h-3.5" />
            <span>Tout replier</span>
          </Button>
        </div>
      </div>

      {/* ─── Branches Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch, idx) => {
          const isCollapsed = collapsedBranches[idx] ?? false;
          const style = getColorStyle(branch.couleur);
          const subBranches = branch.sous_branches || [];

          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all ${style.border} ${style.bg} overflow-hidden`}
            >
              <button
                type="button"
                onClick={() => toggleBranch(idx)}
                className="w-full text-left p-4 flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg ${style.badge} shrink-0`}>
                    <GitFork className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-foreground truncate">
                    {branch.label}
                  </h4>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {subBranches.length} point{subBranches.length > 1 ? "s" : ""}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      isCollapsed ? "" : "rotate-90"
                    }`}
                  />
                </div>
              </button>

              {!isCollapsed && subBranches.length > 0 && (
                <div className="px-4 pb-4 pt-1 space-y-2 border-t border-border/40">
                  {subBranches.map((sub, subIdx) => (
                    <div
                      key={subIdx}
                      className="flex items-start gap-2.5 p-2 rounded-lg bg-background/70 border border-border/40 text-xs text-foreground/90"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${style.text} bg-current`} />
                      <span className="leading-relaxed">{sub.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MindMapView;
