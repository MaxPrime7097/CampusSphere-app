import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, MessageSquare, ArrowRight } from "lucide-react";
import { searchUsers, createPrivateConversation } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface QuickNewMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickNewMessageModal({ open, onOpenChange }: QuickNewMessageModalProps) {
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const normalizedQuery = useMemo(() => search.trim().toLowerCase(), [search]);

  const usersQuery = useQuery({
    queryKey: ["quick-message-users", normalizedQuery],
    queryFn: () => searchUsers(search.trim()),
    enabled: open && normalizedQuery.length >= 2,
    staleTime: 60 * 1000,
  });

  const users = usersQuery.data ?? [];

  const handleSelectUser = async (targetUserId: string) => {
    if (!targetUserId || isCreating) return;
    setIsCreating(true);

    try {
      const result = await createPrivateConversation(targetUserId);
      const conversationId = result?.data?.id ?? result?.id;

      onOpenChange(false);
      setSearch("");

      toast({
        title: "Discussion ouverte",
        description: "Accès à la conversation en cours...",
        duration: 2000,
      });

      if (conversationId) {
        navigate(`/messages/${conversationId}`);
      } else {
        navigate("/messages");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de démarrer la discussion.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="h-5 w-5" />
            Nouveau message
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Recherchez un étudiant pour démarrer une discussion
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou @nom_utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs sm:text-sm"
              autoFocus
            />
          </div>

          <div className="min-h-[140px] max-h-64 overflow-y-auto space-y-1 pr-1">
            {usersQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-xs gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Recherche d'étudiants...</span>
              </div>
            ) : normalizedQuery.length < 2 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                Saisissez au moins 2 caractères pour rechercher
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                Aucun étudiant trouvé pour "{search}"
              </div>
            ) : (
              users
                .filter((u: any) => String(u.id) !== String(currentUser?.id))
                .map((userItem: any) => {
                  const displayName = userItem.name || `${userItem.first_name || ""} ${userItem.last_name || ""}`.trim() || userItem.username;
                  return (
                    <button
                      key={userItem.id}
                      type="button"
                      onClick={() => handleSelectUser(String(userItem.id))}
                      disabled={isCreating}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-border/60 hover:bg-muted/40 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0 border">
                          <AvatarImage src={userItem.avatar} />
                          <AvatarFallback className="text-xs">
                            {displayName.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                            {displayName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            @{userItem.username}
                          </p>
                        </div>
                      </div>

                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  );
                })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
