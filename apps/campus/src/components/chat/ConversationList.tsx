import { Suspense, lazy } from "react";
import {
  MagnifyingGlass as Search,
  Plus,
  UsersThree as Users,
  ChatCircle as MessageSquare,
  PencilSimple,
  BellSlash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import type { Conversation } from "@/types";

const CreateGroupConversationModal = lazy(() =>
  import("@/components/modals/CreateGroupConversationModal").then((module) => ({
    default: module.CreateGroupConversationModal,
  }))
);

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading: boolean;
  onSelectConversation: (id: string) => void;
  onOpenNewPrivate: () => void;
  showCreateGroupModal: boolean;
  onSetShowCreateGroupModal: (show: boolean) => void;
  onGroupCreated: (groupData: any) => void;
  onPrefetchConversation?: (id: string) => void;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  searchQuery,
  onSearchChange,
  loading,
  onSelectConversation,
  onOpenNewPrivate,
  showCreateGroupModal,
  onSetShowCreateGroupModal,
  onGroupCreated,
  onPrefetchConversation,
}: ConversationListProps) {
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`w-full md:w-80 lg:w-88 border-r bg-card/60 backdrop-blur-md flex-shrink-0 ${
        selectedConversationId ? "hidden md:flex" : "flex"
      } flex-col h-full relative`}
    >
      {/* Top Header */}
      <div className="p-3.5 md:p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Messages
            </h2>
            {conversations.length > 0 && (
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {conversations.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Nouveau groupe"
              onClick={() => onSetShowCreateGroupModal(true)}
              title="Créer un groupe"
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Nouveau message"
              onClick={onOpenNewPrivate}
              title="Nouveau message privé"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {showCreateGroupModal && (
              <Suspense fallback={<ModalLoadingFallback />}>
                <CreateGroupConversationModal
                  open={showCreateGroupModal}
                  onOpenChange={onSetShowCreateGroupModal}
                  onGroupCreated={onGroupCreated}
                />
              </Suspense>
            )}
          </div>
        </div>

        {/* Modern Pill Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une discussion..."
            className="w-full bg-slate-100 dark:bg-zinc-800/80 border-0 rounded-full pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="overflow-y-auto flex-1 scrollbar-thin py-1.5">
        {loading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
                <div className="w-11 h-11 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded w-2/3" />
                  <div className="h-2.5 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                {searchQuery ? "Aucun résultat" : "Aucune conversation"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {searchQuery ? "Essayez un autre mot-clé" : "Démarrez une nouvelle conversation"}
              </p>
            </div>
          </div>
        ) : (
          (() => {
            let mutedIds: string[] = [];
            try {
              const raw = localStorage.getItem("chat:muted_conversations");
              if (raw) mutedIds = JSON.parse(raw);
            } catch {}
            const mutedSet = new Set(mutedIds);

            return filteredConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const isMuted = mutedSet.has(conversation.id);

              return (
                <div
                  key={conversation.id}
                  className={`mx-2 my-1 px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-150 select-none ${
                    isSelected
                      ? "bg-muted/80 text-foreground shadow-xs font-medium"
                      : "hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 text-foreground"
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                  onMouseEnter={() => onPrefetchConversation?.(conversation.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with Online Badge */}
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-11 w-11 shadow-xs ring-1 ring-border/30">
                        <AvatarImage src={conversation.avatar ?? undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                          {conversation.type === "group" ? (
                            <Users className="h-5 w-5" />
                          ) : (
                            (conversation.name || "?").slice(0, 1).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full shadow-xs animate-pulse" />
                      )}
                    </div>

                    {/* Info Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h3
                          className={`text-xs md:text-sm truncate ${
                            isSelected ? "font-bold text-foreground" : "font-semibold text-foreground"
                          }`}
                        >
                          {conversation.name || "Conversation"}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isMuted && <BellSlash className="h-3 w-3 text-muted-foreground/60" />}
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {formatRelativeTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate min-w-0">
                          {conversation.lastMessage ||
                            (conversation.type === "group"
                              ? "Conversation de groupe"
                              : "Nouvelle discussion")}
                        </p>
                        {conversation.unread > 0 && (
                          <span
                            className={`${
                              isMuted
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary text-primary-foreground"
                            } text-[10px] font-bold rounded-full min-w-4.5 h-4.5 px-1.5 flex items-center justify-center flex-shrink-0 shadow-xs`}
                          >
                            {conversation.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>

      {/* Floating Compose Button (Telegram style Reference 3) */}
      <button
        type="button"
        onClick={onOpenNewPrivate}
        className="absolute right-4 bottom-5 w-11 h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-10"
        title="Nouveau message"
        aria-label="Nouveau message"
      >
        <PencilSimple className="w-5 h-5" />
      </button>
    </div>
  );
}
