import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  getConversationMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  toggleMessageReaction,
  uploadSphereFile,
  getSphereConversation,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Spinner as Loader2,
  ArrowsOut as Maximize2,
  ArrowsIn as Minimize2,
  PaperPlaneTilt as Send,
  Users,
  Smiley,
  GraduationCap,
  Crown,
  ShieldCheck,
  ArrowDown,
  UploadSimple,
  Hash,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Microphone,
  Trash,
  X,
  ArrowBendUpLeft,
  DotsThreeVertical as MoreVertical,
  Copy,
  PencilSimple,
  Prohibit,
  DownloadSimple,
  Sparkle,
  MagnifyingGlass,
  Check,
} from "@phosphor-icons/react";
import {
  CachedImage,
  SoundwavePlayer,
  CustomVideoPlayer,
  StatusCheckmarks,
  formatFileSize,
  formatAudioTime,
  formatMessageTime,
} from "./ChatMessageItem";
import { MediaLightbox } from "./MediaLightbox";
import { EMOJI_CATEGORIES } from "./ChatMessageInput";
import { storeMediaInCache, triggerDirectDownload } from "@/lib/mediaCache";
import { renderMentionText } from "@/lib/mentions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/components/ui/sidebar";
import type { Message } from "@/types";

interface MiniChatProps {
  sphereId: string;
  sphereName: string;
  sphereMembers?: any[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  className?: string;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "🎉", "👏"];

function mapRawMessage(msg: any, currentUserId: string): Message {
  const author = msg?.author_info || msg?.author || {};
  const senderId = String(author?.id || msg?.author || "");
  const rawType = (msg.type || "").toLowerCase();
  let finalType: "text" | "image" | "audio" | "video" | "file" | "system" = "text";

  if (rawType === "audio" || (msg.media_type && msg.media_type.startsWith("audio/"))) {
    finalType = "audio";
  } else if (
    rawType === "video" ||
    (msg.media_type && msg.media_type.startsWith("video/")) ||
    /\.(mp4|webm|mov|mkv|avi)$/i.test(msg.file_name || "")
  ) {
    finalType = "video";
  } else if (
    rawType === "image" ||
    (msg.media_type && msg.media_type.startsWith("image/")) ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(msg.file_name || "")
  ) {
    finalType = "image";
  } else if (rawType === "file" || (msg.media_url && !rawType)) {
    finalType = "file";
  }

  const isSystem = Boolean(
    msg.content?.startsWith("📎 J'ai partagé") ||
      msg.content?.startsWith("👋") ||
      msg.content?.startsWith("[SYSTEM]") ||
      rawType === "system"
  );
  if (isSystem) {
    finalType = "system";
  }

  return {
    id: String(msg.id),
    type: finalType,
    status: msg.status || "sent",
    sender: author.name || author.full_name || author.username || "Utilisateur",
    senderUsername: author.username || "",
    senderId,
    content: msg.content || "",
    timestamp: msg.created_at || msg.createdAt || null,
    isEdited: Boolean(msg.is_edited),
    isCurrentUser: senderId === String(currentUserId || ""),
    avatar: author.avatar || "/placeholder-avatar.jpg",
    canEdit: msg.can_edit ?? (senderId === String(currentUserId || "") && finalType === "text"),
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

function getDateSeparatorLabel(timestamp?: string | null): string {
  if (!timestamp) return "Aujourd'hui";
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "Aujourd'hui";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

interface CachedSphereChat {
  conversationId: string;
  messages: Message[];
  cachedAt: number;
}
const sphereChatCache = new Map<string, CachedSphereChat>();

export function MiniChat({
  sphereId,
  sphereName,
  sphereMembers = [],
  isExpanded,
  onToggleExpanded,
  className = "",
}: MiniChatProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const sidebar = useSidebar();
  const sidebarOffset = sidebar.state === "collapsed" ? "3rem" : "16rem";
  const isSidebarMobile = sidebar.isMobile;

  // Refs
  const pollingRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isInitialLoadRef = useRef(true);
  const prevMessagesLengthRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const sphereResourceInputRef = useRef<HTMLInputElement | null>(null);

  // Audio recording refs & state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Initialize from cache immediately for 0ms transition without blank screens or spinners!
  const cachedData = sphereChatCache.get(sphereId);
  const [conversationId, setConversationId] = useState<string | null>(
    () => cachedData?.conversationId || null
  );
  const [messages, setMessages] = useState<Message[]>(() => cachedData?.messages || []);
  const [inputContent, setInputContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(() => !cachedData);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transportMode, setTransportMode] = useState<"ws" | "polling" | "idle">("idle");
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Interactions state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(0);
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    type?: string;
    fileName?: string;
  } | null>(null);

  // Members role lookup
  const membersMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const m of sphereMembers) {
      if (m.userId) map.set(String(m.userId), m);
      if (m.user_info?.id) map.set(String(m.user_info.id), m);
      if (m.id) map.set(String(m.id), m);
      if (m.username) map.set(String(m.username).toLowerCase(), m);
    }
    return map;
  }, [sphereMembers]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputContent]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean audio stream on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Fetch messages helper
  const fetchMessages = async (convId: string, myId: string) => {
    try {
      const data = await getConversationMessages(convId);
      const list = Array.isArray(data) ? data : (data as any)?.results || [];
      const mapped = list.map((m: any) => mapRawMessage(m, myId));
      setMessages((prev) => {
        const messageMap = new Map<string, Message>();
        for (const m of mapped) {
          messageMap.set(m.id, m);
        }
        for (const m of prev) {
          if (m.status === "sending" && !messageMap.has(m.id)) {
            messageMap.set(m.id, m);
          }
        }
        const sorted = Array.from(messageMap.values()).sort((a, b) => {
          const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tA - tB;
        });

        // Deep identity check: if unchanged, preserve previous reference to avoid re-rendering and scroll flicker!
        if (prev.length === sorted.length) {
          const isIdentical = prev.every((oldMsg, idx) => {
            const newMsg = sorted[idx];
            return (
              oldMsg.id === newMsg.id &&
              oldMsg.content === newMsg.content &&
              oldMsg.status === newMsg.status &&
              oldMsg.isEdited === newMsg.isEdited &&
              JSON.stringify(oldMsg.reactionsSummary || {}) ===
                JSON.stringify(newMsg.reactionsSummary || {})
            );
          });
          if (isIdentical) {
            return prev;
          }
        }

        // Update persistent cache
        sphereChatCache.set(sphereId, {
          conversationId: convId,
          messages: sorted,
          cachedAt: Date.now(),
        });

        return sorted;
      });
    } catch {
      /* ignore */
    }
  };

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

  const startPolling = (convId: string, myId: string) => {
    if (pollingRef.current) return;
    pollingRef.current = window.setInterval(() => {
      void fetchMessages(convId, myId).catch((): void => {});
    }, 5000);
    setTransportMode("polling");
  };

  const connectWS = (convId: string, myId: string) => {
    stopRealtime();
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || "";
    const host =
      (import.meta.env.VITE_API_WS_HOST as string | undefined) ||
      (apiUrl ? apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : window.location.host);
    const token = localStorage.getItem("access_token") || localStorage.getItem("access");

    const ws = new WebSocket(
      `${proto}://${host}/ws/conversations/${convId}/${token ? `?token=${token}` : ""}`
    );
    socketRef.current = ws;

    ws.onopen = () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setTransportMode("ws");
    };

    ws.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        const eventType = payload?.type;
        const data = payload?.payload || {};

        if (eventType === "message_created") {
          const rawMsg = data.message;
          const next = mapRawMessage(rawMsg, myId);
          setMessages((prev) => {
            if (prev.some((x) => x.id === next.id)) return prev;
            // Reconcile optimistic sending bubble
            let updatedList: Message[];
            if (next.isCurrentUser) {
              const pendingIdx = prev.findIndex(
                (item) =>
                  item.status === "sending" &&
                  item.isCurrentUser &&
                  (item.content === next.content || (item.mediaType && item.mediaType === next.mediaType))
              );
              if (pendingIdx !== -1) {
                const nextList = [...prev];
                nextList[pendingIdx] = next;
                updatedList = nextList;
              } else {
                updatedList = [...prev, next];
              }
            } else {
              updatedList = [...prev, next];
            }

            sphereChatCache.set(sphereId, {
              conversationId: convId,
              messages: updatedList,
              cachedAt: Date.now(),
            });
            return updatedList;
          });
        } else if (eventType === "message_updated") {
          const next = mapRawMessage(data.message, myId);
          setMessages((prev) => {
            const updated = prev.map((item) => (item.id === next.id ? { ...item, ...next } : item));
            sphereChatCache.set(sphereId, {
              conversationId: convId,
              messages: updated,
              cachedAt: Date.now(),
            });
            return updated;
          });
        } else if (eventType === "message_deleted") {
          const deletedId = String(data?.message_id || "");
          setMessages((prev) => {
            let updated: Message[];
            if (data?.message) {
              const next = mapRawMessage(data.message, myId);
              updated = prev.map((item) => (item.id === deletedId ? { ...item, ...next } : item));
            } else {
              updated = prev.filter((item) => item.id !== deletedId);
            }
            sphereChatCache.set(sphereId, {
              conversationId: convId,
              messages: updated,
              cachedAt: Date.now(),
            });
            return updated;
          });
        } else if (eventType === "message_reaction_updated") {
          const messageId = String(data?.message_id || "");
          const summary = data?.reactions_summary || {};
          if (messageId) {
            setMessages((prev) => {
              const updated = prev.map((item) =>
                item.id === messageId ? { ...item, reactionsSummary: summary } : item
              );
              sphereChatCache.set(sphereId, {
                conversationId: convId,
                messages: updated,
                cachedAt: Date.now(),
              });
              return updated;
            });
          }
        }
      } catch {
        /* ignore */
      }
    };

    ws.onerror = () => startPolling(convId, myId);
    ws.onclose = () => startPolling(convId, myId);
  };

  // Bootstrap conversation from dedicated endpoint
  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      // Only show bootstrapping spinner if we have no cached data at all
      if (!sphereChatCache.has(sphereId)) {
        setIsBootstrapping(true);
      }
      setLoadError(null);
      try {
        const myId = String(currentUser?.id || "");
        // 1. Resolve or provision the sphere group conversation cleanly via backend
        const conv = await getSphereConversation(sphereId);
        if (!mounted) return;

        if (conv?.id || conv?.hash_id) {
          const convId = String(conv.hash_id || conv.id);
          setConversationId(convId);
          await fetchMessages(convId, myId);
          if (!mounted) return;
          connectWS(convId, myId);
        } else {
          throw new Error("Impossible d'obtenir la conversation de cette sphère.");
        }
      } catch (err: any) {
        if (mounted && !sphereChatCache.has(sphereId)) {
          setLoadError(err?.message || "Impossible de charger le salon de discussion.");
        }
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    };

    void bootstrap();
    return () => {
      mounted = false;
      stopRealtime();
    };
  }, [sphereId, currentUser?.id]);

  // Scroll detection & Smooth scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  // Only auto-scroll when a brand-new message has actually been added or on initial mount
  useEffect(() => {
    if (isInitialLoadRef.current) {
      if (messages.length > 0) {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
        isInitialLoadRef.current = false;
        prevMessagesLengthRef.current = messages.length;
      }
      return;
    }

    if (messages.length > prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = messages.length;
      if (!showScrollBottom) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages.length, showScrollBottom]);

  // Prevent background scroll when chat is expanded
  useEffect(() => {
    if (isExpanded) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isExpanded]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingMessageId) {
          setEditingMessageId(null);
          setEditingText("");
        } else if (replyingTo) {
          setReplyingTo(null);
        } else if (isExpanded) {
          onToggleExpanded();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, onToggleExpanded, editingMessageId, replyingTo]);

  // File selection handling
  const handleFilePicked = (file?: File | null) => {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale autorisée est de 50 Mo.",
        variant: "destructive",
      });
      return;
    }

    setAttachedFile(file);
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const removeAttachment = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAttachedFile(null);
    setPreviewUrl(null);
  };

  // Drag and drop
  const handleFileDrop = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    handleFilePicked(file);
  };

  // Upload as sphere resource & announce
  const handleUploadSphereResource = async (file: File) => {
    if (!conversationId) return;
    setIsUploadingFile(true);
    try {
      await uploadSphereFile(sphereId, file, file.name);
      toast({
        title: "Ressource ajoutée !",
        description: `"${file.name}" a été partagé dans les ressources de la sphère.`,
      });
      // Announce in chat stream
      const announcement = `📎 J'ai partagé un nouveau fichier : **${file.name}**`;
      await handleSend(announcement, file);
    } catch (err: any) {
      toast({
        title: "Erreur de téléversement",
        description: err?.message || "Impossible de partager le fichier.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Audio Recording (Slack / WhatsApp style)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((sec) => sec + 1);
      }, 1000);
    } catch {
      toast({
        title: "Microphone inaccessible",
        description: "Veuillez autoriser l'accès au microphone pour enregistrer un message vocal.",
        variant: "destructive",
      });
    }
  };

  const cancelRecording = () => {
    if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);

    const recordedDuration = recordSeconds;
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || "audio/webm",
      });
      const audioFile = new File([blob], `vocal-${Date.now()}.webm`, {
        type: blob.type || "audio/webm",
      });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsRecording(false);
      setRecordSeconds(0);

      void handleSend("", audioFile, recordedDuration);
    };

    mediaRecorderRef.current.stop();
  };

  // Sending Messages (Text, Audio, Video, Photo, File) with optimistic zero-latency caching
  const handleSend = async (contentToSend?: string, fileToSend?: File, duration?: number) => {
    if (!conversationId) return;

    const content = (contentToSend !== undefined ? contentToSend : inputContent).trim();
    const file = fileToSend || attachedFile || undefined;

    if (!content && !file) return;
    if (isSending) return;

    // Reset input fields
    setInputContent("");
    removeAttachment();
    const currentReplyingTo = replyingTo;
    setReplyingTo(null);

    // Build optimistic message
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const isImg = Boolean(file && file.type.startsWith("image/"));
    const isAud = Boolean(file && file.type.startsWith("audio/"));
    const isVid = Boolean(
      file && (file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name))
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
      replyToId: currentReplyingTo?.id || null,
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
            created_at: currentReplyingTo.timestamp || undefined,
          }
        : null,
      isDeleted: false,
      deletedAt: null,
      reactions: [],
      reactionsSummary: {},
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom("smooth"), 50);

    setIsSending(true);
    try {
      const res = await sendMessage(conversationId, {
        content: content || undefined,
        file,
        reply_to_id: currentReplyingTo?.id,
        duration,
      });

      const serverMsg = mapRawMessage(res, String(currentUser?.id || ""));

      // Cache locally to prevent any reload
      if (file && serverMsg.mediaUrl) {
        void storeMediaInCache(serverMsg.mediaUrl, file, localMediaUrl || undefined);
      }

      const finalMsg = {
        ...serverMsg,
        mediaUrl: localMediaUrl || serverMsg.mediaUrl,
      };

      setMessages((prev) => {
        const alreadyExists = prev.some((m) => String(m.id) === String(serverMsg.id));
        if (alreadyExists) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? finalMsg : m));
      });
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputContent(content);
      toast({
        title: "Erreur d'envoi",
        description: err?.message || "Impossible d'envoyer le message.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Edit message (Within 15 minutes limit)
  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
  };

  const handleSaveEdit = async () => {
    if (!conversationId || !editingMessageId || !editingText.trim()) return;
    const targetId = editingMessageId;
    const nextContent = editingText.trim();
    setEditingMessageId(null);
    setEditingText("");

    setMessages((prev) =>
      prev.map((m) => (m.id === targetId ? { ...m, content: nextContent, isEdited: true } : m))
    );

    try {
      await updateMessage(conversationId, targetId, nextContent);
    } catch (err: any) {
      toast({
        title: "Erreur de modification",
        description: err?.message || "Impossible de modifier le message.",
        variant: "destructive",
      });
      void fetchMessages(conversationId, String(currentUser?.id || ""));
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId: string) => {
    if (!conversationId) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, isDeleted: true, content: "Ce message a été supprimé" } : m
      )
    );

    try {
      await deleteMessage(conversationId, msgId);
      toast({ title: "Message supprimé" });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible de supprimer le message.",
        variant: "destructive",
      });
      void fetchMessages(conversationId, String(currentUser?.id || ""));
    }
  };

  // Toggle Reaction
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!conversationId || !currentUser?.id) return;
    const myId = String(currentUser.id);

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentSummary = { ...(m.reactionsSummary || {}) };
        const userList = currentSummary[emoji] ? [...currentSummary[emoji]] : [];
        const hasReacted = userList.includes(myId);

        if (hasReacted) {
          const nextUsers = userList.filter((uid) => uid !== myId);
          if (nextUsers.length === 0) {
            delete currentSummary[emoji];
          } else {
            currentSummary[emoji] = nextUsers;
          }
        } else {
          currentSummary[emoji] = [...userList, myId];
        }
        return { ...m, reactionsSummary: currentSummary };
      })
    );

    try {
      await toggleMessageReaction(conversationId, messageId, emoji);
    } catch {
      /* ignore */
    }
  };

  // Filter messages if search is active
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.sender.toLowerCase().includes(q) ||
        (m.fileName && m.fileName.toLowerCase().includes(q))
    );
  }, [messages, searchQuery]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDraggingOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        void handleFileDrop(e.dataTransfer.files);
      }}
      className={`bg-card shadow-xs flex flex-col transition-all duration-200 overflow-hidden ${
        isExpanded
          ? "fixed inset-0 z-50 w-screen h-screen bg-background border-none rounded-none m-0 p-0"
          : "border rounded-2xl h-[620px] md:h-[700px] w-full relative"
      } ${className}`}
    >
      {/* Hidden File Pickers */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFilePicked(e.target.files?.[0])}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleFilePicked(e.target.files?.[0])}
      />
      <input
        ref={sphereResourceInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUploadSphereResource(file);
        }}
      />

      {/* Drag Over Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary rounded-2xl pointer-events-none transition-all">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 animate-bounce">
            <UploadSimple className="h-8 w-8" />
          </div>
          <p className="text-base font-bold text-foreground">Déposez votre fichier ici</p>
          <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
            Il sera prêt à être envoyé dans le salon de la sphère
          </p>
        </div>
      )}

      {/* Uploading Resource Banner */}
      {isUploadingFile && (
        <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-center gap-2 text-xs text-primary font-medium flex-shrink-0 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>Partage de la ressource dans la sphère...</span>
        </div>
      )}

      {/* Slack Header */}
      <div className="px-4 py-3 border-b bg-card flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Hash className="h-5 w-5 font-bold" weight="bold" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm md:text-base leading-tight truncate text-foreground">
                {sphereName}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    transportMode === "ws"
                      ? "bg-emerald-500 animate-pulse"
                      : transportMode === "polling"
                      ? "bg-amber-500"
                      : "bg-muted-foreground"
                  }`}
                />
                <span className="text-[11px]">
                  {transportMode === "ws"
                    ? "En direct"
                    : transportMode === "polling"
                    ? "Synchro"
                    : "Hors ligne"}
                </span>
              </span>
              <span>•</span>
              <span className="truncate flex items-center gap-1 text-[11px]">
                <Users className="h-3 w-3" />
                {sphereMembers.length > 0
                  ? `${sphereMembers.length} membre${sphereMembers.length > 1 ? "s" : ""}`
                  : "Sanctuaire privé"}
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearchBar(!showSearchBar)}
            className={`h-8 w-8 rounded-lg ${showSearchBar ? "bg-muted text-foreground" : "text-muted-foreground"}`}
            title="Rechercher dans le salon"
          >
            <MagnifyingGlass className="h-4 w-4" />
          </Button>

          {isExpanded ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleExpanded}
              className="gap-1.5 text-xs font-semibold shadow-xs h-8 bg-background hover:bg-muted"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Quitter le plein écran</span>
              <kbd className="hidden sm:inline-block ml-1 text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground border">
                Échap
              </kbd>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpanded}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              title="Agrandir (Plein écran)"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Inline Search Bar */}
      {showSearchBar && (
        <div className="px-4 py-2 bg-muted/40 border-b flex items-center gap-2">
          <MagnifyingGlass className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par mot-clé, membre, fichier..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Slack Continuous Message Stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 md:p-4 relative bg-background select-text"
      >
        <div className={isExpanded ? "max-w-5xl mx-auto w-full space-y-1" : "space-y-1"}>
          {/* Loading State */}
          {isBootstrapping && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs font-medium text-muted-foreground">
                Connexion au salon de la sphère...
              </p>
            </div>
          )}

        {/* Load Error State */}
        {loadError && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-center my-6">
            <p className="text-xs font-semibold">{loadError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-2 text-xs"
            >
              Réessayer
            </Button>
          </div>
        )}

        {/* Empty Conversation Welcome */}
        {!isBootstrapping && !loadError && filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center p-8 my-auto h-full max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
              <Hash className="h-6 w-6 font-bold" weight="bold" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Bienvenue dans #{sphereName}</h4>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              C'est le début du salon de travail de cette sphère. Échangez avec vos camarades, posez
              vos questions et partagez des ressources !
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => void handleSend(emoji)}
                  className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-sm border border-border/40 transition-transform hover:scale-110 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message List */}
        {!isBootstrapping &&
          filteredMessages.map((msg, index) => {
            const prevMsg = filteredMessages[index - 1];
            const showDate =
              !prevMsg ||
              new Date(prevMsg.timestamp || "").toDateString() !==
                new Date(msg.timestamp || "").toDateString();

            // Resolve Member Info & Badges
            const member =
              membersMap.get(msg.senderId) ||
              (msg.senderUsername ? membersMap.get(msg.senderUsername.toLowerCase()) : null);
            const isCreator = Boolean(
              member?.isCreator || member?.role === "creator" || member?.role === "owner"
            );
            const isTeacher = Boolean(member?.role === "teacher" || member?.role === "professor");
            const isAdmin = Boolean(member?.role === "admin" || member?.role === "moderator");

            // 15-Minute Edit Rule
            const isWithin15Min =
              msg.timestamp && Date.now() - new Date(msg.timestamp).getTime() < 15 * 60 * 1000;
            const canEdit = msg.isCurrentUser && msg.type === "text" && !msg.isDeleted && isWithin15Min;
            const canDelete =
              !msg.isDeleted && (msg.isCurrentUser || isCreator || isAdmin);

            // System Message (Centered WhatsApp-style pill)
            if (msg.type === "system") {
              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="relative flex items-center justify-center my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/40" />
                      </div>
                      <div className="relative bg-background px-3 py-0.5 rounded-full border border-border/50 text-[11px] font-semibold text-muted-foreground shadow-2xs">
                        {getDateSeparatorLabel(msg.timestamp)}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-center my-2.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 dark:bg-zinc-800/80 border border-border/50 text-xs text-muted-foreground shadow-2xs">
                      <Sparkle className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium text-foreground">{msg.content}</span>
                      <span className="text-[10px] text-muted-foreground/70">
                        • {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            }

            // Slack Continuous Message Row
            const reactionsMap = msg.reactionsSummary || {};
            const hasReactions = Object.keys(reactionsMap).length > 0;
            const isEditing = editingMessageId === msg.id;

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="relative flex items-center justify-center my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/40" />
                    </div>
                    <div className="relative bg-background px-3 py-0.5 rounded-full border border-border/50 text-[11px] font-semibold text-muted-foreground shadow-2xs">
                      {getDateSeparatorLabel(msg.timestamp)}
                    </div>
                  </div>
                )}

                <div
                  className={`group/msg relative flex gap-3 px-3 py-1.5 rounded-xl hover:bg-muted/40 dark:hover:bg-zinc-800/40 transition-colors ${
                    msg.isCurrentUser ? "bg-muted/10 dark:bg-zinc-900/10" : ""
                  }`}
                >
                  {/* Sender Avatar */}
                  <Avatar className="h-9 w-9 rounded-lg shrink-0 mt-0.5 border border-border/40">
                    <AvatarImage src={msg.avatar} alt={msg.sender} />
                    <AvatarFallback className="rounded-lg text-xs font-semibold bg-primary/10 text-primary">
                      {msg.sender.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Body */}
                  <div className="flex-1 min-w-0">
                    {/* Header Row: Name + Role Badges + Timestamp + Checkmarks */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs md:text-sm text-foreground hover:underline cursor-pointer">
                        {msg.sender}
                      </span>

                      {/* Slack Role Badges */}
                      {isCreator && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 h-4 gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-medium"
                        >
                          <Crown className="h-2.5 w-2.5" weight="fill" />
                          <span>Créateur</span>
                        </Badge>
                      )}
                      {isTeacher && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 h-4 gap-1 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 font-medium"
                        >
                          <GraduationCap className="h-2.5 w-2.5" weight="bold" />
                          <span>Professeur</span>
                        </Badge>
                      )}
                      {isAdmin && !isCreator && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 h-4 gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10 font-medium"
                        >
                          <ShieldCheck className="h-2.5 w-2.5" weight="bold" />
                          <span>Admin</span>
                        </Badge>
                      )}

                      <span
                        className="text-[11px] text-muted-foreground ml-1"
                        title={
                          msg.timestamp
                            ? new Date(msg.timestamp).toLocaleString("fr-FR")
                            : undefined
                        }
                      >
                        {formatMessageTime(msg.timestamp)}
                      </span>

                      {msg.isCurrentUser && (
                        <span className="text-muted-foreground">
                          <StatusCheckmarks status={msg.status} />
                        </span>
                      )}

                      {msg.isEdited && (
                        <span className="text-[10px] text-muted-foreground/75 italic">
                          (modifié)
                        </span>
                      )}
                    </div>

                    {/* Quoted Message / Reply Preview */}
                    {msg.replyTo && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 mb-1 border-l-2 border-primary/60 pl-2.5 py-0.5 bg-muted/30 rounded-r">
                        <ArrowBendUpLeft className="h-3 w-3 shrink-0 text-primary" />
                        <span className="font-semibold text-foreground">
                          {msg.replyTo.author_info?.name || "Message"}
                        </span>
                        :
                        <span className="truncate max-w-sm text-foreground/80">
                          {msg.replyTo.content || "Pièce jointe"}
                        </span>
                      </div>
                    )}

                    {/* Content Section */}
                    {msg.isDeleted ? (
                      <p className="text-xs italic text-muted-foreground flex items-center gap-1 mt-1">
                        <Prohibit className="h-3.5 w-3.5" /> Ce message a été supprimé
                      </p>
                    ) : isEditing ? (
                      /* Inline Message Editor */
                      <div className="mt-1.5 flex flex-col gap-2 max-w-md">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void handleSaveEdit();
                            }
                          }}
                          className="w-full text-xs md:text-sm rounded-lg p-2.5 bg-card border border-primary/50 focus:ring-1 focus:ring-primary outline-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <Button size="xs" onClick={handleSaveEdit} className="h-7 text-xs">
                            Enregistrer
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setEditingMessageId(null)}
                            className="h-7 text-xs"
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Text Content */}
                        {msg.content && (
                          <div className="text-xs md:text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed select-text mt-0.5">
                            {renderMentionText(msg.content)}
                          </div>
                        )}

                        {/* Media: Image with Caching & Lightbox */}
                        {msg.type === "image" && msg.mediaUrl && (
                          <div className="mt-2 max-w-sm rounded-xl overflow-hidden border border-border/50 cursor-pointer shadow-2xs hover:border-primary/40 transition-colors">
                            <CachedImage
                              src={msg.mediaUrl}
                              alt={msg.fileName || "Photo"}
                              className="max-h-72 w-auto object-cover rounded-xl hover:opacity-95 transition-opacity"
                              onClick={() =>
                                setLightboxMedia({
                                  url: msg.mediaUrl!,
                                  type: "image",
                                  fileName: msg.fileName || undefined,
                                })
                              }
                            />
                          </div>
                        )}

                        {/* Media: Video with Custom Controls & WhatsApp Download */}
                        {msg.type === "video" && msg.mediaUrl && (
                          <div className="mt-2 max-w-sm">
                            <CustomVideoPlayer
                              src={msg.mediaUrl}
                              fileName={msg.fileName}
                              timestamp={msg.timestamp}
                              status={msg.status}
                              isCurrentUser={msg.isCurrentUser}
                              isAutoCaption={!msg.content}
                              onOpenMedia={(url, type, name) =>
                                setLightboxMedia({ url, type: type || "video", fileName: name })
                              }
                            />
                          </div>
                        )}

                        {/* Media: Voice Note with WhatsApp Waves & Speed Toggles */}
                        {msg.type === "audio" && msg.mediaUrl && (
                          <div className="mt-2 max-w-sm p-2 rounded-xl bg-card border border-border/70 shadow-2xs">
                            <SoundwavePlayer
                              src={msg.mediaUrl}
                              duration={msg.duration}
                              isCurrentUser={msg.isCurrentUser}
                              timestamp={msg.timestamp}
                              status={msg.status}
                            />
                          </div>
                        )}

                        {/* Media: File / Sphere Resource Card */}
                        {msg.type === "file" && msg.mediaUrl && (
                          <div className="mt-2 flex items-center justify-between gap-3 p-2.5 max-w-sm rounded-xl bg-card border border-border/70 hover:border-primary/40 transition-colors shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {msg.fileName || "Fichier joint"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatFileSize(msg.fileSize)}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full shrink-0 text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                triggerDirectDownload(msg.mediaUrl!, msg.fileName || "fichier")
                              }
                              title="Télécharger"
                            >
                              <DownloadSimple className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Reactions Row (Slack style clickable pills) */}
                    {hasReactions && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {Object.entries(reactionsMap).map(([emoji, userIds]) => {
                          const hasReacted = userIds.includes(String(currentUser?.id || ""));
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                                hasReacted
                                  ? "bg-primary/15 border-primary/40 text-primary"
                                  : "bg-muted/40 hover:bg-muted border-border/50 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="text-[11px] font-semibold">{userIds.length}</span>
                            </button>
                          );
                        })}

                        {/* Add reaction plus button */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center justify-center h-6 w-6 rounded-full bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 text-xs transition-colors"
                              title="Ajouter une réaction"
                            >
                              <Smiley className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="p-1.5 flex gap-1">
                            {QUICK_REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-sm"
                              >
                                {emoji}
                              </button>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  {/* Slack Floating Hover Action Bar */}
                  {!msg.isDeleted && (
                    <div className="absolute right-3 -top-3 hidden group-hover/msg:flex items-center gap-0.5 bg-card border border-border/80 rounded-lg shadow-md px-1 py-0.5 z-10 backdrop-blur-xs">
                      {QUICK_REACTIONS.slice(0, 3).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-sm transition-transform active:scale-90"
                          title="Réagir"
                        >
                          {emoji}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setReplyingTo(msg)}
                        className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        title="Répondre"
                      >
                        <ArrowBendUpLeft className="h-3.5 w-3.5" />
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            title="Plus d'actions"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 shadow-lg">
                          <DropdownMenuItem
                            onClick={() => {
                              void navigator.clipboard.writeText(msg.content);
                              toast({ title: "Copié dans le presse-papier" });
                            }}
                            className="gap-2 cursor-pointer text-xs"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copier le texte</span>
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() => handleStartEdit(msg)}
                              className="gap-2 cursor-pointer text-xs"
                            >
                              <PencilSimple className="h-3.5 w-3.5" />
                              <span>Modifier (15 min)</span>
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
                            >
                              <Trash className="h-3.5 w-3.5" />
                              <span>Supprimer</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}

          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute right-4 bottom-28 z-20 h-9 w-9 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95"
          title="Faire défiler vers le bas"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}

      {/* Slack Composer (Bottom Input Box) */}
      {!isBootstrapping && !loadError && (
        <div className="p-3 border-t bg-card flex flex-col gap-2 flex-shrink-0">
          <div className={isExpanded ? "max-w-5xl mx-auto w-full flex flex-col gap-2" : "flex flex-col gap-2"}>
            {/* Replying To Banner */}
          {replyingTo && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 rounded-lg border border-border/50 text-xs text-muted-foreground animate-in fade-in">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowBendUpLeft className="h-3 w-3 text-primary shrink-0" />
                <span>
                  En réponse à <strong className="text-foreground">{replyingTo.sender}</strong> :
                </span>
                <span className="italic truncate max-w-xs">{replyingTo.content || "Fichier"}</span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="hover:text-foreground p-0.5 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Attached File Preview */}
          {attachedFile && (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 border border-border/60 max-w-sm">
              {previewUrl ? (
                attachedFile.type.startsWith("video/") ? (
                  <video
                    src={previewUrl}
                    className="h-10 w-10 object-cover rounded-lg border border-border/40"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Aperçu"
                    className="h-10 w-10 object-cover rounded-lg border border-border/40"
                  />
                )
              ) : (
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{attachedFile.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatFileSize(attachedFile.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-destructive"
                onClick={removeAttachment}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Audio Recording State Bar */}
          {isRecording ? (
            <div className="flex items-center justify-between gap-3 bg-destructive/10 border border-destructive/20 rounded-xl px-3.5 py-2 shadow-2xs animate-in fade-in">
              <button
                type="button"
                onClick={cancelRecording}
                className="h-8 w-8 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                title="Annuler l'enregistrement"
              >
                <Trash className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 flex-1 justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-ping shrink-0" />
                <span className="text-xs font-mono font-bold text-destructive tabular-nums">
                  {formatAudioTime(recordSeconds)}
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  Enregistrement du message vocal...
                </span>
              </div>

              <button
                type="button"
                onClick={stopAndSendRecording}
                className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-2xs transition-transform active:scale-95 shrink-0"
                title="Envoyer le vocal"
              >
                <Send className="h-3.5 w-3.5" weight="fill" />
              </button>
            </div>
          ) : (
            /* Slack Composer Container */
            <div className="flex flex-col rounded-xl border border-border/80 bg-background focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 shadow-2xs transition-all overflow-hidden">
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={`Envoyer un message dans #${sphereName}...`}
                rows={1}
                maxLength={2000}
                className="w-full resize-none bg-transparent px-3.5 py-2 text-xs md:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[38px] max-h-32 scrollbar-thin leading-relaxed"
              />

              {/* Bottom Toolbar Inside Composer */}
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/20 border-t border-border/40">
                {/* Left Attachment Actions */}
                <div className="flex items-center gap-1">
                  {/* Plus / Paperclip Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Ajouter un fichier"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top" className="mb-2 rounded-xl p-1.5 shadow-lg">
                      <DropdownMenuItem
                        onClick={() => imageInputRef.current?.click()}
                        className="gap-2.5 cursor-pointer rounded-lg py-2 px-3 text-xs"
                      >
                        <ImageIcon className="h-4 w-4 text-emerald-500" />
                        <span>Photo ou Vidéo</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2.5 cursor-pointer rounded-lg py-2 px-3 text-xs"
                      >
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span>Document / Fichier</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => sphereResourceInputRef.current?.click()}
                        className="gap-2.5 cursor-pointer rounded-lg py-2 px-3 text-xs text-primary font-medium"
                      >
                        <UploadSimple className="h-4 w-4 text-primary" />
                        <span>Téléverser dans les ressources de la sphère</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Microphone Voice Note Button */}
                  <button
                    type="button"
                    onClick={startRecording}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Enregistrer un message vocal"
                  >
                    <Microphone className="h-4 w-4" />
                  </button>

                  {/* Emoji Picker Popover */}
                  <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Émojis"
                      >
                        <Smiley className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="start"
                      className="w-72 sm:w-80 p-2 rounded-2xl shadow-xl border bg-card text-card-foreground mb-2"
                    >
                      {/* Category Header */}
                      <div className="flex items-center justify-between border-b pb-1.5 mb-2 gap-1">
                        {EMOJI_CATEGORIES.map((cat, i) => (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => setSelectedEmojiCategory(i)}
                            className={`text-base h-8 flex-1 rounded-lg flex items-center justify-center transition-colors ${
                              selectedEmojiCategory === i
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted text-muted-foreground"
                            }`}
                            title={cat.name}
                          >
                            {cat.icon}
                          </button>
                        ))}
                      </div>

                      {/* Emoji Grid */}
                      <div className="grid grid-cols-7 sm:grid-cols-8 gap-1 max-h-48 overflow-y-auto scrollbar-thin p-1">
                        {EMOJI_CATEGORIES[selectedEmojiCategory].emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="text-lg h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-transform hover:scale-115 active:scale-95"
                            onClick={() => {
                              setInputContent((prev) => prev + emoji);
                              if (textareaRef.current) textareaRef.current.focus();
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Right Send Action Button */}
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={(!inputContent.trim() && !attachedFile) || isSending}
                  className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-transform active:scale-95 shadow-2xs disabled:opacity-40 disabled:pointer-events-none"
                  title="Envoyer (Entrée)"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5 ml-0.5" weight="fill" />
                  )}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Media Lightbox */}
      <MediaLightbox
        isOpen={Boolean(lightboxMedia)}
        onClose={() => setLightboxMedia(null)}
        mediaUrl={lightboxMedia?.url || ""}
        mediaType={lightboxMedia?.type}
        fileName={lightboxMedia?.fileName}
      />
    </div>
  );
}
