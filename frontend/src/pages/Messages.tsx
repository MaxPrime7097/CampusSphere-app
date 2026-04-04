import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPrivateConversation, deleteMessage, getCurrentUser, getConversationMessages, getUserConnections, getUserConversations, markConversationRead, sendMessage, updateMessage } from "@/services/api";
import { useTranslation } from "react-i18next";
import { Search, Send, Phone, Video, MoreVertical, MessageSquare, Loader2, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { CreateGroupConversationModal } from "@/components/modals/CreateGroupConversationModal";
import { formatRelativeTime } from "@/lib/date";


function unwrapApiData(payload: any) {
  if (payload?.success !== undefined && payload?.data !== undefined) {
    return payload.data;
  }
  return payload;
}


function mapConversation(rawConv: any, currentUserId?: string) {
  const conv = unwrapApiData(rawConv) || {};
  const participants = conv.participants_info || conv.participants || [];
  const otherParticipant =
    participants.find((participant: any) => String(participant.id) !== String(currentUserId)) || participants[0];
  const lastMessage = conv.last_message?.content || conv.lastMessage?.content || "";
  const lastMessageAt =
    conv.last_message?.created_at ||
    conv.lastMessage?.createdAt ||
    conv.updated_at ||
    conv.updatedAt ||
    conv.last_message_at ||
    conv.lastMessageAt ||
    null;

  return {
    id: String(conv.id),
    type: conv.type || conv.conversation_type || "private",
    participants,
    lastMessage,
    lastMessageAt,
    name: conv.name || otherParticipant?.name || "Conversation",
    avatar: otherParticipant?.avatar || "/placeholder-avatar.jpg",
    unread: Number(conv.unread_count || conv.unreadCount || 0),
    isOnline: false,
    createdBy: String(conv.created_by || conv.createdBy || ""),
  };
}

function mapMessage(rawMsg: any, currentUserId?: string) {
  const msg = unwrapApiData(rawMsg) || {};
  const author = msg.author_info || msg.author || {};
  const senderId = String(author.id || msg.author || "");

  return {
    id: String(msg.id),
    sender: author.name || author.username || "Utilisateur",
    senderUsername: author.username || "",
    senderId,
    content: msg.content || "",
    timestamp: msg.created_at || msg.createdAt || null,
    isCurrentUser: senderId === String(currentUserId || ""),
    avatar: author.avatar || "/placeholder-avatar.jpg",
    canEdit: msg.can_edit ?? senderId === String(currentUserId || ""),
    canDelete: msg.can_delete ?? senderId === String(currentUserId || ""),
  };
}

export function Messages() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [connectionSearch, setConnectionSearch] = useState("");
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [transportMode, setTransportMode] = useState<"ws" | "polling" | "idle">("idle");
  const { toast } = useToast();
  const socketRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<number | null>(null);
  const wsRetryRef = useRef<number>(0);

  const [conversations, setConversations] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const messageSchema = z.object({
    content: z.string()
      .trim()
      .min(1, { message: t('messages.validation.tooShort') })
      .max(1000, { message: t('messages.validation.tooLong') })
  });

  // Load current user
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (isMounted) setCurrentUser(data);
      } catch (e) {
        // User not logged in
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load conversations
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getUserConversations();
        if (isMounted) {
          const mapped = (data || []).map((conv: any) => mapConversation(conv, String(currentUser?.id || "")));
          setConversations(mapped);
        }
      } catch (e: any) {
        toast({
          title: "Erreur",
          description: e?.message || "Impossible de charger les conversations",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load current user connections for new DM flow
  useEffect(() => {
    if (!currentUser?.id) return;

    let isMounted = true;
    (async () => {
      try {
        setLoadingConnections(true);
        const connectionsData = await getUserConnections(currentUser.id);
        if (isMounted) {
          const mapped = (connectionsData || []).map((conn: any) => {
            const isRequester = String(conn.requester) === String(currentUser.id);
            const counterpart = isRequester ? conn.recipient_info : conn.requester_info;
            const counterpartId = isRequester ? conn.recipient : conn.requester;

            return {
              id: String(counterpart?.id || counterpartId),
              name: counterpart?.full_name || counterpart?.name || counterpart?.username || "Utilisateur",
              username: counterpart?.username || "",
              avatar: counterpart?.avatar || "/placeholder-avatar.jpg",
            };
          });
          setConnections(mapped.filter((contact: any) => contact.id));
        }
      } catch {
        if (isMounted) setConnections([]);
      } finally {
        if (isMounted) setLoadingConnections(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    
    let isMounted = true;
    (async () => {
      try {
        const data = await getConversationMessages(conversationId);
        if (isMounted) {
          const mapped = (data || []).map((msg: any) => mapMessage(msg, String(currentUser?.id || "")));
          setMessages(mapped);
        }
      } catch (e: any) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les messages",
          variant: "destructive",
        });
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [conversationId, currentUser]);

  const stopRealtime = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setTransportMode("idle");
  };

  const fetchConversationMessages = async (targetConversationId: string) => {
    const data = await getConversationMessages(targetConversationId);
    const mapped = (data || []).map((msg: any) => mapMessage(msg, String(currentUser?.id || "")));
    setMessages(mapped);
  };

  const startPolling = (targetConversationId: string) => {
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(() => {
      void fetchConversationMessages(targetConversationId).catch(() => null);
    }, 3000);
    setTransportMode("polling");
  };

  useEffect(() => {
    if (!conversationId) {
      stopRealtime();
      return;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = (import.meta.env.VITE_API_WS_HOST as string | undefined) || window.location.host;
    const wsUrl = `${wsProtocol}://${wsHost}/ws/conversations/${conversationId}/`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      wsRetryRef.current = 0;
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setTransportMode("ws");
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const eventType = payload?.type;
        const data = payload?.payload || {};
        if (eventType === "message_created") {
          const next = mapMessage(data.message, String(currentUser?.id || ""));
          setMessages((prev) => (prev.some((item: any) => item.id === next.id) ? prev : [...prev, next]));
          setConversations((prev) =>
            prev.map((conversation) =>
              conversation.id === String(conversationId)
                ? {
                    ...conversation,
                    lastMessage: next.content,
                    lastMessageAt: next.timestamp,
                    unread: next.isCurrentUser ? conversation.unread : conversation.unread + 1,
                  }
                : conversation
            )
          );
          if (!next.isCurrentUser) {
            void markConversationRead(conversationId);
          }
        }
        if (eventType === "message_updated") {
          const next = mapMessage(data.message, String(currentUser?.id || ""));
          setMessages((prev) => prev.map((item: any) => (item.id === next.id ? { ...item, ...next } : item)));
        }
        if (eventType === "message_deleted") {
          const deletedId = String(data?.message_id || "");
          setMessages((prev) => prev.filter((item: any) => item.id !== deletedId));
        }
        if (eventType === "conversation_read") {
          const readerId = String(data?.reader_id || "");
          if (readerId === String(currentUser?.id || "")) {
            setConversations((prev) =>
              prev.map((conversation) =>
                conversation.id === String(conversationId) ? { ...conversation, unread: 0 } : conversation
              )
            );
          }
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => startPolling(conversationId);
    ws.onclose = () => {
      wsRetryRef.current += 1;
      if (wsRetryRef.current <= 2) {
        window.setTimeout(() => {
          if (conversationId) void fetchConversationMessages(conversationId).catch(() => null);
        }, 1200);
      } else {
        startPolling(conversationId);
      }
    };

    return () => stopRealtime();
  }, [conversationId, currentUser]);

  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!conversationId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner une conversation",
      });
      return;
    }

    const validation = messageSchema.safeParse({ content: newMessage });
    
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: t('messages.validation.invalid', { defaultValue: "Message invalide" }),
        description: validation.error.errors[0].message,
      });
      return;
    }

    setIsSending(true);
    
    try {
      const result = await sendMessage(conversationId, newMessage);
      const newMsg = mapMessage(result, String(currentUser?.id || ""));
      
      setMessages(prev => [...prev, newMsg]);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessage: newMsg.content,
                lastMessageAt: newMsg.timestamp,
              }
            : conversation
        )
      );
      setNewMessage("");
      
      toast({
        title: "Message envoyé !",
        description: "Votre message a été envoyé avec succès",
        duration: 2000,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e?.message || "Impossible d'envoyer le message",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsRead = (targetConversationId: string) => {
    void markConversationRead(targetConversationId).catch(() => null);
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === targetConversationId ? { ...conversation, unread: 0 } : conversation
      )
    );
  };

  const handleStartEdit = (message: any) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!conversationId || !editingMessageId) return;
    const validation = messageSchema.safeParse({ content: editingContent });
    if (!validation.success) return;
    try {
      const updated = await updateMessage(conversationId, editingMessageId, editingContent);
      const mapped = mapMessage(updated, String(currentUser?.id || ""));
      setMessages((prev) => prev.map((item: any) => (item.id === mapped.id ? { ...item, ...mapped } : item)));
      setEditingMessageId(null);
      setEditingContent("");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e?.message || "Impossible de modifier le message",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!conversationId) return;
    try {
      await deleteMessage(conversationId, messageId);
      setMessages((prev) => prev.filter((item: any) => item.id !== messageId));
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e?.message || "Impossible de supprimer le message",
      });
    }
  };

  const handleProfileNavigation = (username?: string, displayName?: string) => {
    if (!username) {
      toast({
        title: "Profil indisponible",
        description: `Impossible d'ouvrir le profil de ${displayName || "cet utilisateur"} : username manquant.`,
        variant: "destructive",
      });
      return;
    }

    navigate(`/profile/${username}`);
  };

  const extractConversationFromResult = (result: any) => {
    if (result?.data) return result.data;
    return result;
  };

  const handleCreatePrivateConversation = async (targetUserId: string) => {
    if (!targetUserId) return;

    setIsCreatingPrivate(true);
    try {
      const result = await createPrivateConversation(targetUserId);
      const rawConversation = extractConversationFromResult(result);
      const mappedConversation = mapConversation(rawConversation, String(currentUser?.id || ""));

      setConversations((prev) => [
        mappedConversation,
        ...prev.filter((conversation) => conversation.id !== mappedConversation.id),
      ]);
      setShowNewConversationModal(false);
      setConnectionSearch("");
      navigate(`/messages/${mappedConversation.id}`);
      handleMarkAsRead(mappedConversation.id);

      const isExistingConversation = String(result?.message || "").toLowerCase().includes("existing");
      toast({
        title: isExistingConversation ? "Conversation existante" : "Message privé créé",
        description: isExistingConversation
          ? "La conversation existante a été ouverte."
          : "Nouvelle conversation privée créée.",
        duration: 2000,
      });
    } catch (error: any) {
      const existingConversation = conversations.find(
        (conversation) =>
          conversation.type === "private" &&
          (conversation.participants || []).some((participant: any) => String(participant.id) === String(targetUserId))
      );
      if (existingConversation) {
        navigate(`/messages/${existingConversation.id}`);
        setShowNewConversationModal(false);
        setConnectionSearch("");
        toast({
          title: "Conversation existante",
          description: "La conversation existante a été ouverte.",
          duration: 2000,
        });
        return;
      }

      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Impossible de créer la conversation privée",
      });
    } finally {
      setIsCreatingPrivate(false);
    }
  };

  const selectedConv = conversations.find(c => c.id === conversationId);
  const filteredConnections = connections.filter((contact) => {
    const query = connectionSearch.toLowerCase().trim();
    if (!query) return true;
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.username.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-full w-full bg-gradient-to-br from-background to-accent/20">
      <div className="flex h-full w-full mx-0 overflow-hidden">
        {/* Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r bg-card/50 flex-shrink-0 ${conversationId ? 'hidden md:flex' : 'flex'} flex-col`}>
          <div className="p-3 md:p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-3xl font-bold text-muted-foreground">
                Messages
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  aria-label="Nouveau message privé"
                  onClick={() => setShowNewConversationModal(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <CreateGroupConversationModal
                  onGroupCreated={(groupData) => {
                    const newConversation = mapConversation(groupData, String(currentUser?.id || ""));
                    setConversations((prev) => [newConversation, ...prev.filter((item) => item.id !== newConversation.id)]);
                    toast({
                      title: "Conversation créée !",
                      description: `Le groupe "${newConversation.name}" a été créé`,
                      duration: 2000,
                    });
                    navigate(`/messages/${newConversation.id}`);
                  }}
                >
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" aria-label="Nouveau groupe">
                    <Users className="h-4 w-4" />
                  </Button>
                </CreateGroupConversationModal>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('messages.searchPlaceholder')}
                className="pl-10 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                {searchQuery ? "Aucune conversation trouvée" : t('messages.noConversations')}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 md:p-4 border-b cursor-pointer transition-colors hover:bg-accent/50 ${
                    conversationId === conversation.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => {
                    navigate(`/messages/${conversation.id}`);
                    handleMarkAsRead(conversation.id);
                  }}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10 md:h-12 md:w-12">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback className="bg-input text-muted-foreground font-semibold text-xs md:text-sm">
                          {(conversation.name || "U").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 border-2 border-background rounded-full"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate text-sm md:text-base">
                          {conversation.name || 'Utilisateur'}
                        </h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatRelativeTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {conversation.lastMessage || (conversation.type === 'group' ? 'Conversation de groupe' : 'Message privé')}
                      </p>
                    </div>
                    
                    {conversation.unread > 0 && (
                      <Badge variant="destructive" className="text-xs flex-shrink-0 ml-2">
                        {conversation.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {conversationId ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b bg-card/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden h-8 w-8 p-0 flex-shrink-0"
                    onClick={() => navigate('/messages')}
                  >
                    ←
                  </Button>
                  
                  <Avatar
                    className={`h-8 w-8 flex-shrink-0 transition-opacity ${
                      selectedConv?.participants?.[0]?.username
                        ? "cursor-pointer hover:opacity-80"
                        : "cursor-not-allowed opacity-60"
                    }`}
                    onClick={() =>
                      handleProfileNavigation(
                        selectedConv?.participants?.[0]?.username,
                        selectedConv?.name
                      )
                    }
                  >
                    <AvatarImage src={selectedConv?.avatar} />
                    <AvatarFallback className="bg-input text-muted-foreground font-semibold text-xs md:text-sm">
                      {(selectedConv?.name || "U").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm md:text-base truncate">
                      {selectedConv?.name || 'Utilisateur'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedConv?.type === 'group'
                        ? `${selectedConv?.participants?.length || 0} membres`
                        : 'Conversation privée'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {transportMode === "ws" ? "Temps réel actif" : transportMode === "polling" ? "Mode secours (polling)" : "Hors ligne"}
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
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleProfileNavigation(
                            selectedConv?.participants?.[0]?.username,
                            selectedConv?.name
                          )
                        }
                        disabled={!selectedConv?.participants?.[0]?.username}
                      >
                        Voir le profil
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (conversationId) {
                            handleMarkAsRead(conversationId);
                            toast({ title: "Conversation marquée comme lue", duration: 2000 });
                          }
                        }}
                      >
                        Marquer comme lu
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
              {messages.map((message) => (
                (() => {
                  const isModerator = Boolean(
                    selectedConv?.type === "group" &&
                    String(selectedConv?.createdBy || "") === String(currentUser?.id || "")
                  );
                  const canEdit = Boolean(message.canEdit || isModerator);
                  const canDelete = Boolean(message.canDelete || isModerator);
                  return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}
                 >
                   {!message.isCurrentUser && (
                     <Avatar 
                       className={`h-8 w-8 flex-shrink-0 transition-opacity ${
                         message.senderUsername
                           ? "cursor-pointer hover:opacity-80"
                           : "cursor-not-allowed opacity-60"
                       }`}
                       onClick={() => handleProfileNavigation(message.senderUsername, message.sender)}
                     >
                       <AvatarImage src={message.avatar} />
                       <AvatarFallback className="bg-input text-muted-foreground font-semibold text-xs md:text-sm">
                         {message.sender?.slice(0, 1).toUpperCase() || 'U'}
                       </AvatarFallback>
                     </Avatar>
                   )}
                  
                   <div className={`max-w-[70%] sm:max-w-xs lg:max-w-md ${message.isCurrentUser ? 'text-right' : ''}`}>
                     {!message.isCurrentUser && (
                       <p 
                         className={`text-xs text-muted-foreground mb-1 ${
                           message.senderUsername
                             ? "cursor-pointer hover:underline"
                             : "cursor-not-allowed opacity-60"
                         }`}
                         onClick={() => handleProfileNavigation(message.senderUsername, message.sender)}
                       >
                         {message.sender}
                       </p>
                     )}
                    
                    <Card className={`${
                      message.isCurrentUser 
                        ? 'campus-gradient text-white' 
                        : 'bg-card border'
                    }`}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            {editingMessageId === message.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="bg-background text-foreground"
                                  maxLength={1000}
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="secondary" onClick={handleSaveEdit}>Enregistrer</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingMessageId(null)}>Annuler</Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm">{message.content}</p>
                            )}
                          </div>
                          {(canEdit || canDelete) && editingMessageId !== message.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEdit && (
                                  <DropdownMenuItem onClick={() => handleStartEdit(message)}>
                                    Modifier
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)} className="text-red-600">
                                    Supprimer
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(message.timestamp)}
                    </p>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>

            {/* Message Input */}
            <div className="fixed bottom-0 left-0 right-0 p-3 md:p-4 border-t bg-card/50 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  placeholder={t('messages.typeMessage')}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  className="flex-1 text-sm md:text-base"
                  maxLength={1000}
                />
                <Button 
                  onClick={handleSendMessage}
                  className="campus-gradient text-white hover:opacity-90 h-9 w-9 md:h-10 md:w-10 p-0 flex-shrink-0"
                  disabled={!newMessage.trim() || isSending}
                  aria-label="Send message"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-center p-4">
            <div>
              <div className="w-16 h-16 campus-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('messages.selectTitle', { defaultValue: "Sélectionner une conversation" })}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t('messages.selectConversation')}
              </p>
            </div>
          </div>
        )}
      </div>
      <Dialog open={showNewConversationModal} onOpenChange={setShowNewConversationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Rechercher dans vos connexions..."
              value={connectionSearch}
              onChange={(e) => setConnectionSearch(e.target.value)}
            />
            <div className="max-h-72 overflow-y-auto space-y-2">
              {loadingConnections ? (
                <div className="text-sm text-muted-foreground">Chargement des connexions...</div>
              ) : filteredConnections.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucune connexion trouvée.</div>
              ) : (
                filteredConnections.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                    onClick={() => handleCreatePrivateConversation(contact.id)}
                    disabled={isCreatingPrivate}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>
                        {(contact.name || "U").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.username ? `@${contact.username}` : "Utilisateur"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
