import { useEffect, useState, useMemo } from "react";
import {
  Mail,
  Loader2,
  RefreshCw,
  Trash2,
  CheckCircle,
  Search,
  Eye,
  Reply,
  Inbox,
  User,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getContactMessages, markContactMessageAsRead, deleteContactMessage } from "@/services/api";

type ContactFilter = "all" | "unread" | "read";

export function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContactFilter>("all");
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await getContactMessages();
      setMessages(Array.isArray(res) ? res : res?.data || res?.results || []);
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e?.message || "Impossible de charger les messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleRead = async (id: number) => {
    try {
      await markContactMessageAsRead(id);
      setMessages(messages.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return;
    try {
      await deleteContactMessage(id);
      setMessages(messages.filter((m) => m.id !== id));
      toast({ title: "Message supprimé" });
      if (selectedMessage?.id === id) setIsDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    }
  };

  const openMessage = (msg: any) => {
    setSelectedMessage(msg);
    setIsDialogOpen(true);
    if (!msg.is_read) {
      void handleRead(msg.id);
    }
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const matchSearch =
        !search ||
        [m.name, m.email, m.subject, m.message].join(" ").toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (filter === "unread") return !m.is_read;
      if (filter === "read") return m.is_read;
      return true;
    });
  }, [messages, search, filter]);

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-5">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 font-automata">
                <Mail className="h-4 w-4 text-primary" />
                Boîte de Réception des Contacts
              </CardTitle>
              <CardDescription className="text-xs">
                {messages.length} message(s) au total · {unreadCount} non lu(s)
              </CardDescription>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={load}
              disabled={loading}
              className="h-8 gap-1.5 text-xs rounded-xl self-start md:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Recherche & Filtres */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, objet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-1.5 rounded-xl bg-muted/60 p-1">
              {[
                { key: "all", label: "Tous" },
                { key: "unread", label: `Non lus (${unreadCount})` },
                { key: "read", label: "Lus" },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  size="sm"
                  variant={filter === tab.key ? "default" : "ghost"}
                  className="h-7 px-2.5 text-xs rounded-lg font-medium"
                  onClick={() => setFilter(tab.key as ContactFilter)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Liste des messages */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs font-medium">Chargement des messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-2xl">
              <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground font-automata">Aucun message</p>
              <p className="text-xs text-muted-foreground mt-1">
                Votre boîte de réception est vide pour les filtres sélectionnés
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    !msg.is_read
                      ? "border-primary/40 bg-primary/[0.03] shadow-sm font-medium"
                      : "border-border bg-card hover:border-primary/30 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!msg.is_read ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                      )}
                      <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                        <Mail className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground truncate">{msg.name}</span>
                        <span className="text-[11px] text-muted-foreground truncate">&lt;{msg.email}&gt;</span>
                        {msg.newsletter && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">
                            Newsletter
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-foreground/90 truncate">{msg.subject}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{msg.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 text-muted-foreground">
                    <span className="text-[11px]">
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                          })
                        : ""}
                    </span>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(msg.id);
                      }}
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modale de Lecture & Réponse */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 font-automata">
              <Mail className="h-4 w-4 text-primary" />
              Message de Contact
            </DialogTitle>
            <DialogDescription className="text-xs">
              Détails de la demande reçue depuis le formulaire public
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border text-xs">
                <div>
                  <span className="text-muted-foreground">Expéditeur :</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedMessage.name}</p>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="text-primary hover:underline text-[11px] truncate block"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
                <div>
                  <span className="text-muted-foreground">Reçu le :</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {new Date(selectedMessage.created_at).toLocaleString("fr-FR")}
                  </p>
                  {selectedMessage.newsletter && (
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      Abonné Newsletter
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Objet :</span>
                <p className="font-bold text-sm text-foreground">{selectedMessage.subject}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Contenu du message :</span>
                <div className="p-4 rounded-xl border bg-card text-xs leading-relaxed whitespace-pre-wrap min-h-[120px] max-h-[250px] overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button asChild className="flex-1 rounded-xl text-xs h-9 gap-1.5">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                      `Re: ${selectedMessage.subject}`
                    )}`}
                  >
                    <Reply className="h-3.5 w-3.5" />
                    Répondre par email
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-xl text-xs h-9 gap-1.5"
                  onClick={() => handleDelete(selectedMessage.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

