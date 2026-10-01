import { UserCheck, Zap, BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatSlugToLabel, truncate } from "@/lib/utils";
import type { ConnectionUser } from "./types";

interface ConnectionCardProps {
  connection: ConnectionUser;
  onNavigateProfile: (username: string) => void;
  onNavigateMessage: (id: string) => void;
}

export function ConnectionCard({
  connection,
  onNavigateProfile,
  onNavigateMessage,
}: ConnectionCardProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-3 px-2 sm:px-3 border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => onNavigateProfile(connection.username)}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={connection.avatar} />
          <AvatarFallback className="bg-input text-muted-foreground font-semibold text-sm">
            {connection.name?.slice(0, 1).toUpperCase() || "..."}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-medium text-sm truncate hover:underline">{connection.name}</h3>
            {connection.isVerified && (
              <BadgeCheck className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">@{connection.username}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-muted-foreground">
            {connection.university && (
              <span>{truncate(formatSlugToLabel(connection.university), 20)}</span>
            )}
            {connection.university && <span>·</span>}
            <span className="flex items-center gap-0.5 text-foreground/80 font-medium">
              <Zap className="h-3 w-3 text-primary fill-primary" />
              {connection.impactScore ?? 0}
            </span>
            {connection.mutualFriends ? (
              <>
                <span>·</span>
                <span>{connection.mutualFriends} en commun</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="h-8 px-3 rounded-lg border border-border/60 hover:bg-muted font-normal text-xs text-secondary-foreground shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onNavigateMessage(connection.id);
        }}
      >
        <UserCheck className="h-3.5 w-3.5 mr-1.5" />
        Message
      </Button>
    </div>
  );
}
