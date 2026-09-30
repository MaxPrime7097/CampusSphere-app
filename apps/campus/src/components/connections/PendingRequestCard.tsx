import { Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ConnectionUser } from "./types";

interface PendingRequestCardProps {
  request: ConnectionUser;
  onNavigateProfile: (username: string) => void;
  onAccept: (request: ConnectionUser) => void;
  onReject: (request: ConnectionUser) => void;
}

export function PendingRequestCard({
  request,
  onNavigateProfile,
  onAccept,
  onReject,
}: PendingRequestCardProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 px-2 sm:px-3 border-b border-border/40 hover:bg-muted/30 transition-colors">
      <div
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        onClick={() => onNavigateProfile(request.username)}
      >
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={request.avatar} />
          <AvatarFallback className="bg-input text-muted-foreground font-semibold text-sm">
            {request.name?.slice(0, 1).toUpperCase() || "..."}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate hover:underline">
            {request.name}
          </h3>
          <p className="text-xs text-muted-foreground truncate">@{request.username}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          className="h-8 px-2.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 font-medium text-xs transition-colors shadow-none"
          onClick={() => onAccept(request)}
        >
          <Check className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Accepter</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 rounded-lg text-xs text-destructive hover:bg-destructive/10"
          onClick={() => onReject(request)}
        >
          <X className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Refuser</span>
        </Button>
      </div>
    </div>
  );
}
