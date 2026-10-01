import React from "react";
import { Scroll, Lightning as Zap, BookOpen, Trash as Trash2 } from "@phosphor-icons/react";
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
        "group py-3.5 px-2 flex items-center justify-between gap-3 border-b border-border/40 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
          <Scroll className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm text-foreground truncate">
            {annale.source_title || annale.source_filename || "Annale corrigée"}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {annale.corrections_count} question{annale.corrections_count !== 1 ? "s" : ""} corrigée{annale.corrections_count !== 1 ? "s" : ""} • {new Date(annale.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider flex items-center gap-1",
            annale.mode === "complete"
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          {annale.mode === "complete" ? <BookOpen className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
          {annale.mode === "complete" ? "Complète" : "Rapide"}
        </span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(annale.id);
            }}
            className="p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

