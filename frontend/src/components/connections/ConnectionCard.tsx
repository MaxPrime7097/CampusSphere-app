import { UserCheck, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card
      className="border bg-card hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => onNavigateProfile(connection.username)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={connection.avatar} />
            <AvatarFallback className="bg-input text-muted-foreground font-bold text-lg">
              {connection.name?.slice(0, 1).toUpperCase() || "..."}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm truncate">{connection.name}</h3>
              {connection.isVerified && (
                <div className="w-3.5 h-3.5 campus-gradient rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[8px]">V</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">@{connection.username}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {connection.university && (
                <Badge
                  variant="secondary"
                  className="text-[9px] h-4 px-1.5 py-0 max-w-[100px] truncate"
                  title={formatSlugToLabel(connection.university)}
                >
                  {truncate(formatSlugToLabel(connection.university), 15)}
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Zap className="h-2.5 w-2.5 text-primary" />
                {connection.impactScore ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                {connection.mutualFriends ?? 0} communs
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateMessage(connection.id);
            }}
          >
            <span className="sr-only">Message</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
              <UserCheck className="h-4 w-4" />
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
