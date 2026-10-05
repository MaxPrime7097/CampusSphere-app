import React, { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createPrivateConversation,
  deleteMessage,
  deleteConversation,
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
  toggleMessageReaction,
  deleteMessageReaction,
  getConversationPresence,
} from "@/services/api";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CaretDown as ChevronDown } from "@phosphor-icons/react";
import type { Conversation, Message, MessageType, ConversationParticipant } from "@/types";
import { storeMediaInCache } from "@/lib/mediaCache";
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
  ChatDetailsSidebar,
  MediaLightbox,
} from "@/components/chat";

function formatMessageDateSeparator(timestamp?: string | null): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return "Aujourd'hui";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "Hier";

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function isDifferentDay(d1?: string | null, d2?: string | null): boolean {
  if (!d1 || !d2) return true;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return true;
  return (
    date1.getDate() !== date2.getDate() ||
    date1.getMonth() !== date2.getMonth() ||
    date1.getFullYear() !== date2.getFullYear()
  );
}

function unwrapApiData(payload: any) {
  if (payload?.success !== undefined && payload?.data !== undefined) {
    return payload.data;
  }
  return payload;
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

  return {
    id: String(conv.hash_id || conv.id),
    hash_id: conv.hash_id ? String(conv.hash_id) : undefined,
    numericId: conv.id ? Number(conv.id) : undefined,
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

  const rawType = String(msg.type || "").toLowerCase();
  const isSysPattern =
    rawType === "system" ||
    (!msg.media_url &&
      /a (mis à jour la photo du groupe|supprimé la photo du groupe|renommé le groupe|ajouté .* au groupe|retiré .* du groupe|quitté le groupe)/i.test(
        msg.content || ""
      ));

  let finalType: MessageType = "text";
  if (isSysPattern) {
    finalType = "system";
  } else if (msg.duration || rawType === "audio" || msg.media_type?.startsWith("audio/")) {
    finalType = "audio";
  } else if (msg.media_type?.startsWith("video/") || rawType === "video") {
    finalType = "video";
  } else if (msg.media_type?.startsWith("image/") || rawType === "image") {
    finalType = "image";
  } else if (rawType === "file") {
    finalType = "file";
  }

  return {
    id: String(msg.id),
    type: finalType,
    status: msg.status || "sent",
    sender: author.name || author.username || "Utilisateur",
    senderUsername: author.username || "",
    senderId,
    content: msg.content || "",
    timestamp: msg.created_at || msg.createdAt || null,
    isEdited: Boolean(msg.is_edited),
    isCurrentUser: senderId === String(currentUserId || ""),
    avatar: author.avatar || "/placeholder-avatar.jpg",
    canEdit: msg.can_edit ?? senderId === String(currentUserId || ""),
    canDelete: msg.can_delete ?? senderId === String(currentUserId || ""),
    mediaUrl: msg.media_url || null,
    mediaType: msg.media_type || null,
    fileName: msg.file_name || null,
    fileSize: msg.file_size || null,
    duration: msg.duration || null,
    replyToId: msg.reply_to_id ? String(msg.reply_to_id) : null,
    replyTo: msg.reply_to
      ? {
          id: String(msg.reply_to.id),
          content: msg.reply_to.content || "",
          type: msg.reply_to.type || "text",
          author: msg.reply_to.author,
          author_info: msg.reply_to.author_info,
          created_at: msg.reply_to.created_at,
        }
      : null,
    isDeleted: Boolean(msg.is_deleted),
    deletedAt: msg.deleted_at || null,
    reactions: msg.reactions || [],
    reactionsSummary: msg.reactions_summary || {},
  };
}

export function Messages() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Match a conversation by id, hash_id, or numeric id — handles all URL forms
  const isMatchingConv = (conv: Conversation, id: string | undefined): boolean => {
    if (!id) return false;
    if (conv.id === id) return true;
    if (conv.hash_id && conv.hash_id === id) return true;
    const numId = parseSlugId(id);
    if (numId !== null) {
      if (conv.numericId === numId) return true;
      if (parseSlugId(conv.id) === numId) return true;
    }
    return false;
  };

  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!conversationId) return [];
    const cached = queryClient.getQueryData<any>(["messages", "conversation", conversationId]);
    const rawList = unwrapApiData(cached);
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((m: any) => mapMessage(m, String(currentUser?.id || "")));
    }
    return [];
  });
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
  const [typingUsers, setTypingUsers] = useState<Record<string, { username: string; expiresAt: number }>>({});
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type?: string; fileName?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<number | null>(null);
  const wsRetryRef = useRef<number>(0);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const activeConvIdRef = useRef<string | undefined>(conversationId);
  activeConvIdRef.current = conversationId;

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleScrollToMessage = (messageId: string) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/20");
      setTimeout(() => el.classList.remove("bg-primary/20"), 1500);
    }
  };

  const sendTypingIndicator = (isTyping: boolean) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "typing", is_typing: isTyping }));
    }
  };

  const handleMessageInputChange = (value: string) => {
    setNewMessage(value);
    const now = Date.now();
    if (value.trim().length > 0) {
      if (now - lastTypingSentRef.current > 2000) {
        lastTypingSentRef.current = now;
        sendTypingIndicator(true);
      }
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = window.setTimeout(() => {
        sendTypingIndicator(false);
        lastTypingSentRef.current = 0;
      }, 2500);
    } else {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      sendTypingIndicator(false);
      lastTypingSentRef.current = 0;
    }
  };

  // Clean up expired typers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [id, info] of Object.entries(next)) {
          if (info.expiresAt < now) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Instantly handle conversation switch so previous conversation messages NEVER linger!
  useEffect(() => {
    activeConvIdRef.current = conversationId;
    setTypingUsers({});
    setReplyingTo(null);
    if (!conversationId) {
      setMessages([]);
      return;
    }
    // Mark conversation read on the server and clear unread badge immediately
    void markConversationRead(conversationId).catch((): void => {});
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c))
    );
    // Check TanStack Query cache synchronously:
    const cached = queryClient.getQueryData<any>(["messages", "conversation", conversationId]);
    const rawList = unwrapApiData(cached);
    if (Array.isArray(rawList) && rawList.length > 0) {
      setMessages(rawList.map((m: any) => mapMessage(m, String(currentUser?.id || ""))));
    } else {
      setMessages([]);
    }
  }, [conversationId, queryClient, currentUser?.id]);

  // Seed conversations immediately from TanStack Query cache for 0ms render
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const cached = queryClient.getQueryData<any>(["messages", "conversations", currentUser?.id || "anon"]);
    const rawList = unwrapApiData(cached);
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((c: any) => mapConversation(c, String(currentUser?.id || "")));
    }
    return [];
  });
  const [connections, setConnections] = useState<any[]>(() => {
    const cached = queryClient.getQueryData<any>(["messages", "connections", currentUser?.id || "anon"]);
    const rawList = unwrapApiData(cached);
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList
        .map((conn: any) => {
          const isRequester = String(conn.requester) === String(currentUser?.id);
          const counterpart = isRequester ? conn.recipient_info : conn.requester_info;
          const counterpartId = isRequester ? conn.recipient : conn.requester;
          return {
            id: String(counterpart?.id || counterpartId),
            name: counterpart?.full_name || counterpart?.name || counterpart?.username || "Utilisateur",
            username: counterpart?.username || "",
            avatar: counterpart?.avatar || "/placeholder-avatar.jpg",
          };
        })
        .filter((contact: any) => contact.id);
    }
    return [];
  });
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [loadingGlobalUsers, setLoadingGlobalUsers] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [pendingParticipantId, setPendingParticipantId] = useState<string | null>(null);
  const [isUpdatingConversation, setIsUpdatingConversation] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deletingMessageIds, setDeletingMessageIds] = useState<Set<string>>(new Set());

  const conversationsQuery = useQuery({
    queryKey: ["messages", "conversations", currentUser?.id || "anon"],
    queryFn: () => getUserConversations(),
    enabled: Boolean(currentUser?.id),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const loadingConversations = conversationsQuery.isLoading && conversations.length === 0;

  const handlePrefetchConversation = (targetConvId: string) => {
    if (!targetConvId) return;
    queryClient.prefetchQuery({
      queryKey: ["messages", "conversation", targetConvId],
      queryFn: () => getConversationMessages(targetConvId),
      staleTime: 60 * 1000,
    });
  };

  const connectionsQuery = useQuery({
    queryKey: ["messages", "connections", currentUser?.id || "anon"],
    queryFn: () => getUserConnections(String(currentUser?.id || "")),
    enabled: Boolean(currentUser?.id),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
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
      const raw = unwrapApiData(conversationsQuery.data);
      if (Array.isArray(raw)) {
        setConversations(
          raw.map((conv: any) =>
            mapConversation(conv, String(currentUser?.id || ""))
          )
        );
      }
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
    }
  }, [conversationsQuery.data, conversationsQuery.error, currentUser?.id, toast]);

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
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

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
    setShowScrollBottom(false);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
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
    if (conversationId !== activeConvIdRef.current) {
      return;
    }

    if (conversationMessagesQuery.data) {
      const rawData = unwrapApiData(conversationMessagesQuery.data) || [];
      const mapped = (Array.isArray(rawData) ? rawData : []).map((msg: any) =>
        mapMessage(msg, String(currentUser?.id || ""))
      );
      setMessages((prev) => {
        if (conversationId !== activeConvIdRef.current) return prev;
        const messageMap = new Map<string, Message>();
        for (const m of mapped) {
          messageMap.set(m.id, m);
        }
        for (const m of prev) {
          if (m.status === "sending" && !messageMap.has(m.id)) {
            messageMap.set(m.id, m);
          }
        }
        return Array.from(messageMap.values()).sort((a, b) => {
          const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tA - tB;
        });
      });

      const initialReactions: Record<string, Record<string, string[]>> = {};
      for (const m of mapped) {
        if (m.reactionsSummary && Object.keys(m.reactionsSummary).length > 0) {
          initialReactions[m.id] = m.reactionsSummary;
        }
      }
      setReactions((prev) => ({ ...initialReactions, ...prev }));
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
      socketRef.current.onopen = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
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
    if (targetConversationId !== activeConvIdRef.current) return;
    try {
      const data =
        targetConversationId === conversationId && conversationMessagesQuery.data
          ? conversationMessagesQuery.data
          : await getConversationMessages(targetConversationId);
      if (targetConversationId !== activeConvIdRef.current) return;

      const rawData = unwrapApiData(data) || [];
      const mapped = (Array.isArray(rawData) ? rawData : []).map((msg: any) =>
        mapMessage(msg, String(currentUser?.id || ""))
      );
      setMessages((prev) => {
        if (targetConversationId !== activeConvIdRef.current) return prev;
        const messageMap = new Map<string, Message>();
        for (const m of mapped) {
          messageMap.set(m.id, m);
        }
        for (const m of prev) {
          if (m.status === "sending" && !messageMap.has(m.id)) {
            messageMap.set(m.id, m);
          }
        }
        return Array.from(messageMap.values()).sort((a, b) => {
          const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tA - tB;
        });
      });
      const initialReactions: Record<string, Record<string, string[]>> = {};
      for (const m of mapped) {
        if (m.reactionsSummary && Object.keys(m.reactionsSummary).length > 0) {
          initialReactions[m.id] = m.reactionsSummary;
        }
      }
      setReactions((prev) => ({ ...initialReactions, ...prev }));
    } catch {
      // ignore
    }
  };

  const startPolling = (targetConversationId: string) => {
    if (targetConversationId !== activeConvIdRef.current) return;
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(() => {
      if (targetConversationId !== activeConvIdRef.current) {
        if (pollingRef.current) {
          window.clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return;
      }
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
      if (conversationId !== activeConvIdRef.current) return;
      try {
        const payload = JSON.parse(event.data);
        const eventType = payload?.type;
        const data = payload?.payload || {};
        if (eventType === "message_created") {
          const rawMsg = data.message;
          const next = mapMessage(rawMsg, String(currentUser?.id || ""));
          setMessages((prev) => {
            // If already present by id, do not duplicate
            if (prev.some((item: any) => String(item.id) === String(next.id))) {
              return prev;
            }
            // If current user sent it, reconcile optimistic "sending" bubble!
            if (next.isCurrentUser) {
              const pendingIdx = prev.findIndex(
                (item: any) =>
                  item.status === "sending" &&
                  item.isCurrentUser &&
                  (item.content === next.content || (item.mediaType && item.mediaType === next.mediaType))
              );
              if (pendingIdx !== -1) {
                const nextList = [...prev];
                nextList[pendingIdx] = next;
                return nextList;
              }
            }
            return [...prev, next];
          });
          queryClient.setQueryData(
            ["messages", "conversation", conversationId],
            (old: any) => {
              const list = unwrapApiData(old) || [];
              if (!Array.isArray(list)) return [rawMsg];
              if (list.some((m: any) => String(m.id) === String(next.id))) return list;
              return [...list, rawMsg];
            }
          );
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
          setMessages((prev) =>
            prev.map((item: any) => (item.id === next.id ? { ...item, ...next } : item))
          );
        }
        if (eventType === "message_deleted") {
          const deletedId = String(data?.message_id || "");
          if (data?.message) {
            const next = mapMessage(data.message, String(currentUser?.id || ""));
            setMessages((prev) =>
              prev.map((item: any) => (item.id === deletedId ? { ...item, ...next } : item))
            );
          } else {
            setMessages((prev) => prev.filter((item: any) => item.id !== deletedId));
          }
        }
        if (eventType === "message_reaction_updated") {
          const messageId = String(data?.message_id || "");
          const summary = data?.reactions_summary || {};
          if (messageId) {
            setReactions((prev) => ({
              ...prev,
              [messageId]: summary,
            }));
          }
        }
        if (eventType === "conversation_updated") {
          if (data?.conversation) {
            const updatedConv = mapConversation(data.conversation, String(currentUser?.id || ""));
            setConversations((prev) =>
              prev.map((c) => (c.id === updatedConv.id ? { ...c, ...updatedConv } : c))
            );
          }
        }
        if (eventType === "conversation_read") {
          const readerId = String(data?.reader_id || "");
          if (readerId === String(currentUser?.id || "")) {
            setConversations((prev) =>
              prev.map((conversation) =>
                conversation.id === String(conversationId)
                  ? { ...conversation, unread: 0 }
                  : conversation
              )
            );
          } else {
            // Other participant read our messages -> turn checks blue ("read")!
            const readTimestamp = data?.timestamp ? new Date(data.timestamp).getTime() : Date.now();
            setMessages((prev) =>
              prev.map((m) => {
                if (m.isCurrentUser && m.status !== "read") {
                  const msgTime = m.timestamp ? new Date(m.timestamp).getTime() : 0;
                  if (msgTime <= readTimestamp) {
                    return { ...m, status: "read" };
                  }
                }
                return m;
              })
            );
            queryClient.setQueryData(
              ["messages", "conversation", conversationId],
              (old: any) => {
                const list = unwrapApiData(old) || [];
                if (!Array.isArray(list)) return old;
                return list.map((m: any) => {
                  const isAuthor = String(m.author || m.author_info?.id) === String(currentUser?.id || "");
                  if (isAuthor) {
                    return { ...m, status: "read", is_read: true, is_read_by_user: true };
                  }
                  return m;
                });
              }
            );
          }
        }
        if (eventType === "user_typing") {
          const typerId = String(data?.user_id || "");
          if (typerId && typerId !== String(currentUser?.id)) {
            const isTyping = Boolean(data?.is_typing);
            const username = data?.username || "Quelqu'un";
            setTypingUsers((prev) => {
              if (!isTyping) {
                const next = { ...prev };
                delete next[typerId];
                return next;
              }
              return {
                ...prev,
                [typerId]: { username, expiresAt: Date.now() + 3500 },
              };
            });
          }
        }
        if (eventType === "presence_state") {
          const onlineIds = (data?.online_user_ids || []).map((id: any) => String(id));
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === String(conversationId)) {
                const other = (conv.participants || []).find(
                  (p: any) => String(p.id) !== String(currentUser?.id)
                );
                const isOnline = other ? onlineIds.includes(String(other.id)) : false;
                return { ...conv, isOnline, onlineUserIds: onlineIds };
              }
              return conv;
            })
          );
        }
        if (eventType === "user_presence") {
          const userId = String(data?.user_id || "");
          const isOnline = Boolean(data?.is_online ?? data?.status === "online");
          if (userId === String(currentUser?.id)) return;

          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === String(conversationId)) {
                const other = (conv.participants || []).find(
                  (p: any) => String(p.id) !== String(currentUser?.id)
                );
                const isOther = other && String(other.id) === userId;
                const prevOnline: string[] = ((conv as any).onlineUserIds as string[]) || [];
                const nextOnline = isOnline
                  ? Array.from(new Set([...prevOnline, userId]))
                  : prevOnline.filter((id) => id !== userId);
                return {
                  ...conv,
                  isOnline: isOther ? isOnline : conv.isOnline,
                  onlineUserIds: nextOnline,
                };
              }
              return conv;
            })
          );
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      if (conversationId === activeConvIdRef.current) {
        startPolling(conversationId);
      }
    };
    ws.onclose = () => {
      if (conversationId !== activeConvIdRef.current) return;
      wsRetryRef.current += 1;
      if (wsRetryRef.current <= 2) {
        window.setTimeout(() => {
          if (conversationId === activeConvIdRef.current) {
            void fetchConversationMessages(conversationId).catch((): void => {});
          }
        }, 1200);
      } else {
        startPolling(conversationId);
      }
    };

    return () => stopRealtime();
  }, [conversationId, currentUser]);

  const handleSendMessage = async (file?: File, duration?: number) => {
    if (!conversationId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner une conversation",
      });
      return;
    }

    if (isSending || (!newMessage.trim() && !file)) return;

    if (!file) {
      const validation = messageSchema.safeParse({ content: newMessage });
      if (!validation.success) {
        toast({
          variant: "destructive",
          title: t("messages.validation.invalid", { defaultValue: "Message invalide" }),
          description: validation.error.errors[0].message,
        });
        return;
      }
    }

    const content = newMessage.trim();
    const reply_to_id = replyingTo?.id;
    const currentReplyingTo = replyingTo;

    // Reset input immediately for zero-latency feel
    setNewMessage("");
    setReplyingTo(null);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    sendTypingIndicator(false);
    lastTypingSentRef.current = 0;

    // Build optimistic message with clock icon
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const isImg = Boolean(file && file.type.startsWith("image/"));
    const isAud = Boolean(file && file.type.startsWith("audio/"));
    const isVid = Boolean(
      file && (file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi|ogv)$/i.test(file.name))
    );
    const localMediaUrl = file ? URL.createObjectURL(file) : null;

    const optimisticMsg: Message = {
      id: tempId,
      type: isImg ? "image" : isAud ? "audio" : isVid ? "video" : file ? "file" : "text",
      status: "sending",
      sender: currentUser?.name || currentUser?.username || "Moi",
      senderUsername: currentUser?.username || "",
      senderId: String(currentUser?.id || ""),
      content,
      timestamp: new Date().toISOString(),
      isEdited: false,
      isCurrentUser: true,
      avatar: (currentUser as any)?.avatar || "/placeholder-avatar.jpg",
      canEdit: false,
      canDelete: false,
      mediaUrl: localMediaUrl,
      mediaType: isImg ? "image" : isAud ? "audio" : isVid ? "video" : file ? "file" : null,
      fileName: file?.name || null,
      fileSize: file?.size || null,
      duration: duration || null,
      replyToId: reply_to_id || null,
      replyTo: currentReplyingTo
        ? {
            id: currentReplyingTo.id,
            content: currentReplyingTo.content,
            type: currentReplyingTo.type,
            author: currentReplyingTo.senderId,
            author_info: {
              id: currentReplyingTo.senderId,
              name: currentReplyingTo.sender,
              username: currentReplyingTo.senderUsername,
              avatar: currentReplyingTo.avatar,
            },
            created_at: currentReplyingTo.timestamp,
          }
        : null,
      isDeleted: false,
      deletedAt: null,
      reactions: [],
      reactionsSummary: {},
    };

    // Show in chat immediately!
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom("smooth"), 50);

    const targetConversationId = conversationId;
    setIsSending(true);
    try {
      const result = await sendMessage(targetConversationId, {
        content: content || undefined,
        file,
        reply_to_id,
        duration,
      });
      const rawMsg = unwrapApiData(result);
      const serverMsg = mapMessage(rawMsg, String(currentUser?.id || ""));

      if (file && serverMsg.mediaUrl) {
        void storeMediaInCache(serverMsg.mediaUrl, file, localMediaUrl || undefined);
      }
      const finalMsg = {
        ...serverMsg,
        mediaUrl: localMediaUrl || serverMsg.mediaUrl,
      };

      // Replace optimistic message with real message (or clean up tempId if ws already added it)
      setMessages((prev) => {
        if (activeConvIdRef.current !== targetConversationId) return prev;
        const alreadyHasServerMsg = prev.some((item) => String(item.id) === String(serverMsg.id));
        if (alreadyHasServerMsg) {
          return prev.filter((item) => item.id !== tempId);
        }
        return prev.map((item) => (item.id === tempId ? finalMsg : item));
      });
      queryClient.setQueryData(
        ["messages", "conversation", targetConversationId],
        (old: any) => {
          const list = unwrapApiData(old) || [];
          if (!Array.isArray(list)) return [rawMsg];
          const filtered = list.filter((m: any) => String(m.id) !== tempId);
          if (filtered.some((m: any) => String(m.id) === String(serverMsg.id))) return filtered;
          return [...filtered, rawMsg];
        }
      );
      void queryClient.invalidateQueries({
        queryKey: ["messages", "conversation", targetConversationId],
        exact: true,
      });
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === targetConversationId
            ? {
                ...conversation,
                lastMessage:
                  serverMsg.content ||
                  (file
                    ? isImg
                      ? "Photo"
                      : isAud
                      ? "Message vocal"
                      : isVid
                      ? "Vidéo"
                      : "Fichier"
                    : ""),
                lastMessageAt: serverMsg.timestamp,
              }
            : conversation
        )
      );
    } catch (e: any) {
      setMessages((prev) => {
        if (activeConvIdRef.current !== targetConversationId) return prev;
        return prev.map((item) => (item.id === tempId ? { ...item, status: "failed" } : item));
      });
      toast({
        variant: "destructive",
        title: "Échec de l'envoi",
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
    const targetConvId = conversationId;
    setDeletingMessageIds((prev) => new Set(prev).add(messageId));
    try {
      await deleteMessage(targetConvId, messageId);
      setMessages((prev) => prev.filter((item: any) => item.id !== messageId));
      queryClient.setQueryData(
        ["messages", "conversation", targetConvId],
        (old: any) => {
          const list = unwrapApiData(old) || [];
          if (!Array.isArray(list)) return [];
          return list.filter((m: any) => String(m.id) !== String(messageId));
        }
      );
      void queryClient.invalidateQueries({
        queryKey: ["messages", "conversation", targetConvId],
        exact: true,
      });
      toast({
        title: "Message supprimé",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e?.message || "Impossible de supprimer le message",
      });
    } finally {
      setDeletingMessageIds((prev) => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
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
          (conversation.participants || []).some(
            (participant: any) => String(participant.id) === String(targetUserId)
          )
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

  // Fetch initial presence for conversation
  useEffect(() => {
    if (!conversationId) return;
    void getConversationPresence(conversationId)
      .then((res) => {
        const onlineIds = (res.online_user_ids || []).map((id: any) => String(id));
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === String(conversationId)) {
              const other = (conv.participants || []).find(
                (p: any) => String(p.id) !== String(currentUser?.id)
              );
              const isOnline = other ? onlineIds.includes(String(other.id)) : false;
              return { ...conv, isOnline, onlineUserIds: onlineIds };
            }
            return conv;
          })
        );
      })
      .catch((): void => {});
  }, [conversationId, currentUser?.id]);

  // Global cross-conversation message event listener (from AppLayout notification socket)
  useEffect(() => {
    const handleGlobalMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      const targetConvId = String(data?.conversation_id || data?.target_id || "");
      if (targetConvId) {
        setConversations((prev) => {
          const existing = prev.find((c) => c.id === targetConvId);
          if (!existing) return prev;
          const updated = {
            ...existing,
            lastMessage: data?.message || data?.title || existing.lastMessage,
            lastMessageAt: new Date().toISOString(),
            unread: targetConvId === conversationId ? existing.unread : existing.unread + 1,
          };
          return [updated, ...prev.filter((c) => c.id !== targetConvId)];
        });
      }
    };
    window.addEventListener("campus:message_received", handleGlobalMessage);
    return () => window.removeEventListener("campus:message_received", handleGlobalMessage);
  }, [conversationId]);

  const selectedConv =
    conversations.find((c) => isMatchingConv(c, conversationId)) ??
    conversations.find(
      (c) =>
        c.type === "private" &&
        (c.participants || []).some((p: any) => String(p.id) === String(conversationId))
    );

  // Canonicalize URL: redirect numeric or unknown form to hash_id
  useEffect(() => {
    if (
      conversationId &&
      selectedConv?.hash_id &&
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

  const typingList = Object.values(typingUsers).map((u) => u.username);
  let typingLabel = "";
  if (typingList.length === 1) {
    typingLabel = `${typingList[0]} est en train d'écrire...`;
  } else if (typingList.length === 2) {
    typingLabel = `${typingList[0]} et ${typingList[1]} écrivent...`;
  } else if (typingList.length > 2) {
    typingLabel = "Plusieurs personnes écrivent...";
  }

  const selectedOnlineIds = ((selectedConv as any)?.onlineUserIds as string[]) || [];
  const onlineCount = selectedConv?.type === "group"
    ? selectedConv.participants.filter(
        (p) => String(p.id) !== String(currentUser?.id) && selectedOnlineIds.includes(String(p.id))
      ).length
    : undefined;


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
          conv.id === conversationId ? { ...conv, name: renameValue.trim() } : conv
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
          conv.id === conversationId ? { ...conv, participants: updatedParticipants } : conv
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
          conv.id === conversationId ? { ...conv, participants: updatedParticipants } : conv
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
          conv.id === conversationId ? { ...conv, unread: Math.max(1, conv.unread || 0) } : conv
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

  const handleAvatarUpload = async (file: File) => {
    if (!conversationId) return;
    try {
      const res: any = await uploadConversationAvatar(conversationId, file);
      const newAvatarUrl = res?.avatar_url || res?.data?.avatar_url || (typeof res === "string" ? res : null);
      if (newAvatarUrl) {
        setConversations((prev) =>
          prev.map((conv) => (conv.id === conversationId ? { ...conv, avatar: newAvatarUrl } : conv))
        );
      }
      void queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["messages", "conversation", conversationId] });
      toast({ title: "Photo du groupe mise à jour !" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de modifier la photo", variant: "destructive" });
    }
  };

  const handleRemoveAvatar = async () => {
    if (!conversationId) return;
    try {
      await removeConversationAvatar(conversationId);
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, avatar: null } : conv))
      );
      toast({ title: "Avatar supprimé" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
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

    if (conversationId) {
      try {
        await toggleMessageReaction(conversationId, messageId, emoji);
      } catch (err: any) {
        console.error("Failed to toggle reaction on server:", err);
      }
    }
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
          loading={loadingConversations}
          onSelectConversation={(id) => {
            navigate(`/messages/${id}`);
            handleMarkAsRead(id);
          }}
          onPrefetchConversation={handlePrefetchConversation}
          onOpenNewPrivate={() => setShowNewConversationModal(true)}
          showCreateGroupModal={showCreateGroupConversationModal}
          onSetShowCreateGroupModal={setShowCreateGroupConversationModal}
          onGroupCreated={(groupData) => {
            const newConversation = mapConversation(groupData, String(currentUser?.id || ""));
            setConversations((prev) => [
              newConversation,
              ...prev.filter((item) => item.id !== newConversation.id),
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
          <div className="flex-1 flex min-w-0 h-full relative overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 h-full relative bg-slate-50/50 dark:bg-zinc-950/60">
              <ChatHeader
                conversation={selectedConv}
                currentUserId={currentUser?.id != null ? String(currentUser.id) : undefined}
                transportMode={transportMode}
                isUpdatingConversation={isUpdatingConversation}
                typingText={typingLabel}
                onlineCount={onlineCount}
                isDetailsOpen={showDetailsSidebar}
                onToggleDetails={() => setShowDetailsSidebar((prev) => !prev)}
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
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-2 sm:p-4 scrollbar-thin scroll-smooth relative"
              >
                <div className="min-h-full flex flex-col justify-end space-y-2">
                  {messages.map((message, index) => {
                    const prevMessage = index > 0 ? messages[index - 1] : undefined;
                    const showDateSeparator =
                      index === 0 || isDifferentDay(prevMessage?.timestamp, message.timestamp);
                    const isModerator = Boolean(
                      selectedConv.type === "group" &&
                        String(selectedConv.createdBy || "") === String(currentUser?.id || "")
                    );

                    const isSystemMessage =
                      message.type === "system" ||
                      Boolean(
                        !message.mediaUrl &&
                          /a (mis à jour la photo du groupe|supprimé la photo du groupe|renommé le groupe|ajouté .* au groupe|retiré .* du groupe|quitté le groupe)/i.test(
                            message.content || ""
                          )
                      );

                    if (isSystemMessage) {
                      return (
                        <Fragment key={message.id}>
                          {showDateSeparator && (
                            <div className="flex justify-center my-3.5 select-none">
                              <span className="bg-slate-200/80 dark:bg-zinc-800/80 backdrop-blur-md text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-3.5 py-1 rounded-full shadow-xs">
                                {formatMessageDateSeparator(message.timestamp)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-center my-2 select-none">
                            <span className="bg-slate-200/70 dark:bg-zinc-800/70 border border-slate-300/40 dark:border-zinc-700/40 text-[11px] font-medium text-slate-600 dark:text-slate-300 px-3.5 py-1 rounded-full shadow-xs text-center max-w-md">
                              {message.content}
                            </span>
                          </div>
                        </Fragment>
                      );
                    }

                    return (
                      <Fragment key={message.id}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-3.5 select-none">
                            <span className="bg-slate-200/80 dark:bg-zinc-800/80 backdrop-blur-md text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-3.5 py-1 rounded-full shadow-xs">
                              {formatMessageDateSeparator(message.timestamp)}
                            </span>
                          </div>
                        )}
                        <ChatMessageItem
                          message={message}
                          isCurrentUser={message.isCurrentUser}
                          isModerator={isModerator}
                          isGroup={selectedConv.type === "group"}
                          isDeleting={deletingMessageIds.has(message.id)}
                          isEditing={editingMessageId === message.id}
                          editingContent={editingContent}
                          onStartEdit={handleStartEdit}
                          onChangeEditContent={setEditingContent}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={() => setEditingMessageId(null)}
                          onDelete={handleDeleteMessage}
                          onReply={handleReply}
                          onScrollToMessage={handleScrollToMessage}
                          messageReactions={reactions[message.id]}
                          onToggleReaction={handleToggleReaction}
                          showEmojiPicker={showEmojiFor === message.id}
                          onToggleEmojiPicker={(msgId) =>
                            setShowEmojiFor((prev) => (prev === msgId ? null : msgId))
                          }
                          onSelectEmoji={handleSelectEmoji}
                          onNavigateProfile={handleProfileNavigation}
                          onOpenMedia={(url, type, name) =>
                            setLightboxMedia({ url, type, fileName: name })
                          }
                        />
                      </Fragment>
                    );
                  })}
                  {typingLabel && (
                    <div className="flex items-center gap-2 py-1 px-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center gap-1.5 bg-muted/80 backdrop-blur-sm rounded-2xl px-3.5 py-2 shadow-sm border border-border/40">
                        <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" />
                        <span className="ml-1 text-xs text-muted-foreground font-medium">{typingLabel}</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Floating Scroll-to-bottom button (Telegram style) */}
              {showScrollBottom && (
                <button
                  type="button"
                  onClick={() => scrollToBottom("smooth")}
                  className="absolute right-6 bottom-24 w-10 h-10 rounded-full bg-card/95 backdrop-blur-md shadow-md border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95 z-20"
                  title="Faire défiler vers le bas"
                  aria-label="Faire défiler vers le bas"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              )}

              <ChatMessageInput
                value={newMessage}
                onChange={handleMessageInputChange}
                onSend={handleSendMessage}
                isSending={isSending}
                placeholder={t("messages.typeMessage")}
                replyingTo={replyingTo}
                onCancelReply={handleCancelReply}
              />
            </div>

            {/* Right Details Community / Channel Info Panel (Dribbble & Telegram references) */}
            <ChatDetailsSidebar
              conversation={selectedConv}
              currentUserId={currentUser?.id != null ? String(currentUser.id) : undefined}
              messages={messages}
              participants={participants.length > 0 ? participants : (selectedConv.participants || [])}
              isOpen={showDetailsSidebar}
              isLoading={conversationMessagesQuery.isLoading}
              onClose={() => setShowDetailsSidebar(false)}
              onlineCount={onlineCount}
              onOpenParticipants={openParticipantsDialog}
              onRenameGroup={() => {
                setRenameValue(selectedConv.name || "");
                setRenameDialogOpen(true);
              }}
              onLeaveConversation={handleLeaveSelectedConversation}
              onDeleteConversation={handleDeleteSelectedConversation}
              onAvatarUpload={handleAvatarUpload}
              onNavigateProfile={handleProfileNavigation}
              onOpenMedia={(url, type, name) =>
                setLightboxMedia({ url, type, fileName: name })
              }
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

      <MediaLightbox
        isOpen={Boolean(lightboxMedia)}
        onClose={() => setLightboxMedia(null)}
        mediaUrl={lightboxMedia?.url || null}
        mediaType={lightboxMedia?.type}
        fileName={lightboxMedia?.fileName}
      />
    </div>
  );
}

export default Messages;
