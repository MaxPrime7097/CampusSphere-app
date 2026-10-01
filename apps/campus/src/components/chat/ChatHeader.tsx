import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UsersThree as Users, Phone, Video, DotsThreeVertical as EllipsisVertical, Camera } from "@phosphor-icons/react";
import type { Conversation } from "@/types";

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId?: string;
  transportMode: "ws" | "polling" | "idle";
  isUpdatingConversation: boolean;
  onBack: () => void;
  onOpenParticipants: () => void;
  onRenameGroup: () => void;
  onMarkUnread: () => void;
  onLeaveConversation: () => void;
  onDeleteConversation: () => void;
  onAvatarUpload: (file: File) => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
  onNavigateProfile: (username?: string, displayName?: string) => void;
}

export function ChatHeader({
  conversation,
  currentUserId,
  transportMode,
  isUpdatingConversation,
  onBack,
  onOpenParticipants,
  onRenameGroup,
  onMarkUnread,
  onLeaveConversation,
  onDeleteConversation,
  onAvatarUpload,
  onRemoveAvatar,
  onNavigateProfile,
}: ChatHeaderProps) {
  const isGroup = conversation.type === "group";
  const isGroupCreator =
    isGroup && String(conversation.createdBy || "") === String(currentUserId || "");
  const canRenameGroup = Boolean(isGroup && isGroupCreator);
  const canDeleteConversation = Boolean(isGroup && isGroupCreator);

  const otherParticipant =
    (conversation.participants || []).find(
      (p: any) => String(p.id) !== String(currentUserId)
    ) || conversation.participants?.[0];

  const handleAvatarClick = () => {
    if (!isGroup) {
      onNavigateProfile(otherParticipant?.username, otherParticipant?.name || conversation.name);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onAvatarUpload(file);
      e.target.value = "";
    }
  };

  return (
    <div className="p-3 md:p-4 border-b bg-card/50 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-8 w-8 p-0 flex-shrink-0"
            onClick={onBack}
          >
            ←
          </Button>

          <div className="relative flex-shrink-0">
            <Avatar
              className={`h-8 w-8 transition-opacity ${
                isGroup
                  ? "cursor-default"
                  : otherParticipant?.username
                  ? "cursor-pointer hover:opacity-80"
                  : "cursor-not-allowed opacity-60"
              }`}
              onClick={handleAvatarClick}
            >
              <AvatarImage src={conversation.avatar ?? undefined} />
              <AvatarFallback className="bg-input text-muted-foreground font-semibold text-xs md:text-sm">
                {isGroup ? (
                  <Users className="h-4 w-4" />
                ) : (
                  (conversation.name || "...").slice(0, 1).toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>
            {conversation.isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            )}
            {isGroupCreator && (
              <label
                className="absolute -bottom-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80"
                title="Changer l'avatar du groupe"
              >
                <Camera className="h-2.5 w-2.5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm md:text-base truncate pr-2 max-w-[140px] md:max-w-none">
              {conversation.name || "Utilisateur"}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {isGroup
                ? `${conversation.participants?.length || 0} membre${
                    (conversation.participants?.length || 0) > 1 ? "s" : ""
                  }`
                : otherParticipant?.username
                ? `@${otherParticipant.username}`
                : "Conversation privée"}
            </p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  transportMode === "ws"
                    ? "bg-green-500"
                    : transportMode === "polling"
                    ? "bg-yellow-500"
                    : "bg-muted-foreground"
                }`}
              />
              {transportMode === "ws"
                ? "Temps réel"
                : transportMode === "polling"
                ? "Polling"
                : "Hors ligne"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 md:h-9 md:w-9"
                  aria-label="Voice call"
                  disabled
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bientôt disponible</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 md:h-9 md:w-9"
                  aria-label="Video call"
                  disabled
                >
                  <Video className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bientôt disponible</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 md:h-9 md:w-9"
                aria-label="More options"
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenParticipants}>
                Voir les participants
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onRenameGroup}
                disabled={!canRenameGroup || isUpdatingConversation}
              >
                Renommer groupe
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onOpenParticipants}
                disabled={!isGroup}
              >
                Ajouter/retirer membres
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMarkUnread}>
                Marquer non lu
              </DropdownMenuItem>
              {isGroupCreator && conversation.avatar && (
                <DropdownMenuItem onClick={onRemoveAvatar}>
                  Supprimer l'avatar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={onLeaveConversation}
                disabled={isUpdatingConversation}
              >
                Quitter conversation
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDeleteConversation}
                disabled={!canDeleteConversation || isUpdatingConversation}
                className="text-destructive focus:text-destructive"
              >
                Supprimer conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
