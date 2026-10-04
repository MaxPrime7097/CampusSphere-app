import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createPrivateConversation,
  deleteMessage,
  deleteConversation,
  getConversation,
  getConversationMessages,
  getConversationParticipants,
  getUserConnections,
  getUserConversations,
  markConversationRead,
  markConversationUnread,
  addParticipant,
  removeParticipant,
  renameConversation,
  leaveConversation,
  sendMessage,
  updateMessage,
  uploadConversationAvatar,
  removeConversationAvatar,
  searchUsers,
} from "@/services/api";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import type { Conversation, Message, ConversationParticipant } from "@/types";
import { parseSlugId, encodeHashId } from "@/lib/hashids";
import {
  ChatHeader,
  ChatMessageItem,
  ChatMessageInput,
  ChatEmptyState,
  ConversationList,
  NewConversationDialog,
  ConversationParticipantsDialog,
  RenameGroupDialog,
} from "@/components/chat";

function unwrapApiData(payload: any) {
  if (payload?.success !== undefined && payload?.data !== undefined) {
    return payload.data;
  }
  return payload;
}

function isMatchingConv(conv: Conversation | null | undefined, targetId: string | undefined): boolean {
  if (!conv || !targetId) return false;
  if (conv.id === targetId) return true;
  if (conv.hash_id && conv.hash_id === targetId) return true;
  const targetNum = typeof targetId === "number" ? targetId : parseSlugId(targetId);
  const convNum = conv.numericId ?? (typeof conv.id === "number" ? conv.id : parseSlugId(conv.id));
  if (targetNum !== null && convNum !== null && targetNum === convNum) return true;
  return false;
}

function mapConversation(rawConv: any, currentUserId?: string): Conversation {
  const conv = unwrapApiData(rawConv) || {};
  const isGroup = (conv.type || conv.conversation_type) === "group";
  const participants = conv.participants_info || conv.participants || [];
  const otherParticipant =
    participants.find((participant: any) => String(participant.id) !== String(currentUserId)) ||
    participants[0];
  const otherParticipantName =
    otherParticipant?.full_name || otherParticipant?.name || otherParticipant?.username;
  const lastMessage = conv.last_message?.content || conv.lastMessage?.content || "";
  const lastMessageAt =
    conv.last_message?.created_at ||
    conv.lastMessage?.createdAt ||
    conv.updated_at ||
    conv.updatedAt ||
    conv.last_message_at ||
    conv.lastMessageAt ||
    null;

  const numericId = typeof conv.id === "number" ? conv.id : parseSlugId(conv.id);
  const hashId = conv.hash_id || conv.hashId || (numericId ? encodeHashId(numericId) : null) || String(conv.id || "");

  return {
    id: hashId,
    hash_id: hashId,
    numericId: numericId ?? undefined,
    type: conv.type || conv.conversation_type || "private",
    participants,
    lastMessage,
    lastMessageAt,
    name: isGroup
      ? conv.name || `Groupe (${participants.length} membres)`
      : otherParticipantName || conv.name || (participants.length > 0 ? "Utilisateur" : "Conversation"),
    avatar: isGroup
      ? conv.avatar_url || conv.avatar || null
      : otherParticipant?.avatar || "/placeholder-avatar.jpg",
    unread: Number(conv.unread_count || conv.unreadCount || 0),
    isOnline: false,
    createdBy: String(conv.created_by || conv.createdBy || ""),
  };
}

function mapMessage(rawMsg: any, currentUserId?: string): Message {
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
    isEdited:
      msg.is_edited ||
      (msg.updated_at && msg.created_at && msg.updated_at !== msg.created_at) ||
      false,
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
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showCreateGroupConversationModal, setShowCreateGroupConversationModal] = useState(false);
  const [connectionSearch, setConnectionSearch] = useState("");
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [transportMode, setTransportMode] = useState<"ws" | "polling" | "idle">("idle");
  const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<number | null>(null);
  const wsRetryRef = useRef<number>(0);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [loadingGlobalUsers, setLoadingGlobalUsers] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [pendingParticipantId, setPendingParticipantId] = useState<string | null>(null);
  const [isUpdatingConversation, setIsUpdatingConversation] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const conversationsQuery = useQuery({
    queryKey: ["messages", "conversations", currentUser?.id || "anon"],
    queryFn: () => getUserConversations(),
    enabled: Boolean(currentUser?.id),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const connectionsQuery = useQuery({
    queryKey: ["messages", "connections", currentUser?.id || "anon"],
    queryFn: () => getUserConnections(String(currentUser?.id || "")),
    enabled: Boolean(currentUser?.id),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const messageSchema = z.object({
    content: z
      .string()
      .trim()
      .min(1, { message: t("messages.validation.tooShort") })
      .max(1000, { message: t("messages.validation.tooLong") }),
  });

  useEffect(() => {
    if (conversationsQuery.data) {
      setConversations(
        (conversationsQuery.data || []).map((conv: any) =>
          mapConversation(conv, String(currentUser?.id || ""))
        )
      );
      setLoading(false);
      return;
    }
    if (conversationsQuery.isLoading) {
      setLoading(true);
      return;
    }
    if (conversationsQuery.error) {
      toast({
        title: "Erreur",
        description:
          (conversationsQuery.error as any)?.message ||
          "Impossible de charger les conversations",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [conversationsQuery.data, conversationsQuery.error, conversationsQuery.isLoading, currentUser?.id, toast]);

  useEffect(() => {
    if (connectionsQuery.data) {
      const mapped = (connectionsQuery.data || []).map((conn: any) => {
        const isRequester = String(conn.requester) === String(currentUser?.id);
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
      setLoadingConnections(false);
      return;
    }
    if (connectionsQuery.isLoading) {
      setLoadingConnections(true);
      return;
    }
    if (connectionsQuery.error) {
      setConnections([]);
      setLoadingConnections(false);
    }
  }, [connectionsQuery.data, connectionsQuery.error, connectionsQuery.isLoading, currentUser?.id]);

  const normalizedConnectionSearch = connectionSearch.trim().toLowerCase();
  const globalUsersQuery = useQuery({
    queryKey: ["messages", "global-users", currentUser?.id || "anon", normalizedConnectionSearch],
    queryFn: () => searchUsers(connectionSearch.trim()),
    enabled: normalizedConnectionSearch.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const conversationMessagesQuery = useQuery({
    queryKey: ["messages", "conversation", conversationId || "none"],
    queryFn: () => getConversationMessages(String(conversationId || "")),
    enabled: Boolean(conversationId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const singleConversationQuery = useQuery({
    queryKey: ["messages", "conversation-detail", conversationId || "none"],
    queryFn: () => getConversation(String(conversationId || "")),
    enabled: Boolean(conversationId) && !conversations.some((c) => isMatchingConv(c, conversationId)),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (singleConversationQuery.data) {
      const mapped = mapConversation(singleConversationQuery.data, String(currentUser?.id || ""));
      setConversations((prev) => {
        if (prev.some((c) => isMatchingConv(c, mapped.id))) return prev;
        return [mapped, ...prev];
      });
    }
  }, [singleConversationQuery.data, currentUser?.id]);

  useEffect(() => {
    if (normalizedConnectionSearch.length < 2) {
      setGlobalUsers([]);
      setLoadingGlobalUsers(false);
      return;
    }
    setLoadingGlobalUsers(globalUsersQuery.isLoading);
    if (globalUsersQuery.data) {
      const mapped = (globalUsersQuery.data || [])
        .map((u: any) => ({
          id: String(u.id),
          name: u.full_name || u.username || "Utilisateur",
          username: u.username || "",
          avatar: u.avatar || "/placeholder-avatar.jpg",
        }))
        .filter((u: any) => String(u.id) !== String(currentUser?.id));
      setGlobalUsers(mapped);
      return;
    }
    if (globalUsersQuery.error) {
      setGlobalUsers([]);
    }
  }, [connectionSearch, currentUser?.id, globalUsersQuery.data, globalUsersQuery.error, globalUsersQuery.isLoading, normalizedConnectionSearch]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => scrollToBottom("smooth"), 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, conversationId]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    if (conversationMessagesQuery.data) {
      const mapped = (conversationMessagesQuery.data || []).map((msg: any) =>
        mapMessage(msg, String(currentUser?.id || ""))
      );
      setMessages(mapped);
      return;
    }

    if (conversationMessagesQuery.error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      });
    }
  }, [conversationId, conversationMessagesQuery.data, conversationMessagesQuery.error, currentUser?.id, toast]);

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
    const data =
      targetConversationId === conversationId
        ? conversationMessagesQuery.data ||
          (await conversationMessagesQuery.refetch().then((result) => result.data))
        : await getConversationMessages(targetConversationId);
    const mapped = (data || []).map((msg: any) =>
      mapMessage(msg, String(currentUser?.id || ""))
    );
    setMessages(mapped);
  };

  const startPolling = (targetConversationId: string) => {
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(() => {
      void fetchConversationMessages(targetConversationId).catch((): void => {});
    }, 3000);
    setTransportMode("polling");
  };

  useEffect(() => {
    if (!conversationId) {
      stopRealtime();
      return;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || "";
    const wsHost =
      (import.meta.env.VITE_API_WS_HOST as string | undefined) ||
      (apiUrl ? apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : window.location.host);
    const token = localStorage.getItem("access_token") || localStorage.getItem("access");
    const wsUrl = `${wsProtocol}://${wsHost}/ws/conversations/${conversationId}/${
      token ? `?token=${token}` : ""
    }`;
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
          setMessages((prev) =>
            prev.some((item: any) => item.id === next.id) ? prev : [...prev, next]
          );
          setConversations((prev) =>
            prev.map((conversation) =>
              isMatchingConv(conversation, conversationId)
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
          setMessages((prev) =>
            prev.map((item: any) => (item.id === next.id ? { ...item, ...next } : item))
          );
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
                isMatchingConv(conversation, conversationId)
                  ? { ...conversation, unread: 0 }
                  : conversation
              )
            );
          }
        }
        if (eventType === "user_presence") {
          const { user_id, status } = payload.payload;
          if (user_id === String(currentUser?.id)) return;

          setConversations((prev) =>
            prev.map((conv) => {
              if (isMatchingConv(conv, conversationId)) {
                return { ...conv, isOnline: status === "online" };
              }
              return conv;
            })
          );
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
          if (conversationId) void fetchConversationMessages(conversationId).catch((): void => {});
        }, 1200);
      } else {
        startPolling(conversationId);
      }
    };

    return () => stopRealtime();
  }, [conversationId, currentUser]);

  const handleSendMessage = async () => {
    if (!conversationId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner une conversation",
      });
      return;
    }

    if (isSending || !newMessage.trim()) return;

    const validation = messageSchema.safeParse({ content: newMessage });
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: t("messages.validation.invalid", { defaultValue: "Message invalide" }),
        description: validation.error.errors[0].message,
      });
      return;
    }

    setIsSending(true);
    try {
      const result = await sendMessage(conversationId, newMessage);
      const newMsg = mapMessage(result, String(currentUser?.id || ""));

      setMessages((prev) =>
        prev.some((item: any) => item.id === newMsg.id) ? prev : [...prev, newMsg]
      );
      setConversations((prev) =>
        prev.map((conversation) =>
          isMatchingConv(conversation, conversationId)
            ? {
                ...conversation,
                lastMessage: newMsg.content,
                lastMessageAt: newMsg.timestamp,
              }
            : conversation
        )
      );
      setNewMessage("");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
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
    void markConversationRead(targetConversationId).catch((): void => {});
    setConversations((prev) =>
      prev.map((conversation) =>
        isMatchingConv(conversation, targetConversationId) ? { ...conversation, unread: 0 } : conversation
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
      setMessages((prev) =>
        prev.map((item: any) => (item.id === mapped.id ? { ...item, ...mapped } : item))
      );
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
        ...prev.filter((conversation) => !isMatchingConv(conversation, mappedConversation.id)),
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
          (conversation.participants || []).some(
            (participant: any) => String(participant.id) === String(targetUserId)
          )
      );
      if (existingConversation) {
        navigate(`/messages/${existingConversation.hash_id || existingConversation.id}`);
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

  const selectedConv =
    conversations.find((c) => isMatchingConv(c, conversationId)) ||
    conversations.find(
      (c) =>
        c.type === "private" &&
        (c.participants || []).some((p: any) => String(p.id) === String(conversationId))
    );

  useEffect(() => {
    if (
      conversationId &&
      selectedConv &&
      selectedConv.hash_id &&
      conversationId !== selectedConv.hash_id &&
      (/^\d+$/.test(conversationId) || conversationId !== selectedConv.id)
    ) {
      navigate(`/messages/${selectedConv.hash_id}`, { replace: true });
    }
  }, [conversationId, selectedConv, navigate]);

  const selectedParticipants = selectedConv?.participants || [];
  const isGroupCreator =
    selectedConv?.type === "group" &&
    String(selectedConv?.createdBy || "") === String(currentUser?.id || "");

  const openParticipantsDialog = async () => {
    if (!conversationId) return;
    setParticipantsDialogOpen(true);
    setLoadingParticipants(true);
    try {
      const data = await getConversationParticipants(conversationId);
      setParticipants(unwrapApiData(data) || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Participants indisponibles",
        description:
          error?.message || "Impossible de récupérer les participants de cette conversation.",
      });
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleRenameConfirm = async () => {
    if (!conversationId || !renameValue.trim()) return;
    setIsUpdatingConversation(true);
    try {
      await renameConversation(conversationId, renameValue.trim());
      setConversations((prev) =>
        prev.map((conv) =>
          isMatchingConv(conv, conversationId) ? { ...conv, name: renameValue.trim() } : conv
        )
      );
      setRenameDialogOpen(false);
      toast({ title: "Groupe renommé", description: `Nouveau nom : ${renameValue.trim()}.` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Renommage refusé",
        description: error?.message || "Vous n'avez pas le droit de renommer ce groupe.",
      });
    } finally {
      setIsUpdatingConversation(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!conversationId) return;
    setPendingParticipantId(userId);
    try {
      await addParticipant(conversationId, userId);
      const data = await getConversationParticipants(conversationId);
      const updatedParticipants = unwrapApiData(data) || [];
      setParticipants(updatedParticipants);
      setConversations((prev) =>
        prev.map((conv) =>
          isMatchingConv(conv, conversationId) ? { ...conv, participants: updatedParticipants } : conv
        )
      );
      toast({ title: "Membre ajouté", description: "Le membre a été ajouté à la conversation." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ajout impossible",
        description: error?.message || "Impossible d'ajouter ce membre.",
      });
    } finally {
      setPendingParticipantId(null);
    }
  };

  const handleRemoveMember = async (userId: string, displayName: string) => {
    if (!conversationId) return;
    setPendingParticipantId(userId);
    try {
      await removeParticipant(conversationId, userId);
      const updatedParticipants = participants.filter(
        (participant: any) => String(participant.id) !== String(userId)
      );
      setParticipants(updatedParticipants);
      setConversations((prev) =>
        prev.map((conv) =>
          isMatchingConv(conv, conversationId) ? { ...conv, participants: updatedParticipants } : conv
        )
      );
      toast({ title: "Membre retiré", description: `${displayName} a été retiré du groupe.` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Retrait impossible",
        description: error?.message || `Impossible de retirer ${displayName}.`,
      });
    } finally {
      setPendingParticipantId(null);
    }
  };

  const handleMarkUnread = async () => {
    if (!conversationId || !selectedConv) return;
    try {
      await markConversationUnread(conversationId);
      setConversations((prev) =>
        prev.map((conv) =>
          isMatchingConv(conv, conversationId) ? { ...conv, unread: Math.max(1, conv.unread || 0) } : conv
        )
      );
      toast({ title: "Non lu", description: `« ${selectedConv.name} » est marquée comme non lue.` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Marquage impossible",
        description: error?.message || "Impossible de marquer cette conversation en non lu.",
      });
    }
  };

  const handleLeaveSelectedConversation = async () => {
    if (!conversationId || !selectedConv) return;
    if (!window.confirm(`Quitter « ${selectedConv.name} » ?`)) return;
    setIsUpdatingConversation(true);
    try {
      await leaveConversation(conversationId);
      setConversations((prev) => prev.filter((conv) => !isMatchingConv(conv, conversationId)));
      navigate("/messages");
      toast({ title: "Conversation quittée", description: `Vous avez quitté « ${selectedConv.name} ».` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Impossible de quitter",
        description: error?.message || "Vous ne pouvez pas quitter cette conversation actuellement.",
      });
    } finally {
      setIsUpdatingConversation(false);
    }
  };

  const handleDeleteSelectedConversation = async () => {
    if (!conversationId || !selectedConv) return;
    if (!window.confirm(`Supprimer définitivement « ${selectedConv.name} » ?`)) return;
    setIsUpdatingConversation(true);
    try {
      await deleteConversation(conversationId);
      setConversations((prev) => prev.filter((conv) => !isMatchingConv(conv, conversationId)));
      navigate("/messages");
      toast({ title: "Conversation supprimée", description: `« ${selectedConv.name} » a été supprimée.` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Suppression refusée",
        description: error?.message || "Vous n'avez pas les droits de suppression sur cette conversation.",
      });
    } finally {
      setIsUpdatingConversation(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!conversationId) return;
    try {
      const res = await uploadConversationAvatar(conversationId, file);
      setConversations((prev) =>
        prev.map((conv) => (isMatchingConv(conv, conversationId) ? { ...conv, avatar: res.avatar_url } : conv))
      );
      toast({ title: "Avatar mis à jour !" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
    }
  };

  const handleRemoveAvatar = async () => {
    if (!conversationId) return;
    try {
      await removeConversationAvatar(conversationId);
      setConversations((prev) =>
        prev.map((conv) => (isMatchingConv(conv, conversationId) ? { ...conv, avatar: null } : conv))
      );
      toast({ title: "Avatar supprimé" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
    }
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    setReactions((prev) => {
      const msgR = { ...(prev[messageId] || {}) };
      const uid = String(currentUser?.id || "me");
      const alreadyHadThisOne = (prev[messageId]?.[emoji] || []).includes(uid);
      Object.keys(msgR).forEach((e) => {
        msgR[e] = (msgR[e] || []).filter((u) => u !== uid);
        if (msgR[e].length === 0) delete msgR[e];
      });
      if (!alreadyHadThisOne) msgR[emoji] = [...(msgR[emoji] || []), uid];
      return { ...prev, [messageId]: msgR };
    });
  };

  const handleSelectEmoji = (messageId: string, emoji: string) => {
    handleToggleReaction(messageId, emoji);
    setShowEmojiFor(null);
  };

  return (
    <div
      className={`w-full bg-gradient-to-br from-background to-accent/20 overflow-hidden ${
        conversationId && window.innerWidth < 768 ? "app-height-fix-no-nav" : "app-height-fix"
      }`}
    >
      <div className="flex h-full w-full mx-0 overflow-hidden relative">
        <ConversationList
          conversations={conversations}
          selectedConversationId={conversationId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={loading}
          onSelectConversation={(id) => {
            navigate(`/messages/${id}`);
            handleMarkAsRead(id);
          }}
          onOpenNewPrivate={() => setShowNewConversationModal(true)}
          showCreateGroupModal={showCreateGroupConversationModal}
          onSetShowCreateGroupModal={setShowCreateGroupConversationModal}
          onGroupCreated={(groupData) => {
            const newConversation = mapConversation(groupData, String(currentUser?.id || ""));
            setConversations((prev) => [
              newConversation,
              ...prev.filter((item) => !isMatchingConv(item, newConversation.id)),
            ]);
            toast({
              title: "Conversation créée !",
              description: `Le groupe "${newConversation.name}" a été créé`,
              duration: 2000,
            });
            navigate(`/messages/${newConversation.id}`);
          }}
        />

        {/* Chat Area */}
        {conversationId && selectedConv ? (
          <div className="flex-1 flex flex-col min-w-0 h-full relative">
            <ChatHeader
              conversation={selectedConv}
              currentUserId={currentUser?.id != null ? String(currentUser.id) : undefined}
              transportMode={transportMode}
              isUpdatingConversation={isUpdatingConversation}
              onBack={() => navigate("/messages")}
              onOpenParticipants={openParticipantsDialog}
              onRenameGroup={() => {
                setRenameValue(selectedConv.name || "");
                setRenameDialogOpen(true);
              }}
              onMarkUnread={handleMarkUnread}
              onLeaveConversation={handleLeaveSelectedConversation}
              onDeleteConversation={handleDeleteSelectedConversation}
              onAvatarUpload={handleAvatarUpload}
              onRemoveAvatar={handleRemoveAvatar}
              onNavigateProfile={handleProfileNavigation}
            />

            {/* Messages Scroll Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 scrollbar-thin scroll-smooth"
            >
              {messages.map((message) => {
                const isModerator = Boolean(
                  selectedConv.type === "group" &&
                    String(selectedConv.createdBy || "") === String(currentUser?.id || "")
                );
                return (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    isCurrentUser={message.isCurrentUser}
                    isModerator={isModerator}
                    isEditing={editingMessageId === message.id}
                    editingContent={editingContent}
                    onStartEdit={handleStartEdit}
                    onChangeEditContent={setEditingContent}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingMessageId(null)}
                    onDelete={handleDeleteMessage}
                    messageReactions={reactions[message.id]}
                    onToggleReaction={handleToggleReaction}
                    showEmojiPicker={showEmojiFor === message.id}
                    onToggleEmojiPicker={(msgId) =>
                      setShowEmojiFor((prev) => (prev === msgId ? null : msgId))
                    }
                    onSelectEmoji={handleSelectEmoji}
                    onNavigateProfile={handleProfileNavigation}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <ChatMessageInput
              value={newMessage}
              onChange={setNewMessage}
              onSend={handleSendMessage}
              isSending={isSending}
              placeholder={t("messages.typeMessage")}
            />
          </div>
        ) : (
          <ChatEmptyState onNewMessage={() => setShowNewConversationModal(true)} />
        )}
      </div>

      <NewConversationDialog
        open={showNewConversationModal}
        onOpenChange={setShowNewConversationModal}
        search={connectionSearch}
        onSearchChange={setConnectionSearch}
        connections={connections}
        globalUsers={globalUsers}
        loadingConnections={loadingConnections}
        loadingGlobalUsers={loadingGlobalUsers}
        isCreatingPrivate={isCreatingPrivate}
        onCreatePrivate={handleCreatePrivateConversation}
      />

      <RenameGroupDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        value={renameValue}
        onChange={setRenameValue}
        onConfirm={handleRenameConfirm}
        isUpdating={isUpdatingConversation}
      />

      <ConversationParticipantsDialog
        open={participantsDialogOpen}
        onOpenChange={setParticipantsDialogOpen}
        loading={loadingParticipants}
        participants={participants}
        fallbackParticipants={selectedParticipants}
        currentUserId={currentUser?.id != null ? String(currentUser.id) : undefined}
        isGroup={selectedConv?.type === "group"}
        isGroupCreator={isGroupCreator}
        pendingParticipantId={pendingParticipantId}
        connections={connections}
        onRemoveMember={handleRemoveMember}
        onAddMember={handleAddMember}
      />
    </div>
  );
}

export default Messages;
