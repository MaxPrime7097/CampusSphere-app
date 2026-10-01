import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Smiley as Smile, DotsThreeVertical as MoreVertical, Pencil, Trash, Checks as CheckCheck } from "@phosphor-icons/react";
import { formatRelativeTime } from "@/lib/date";
import type { Message } from "@/types";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface ChatMessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  isModerator: boolean;
  isEditing: boolean;
  editingContent: string;
  onStartEdit: (message: Message) => void;
  onChangeEditContent: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (messageId: string) => void;
  messageReactions?: Record<string, string[]>;
  onToggleReaction: (messageId: string, emoji: string) => void;
  showEmojiPicker: boolean;
  onToggleEmojiPicker: (messageId: string) => void;
  onSelectEmoji: (messageId: string, emoji: string) => void;
  onNavigateProfile: (username?: string, displayName?: string) => void;
}

export function ChatMessageItem({
  message,
  isCurrentUser,
  isModerator,
  isEditing,
  editingContent,
  onStartEdit,
  onChangeEditContent,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  messageReactions = {},
  onToggleReaction,
  showEmojiPicker,
  onToggleEmojiPicker,
  onSelectEmoji,
  onNavigateProfile,
}: ChatMessageItemProps) {
  const canEdit = Boolean(message.canEdit || isModerator);
  const canDelete = Boolean(message.canDelete || isModerator);

  return (
    <div className={`flex gap-3 group ${isCurrentUser ? "flex-row-reverse" : ""}`}>
      {!isCurrentUser && (
        <Avatar
          className={`h-8 w-8 flex-shrink-0 transition-opacity ${
            message.senderUsername
              ? "cursor-pointer hover:opacity-80"
              : "cursor-not-allowed opacity-60"
          }`}
          onClick={() => onNavigateProfile(message.senderUsername, message.sender)}
        >
          <AvatarImage src={message.avatar} />
          <AvatarFallback className="bg-input text-muted-foreground font-semibold text-xs md:text-sm">
            {message.sender?.slice(0, 1).toUpperCase() || "..."}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`relative max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] min-w-0 ${
          isCurrentUser ? "text-right ml-auto" : "text-left mr-auto"
        }`}
      >
        {!isCurrentUser && (
          <p
            className={`text-xs text-muted-foreground mb-1 ${
              message.senderUsername
                ? "cursor-pointer hover:underline"
                : "cursor-not-allowed opacity-60"
            }`}
            onClick={() => onNavigateProfile(message.senderUsername, message.sender)}
          >
            {message.sender}
          </p>
        )}

        {/* Bubble */}
        <div
          className={`group/bubble relative inline-block max-w-full px-3.5 py-2 rounded-2xl text-sm break-words overflow-wrap-anywhere ${
            isCurrentUser
              ? "bg-secondary text-secondary-foreground border border-border/60 rounded-br-sm"
              : "bg-muted/50 text-foreground border border-border/30 rounded-bl-sm"
          }`}
        >
          {isEditing ? (
            <div className="space-y-2 min-w-[200px]">
              <Input
                value={editingContent}
                onChange={(e) => onChangeEditContent(e.target.value)}
                className="bg-background text-foreground h-8 text-sm"
                maxLength={1000}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
              />
              <div className="flex gap-1.5 justify-end">
                <Button
                  size="sm"
                  className="h-6 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60"
                  onClick={onSaveEdit}
                >
                  OK
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={onCancelEdit}>
                  ✕
                </Button>
              </div>
            </div>
          ) : (
            <p className="leading-relaxed break-all whitespace-pre-wrap">
              {message.content.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) =>
                /^https?:\/\//.test(part) ? (
                  <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:opacity-80 break-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {part}
                  </a>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
              {message.isEdited && (
                <span className="text-[10px] opacity-70 ml-2 italic whitespace-nowrap">
                  (modifié)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Actions & Reactions row */}
        {!isEditing && (
          <div
            className={`flex flex-wrap items-center gap-1.5 mt-1.5 relative ${
              isCurrentUser ? "justify-end" : "justify-start"
            }`}
          >
            {/* Reactions badges */}
            {Object.entries(messageReactions).map(([emoji, users]) =>
              users.length > 0 ? (
                <button
                  key={emoji}
                  className="text-[10px] bg-card border rounded-full px-1.5 py-0.5 flex items-center gap-1 hover:bg-muted transition-colors"
                  onClick={() => onToggleReaction(message.id, emoji)}
                >
                  {emoji} <span className="font-medium">{users.length}</span>
                </button>
              ) : null
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-0.5">
              <button
                className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground/60 hover:text-foreground"
                title="Réagir"
                onClick={() => onToggleEmojiPicker(message.id)}
              >
                <Smile className="h-3.5 w-3.5" />
              </button>

              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground/60 hover:text-foreground">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuContent
                      side="bottom"
                      align={isCurrentUser ? "end" : "start"}
                      className="z-50"
                    >
                      {canEdit && (
                        <DropdownMenuItem onClick={() => onStartEdit(message)} className="gap-2">
                          <Pencil className="h-3.5 w-3.5" /> Modifier
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(message.id)}
                          className="text-destructive focus:text-destructive gap-2"
                        >
                          <Trash className="h-3.5 w-3.5" /> Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenuPortal>
                </DropdownMenu>
              )}
            </div>

            {/* Emoji picker popup */}
            {showEmojiPicker && (
              <div
                className={`absolute bottom-full mb-2 ${
                  isCurrentUser ? "right-0" : "left-0"
                } flex gap-1 bg-card border rounded-full px-2 py-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100`}
              >
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className="text-base hover:scale-125 transition-transform"
                    onClick={() => onSelectEmoji(message.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <p
          className={`text-[10px] text-muted-foreground mt-1 flex items-center gap-1 ${
            isCurrentUser ? "justify-end" : ""
          }`}
        >
          {formatRelativeTime(message.timestamp)}
          {isCurrentUser && <CheckCheck className="h-2.5 w-2.5 text-muted-foreground" />}
        </p>
      </div>
    </div>
  );
}
