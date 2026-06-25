import { useEffect, useRef, useState } from "react";
import { getConversationMessages, getUserConversations, sendMessage, getCurrentUser, listSphereMembers, createGroupConversation } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Maximize2, MessageCircle, Minimize2, Send, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date";
import { renderMentionText } from "@/lib/mentions";
import { useToast } from "@/hooks/use-toast";



interface MiniChatProps {
  sphereId: string;
  sphereName: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  className?: string;
}

export function MiniChat({ sphereId, sphereName, isExpanded, onToggleExpanded, className = "" }: MiniChatProps) {
  const { toast } = useToast();
  const pollingRef = useRef<number | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transportMode, setTransportMode] = useState<"ws" | "polling" | "idle">("idle");
  const [memberIds, setMemberIds] = useState<string[]>([]);


  const toList = (v: any): any[] => {
    if (Array.isArray(v)) return v;
    if (Array.isArray(v?.data)) return v.data;
    if (Array.isArray(v?.results)) return v.results;
    if (Array.isArray(v?.data?.results)) return v.data.results;
    return [];
  };

  const toMsg = (m: any, myId?: string) => {
    const author = m?.author_info || m?.author || {};
    const senderId = String(author?.id || m?.author || "");
    return {
      id: String(m?.id || ""),
      content: m?.content || "",
      sender: author?.name || author?.full_name || author?.username || "Utilisateur",
      avatar: author?.avatar || null,
      timestamp: m?.created_at || m?.createdAt || null,
      isMe: myId ? senderId === myId : false,
    };
  };

  const fetchMessages = async (convId: string, myId?: string) => {
    const data = await getConversationMessages(convId);
    const mapped = toList(data).map((m) => toMsg(m, myId));
    setMessages(mapped.slice(-30));
  };

  const stopRealtime = () => {
    if (socketRef.current) { socketRef.current.close(); socketRef.current = null; }
    if (pollingRef.current) { window.clearInterval(pollingRef.current); pollingRef.current = null; }
    setTransportMode("idle");
  };

  const startPolling = (convId: string, myId?: string) => {
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(() => {
      void fetchMessages(convId, myId).catch(() => null);
    }, 4000);
    setTransportMode("polling");
  };

  const connectWS = (convId: string, myId?: string) => {
    if (socketRef.current) { socketRef.current.close(); socketRef.current = null; }
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || "";
    const host = (import.meta.env.VITE_API_WS_HOST as string | undefined) ||
      (apiUrl ? apiUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : window.location.host);
    const token = localStorage.getItem("access_token") || localStorage.getItem("access");
    const ws = new WebSocket(`${proto}://${host}/ws/conversations/${convId}/${token ? `?token=${token}` : ""}`);
    socketRef.current = ws;

    ws.onopen = () => {
      if (pollingRef.current) { window.clearInterval(pollingRef.current); pollingRef.current = null; }
      setTransportMode("ws");
    };
    ws.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload?.type === "message_created") {
          const next = toMsg(payload?.payload?.message, myId);
          setMessages((prev) => prev.some((x) => x.id === next.id) ? prev : [...prev, next].slice(-30));
        }
      } catch { /* ignore */ }
    };
    ws.onerror = () => startPolling(convId, myId);
    ws.onclose = () => startPolling(convId, myId);
  };

  useEffect(() => {
    let mounted = true;
    const SPHERE_CONV_PREFIX = `sphere-${sphereId}`;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setLoadError(null);
      try {
        const [user, convsRaw] = await Promise.all([getCurrentUser(), getUserConversations()]);
        if (!mounted) return;

        const myId = user?.id ? String(user.id) : undefined;
        setCurrentUser(user);

        const convs = toList(convsRaw);
        // Chercher une conv de groupe existante liée à cette sphère (nommée sphere-<id>)
        const existing = convs.find((c: any) => {
          const name = (c?.name || "").trim().toLowerCase();
          const type = c?.type || c?.conversation_type;
          // Match exactly sphere-{id} or a name containing (sphere-{id})
          return type === "group" && (
            name === SPHERE_CONV_PREFIX.toLowerCase() || 
            name.includes(`(${SPHERE_CONV_PREFIX.toLowerCase()})`)
          );
        });

        if (!existing) {
          try {
            
            const membersRaw = await listSphereMembers(sphereId);
            const ids = toList(membersRaw)
              .map((m: any) => String(m.user_info?.id ?? m.user ?? ""))
              .filter((id: string) => id && id !== myId);
            setMemberIds(ids);
          } catch {
            setMemberIds([]);
          }
          setConversationId(null);
          setIsBootstrapping(false);
          return;
        }

        const convId = String(existing.id);
        setConversationId(convId);
        await fetchMessages(convId, myId);
        if (!mounted) return;
        connectWS(convId, myId);
      } catch (err: any) {
        if (mounted) setLoadError(err?.message || "Impossible de charger le chat.");
      } finally {
        if (mounted) setIsBootstrapping(false);
      }

    };

    void bootstrap();
    return () => { mounted = false; stopRealtime(); };
  }, [sphereId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if ((!conversationId && memberIds.length === 0 && !currentUser) || !newMessage.trim() || isSending) return;
    
    // Si pas de conversation, on tente de la créer. On vérifie d'abord si on a des membres.
    if (!conversationId && memberIds.length === 0) {
      toast({
        title: "Discussion impossible",
        description: "Il n'y a aucun autre membre dans cette sphère pour discuter.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage("");
    try {
      let currentConvId = conversationId;
      
      if (!currentConvId) {
        
        const SPHERE_CONV_PREFIX = `sphere-${sphereId}`;
        // Use a more descriptive name for the conversation
        const convName = `${sphereName} (sphere-${sphereId})`;
        const created = await createGroupConversation(convName, memberIds);
        const groupData = created?.data ?? created;
        if (groupData?.id) {
          currentConvId = String(groupData.id);
          setConversationId(currentConvId);
          connectWS(currentConvId, currentUser?.id ? String(currentUser.id) : undefined);
        } else {
          // Extraction plus fine de l'erreur
          const errorDetail = 
            groupData?.detail || 
            (groupData?.participant_ids ? `Membres : ${groupData.participant_ids.join(', ')}` : null) ||
            groupData?.message || 
            "Impossible d'initialiser la discussion";
          throw new Error(errorDetail);
        }
      }

      const result = await sendMessage(currentConvId, content);
      const mapped = toMsg(result, currentUser?.id ? String(currentUser.id) : undefined);
      setMessages((prev) => prev.some((x) => x.id === mapped.id) ? prev : [...prev, mapped].slice(-30));
    } catch (e: any) {
      setNewMessage(content);
      toast({ title: "Erreur d'envoi", description: e?.message || "Impossible d'envoyer le message", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };


  const statusDot = transportMode === "ws"
    ? "bg-green-500"
    : transportMode === "polling"
      ? "bg-yellow-500"
      : "bg-muted-foreground";

  return (
    <Card className={`campus-card transition-all duration-300 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <MessageCircle className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Chat · {sphereName}</CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                <span>
                  {transportMode === "ws" ? "Temps réel" : transportMode === "polling" ? "Polling" : "Hors ligne"}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleExpanded} className="h-7 w-7 p-0">
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {/* Messages area */}
        <div
          className="rounded-lg border bg-muted/20 overflow-y-auto p-2 space-y-2"
          style={{ height: isExpanded ? 320 : 200 }}
        >
          {isBootstrapping ? (
            <div className="h-full flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
            </div>
          ) : loadError ? (
            <div className="h-full flex items-center justify-center text-sm text-destructive text-center px-2">
              {loadError}
            </div>
          ) : !conversationId ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-3">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Aucun canal de discussion pour cette sphère.<br />
                Écrivez le premier message pour commencer !
              </p>
            </div>

          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Aucun message. Soyez le premier !
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.isMe ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={msg.avatar ?? undefined} />
                  <AvatarFallback className="text-[10px]">{(msg.sender || "...").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${msg.isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {!msg.isMe && (
                    <span className="text-[10px] text-muted-foreground mb-0.5">{msg.sender}</span>
                  )}
                  <div className={`rounded-lg px-2.5 py-1.5 text-sm ${msg.isMe ? "campus-gradient text-white" : "bg-card border"}`}>
                    {renderMentionText(msg.content)}
                  </div>

                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {formatRelativeTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!isBootstrapping && !loadError && (
          <div className="flex gap-2">

            <Input
              placeholder="Écrire un message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
              className="text-sm h-8"
              maxLength={500}
              disabled={isSending}
            />
            <Button
              size="sm"
              className="campus-gradient text-white h-8 w-8 p-0 flex-shrink-0"
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
