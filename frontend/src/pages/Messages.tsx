import { Suspense, lazy, useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPrivateConversation, deleteMessage, deleteConversation, getConversationMessages, getConversationParticipants, getUserConnections, getUserConversations, markConversationRead, markConversationUnread, addParticipant, removeParticipant, renameConversation, leaveConversation, sendMessage, updateMessage, uploadConversationAvatar, removeConversationAvatar, searchUsers } from "@/services/api";
import { useTranslation } from "react-i18next";
import { Search, Send, Phone, Video, EllipsisVertical, MoreVertical, MessageSquare, Loader2, Users, Plus, Camera, Smile, ArrowLeft, CheckCheck, Trash, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { formatRelativeTime } from "@/lib/date";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import type { Conversation, Message, ConversationParticipant } from "@/types";

const CreateGroupConversationModal = lazy(() => import("@/components/modals/CreateGroupConversationModal").then((module) => ({ default: module.CreateGroupConversationModal })));


function unwrapApiData(payload: any) {
  if (payload?.success !== undefined && payload?.data !== undefined) {
    return payload.data;
  }
  return payload;
}


function mapConversation(rawConv: any, currentUserId?: string): Conversation {
  const conv = unwrapApiData(rawConv) || {};
  const isGroup = (conv.type || conv.conversation_type) === 'group';
  const participants = conv.participants_info || conv.participants || [];
  const otherParticipant =
    participants.find((participant: any) => String(participant.id) !== String(currentUserId)) || participants[0];
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

  return {
    id: String(conv.id),
    type: conv.type || conv.conversation_type || "private",
    participants,
    lastMessage,
    lastMessageAt,
    name:
      isGroup
        ? (conv.name || `Groupe (${participants.length} membres)`)
        : (otherParticipantName || conv.name || (participants.length > 0 ? "Utilisateur" : "Conversation")),
    avatar: isGroup
      ? (conv.avatar_url || conv.avatar || null)
      : (otherParticipant?.avatar || "/placeholder-avatar.jpg"),
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
    isEdited: msg.is_edited || (msg.updated_at && msg.created_at && msg.updated_at !== msg.created_at) || false,
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
  const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
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
  const { user: currentUser } = useAuth();

  const conversationsQuery = useQuery({
    queryKey: ["messages", "conversations", currentUser?.id || "anon"],
    queryFn: getUserConversations,
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
    content: z.string()
      .trim()
      .min(1, { message: t('messages.validation.tooShort') })
      .max(1000, { message: t('messages.validation.tooLong') })
  });

  useEffect(() => {
    if (conversationsQuery.data) {
      setConversations((conversationsQuery.data || []).map((conv: any) => mapConversation(conv, String(currentUser?.id || ""))));
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
        description: (conversationsQuery.error as any)?.message || "Impossible de charger les conversations",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [conversationsQuery.data, conversationsQuery.error, conversationsQuery.isLoading, currentUser?.id, toast]);

  // Load current user connections for new DM flow
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

  // Global search for any user
  useEffect(() => {
    if (normalizedConnectionSearch.length < 2) {
      setGlobalUsers([]);
      setLoadingGlobalUsers(false);
      return;
    }
    setLoadingGlobalUsers(globalUsersQuery.isLoading);
    if (globalUsersQuery.data) {
      const mapped = (globalUsersQuery.data || []).map((u: any) => ({
        id: String(u.id),
        name: u.full_name || u.username || "Utilisateur",
        username: u.username || "",
        avatar: u.avatar || "/placeholder-avatar.jpg",
      })).filter((u: any) => String(u.id) !== String(currentUser?.id));
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
        behavior
      });
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Scroll on messages change or conversation change
  useEffect(() => {
    if (messages.length > 0) {
      // Small timeout to ensure DOM is updated
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
      const mapped = (conversationMessagesQuery.data || []).map((msg: any) => mapMessage(msg, String(currentUser?.id || "")));
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
    const data = targetConversationId === conversationId
      ? (conversationMessagesQuery.data || await conversationMessagesQuery.refetch().then((result) => result.data))
      : await getConversationMessages(targetConversationId);
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
    const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || "";
    const wsHost = (import.meta.env.VITE_API_WS_HOST as string | undefined) ||
      (apiUrl ? apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : window.location.host);
    const token = localStorage.getItem("access_token") || localStorage.getItem("access");
    const wsUrl = `${wsProtocol}://${wsHost}/ws/conversations/${conversationId}/${token ? `?token=${token}` : ""}`;
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
        if (eventType === "user_presence") {
          const { user_id, status } = payload.payload;
          if (user_id === String(currentUser?.id)) return;

          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === String(conversationId)) {
                // In private chat, the "isOnline" refers to the other person
                if (conv.type === "private") {
                  return { ...conv, isOnline: status === "online" };
                }
                // In group chat, it's more complex, but let's just mark the group as active
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
    
    if (isSending || !newMessage.trim()) return;

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
      
      setMessages(prev => prev.some((item: any) => item.id === newMsg.id) ? prev : [...prev, newMsg]);
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
      // Si la conv existait déjà, naviguer sans créer de doublon
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
  const selectedParticipants = selectedConv?.participants || [];
  const isGroupCreator =
    selectedConv?.type === "group" && String(selectedConv?.createdBy || "") === String(currentUser?.id || "");
  const canRenameGroup = Boolean(selectedConv?.type === "group" && isGroupCreator);
  const canDeleteConversation = Boolean(selectedConv?.type === "group" && isGroupCreator);

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
        description: error?.message || "Impossible de récupérer les participants de cette conversation.",
      });
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleRenameGroup = async () => {
    if (!conversationId || !selectedConv) return;
    setRenameValue(selectedConv.name || "");
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = async () => {
    if (!conversationId || !renameValue.trim()) return;
    setIsUpdatingConversation(true);
    try {
      await renameConversation(conversationId, renameValue.trim());
      setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, name: renameValue.trim() } : conv)));
      setRenameDialogOpen(false);
      toast({ title: "Groupe renommé", description: `Nouveau nom : ${renameValue.trim()}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Renommage refusé", description: error?.message || "Vous n'avez pas le droit de renommer ce groupe." });
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
      setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, participants: updatedParticipants } : conv)));
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
      const updatedParticipants = participants.filter((participant: any) => String(participant.id) !== String(userId));
      setParticipants(updatedParticipants);
      setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, participants: updatedParticipants } : conv)));
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
      setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, unread: Math.max(1, conv.unread || 0) } : conv)));
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
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
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
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
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

  const filteredConnections = connections.filter((contact) => {
    const query = connectionSearch.toLowerCase().trim();
    if (!query) return true;
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.username.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`w-full bg-gradient-to-br from-background to-accent/20 overflow-hidden ${conversationId && window.innerWidth < 768 ? 'app-height-fix-no-nav' : 'app-height-fix'}`}>
      <div className="flex h-full w-full mx-0 overflow-hidden relative">
        {/* Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r bg-card/50 flex-shrink-0 ${conversationId ? 'hidden md:flex' : 'flex'} flex-col h-full`}>
          <div className="p-3 md:p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
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
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  aria-label="Nouveau groupe"
                  onClick={() => setShowCreateGroupConversationModal(true)}
                >
                  <Users className="h-4 w-4" />
                </Button>
                {showCreateGroupConversationModal && (
                  <Suspense fallback={<ModalLoadingFallback />}>
                    <CreateGroupConversationModal
                      open={showCreateGroupConversationModal}
                      onOpenChange={setShowCreateGroupConversationModal}
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
                    />
                  </Suspense>
                )}
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
                  <p className="text-sm font-medium">{searchQuery ? "Aucun résultat" : "Aucune conversation"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{searchQuery ? "Essayez un autre nom" : "Démarrez une nouvelle conversation"}</p>
                </div>
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
                      <Avatar className="h-9 w-9 md:h-12 md:w-12">
                        <AvatarImage src={conversation.avatar ?? undefined} />
                        <AvatarFallback className="bg-input text-muted-foreground font-semibold text-[10px] md:text-sm">
                          {conversation.type === 'group'
                            ? <Users className="h-4 w-4 md:h-5 md:w-5" />
                            : (conversation.name || "...").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="font-semibold truncate text-xs md:text-sm max-w-[100px] md:max-w-none">
                            {conversation.name || 'Utilisateur'}
                          </h3>
                          {conversation.type === 'group' && (
                            <span className="flex-shrink-0 text-[9px] font-medium bg-primary/10 text-primary px-1 py-0 rounded">
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
                          {conversation.lastMessage || (conversation.type === 'group' ? 'Conversation de groupe' : 'Message privé')}
                        </p>
                        {conversation.unread > 0 && (
                          <Badge variant="destructive" className="h-4 min-w-[16px] px-1 text-[10px] flex-shrink-0">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {conversationId ? (
          <div className="flex-1 flex flex-col min-w-0 h-full relative">
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
                  
                  <div className="relative flex-shrink-0">
                    <Avatar
                      className={`h-8 w-8 transition-opacity ${
                        !selectedConv || selectedConv.type === 'group'
                          ? 'cursor-default'
                          : selectedConv?.participants?.[0]?.username
                            ? 'cursor-pointer hover:opacity-80'
                            : 'cursor-not-allowed opacity-60'
                      }`}
                      onClick={() => {
                        if (selectedConv?.type !== 'group') {
                          // Pour les convs privées, trouver le bon participant (pas soi-même)
                          const other = (selectedConv?.participants || []).find(
                            (p: any) => String(p.id) !== String(currentUser?.id)
                          ) || selectedConv?.participants?.[0];
                          handleProfileNavigation(other?.username, other?.name || selectedConv?.name);
                        }
                      }}
                    >
                      <AvatarImage src={selectedConv?.avatar ?? undefined} />
                      <AvatarFallback className="bg-input text-muted-foreground font-semibold text-xs md:text-sm">
                        {selectedConv?.type === 'group'
                          ? <Users className="h-4 w-4" />
                          : (selectedConv?.name || "...").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConv?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
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
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !conversationId) return;
                            try {
                              const res = await uploadConversationAvatar(conversationId, file);
                              setConversations((prev) =>
                                prev.map((conv) =>
                                  conv.id === conversationId
                                    ? { ...conv, avatar: res.avatar_url }
                                    : conv
                                )
                              );
                              toast({ title: "Avatar mis à jour !" });
                            } catch (err: any) {
                              toast({ title: "Erreur", description: err?.message, variant: "destructive" });
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm md:text-base truncate pr-2 max-w-[140px] md:max-w-none">
                      {selectedConv?.name || 'Utilisateur'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedConv?.type === 'group'
                        ? `${selectedConv?.participants?.length || 0} membre${(selectedConv?.participants?.length || 0) > 1 ? 's' : ''}`
                        : (() => {
                            const other = (selectedConv?.participants || []).find(
                              (p: any) => String(p.id) !== String(currentUser?.id)
                            ) || selectedConv?.participants?.[0];
                            return other?.username ? `@${other.username}` : 'Conversation privée';
                          })()}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${transportMode === 'ws' ? 'bg-green-500' : transportMode === 'polling' ? 'bg-yellow-500' : 'bg-muted-foreground'}`} />
                      {transportMode === "ws" ? "Temps réel" : transportMode === "polling" ? "Polling" : "Hors ligne"}
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
                      <DropdownMenuItem onClick={openParticipantsDialog}>Voir les participants</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleRenameGroup} disabled={!canRenameGroup || isUpdatingConversation}>
                        Renommer groupe
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={openParticipantsDialog} disabled={selectedConv?.type !== "group"}>
                        Ajouter/retirer membres
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleMarkUnread}>Marquer non lu</DropdownMenuItem>
                      {isGroupCreator && selectedConv?.avatar && (
                        <DropdownMenuItem onClick={async () => {
                          if (!conversationId) return;
                          try {
                            await removeConversationAvatar(conversationId);
                            setConversations((prev) => prev.map((conv) =>
                              conv.id === conversationId ? { ...conv, avatar: null } : conv
                            ));
                            toast({ title: "Avatar supprimé" });
                          } catch (err: any) {
                            toast({ title: "Erreur", description: err?.message, variant: "destructive" });
                          }
                        }}>
                          Supprimer l'avatar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleLeaveSelectedConversation} disabled={isUpdatingConversation}>
                        Quitter conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDeleteSelectedConversation}
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

            {/* Messages - THE scrollable area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 scrollbar-thin scroll-smooth"
            >
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
                  className={`flex gap-3 group ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}
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
                         {message.sender?.slice(0, 1).toUpperCase() || '...'}
                       </AvatarFallback>
                     </Avatar>
                   )}
                  
                    <div className={`relative max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] min-w-0 ${message.isCurrentUser ? 'text-right ml-auto' : 'text-left mr-auto'}`}>
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
                    
                     {/* Bubble */}
                     <div
                       className={`group/bubble relative inline-block max-w-full px-3 py-2 rounded-2xl text-sm break-words overflow-wrap-anywhere shadow-sm ${
                         message.isCurrentUser
                           ? 'campus-gradient text-white rounded-br-sm'
                           : 'bg-card border rounded-bl-sm'
                       }`}
                       onMouseLeave={() => setShowEmojiFor(null)}
                     >
                       {editingMessageId === message.id ? (
                         <div className="space-y-2 min-w-[200px]">
                           <Input
                             value={editingContent}
                             onChange={(e) => setEditingContent(e.target.value)}
                             className="bg-background text-foreground h-8 text-sm"
                             maxLength={1000}
                             autoFocus
                             onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingMessageId(null); }}
                           />
                           <div className="flex gap-1.5 justify-end">
                             <Button size="sm" className="h-6 text-xs campus-gradient text-white" onClick={handleSaveEdit}>OK</Button>
                             <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingMessageId(null)}>✕</Button>
                           </div>
                         </div>
                       ) : (
                          <p className="leading-relaxed break-all whitespace-pre-wrap">
                            {message.content.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) =>
                              /^https?:\/\//.test(part) ? (
                                <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                                  className="underline underline-offset-2 hover:opacity-80 break-all"
                                  onClick={(e) => e.stopPropagation()}>{part}</a>
                              ) : <span key={i}>{part}</span>
                            )}
                            {message.isEdited && (
                              <span className="text-[10px] opacity-70 ml-2 italic whitespace-nowrap">(modifié)</span>
                            )}
                          </p>
                       )}
                      </div>

                      {/* Actions & Reactions row — outside bubble, always visible */}
                      {editingMessageId !== message.id && (
                        <div className={`flex flex-wrap items-center gap-1.5 mt-1.5 relative ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          {/* Current Reactions badges */}
                          {reactions[message.id] && Object.entries(reactions[message.id]).map(([emoji, users]) =>
                            users.length > 0 ? (
                              <button
                                key={emoji}
                                className="text-[10px] bg-card border rounded-full px-1.5 py-0.5 flex items-center gap-1 hover:bg-muted transition-colors"
                                onClick={() => {
                                  setReactions(prev => {
                                    const msgR = { ...(prev[message.id] || {}) };
                                    const uid = String(currentUser?.id || "me");
                                    const alreadyHadThisOne = (prev[message.id]?.[emoji] || []).includes(uid);
                                    Object.keys(msgR).forEach(e => {
                                      msgR[e] = (msgR[e] || []).filter(u => u !== uid);
                                      if (msgR[e].length === 0) delete msgR[e];
                                    });
                                    if (!alreadyHadThisOne) msgR[emoji] = [...(msgR[emoji] || []), uid];
                                    return { ...prev, [message.id]: msgR };
                                  });
                                }}
                              >
                                {emoji} <span className="font-medium">{users.length}</span>
                              </button>
                            ) : null
                          )}

                          {/* Quick Actions (Emoji & More) */}
                          <div className="flex items-center gap-0.5">
                            <button
                              className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground/60 hover:text-primary"
                              title="Réagir"
                              onClick={() => setShowEmojiFor(showEmojiFor === message.id ? null : message.id)}
                            >
                              <Smile className="h-3.5 w-3.5" />
                            </button>

                            {(canEdit || canDelete) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground/60 hover:text-primary">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuContent side="bottom" align={message.isCurrentUser ? 'end' : 'start'} className="z-50">
                                    {canEdit && (
                                      <DropdownMenuItem onClick={() => handleStartEdit(message)} className="gap-2">
                                        <Pencil className="h-3.5 w-3.5" /> Modifier
                                      </DropdownMenuItem>
                                    )}
                                    {canDelete && (
                                      <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)} className="text-destructive focus:text-destructive gap-2">
                                        <Trash className="h-3.5 w-3.5" /> Supprimer
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenuPortal>
                              </DropdownMenu>
                            )}
                          </div>

                          {/* Emoji picker popup */}
                          {showEmojiFor === message.id && (
                            <div className={`absolute bottom-full mb-2 ${message.isCurrentUser ? 'right-0' : 'left-0'} flex gap-1 bg-card border rounded-full px-2 py-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100`}>
                              {EMOJIS.map(emoji => (
                                <button key={emoji} className="text-base hover:scale-125 transition-transform" onClick={() => {
                                  setReactions(prev => {
                                    const msgR = { ...(prev[message.id] || {}) };
                                    const uid = String(currentUser?.id || "me");
                                    const alreadyHadThisOne = (prev[message.id]?.[emoji] || []).includes(uid);
                                    Object.keys(msgR).forEach(e => {
                                      msgR[e] = (msgR[e] || []).filter(u => u !== uid);
                                      if (msgR[e].length === 0) delete msgR[e];
                                    });
                                    if (!alreadyHadThisOne) msgR[emoji] = [...(msgR[emoji] || []), uid];
                                    return { ...prev, [message.id]: msgR };
                                  });
                                  setShowEmojiFor(null);
                                }}>{emoji}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    
                      <p className={`text-[10px] text-muted-foreground mt-1 flex items-center gap-1 ${message.isCurrentUser ? 'justify-end' : ''}`}>
                        {formatRelativeTime(message.timestamp)}
                        {message.isCurrentUser && <CheckCheck className="h-2.5 w-2.5 text-primary/60" />}
                      </p>
                  </div>
                </div>
                  );
                })()
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-t bg-card/50 flex-shrink-0">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder={t('messages.typeMessage')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                    }}
                    className="text-sm pr-12"
                    maxLength={1000}
                  />
                  {newMessage.length > 800 && (
                    <span className={`absolute right-3 bottom-2 text-[10px] ${
                      newMessage.length >= 1000 ? 'text-destructive' : 'text-muted-foreground'
                    }`}>{newMessage.length}/1000</span>
                  )}
                </div>
                <Button
                  onClick={handleSendMessage}
                  className="campus-gradient text-white hover:opacity-90 h-9 w-9 p-0 flex-shrink-0"
                  disabled={!newMessage.trim() || isSending}
                  aria-label="Send message"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 pl-0.5">Entrée pour envoyer</p>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-center p-8">
            <div className="space-y-4">
              <div className="w-20 h-20 campus-gradient rounded-full flex items-center justify-center mx-auto shadow-lg">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Vos messages</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Sélectionnez une conversation ou démarrez-en une nouvelle.
                </p>
              </div>
              <Button
                className="campus-gradient text-white hover:opacity-90"
                onClick={() => setShowNewConversationModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Nouveau message
              </Button>
            </div>
          </div>
        )}
      </div>
      <Dialog open={showNewConversationModal} onOpenChange={setShowNewConversationModal}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Nouveau message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Rechercher dans vos connexions..."
              value={connectionSearch}
              onChange={(e) => setConnectionSearch(e.target.value)}
            />
            <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
              {/* Connections */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground px-1">Vos connexions</p>
                {loadingConnections ? (
                  <div className="text-sm text-muted-foreground px-1">Chargement...</div>
                ) : filteredConnections.length === 0 ? (
                  <div className="text-sm text-muted-foreground px-1 opacity-70">
                    {connectionSearch ? "Aucun match" : "Aucune connexion trouvée"}
                  </div>
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
                          {(contact.name || "...").slice(0, 1).toUpperCase()}
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

              {/* Global search results */}
              {connectionSearch.trim().length >= 2 && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-[10px] font-bold text-muted-foreground px-1">Global (Tous les membres)</p>
                  {loadingGlobalUsers ? (
                    <div className="text-sm text-muted-foreground px-1">Recherche globale...</div>
                  ) : globalUsers.length === 0 ? (
                    <div className="text-sm text-muted-foreground px-1 opacity-70">Aucun membre trouvé</div>
                  ) : (
                    globalUsers
                      .filter(u => !connections.some(c => String(c.id) === String(u.id)))
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                          onClick={() => handleCreatePrivateConversation(u.id)}
                          disabled={isCreatingPrivate}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback>
                              {(u.name || "...").slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{u.username}
                            </p>
                          </div>
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog renommage groupe */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Renommer le groupe</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Nouveau nom..."
              maxLength={50}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)} disabled={isUpdatingConversation}>Annuler</Button>
              <Button onClick={handleRenameConfirm} disabled={!renameValue.trim() || isUpdatingConversation} className="campus-gradient text-white">
                {isUpdatingConversation ? <Loader2 className="h-4 w-4 animate-spin" /> : "Renommer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={participantsDialogOpen} onOpenChange={setParticipantsDialogOpen}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Participants de la conversation</DialogTitle>
          </DialogHeader>
          {loadingParticipants ? (
            <p className="text-sm text-muted-foreground py-4">Chargement des participants...</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(participants.length > 0 ? participants : selectedParticipants).map((participant: any) => {
                  const displayName = participant.full_name || participant.name || participant.username || "Utilisateur";
                  const isCurrent = String(participant.id) === String(currentUser?.id || "");
                  return (
                    <div key={participant.id} className="flex items-center justify-between border rounded-md p-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">@{participant.username || "utilisateur"}</p>
                      </div>
                      {isGroupCreator && !isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveMember(String(participant.id), displayName)}
                          disabled={pendingParticipantId === String(participant.id)}
                        >
                          Retirer
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedConv?.type === "group" && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium">Ajouter un membre</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filteredConnections
                      .filter((contact) => !(participants.length > 0 ? participants : selectedParticipants).some(
                        (p: any) => String(p.id) === String(contact.id)
                      ))
                      .map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between">
                          <span className="text-sm truncate">{contact.name}</span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAddMember(String(contact.id))}
                            disabled={!isGroupCreator || pendingParticipantId === String(contact.id)}
                          >
                            Ajouter
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
