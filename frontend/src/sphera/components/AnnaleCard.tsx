import React from "react";
import { useNavigate } from "react-router-dom";
import { Scroll, Zap, BookOpen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnnaleSessionListItem } from "../types/sphera.types";

interface AnnaleCardProps {
  annale: AnnaleSessionListItem;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  className?: string;
}

export function AnnaleCard({ annale, onOpen, onDelete, className }: AnnaleCardProps) {
  return (
    <div className={cn("group relative flex flex-col rounded-2xl border border-border/40 bg-card/50 hover:bg-card/80 hover:border-[#ff9800]/30 hover:shadow-md transition-all duration-200 overflow-hidden", className)}>
      {/* Color accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#ff9800]/80 to-[#ff9800]/30" />

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff9800]/10 ring-1 ring-[#ff9800]/20 flex items-center justify-center flex-shrink-0">
              <Scroll className="w-4 h-4 text-[#ff9800]" />
            </div>
            <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
              {annale.source_title || annale.source_filename || "Annale"}
            </p>
          </div>
          <span
            className={cn(
              "flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ring-1",
              annale.mode === "complete"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20"
                : "bg-[#ff9800]/10 text-[#ff9800] ring-[#ff9800]/20"
            )}
          >
            {annale.mode === "complete" ? <BookOpen className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
            {annale.mode === "complete" ? "Complète" : "Rapide"}
          </span>
        </div>

        {/* Stats */}
        <p className="text-xs text-muted-foreground">
          {annale.corrections_count} question{annale.corrections_count !== 1 ? "s" : ""} corrigée{annale.corrections_count !== 1 ? "s" : ""}
          {" · "}
          {new Date(annale.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={() => onOpen(annale.id)}
            className="flex-1 py-2 px-3 rounded-xl bg-[#ff9800]/10 hover:bg-[#ff9800]/20 text-[#ff9800] text-xs font-semibold transition-colors"
          >
            Voir la correction
          </button>
          <button
            onClick={() => onDelete(annale.id)}
            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
