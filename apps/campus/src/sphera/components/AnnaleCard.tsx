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
    <div
      onClick={() => onOpen(annale.id)}
      className={cn(
        "group relative flex flex-col p-5 bg-card hover:bg-accent/50 border border-border/40 hover:border-border hover:shadow-sm transition-all duration-200 cursor-pointer overflow-hidden",
        className || "rounded-2xl"
      )}
    >
      {/* Top Header: Icon and Trash */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
          <Scroll className="h-5 w-5 text-orange-500" />
        </div>
        
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(annale.id);
            }}
            className="p-2 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Middle: Title & Subtitle */}
      <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
        {annale.source_title || annale.source_filename || "Annale corrigée"}
      </h3>
      <p className="text-xs text-muted-foreground mb-4 line-clamp-1">
        {annale.corrections_count} question{annale.corrections_count !== 1 ? "s" : ""} corrigée{annale.corrections_count !== 1 ? "s" : ""}
      </p>

      {/* Bottom: Date & Badges */}
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground font-medium">
          {new Date(annale.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        </span>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <span
            className={cn(
              "px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wider flex items-center gap-1",
              annale.mode === "complete"
                ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                : "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400"
            )}
          >
            {annale.mode === "complete" ? <BookOpen className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
            {annale.mode === "complete" ? "Complète" : "Rapide"}
          </span>
        </div>
      </div>
    </div>
  );
}
