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
    <Card
      className={cn(
        "group border bg-card hover:shadow-md transition-all duration-200 overflow-hidden",
        className
      )}
    >
      <CardContent className="p-0">
        {/* Barre colorée en haut */}
        <div className={cn("h-1 w-full bg-[#ff9800]")} />

        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-xl flex-shrink-0 bg-[#ff9800]/10 border border-[#ff9800]/20")}>
              <Icon className={cn("h-4 w-4 text-[#ff9800]")} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground line-clamp-1">
                {session.content_preview || resourceName}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {resourceName}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {tools.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className="text-[10px] px-2 py-0 h-5 bg-[#ff9800]/10 border-[#ff9800]/20 border text-[#ff9800]"
              >
                {TOOL_CONFIG[t]?.label || t}
              </Badge>
            ))}
            {session.is_shared && (
              <Badge
                variant="secondary"
                className="text-[10px] px-2 py-0 h-5 bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 border"
              >
                <Share2 className="h-2.5 w-2.5 mr-1" />
                {session.sphere_name ? `Partagé dans ${session.sphere_name}` : "Partagé"}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-8 gap-1.5 campus-gradient text-white text-xs"
              onClick={() => onResume(session.id)}
            >
              <Play className="h-3 w-3" />
              Reprendre
            </Button>
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:border-red-500/50"
                onClick={() => onDelete(session.id)}
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
