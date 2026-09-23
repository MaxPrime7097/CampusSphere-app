import { Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="border bg-card hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar
            className="h-12 w-12 flex-shrink-0 cursor-pointer"
            onClick={() => onNavigateProfile(request.username)}
          >
            <AvatarImage src={request.avatar} />
            <AvatarFallback className="bg-input text-muted-foreground font-bold text-lg">
              {request.name?.slice(0, 1).toUpperCase() || "..."}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-sm truncate cursor-pointer hover:underline"
              onClick={() => onNavigateProfile(request.username)}
            >
              {request.name}
            </h3>
            <p className="text-xs text-muted-foreground">@{request.username}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              className="h-8 w-8 sm:w-auto p-0 sm:px-3 text-xs campus-gradient text-white hover:opacity-90"
              onClick={() => onAccept(request)}
            >
              <Check className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Accepter</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 sm:w-auto p-0 sm:px-3 text-xs text-destructive hover:bg-destructive/10"
              onClick={() => onReject(request)}
            >
              <X className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refuser</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
