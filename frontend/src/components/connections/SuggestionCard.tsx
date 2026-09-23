import { Link, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card
      className="border bg-card hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => onNavigateProfile(suggestion.username)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={suggestion.avatar} />
            <AvatarFallback className="bg-input text-muted-foreground font-bold text-lg">
              {suggestion.name?.slice(0, 1).toUpperCase() || "..."}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{suggestion.name}</h3>
            <p className="text-xs text-muted-foreground">@{suggestion.username}</p>
            {suggestion.reason && (
              <p className="text-[10px] text-primary/80 italic mt-0.5 truncate w-full">
                {suggestion.reason}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {suggestion.university && (
                <Badge
                  variant="secondary"
                  className="text-[9px] h-4 px-1.5 py-0 max-w-[100px] truncate"
                  title={formatSlugToLabel(suggestion.university)}
                >
                  {truncate(formatSlugToLabel(suggestion.university), 15)}
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Zap className="h-2.5 w-2.5 text-primary" />
                {suggestion.impactScore ?? 0}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            className="flex-shrink-0 h-8 w-8 sm:w-auto p-0 sm:px-3 text-xs campus-gradient text-white hover:opacity-90"
            onClick={(e) => onConnect(e, suggestion)}
          >
            <Link className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Connecter</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
