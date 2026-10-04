import { Suspense, lazy } from "react";
import { MagnifyingGlass as Search, Plus, UsersThree as Users, ChatCircle as MessageSquare } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/date";
import { parseSlugId } from "@/lib/hashids";
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
}: ConversationListProps) {
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`w-full md:w-80 lg:w-96 border-r bg-card/50 flex-shrink-0 ${
        selectedConversationId ? "hidden md:flex" : "flex"
      } flex-col h-full`}
    >
      <div className="p-3 md:p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Messages
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              aria-label="Nouveau message privé"
              onClick={onOpenNewPrivate}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              aria-label="Nouveau groupe"
              onClick={() => onSetShowCreateGroupModal(true)}
            >
              <Users className="h-4 w-4" />
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une conversation..."
            className="pl-10 text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-y-auto flex-1 scrollbar-thin">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 border-b animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {searchQuery ? "Aucun résultat" : "Aucune conversation"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {searchQuery ? "Essayez un autre nom" : "Démarrez une nouvelle conversation"}
              </p>
            </div>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isSelected =
              selectedConversationId === conversation.id ||
              (conversation.hash_id && selectedConversationId === conversation.hash_id) ||
              (parseSlugId(selectedConversationId) !== null &&
                parseSlugId(selectedConversationId) ===
                  (conversation.numericId ?? parseSlugId(conversation.id)));
            return (
              <div
                key={conversation.id}
                className={`p-3 md:p-4 border-b cursor-pointer transition-colors hover:bg-accent/50 ${
                  isSelected ? "bg-accent" : ""
                }`}
                onClick={() => onSelectConversation(conversation.hash_id || conversation.id)}
              >
              <div className="flex items-center gap-2 md:gap-3">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-9 w-9 md:h-12 md:w-12">
                    <AvatarImage src={conversation.avatar ?? undefined} />
                    <AvatarFallback className="bg-input text-muted-foreground font-semibold text-[10px] md:text-sm">
                      {conversation.type === "group" ? (
                        <Users className="h-4 w-4 md:h-5 md:w-5" />
                      ) : (
                        (conversation.name || "...").slice(0, 1).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="font-semibold truncate text-xs md:text-sm max-w-[100px] md:max-w-none">
                        {conversation.name || "Utilisateur"}
                      </h3>
                      {conversation.type === "group" && (
                        <span className="flex-shrink-0 text-[9px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          Groupe
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatRelativeTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <p className="text-xs text-muted-foreground truncate min-w-0 overflow-hidden">
                      {conversation.lastMessage ||
                        (conversation.type === "group"
                          ? "Conversation de groupe"
                          : "Message privé")}
                    </p>
                    {conversation.unread > 0 && (
                      <Badge
                        variant="destructive"
                        className="h-4 min-w-[16px] px-1 text-[10px] flex-shrink-0"
                      >
                        {conversation.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
}
