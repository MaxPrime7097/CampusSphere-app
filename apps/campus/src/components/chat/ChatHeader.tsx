import React from "react";
import { useTranslation } from "react-i18next";
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
import {
  UsersThree as Users,
  Phone,
  Video,
  DotsThreeVertical as EllipsisVertical,
  Camera,
  Info,
  CaretLeft,
  User,
  Trash,
  SignOut,
  PencilSimple,
  Check,
} from "@phosphor-icons/react";
import { ImageUploadModal } from "@/components/modals/ImageUploadModal";
import type { Conversation } from "@/types";

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId?: string;
  transportMode: "ws" | "polling" | "idle";
  isUpdatingConversation: boolean;
  typingText?: string;
  onlineCount?: number;
  isDetailsOpen?: boolean;
  onToggleDetails?: () => void;
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
  typingText,
  onlineCount,
  isDetailsOpen,
  onToggleDetails,
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
  const { t } = useTranslation("messages");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);
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
    if (isGroup) {
      setIsAvatarModalOpen(true);
    } else {
      onNavigateProfile(otherParticipant?.username, otherParticipant?.name || conversation.name);
    }
  };

  return (
    <div className="p-3 md:p-4 border-b bg-card/50 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 rounded-full text-foreground hover:bg-muted active:scale-95 transition-transform flex-shrink-0 -ml-1"
            onClick={onBack}
            aria-label={t("header.backToDiscussions")}
            title={t("header.back")}
          >
            <CaretLeft className="h-5 w-5" weight="bold" />
          </Button>

          <div className="relative flex-shrink-0">
            <Avatar
              className={`h-10 w-10 transition-opacity cursor-pointer hover:opacity-85 ${
                !isGroup && !otherParticipant?.username ? "opacity-70" : ""
              }`}
              onClick={handleAvatarClick}
              title={isGroup ? t("header.changeGroupPhoto") : otherParticipant?.name || conversation.name}
            >
              <AvatarImage src={conversation.avatar ?? undefined} />
              <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
                {isGroup ? (
                  <Users className="h-5 w-5" />
                ) : (
                  (conversation.name || "...").slice(0, 1).toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>
            {conversation.isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
            )}
            {isGroup && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAvatarModalOpen(true);
                }}
                className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-transform active:scale-95 shadow-xs"
                title={t("header.changeGroupPhoto")}
                aria-label={t("header.changeGroupPhoto")}
              >
                <Camera className="h-3 w-3 text-white" />
              </button>
            )}
          </div>

          <div
            className={`min-w-0 flex-1 ${onToggleDetails ? "cursor-pointer select-none" : ""}`}
            onClick={onToggleDetails}
          >
            <h3 className="font-semibold text-sm md:text-base truncate pr-2 max-w-[160px] md:max-w-none text-foreground hover:opacity-80 transition-opacity">
              {conversation.name || t("header.user")}
            </h3>
            {typingText ? (
              <p className="text-xs text-primary font-medium truncate flex items-center gap-1.5 animate-pulse">
                <span>{typingText}</span>
              </p>
            ) : isGroup ? (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                <span>
                  {t("header.members", { count: conversation.participants?.length || 0 })}
                </span>
                {onlineCount !== undefined && onlineCount > 0 && (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="text-emerald-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {t("header.onlineCount", { count: onlineCount })}
                    </span>
                  </>
                )}
              </p>
            ) : conversation.isOnline ? (
              <p className="text-xs text-emerald-500 font-medium truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("header.online")}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground truncate">
                {otherParticipant?.username
                  ? `@${otherParticipant.username}`
                  : t("header.privateConversation")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label={t("header.audioCall")}
                disabled
              >
                <Phone className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("header.soonAvailable")}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label={t("header.videoCall")}
                disabled
              >
                <Video className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("header.soonAvailable")}</p>
            </TooltipContent>
          </Tooltip>

          {onToggleDetails && (
            <Button
              variant={isDetailsOpen ? "secondary" : "ghost"}
              size="sm"
              className={`h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-full transition-colors ${
                isDetailsOpen
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              aria-label={t("header.conversationInfo")}
              onClick={onToggleDetails}
              title={t("header.conversationInfo")}
            >
              <Info className="h-5 w-5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label={t("header.moreOptions")}
              >
                <EllipsisVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {isGroup ? (
                <>
                  {onToggleDetails && (
                    <DropdownMenuItem onClick={onToggleDetails} className="gap-2.5 text-xs">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      {t("header.groupInfo")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onOpenParticipants} className="gap-2.5 text-xs">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {t("header.groupMembers", { count: conversation.participants?.length || 0 })}
                  </DropdownMenuItem>
                  {canRenameGroup && (
                    <DropdownMenuItem
                      onClick={onRenameGroup}
                      disabled={isUpdatingConversation}
                      className="gap-2.5 text-xs"
                    >
                      <PencilSimple className="h-4 w-4 text-muted-foreground" />
                      {t("header.renameGroup")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setIsAvatarModalOpen(true)} className="gap-2.5 text-xs">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    {t("header.changePhoto")}
                  </DropdownMenuItem>
                  {isGroupCreator && conversation.avatar && (
                    <DropdownMenuItem onClick={onRemoveAvatar} className="gap-2.5 text-xs">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      {t("header.removePhoto")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onMarkUnread} className="gap-2.5 text-xs">
                    <Check className="h-4 w-4 text-muted-foreground" />
                    {t("header.markUnread")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onLeaveConversation}
                    disabled={isUpdatingConversation}
                    className="gap-2.5 text-xs text-rose-500 focus:text-rose-500"
                  >
                    <SignOut className="h-4 w-4" />
                    {t("header.leaveGroup")}
                  </DropdownMenuItem>
                  {canDeleteConversation && (
                    <DropdownMenuItem
                      onClick={onDeleteConversation}
                      disabled={isUpdatingConversation}
                      className="gap-2.5 text-xs text-destructive focus:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                      {t("header.deleteGroup")}
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                <>
                  {onToggleDetails && (
                    <DropdownMenuItem onClick={onToggleDetails} className="gap-2.5 text-xs">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      {t("header.contactInfo")}
                    </DropdownMenuItem>
                  )}
                  {otherParticipant?.username && (
                    <DropdownMenuItem
                      onClick={() =>
                        onNavigateProfile(
                          otherParticipant?.username,
                          otherParticipant?.name || conversation.name
                        )
                      }
                      className="gap-2.5 text-xs"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      {t("header.viewProfile")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onMarkUnread} className="gap-2.5 text-xs">
                    <Check className="h-4 w-4 text-muted-foreground" />
                    {t("header.markUnread")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDeleteConversation}
                    disabled={isUpdatingConversation}
                    className="gap-2.5 text-xs text-destructive focus:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                    {t("header.deleteConversation")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ImageUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSave={async (file) => {
          await onAvatarUpload(file);
          setIsAvatarModalOpen(false);
        }}
        title={t("header.groupPhotoTitle")}
        description={t("header.groupPhotoDesc")}
        currentImage={conversation.avatar ?? undefined}
        shape="round"
        aspectRatio={1}
      />
    </div>
  );
}
