import { Link, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatSlugToLabel, truncate } from "@/lib/utils";
import type { ConnectionUser } from "./types";

interface SuggestionCardProps {
  suggestion: ConnectionUser;
  onNavigateProfile: (username: string) => void;
  onConnect: (e: React.MouseEvent, suggestion: ConnectionUser) => void;
}

export function SuggestionCard({
  suggestion,
  onNavigateProfile,
  onConnect,
}: SuggestionCardProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-3 px-2 sm:px-3 border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => onNavigateProfile(suggestion.username)}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={suggestion.avatar} />
          <AvatarFallback className="bg-input text-muted-foreground font-semibold text-sm">
            {suggestion.name?.slice(0, 1).toUpperCase() || "..."}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate hover:underline">{suggestion.name}</h3>
          <p className="text-xs text-muted-foreground truncate">@{suggestion.username}</p>
          {suggestion.reason && (
            <p className="text-[11px] text-muted-foreground/80 italic mt-0.5 truncate">
              {suggestion.reason}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-muted-foreground">
            {suggestion.university && (
              <span>{truncate(formatSlugToLabel(suggestion.university), 20)}</span>
            )}
            {suggestion.university && <span>·</span>}
            <span className="flex items-center gap-0.5">
              <Zap className="h-3 w-3 text-muted-foreground" />
              {suggestion.impactScore ?? 0}
            </span>
          </div>
        </div>
      </div>
      <Button
        size="sm"
        className="h-8 px-3 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 font-medium text-xs shrink-0 transition-colors shadow-none"
        onClick={(e) => onConnect(e, suggestion)}
      >
        <Link className="h-3.5 w-3.5 mr-1.5" />
        Connecter
      </Button>
    </div>
  );
}
