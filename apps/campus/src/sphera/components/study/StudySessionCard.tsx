import React from "react";
import { BookOpen, BrainCircuit, Share2, Trash2, SquareStack } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { cn } from "@/lib/utils";

interface StudySessionCardProps {
  session: {
    id: number;
    tool_types: string[];
    resource_title: string;
    source_filename?: string;
    content_preview?: string;
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
    icon: SquareStack,
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
  const config = (TOOL_CONFIG as Record<string, { icon: any; label: string }>)[primaryTool] || TOOL_CONFIG.fiche;
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
        "group py-3.5 px-2 flex items-center justify-between gap-3 border-b border-border/40 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-foreground truncate">
              {session.content_preview || resourceName}
            </h3>
            {session.is_shared && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-0.5">
                <Share2 className="w-2.5 h-2.5" /> Partagé
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Extrait de {resourceName} • {timeAgo}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden sm:flex gap-1">
          {tools.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground"
            >
              {(TOOL_CONFIG as any)[t]?.label || t}
            </span>
          ))}
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
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
};

