import { useEffect, useState } from "react";
import { Mail, Loader2, RefreshCw, Trash2, CheckCircle, Search, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getContactMessages, markContactMessageAsRead, deleteContactMessage } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getContactMessages();
      setMessages(Array.isArray(res) ? res : res?.data || res?.results || []);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Impossible de charger les messages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleRead = async (id: number) => {
    try {
      await markContactMessageAsRead(id);
      setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m));
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return;
    try {
      await deleteContactMessage(id);
      setMessages(messages.filter(m => m.id !== id));
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
      handleRead(msg.id);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Messages de Contact</CardTitle>
            <CardDescription>Consultez les messages envoyés depuis la page Nous contacter</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">Aucun message pour le moment.</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-3 font-semibold text-sm bg-muted/50 border-b">
                <div className="col-span-2">Date</div>
                <div className="col-span-3">Expéditeur</div>
                <div className="col-span-5">Sujet</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y max-h-[60vh] overflow-y-auto">
                {Array.isArray(messages) && messages.map((msg) => (
                  <div key={msg.id} className={`grid grid-cols-12 gap-2 p-3 text-sm items-center hover:bg-muted/30 transition-colors ${!msg.is_read ? 'bg-primary/5 font-medium' : ''}`}>
                    <div className="col-span-2 truncate text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="col-span-3 truncate flex flex-col">
                      <span>{msg.name}</span>
                      <span className="text-xs text-muted-foreground">{msg.email}</span>
                    </div>
                    <div className="col-span-5 truncate flex items-center gap-2">
                      {!msg.is_read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                      <span className="truncate">{msg.subject}</span>
                    </div>
                    <div className="col-span-2 text-right flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openMessage(msg)}>
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(msg.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Message
            </DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                <div>
                  <div className="text-muted-foreground mb-1">De :</div>
                  <div className="font-medium">{selectedMessage.name}</div>
                  <div className="text-muted-foreground">{selectedMessage.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Détails :</div>
                  <div>Reçu le {new Date(selectedMessage.created_at).toLocaleString()}</div>
                  <div className="mt-1 flex items-center gap-2">
                    {selectedMessage.newsletter && <Badge variant="secondary" className="text-xs">Inscrit Newsletter</Badge>}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="font-semibold text-lg">{selectedMessage.subject}</div>
                <div className="bg-background border rounded-lg p-4 min-h-[150px] whitespace-pre-wrap text-sm">
                  {selectedMessage.message}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button variant="destructive" onClick={() => handleDelete(selectedMessage.id)}>
                  Supprimer ce message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
