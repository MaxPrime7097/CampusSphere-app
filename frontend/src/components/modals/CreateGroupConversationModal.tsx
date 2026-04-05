import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Loader2, Check, MessageSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createGroupConversation, getCurrentUser, getUserConnections } from "@/services/api";
import { z } from "zod";

interface UserOption { id: string; name: string; username: string; avatar?: string | null; }

interface Props {
  children: React.ReactNode;
  onGroupCreated?: (groupData: unknown) => void;
}

const groupSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères").max(50),
  members: z.array(z.string()).min(2, "Sélectionnez au moins 2 membres"),
});

export function CreateGroupConversationModal({ children, onGroupCreated }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [connections, setConnections] = useState<UserOption[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoadingConnections(true);
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user?.id || !mounted) return;
        const conns = await getUserConnections(user.id);
        if (!mounted) return;
        const mapped = (conns || []).map((conn: any) => {
          const isReq = String(conn.requester) === String(user.id);
          const other = isReq ? conn.recipient_info : conn.requester_info;
          const otherId = isReq ? conn.recipient : conn.requester;
          return {
            id: String(other?.id || otherId),
            name: other?.full_name || other?.name || other?.username || "Utilisateur",
            username: other?.username || "",
            avatar: other?.avatar || null,
          };
        }).filter((c: UserOption) => c.id);
        setConnections(mapped);
      } catch {
        setConnections([]);
      } finally {
        if (mounted) setLoadingConnections(false);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen]);

  const filtered = connections.filter((u) => {
    const q = searchQuery.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  });

  const selectedUsers = connections.filter((u) => selectedMembers.includes(u.id));

  const toggle = (id: string) =>
    setSelectedMembers((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleCreate = async () => {
    try {
      groupSchema.parse({ name, members: selectedMembers });
      setIsCreating(true);
      const result = await createGroupConversation(name.trim(), selectedMembers);
      const groupData = (result as any)?.data ?? result;
      toast({ title: "Groupe créé !", description: `"${name}" a été créé`, duration: 3000 });
      onGroupCreated?.(groupData);
      reset();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: error instanceof z.ZodError ? "Erreur de validation" : "Erreur",
        description: error instanceof z.ZodError ? error.errors[0].message : error?.message || "Impossible de créer le groupe",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const reset = () => {
    setName(""); setSelectedMembers([]); setSearchQuery(""); setIsCreating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Créer un groupe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="groupName">Nom du groupe *</Label>
            <Input
              id="groupName"
              placeholder="Ex: Projet IA 2025..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">{name.length}/50</p>
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedUsers.map((u) => (
                <Badge key={u.id} variant="secondary" className="flex items-center gap-1.5 pr-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={u.avatar ?? undefined} />
                    <AvatarFallback className="text-[9px]">{u.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{u.name}</span>
                  <button type="button" onClick={() => toggle(u.id)} className="ml-0.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <Label>Ajouter des membres ({selectedMembers.length} sélectionné{selectedMembers.length > 1 ? "s" : ""})</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrer vos connexions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
            {loadingConnections ? (
              <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {connections.length === 0 ? "Aucune connexion trouvée" : "Aucun résultat"}
              </div>
            ) : (
              filtered.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors border-b last:border-0 ${
                    selectedMembers.includes(user.id) ? "bg-primary/10" : "hover:bg-muted/50"
                  }`}
                  onClick={() => toggle(user.id)}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={user.avatar ?? undefined} />
                    <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                  </div>
                  {selectedMembers.includes(user.id) && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isCreating}>Annuler</Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !name.trim() || selectedMembers.length < 2}
            className="campus-gradient text-white hover:opacity-90"
          >
            {isCreating
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création...</>
              : <><MessageSquare className="h-4 w-4 mr-2" />Créer</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
