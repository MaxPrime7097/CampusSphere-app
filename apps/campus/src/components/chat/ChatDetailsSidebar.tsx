import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  X,
  Bell,
  BellSlash,
  Image as ImageIcon,
  FileText,
  User,
  UsersThree as Users,
  SignOut,
  Camera,
  DownloadSimple,
  PencilSimple,
  UserPlus,
  VideoCamera,
  Play,
} from "@phosphor-icons/react";
import { ImageUploadModal } from "@/components/modals/ImageUploadModal";
import type { Conversation, ConversationParticipant, Message } from "@/types";

interface ChatDetailsSidebarProps {
  conversation: Conversation;
  currentUserId?: string;
  messages: Message[];
  participants: ConversationParticipant[];
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onlineCount?: number;
  onOpenParticipants: () => void;
  onRenameGroup: () => void;
  onLeaveConversation: () => void;
  onDeleteConversation: () => void;
  onAvatarUpload: (file: File) => Promise<void>;
  onNavigateProfile: (username?: string, displayName?: string) => void;
  onOpenMedia?: (mediaUrl: string, mediaType?: string, fileName?: string) => void;
}

export function ChatDetailsSidebar({
  conversation,
  currentUserId,
  messages,
  participants,
  isOpen,
  isLoading = false,
  onClose,
  onlineCount,
  onOpenParticipants,
  onRenameGroup,
  onLeaveConversation,
  onAvatarUpload,
  onNavigateProfile,
  onOpenMedia,
}: ChatDetailsSidebarProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"media" | "files" | "members">("media");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [notificationsMuted, setNotificationsMuted] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("chat:muted_conversations");
      if (!stored) return false;
      const list = JSON.parse(stored);
      return Array.isArray(list) && list.includes(conversation.id);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("chat:muted_conversations");
      if (!stored) {
        setNotificationsMuted(false);
        return;
      }
      const list = JSON.parse(stored);
      setNotificationsMuted(Array.isArray(list) && list.includes(conversation.id));
    } catch {
      setNotificationsMuted(false);
    }
  }, [conversation.id]);

  const handleToggleMute = () => {
    try {
      const stored = localStorage.getItem("chat:muted_conversations");
      const list: string[] = stored ? JSON.parse(stored) : [];
      let nextState = false;
      let nextList: string[];
      if (list.includes(conversation.id)) {
        nextList = list.filter((id) => id !== conversation.id);
        nextState = false;
        toast({
          title: "Notifications réactivées",
          description: `Les notifications pour ${conversation.name || "cette conversation"} sont maintenant actives.`,
        });
      } else {
        nextList = [...list, conversation.id];
        nextState = true;
        toast({
          title: "Conversation en sourdine",
          description: `Les notifications pour ${conversation.name || "cette conversation"} ont été coupées.`,
        });
      }
      localStorage.setItem("chat:muted_conversations", JSON.stringify(nextList));
      setNotificationsMuted(nextState);
    } catch (e) {
      console.error("Failed to update mute state:", e);
    }
  };

  if (!isOpen) return null;

  const isGroup = conversation.type === "group";
  const isGroupCreator =
    isGroup && String(conversation.createdBy || "") === String(currentUserId || "");

  const otherParticipant =
    (conversation.participants || []).find(
      (p: any) => String(p.id) !== String(currentUserId)
    ) || conversation.participants?.[0];

  const isVideoMsg = (m: Message) =>
    Boolean(
      m.mediaUrl &&
      (m.mediaType === "video" ||
        m.type === "video" ||
        m.mediaType?.startsWith("video/") ||
        /\.(mp4|webm|mov|mkv|avi|ogv)$/i.test(m.mediaUrl || m.fileName || ""))
    );

  const sharedMedia = messages.filter(
    (m) =>
      !m.isDeleted &&
      Boolean(m.mediaUrl) &&
      (m.mediaType === "image" ||
        m.type === "image" ||
        m.mediaType?.startsWith("image/") ||
        isVideoMsg(m))
  );

  const sharedFiles = messages.filter(
    (m) =>
      !m.isDeleted &&
      Boolean(m.mediaUrl) &&
      m.mediaType !== "image" &&
      m.type !== "image" &&
      !m.mediaType?.startsWith("image/") &&
      m.mediaType !== "audio" &&
      m.type !== "audio" &&
      !isVideoMsg(m)
  );

  return (
    <aside className="fixed inset-0 z-50 md:relative md:inset-auto md:w-80 lg:w-88 border-l bg-background md:bg-card/95 backdrop-blur-md flex flex-col h-full flex-shrink-0 transition-all duration-200 shadow-2xl md:shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b flex-shrink-0">
        <h3 className="font-semibold text-sm text-foreground">
          {isGroup ? "Détails du groupe" : "Infos du contact"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-5">
        {isLoading ? (
          /* Smooth Skeleton Loading State */
          <div className="flex flex-col items-center text-center pt-4 space-y-4 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-muted" />
            <div className="space-y-1.5 w-full flex flex-col items-center">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
            <div className="flex gap-2 w-full pt-2">
              <div className="flex-1 h-12 bg-muted rounded-xl" />
              <div className="flex-1 h-12 bg-muted rounded-xl" />
            </div>
            <div className="w-full h-8 bg-muted rounded-xl" />
            <div className="grid grid-cols-3 gap-1.5 w-full pt-2">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="aspect-square bg-muted rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            {/* Profile Card Center (Matches Dribbble & Telegram references) */}
            <div className="flex flex-col items-center text-center pt-2">
              <div
                className={`relative group mb-3 ${isGroup ? "cursor-pointer" : ""}`}
                onClick={() => {
                  if (isGroup) setIsAvatarModalOpen(true);
                }}
              >
                <Avatar className="h-20 w-20 ring-4 ring-border/40 shadow-md">
                  <AvatarImage src={conversation.avatar ?? undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xl">
                    {isGroup ? (
                      <Users className="h-8 w-8" />
                    ) : (
                      (conversation.name || "?").slice(0, 1).toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                {conversation.isOnline && (
                  <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full shadow-sm animate-pulse" />
                )}
                {isGroup && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAvatarModalOpen(true);
                    }}
                    className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                    title="Changer la photo du groupe"
                    aria-label="Changer la photo du groupe"
                  >
                    <Camera className="h-6 w-6" />
                  </button>
                )}
              </div>

              <h4 className="font-semibold text-base text-foreground max-w-[240px] truncate">
                {conversation.name || "Conversation"}
              </h4>

              {isGroup && (
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="mt-1 text-xs text-primary hover:underline font-medium flex items-center gap-1.5"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Modifier la photo
                </button>
              )}

              {isGroup ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {conversation.participants?.length || 0} membres
                  {onlineCount !== undefined && onlineCount > 0 && (
                    <span className="text-emerald-500 font-medium ml-1.5">
                      • 🟢 {onlineCount} en ligne
                    </span>
                  )}
                </p>
              ) : conversation.isOnline ? (
                <p className="text-xs text-emerald-500 font-medium mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En ligne
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {otherParticipant?.username ? `@${otherParticipant.username}` : "Hors ligne"}
                </p>
              )}

              {/* Action Pills Bar (Mute, Profile/Rename, Leave) */}
              <div className="flex items-center justify-center gap-2 mt-4 w-full">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
                >
                  {notificationsMuted ? (
                    <BellSlash className="h-4 w-4 mb-1 text-rose-500" />
                  ) : (
                    <Bell className="h-4 w-4 mb-1" />
                  )}
                  <span className="text-[11px] font-medium truncate max-w-full">
                    {notificationsMuted ? "Sourdine" : "Notifs"}
                  </span>
                </button>

                {isGroup ? (
                  <button
                    type="button"
                    onClick={onRenameGroup}
                    className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
                  >
                    <PencilSimple className="h-4 w-4 mb-1" />
                    <span className="text-[11px] font-medium truncate max-w-full">Renommer</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateProfile(otherParticipant?.username, otherParticipant?.name)
                    }
                    className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs"
                  >
                    <User className="h-4 w-4 mb-1" />
                    <span className="text-[11px] font-medium truncate max-w-full">Profil</span>
                  </button>
                )}

                {isGroup && (
                  <button
                    type="button"
                    onClick={onLeaveConversation}
                    className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-muted/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-muted-foreground hover:text-rose-500 transition-colors text-xs"
                  >
                    <SignOut className="h-4 w-4 mb-1" />
                    <span className="text-[11px] font-medium truncate max-w-full">Quitter</span>
                  </button>
                )}
              </div>
            </div>

            {/* Media / Files / Members Tabs */}
            <div className="pt-2">
              <div className="flex bg-muted/60 p-1 rounded-xl gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("media")}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === "media"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Médias ({sharedMedia.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("files")}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    activeTab === "files"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Fichiers ({sharedFiles.length})
                </button>
                {isGroup && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("members")}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                      activeTab === "members"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Membres
                  </button>
                )}
              </div>

              <div className="mt-3">
                {/* Media Tab: 3-column Grid (Opens Lightbox on click) */}
                {activeTab === "media" && (
                  <div>
                    {sharedMedia.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        <ImageIcon className="h-7 w-7 mx-auto mb-2 opacity-30" />
                        Aucune photo partagée
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5">
                        {sharedMedia.map((m) => {
                          const isVid = isVideoMsg(m);
                          return (
                            <div
                              key={m.id}
                              className="aspect-square rounded-lg overflow-hidden bg-muted group relative cursor-pointer"
                              onClick={() => {
                                if (onOpenMedia) {
                                  onOpenMedia(m.mediaUrl!, isVid ? "video" : "image", m.fileName || undefined);
                                } else {
                                  window.open(m.mediaUrl!, "_blank");
                                }
                              }}
                            >
                              {isVid ? (
                                <div className="w-full h-full bg-black relative flex items-center justify-center">
                                  <video
                                    src={m.mediaUrl!}
                                    className="w-full h-full object-cover opacity-80"
                                    muted
                                    preload="metadata"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center shadow-xs">
                                      <Play className="h-3 w-3 ml-0.5" weight="fill" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={m.mediaUrl!}
                                  alt="Média"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  loading="lazy"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Files Tab */}
                {activeTab === "files" && (
                  <div className="space-y-1.5">
                    {sharedFiles.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        <FileText className="h-7 w-7 mx-auto mb-2 opacity-30" />
                        Aucun fichier partagé
                      </div>
                    ) : (
                      sharedFiles.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/40 hover:bg-muted transition-colors text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate text-foreground">
                              {m.fileName || "Document"}
                            </p>
                          </div>
                          <a
                            href={m.mediaUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={m.fileName || true}
                            className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-background text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                          >
                            <DownloadSimple className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Members Tab */}
                {activeTab === "members" && isGroup && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onOpenParticipants}
                      className="w-full text-xs gap-1.5 rounded-xl border-dashed"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Gérer les membres
                    </Button>

                    <div className="divide-y divide-border/40 pt-1">
                      {(conversation.participants || []).map((p: any) => {
                        const isYou = String(p.id) === String(currentUserId);
                        const isAdmin = String(p.id) === String(conversation.createdBy);
                        return (
                          <div
                            key={p.id}
                            className="flex items-center gap-2.5 py-2 hover:bg-muted/30 px-1 rounded-lg cursor-pointer"
                            onClick={() => onNavigateProfile(p.username, p.name || p.full_name)}
                          >
                            <Avatar className="h-7 w-7 flex-shrink-0">
                              <AvatarImage src={p.avatar} />
                              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground font-semibold">
                                {(p.name || p.username || "?").slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate text-foreground">
                                {p.full_name || p.name || p.username || "Utilisateur"}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {p.username ? `@${p.username}` : ""}
                              </p>
                            </div>
                            {isAdmin ? (
                              <span className="text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                Admin
                              </span>
                            ) : isYou ? (
                              <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                Vous
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <ImageUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSave={async (file) => {
          await onAvatarUpload(file);
          setIsAvatarModalOpen(false);
        }}
        title="Photo du groupe"
        description="Recadrez et ajustez l'image du groupe."
        currentImage={conversation.avatar ?? undefined}
        shape="round"
        aspectRatio={1}
      />
    </aside>
  );
}
