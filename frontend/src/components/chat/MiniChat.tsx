import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createGroupConversation,
  getConversationMessages,
  getCurrentUser,
  getUserConversations,
  isNetworkApiError,
  listSphereMembers,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Maximize2, MessageCircle, MessagesSquare, Minimize2, RefreshCw, Users } from "lucide-react";

interface MiniChatProps {
  sphereId: string;
  sphereName: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  className?: string;
}

export function MiniChat({
  sphereId,
  sphereName,
  isExpanded,
  onToggleExpanded,
  className = "",
}: MiniChatProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const socketRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<number | null>(null);
  const wsRetryRef = useRef<number>(0);
  const liveModeRef = useRef<"ws" | "polling" | "idle">("idle");

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [transportMode, setTransportMode] = useState<"ws" | "polling" | "idle">("idle");

  const toList = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.results)) return value.results;
    if (Array.isArray(value?.data?.results)) return value.data.results;
    if (Array.isArray(value?.data)) return value.data;
    return [];
  };

  const toMessage = (msg: any) => {
    const author = msg?.author_info || msg?.author || {};
    const authorName =
      author?.name ||
      `${author?.first_name || ""} ${author?.last_name || ""}`.trim() ||
      author?.username ||
      "Utilisateur";

    return {
      id: String(msg?.id || crypto.randomUUID()),
      content: msg?.content || "",
      authorName,
      createdAt: msg?.created_at || msg?.createdAt || new Date().toISOString(),
    };
  };

  const fetchMessages = async (targetConversationId: string, limit = 20) => {
    const response = await getConversationMessages(targetConversationId);
    const mapped = toList(response).map(toMessage);
    setMessages(mapped.slice(-limit));
  };

  const startPolling = (targetConversationId: string) => {
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(() => {
      void fetchMessages(targetConversationId).catch(() => null);
    }, 5000);
    liveModeRef.current = "polling";
    setTransportMode("polling");
  };

  const stopRealtime = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    liveModeRef.current = "idle";
    setTransportMode("idle");
  };

  const connectWebSocket = (targetConversationId: string) => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = (import.meta.env.VITE_API_WS_HOST as string | undefined) || window.location.host;
    const wsUrl = `${wsProtocol}://${wsHost}/ws/chat/${targetConversationId}/`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      wsRetryRef.current = 0;
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      liveModeRef.current = "ws";
      setTransportMode("ws");
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type !== "chat_message") return;
        const mapped = toMessage(payload?.message);
        setMessages((prev) => {
          if (prev.some((item) => String(item.id) === String(mapped.id))) return prev;
          return [...prev, mapped].slice(-20);
        });
      } catch {
        // ignore malformed payloads
      }
    };

    ws.onerror = () => {
      if (liveModeRef.current !== "polling") startPolling(targetConversationId);
    };

    ws.onclose = () => {
      if (liveModeRef.current === "ws") {
        wsRetryRef.current += 1;
        if (wsRetryRef.current <= 2) {
          window.setTimeout(() => connectWebSocket(targetConversationId), 1200);
          return;
        }
      }
      if (liveModeRef.current !== "polling") startPolling(targetConversationId);
    };
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setLoadError(null);

      try {
        let currentUser: any;
        try {
          currentUser = await getCurrentUser();
        } catch (error: any) {
          throw new Error(
            isNetworkApiError(error)
              ? "Connexion API impossible (CORS/backend indisponible)"
              : error?.message || "Impossible de récupérer l'utilisateur courant."
          );
        }

        let conversationsResponse: any;
        try {
          conversationsResponse = await getUserConversations();
        } catch (error: any) {
          throw new Error(
            isNetworkApiError(error)
              ? "Connexion API impossible (CORS/backend indisponible)"
              : error?.message || "Impossible de récupérer les conversations utilisateur."
          );
        }

        const membersResponse = await listSphereMembers(sphereId);

        const myId = String(currentUser?.id || "");
        const allConversations = toList(conversationsResponse);
        const sphereConversationName = `sphere-${sphereId}`;

        const existing = allConversations.find((conv: any) => {
          const type = conv?.type || conv?.conversation_type;
          const name = (conv?.name || "").trim().toLowerCase();
          return type === "group" && name === sphereConversationName.toLowerCase();
        });

        let resolvedConversation = existing;

        if (!resolvedConversation) {
          const participantIds = toList(membersResponse)
            .map((member: any) => member?.user_info?.id || member?.user || member?.id)
            .filter(Boolean)
            .map(String)
            .filter((id: string) => id !== myId);

          if (participantIds.length >= 2) {
            const created = await createGroupConversation(sphereConversationName, participantIds);
            resolvedConversation = created?.data || created;
          }
        }

        const resolvedId = resolvedConversation?.id ? String(resolvedConversation.id) : null;

        if (!mounted) return;
        setConversationId(resolvedId);

        if (!resolvedId) {
          setMessages([]);
          setTransportMode("idle");
          return;
        }

        await fetchMessages(resolvedId);
        if (!mounted) return;
        connectWebSocket(resolvedId);
      } catch (error: any) {
        if (!mounted) return;
        const message = error?.message || "Impossible d'initialiser le chat de sphère.";
        setLoadError(message);
        toast({
          title: "Chat indisponible",
          description: message,
          variant: "destructive",
        });
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
      stopRealtime();
    };
  }, [sphereId, toast]);

  const statusText = useMemo(() => {
    if (transportMode === "ws") return "Canal temps réel connecté";
    if (transportMode === "polling") return "Mode secours (polling HTTP)";
    return "Canal temps réel indisponible";
  }, [transportMode]);

  return (
    <Card className={`campus-card transition-all duration-300 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Chat de la sphère</CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{statusText}</span>
                <Badge variant="secondary" className="text-xs">
                  {sphereName || sphereId}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div
          className={`rounded-lg border border-dashed bg-muted/30 px-4 py-4 ${
            isExpanded ? "min-h-80" : "min-h-48"
          }`}
        >
          {isBootstrapping ? (
            <div className="h-full min-h-[140px] w-full flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion au chat de sphère...
            </div>
          ) : loadError ? (
            <div className="h-full min-h-[140px] w-full flex flex-col items-center justify-center text-center">
              <p className="font-medium mb-2">Impossible de charger le chat.</p>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">{loadError}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          ) : !conversationId ? (
            <div className="h-full min-h-[140px] w-full flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-4">
                <MessagesSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium mb-2">Conversation de sphère indisponible.</p>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Il faut au moins 3 membres dans la sphère pour créer automatiquement un salon de groupe.
              </p>
              <Button onClick={() => navigate("/messages")} className="campus-gradient text-white hover:opacity-90">
                Ouvrir la messagerie
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="space-y-2 overflow-auto pr-1" style={{ maxHeight: isExpanded ? 300 : 180 }}>
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucun message récent.</p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="rounded-md bg-background/90 border px-3 py-2">
                      <div className="text-xs text-muted-foreground mb-1">{message.authorName}</div>
                      <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-3 mt-3 border-t flex justify-end">
                <Button onClick={() => navigate(`/messages/${conversationId}`)} className="campus-gradient text-white hover:opacity-90">
                  Ouvrir la conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
