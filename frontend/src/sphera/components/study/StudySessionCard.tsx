import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, BrainCircuit, Columns, Share2, Play, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { cn } from "@/lib/utils";

interface StudySessionCardProps {
  session: {
    id: number;
    tool_types: ("fiche" | "quiz" | "flashcards")[];
    resource_title: string;
    source_filename?: string;
    content_preview?: string; // titre du contenu généré
    is_shared: boolean;
    sphere_name?: string;
    created_at: string;
  };
  onResume: (sessionId: number) => void;
  onDelete?: (sessionId: number) => void;
  className?: string;
}

const TOOL_CONFIG = {
  fiche: {
    icon: BookOpen,
    label: "Fiche",
  },
  quiz: {
    icon: BrainCircuit,
    label: "Quiz",
  },
  flashcards: {
    icon: Columns,
    label: "Flashcards",
  },
};

export const StudySessionCard: React.FC<StudySessionCardProps> = ({
  session,
  onResume,
  onDelete,
  className,
}) => {
  const tools = session.tool_types || [];
  const primaryTool = tools[0] || "fiche";
  const config = TOOL_CONFIG[primaryTool] || TOOL_CONFIG.fiche;
  const Icon = config.icon;
  const resourceName = session.resource_title || session.source_filename || "Document";
  const timeAgo = formatDistanceToNow(new Date(session.created_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div
      onClick={() => onResume(session.id)}
      className={cn(
        "group relative flex flex-col p-5 bg-card hover:bg-accent/50 border border-border/40 hover:border-border hover:shadow-sm transition-all duration-200 cursor-pointer overflow-hidden",
        className || "rounded-2xl"
      )}
    >
      {/* Top Header: Icon and Trash */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
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
        {session.content_preview || resourceName}
      </h3>
      <p className="text-xs text-muted-foreground mb-4 line-clamp-1">
        Extrait de {resourceName}
      </p>

      {/* Bottom: Date & Badges */}
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground font-medium">
          {timeAgo}
        </span>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {tools.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-md bg-muted border border-border/50 text-[10px] font-medium text-foreground uppercase tracking-wider"
            >
              {TOOL_CONFIG[t]?.label || t}
            </span>
          ))}
          {session.is_shared && (
            <span className="px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] font-medium text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center gap-1">
              <Share2 className="w-3 h-3" /> Partagé
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
