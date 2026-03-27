import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, Loader2, Check, UserPlus, MessageSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createGroupConversation, searchUsers } from "@/services/api";
import { z } from "zod";

interface UserOption {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
  isOnline?: boolean;
}

interface CreateGroupConversationModalProps {
  children: React.ReactNode;
  onGroupCreated?: (groupData: unknown) => void;
}

const groupSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères").max(50),
  description: z.string().max(200, "La description ne doit pas dépasser 200 caractères").optional(),
  members: z.array(z.string()).min(2, "Sélectionnez au moins 2 membres"),
});

export function CreateGroupConversationModal({ children, onGroupCreated }: CreateGroupConversationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserOption[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      void (async () => {
        if (!searchQuery.trim()) {
          setSearchResults([]);
          return;
        }

        try {
          setIsSearching(true);
          const users = await searchUsers(searchQuery.trim());
          const mapped = (users || []).map((user: any) => ({
            id: String(user.id),
            name: user.name || user.username || "Utilisateur",
            username: user.username || "user",
            avatar: user.avatar || null,
          }));
          setSearchResults(mapped);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      })();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [isOpen, searchQuery]);

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const getSelectedUsers = () => {
    return searchResults.filter((user) => selectedMembers.includes(user.id));
  };

  const handleCreateGroup = async () => {
    try {
      groupSchema.parse({ name, description, members: selectedMembers });
      setIsCreating(true);

      const result = await createGroupConversation(name.trim(), selectedMembers);
      const groupData = result?.data ?? result;

      toast({
        title: "Groupe créé !",
        description: `La conversation "${name}" a été créée`,
        duration: 3000,
      });

      onGroupCreated?.(groupData);
      resetForm();
      setIsOpen(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: error?.message || "Impossible de créer le groupe",
          variant: "destructive",
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedMembers([]);
    setSearchQuery("");
    setSearchResults([]);
    setIsCreating(false);
    setIsSearching(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Créer une conversation de groupe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="groupName">Nom du groupe *</Label>
            <Input
              id="groupName"
              placeholder="Ex: Projet IA 2025, Révisions Math..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">{name.length}/50 caractères</p>
          </div>

          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Décrivez le but de ce groupe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              className="mt-2 min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/200 caractères</p>
          </div>

          <div>
            <Label>Ajouter des membres *</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des utilisateurs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {selectedMembers.length > 0 && (
            <div>
              <Label>Membres sélectionnés ({selectedMembers.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {getSelectedUsers().map((user) => (
                  <Badge key={user.id} variant="secondary" className="flex items-center gap-2">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {user.name}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleMemberToggle(user.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Résultats</Label>
            <ScrollArea className="h-48 mt-2 border rounded-lg">
              <div className="p-2 space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMembers.includes(user.id)
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleMemberToggle(user.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block">{user.name}</span>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                    {selectedMembers.includes(user.id) && <Check className="h-4 w-4 text-primary" />}
                  </div>
                ))}
                {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun utilisateur trouvé</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isCreating}>
            Annuler
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={isCreating || !name.trim() || selectedMembers.length < 2}
            className="campus-gradient text-white hover:opacity-90"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Créer le groupe
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
