import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Search, Loader2, CheckCircle, Users, UserCheck, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addSphereMember, searchUsers } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

interface UserOption {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string | null;
  university?: string;
  faculty?: string;
  skills?: string[];
}

interface AddMemberModalProps {
  children?: React.ReactNode;
  onMemberAdded?: (memberData: unknown) => void;
  sphereId?: string;
  sphereName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddMemberModal({ children, onMemberAdded, sphereId, sphereName, open: controlledOpen, onOpenChange: setControlledOpen }: AddMemberModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  const searchQueryKey = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);
  const usersQuery = useQuery({
    queryKey: ["user-search", searchQueryKey],
    queryFn: () => searchUsers(searchQuery.trim()),
    enabled: open && searchQueryKey.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!open || !searchQueryKey) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(usersQuery.isFetching);
    if (usersQuery.data) {
      const mapped = (usersQuery.data || []).map((user: any) => ({
        id: String(user.id),
        name: user.name || user.username || "Utilisateur",
        username: user.username || "user",
        email: user.email,
        avatar: user.avatar || null,
        university: user.university,
        faculty: user.faculty,
        skills: user.skills || [],
      }));
      setSearchResults(mapped);
      return;
    }

    if (usersQuery.error) {
      setSearchResults([]);
    }
  }, [open, searchQueryKey, usersQuery.data, usersQuery.error, usersQuery.isFetching]);

  const addUserToSelection = (user: UserOption) => {
    setSelectedUsers((prev) => (prev.some((item) => item.id === user.id) ? prev : [...prev, user]));
  };

  const removeUserFromSelection = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const submitMembers = async () => {
    if (selectedUsers.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun utilisateur sélectionné",
        description: "Veuillez sélectionner au moins un utilisateur",
      });
      return;
    }

    if (!sphereId) {
      toast({
        variant: "destructive",
        title: "Sphère introuvable",
        description: "Impossible d'ajouter des membres sans identifiant de sphère",
      });
      return;
    }

    setIsAdding(true);

    try {
      const addedMembers = [];
      for (const user of selectedUsers) {
        const result = await addSphereMember(sphereId, { user: user.id, role: "member" });
        addedMembers.push(result?.data ?? result ?? user);
      }

      onMemberAdded?.(addedMembers);

      toast({
        title: "Membres ajoutés",
        description: `${selectedUsers.length} membre(s) ajouté(s) à ${sphereName || "la sphère"}`,
        duration: 3000,
      });

      setSelectedUsers([]);
      setSearchQuery("");
      setSearchResults([]);
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Impossible d'ajouter les membres",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUsers([]);
    setIsAdding(false);
    setIsSearching(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Ajouter des membres
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Rechercher des utilisateurs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nom, username, université, compétences..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Résultats ({searchResults.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.name}</p>
                            <span className="text-sm text-muted-foreground">@{user.username}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.university || "Université"}{user.faculty ? ` • ${user.faculty}` : ""}
                          </p>
                          {!!user.skills?.length && (
                            <div className="flex gap-1 mt-1">
                              {user.skills.slice(0, 2).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addUserToSelection(user)}
                        disabled={selectedUsers.some((item) => item.id === user.id)}
                        variant={selectedUsers.some((item) => item.id === user.id) ? "secondary" : "default"}
                      >
                        {selectedUsers.some((item) => item.id === user.id) ? (
                          <UserCheck className="h-4 w-4" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun utilisateur trouvé</p>
                <p className="text-sm">Essayez avec d'autres mots-clés</p>
              </div>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Utilisateurs sélectionnés ({selectedUsers.length})
              </h3>
              <div className="space-y-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeUserFromSelection(user.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isAdding}>
              Annuler
            </Button>
            <Button
              onClick={submitMembers}
              disabled={selectedUsers.length === 0 || isAdding}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-muted border border-border/60"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Ajouter {selectedUsers.length} membre(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
