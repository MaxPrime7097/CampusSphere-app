import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, ArrowClockwise as RefreshCw, Check } from "@phosphor-icons/react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { searchUsers, getUserConnections, createConnection } from "@/services/api";
import { cn, formatSlugToLabel } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

type FriendSuggestion = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  faculty: string;
  university: string;
  mutualFriends: number | null;
};

export function FriendSuggestions() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [addedFriends, setAddedFriends] = useState<string[]>([]);

  // Persistent TanStack Query cache: prevents re-fetching and skeleton flashes on every route navigation
  const {
    data: friends = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<FriendSuggestion[]>({
    queryKey: ["friend-suggestions", currentUser?.id || "anon"],
    queryFn: async (): Promise<FriendSuggestion[]> => {
      if (!currentUser?.id) return [];
      try {
        const [allUsers, userConnections] = await Promise.all([
          searchUsers("").catch((): any[] => []),
          getUserConnections(currentUser.id).catch((): any[] => []),
        ]);
        const connectionIds = new Set(
          (userConnections || []).map((c: any) =>
            String(c.requester === currentUser.id ? c.recipient : c.requester)
          )
        );

        return (allUsers || [])
          .filter(
            (u: any) =>
              String(u.id) !== String(currentUser.id) &&
              !connectionIds.has(String(u.id))
          )
          .slice(0, 10)
          .map((user: any) => ({
            id: String(user.id),
            name: user.name || "Utilisateur",
            username: user.username || "user",
            avatar: user.avatar || null,
            faculty: formatSlugToLabel(user.faculty) || "",
            university: formatSlugToLabel(user.university) || "",
            mutualFriends: user.mutualFriends ?? user.mutual_friends ?? 0,
          }));
      } catch (err) {
        console.error("Error loading suggestions:", err);
        return [];
      }
    },
    enabled: Boolean(currentUser?.id),
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 30 * 60 * 1000,    // Keep in garbage collection cache for 30 minutes
    refetchOnMount: false,     // Never reload when navigating back to Home
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const handleManualRefresh = async () => {
    const result = await refetch();
    if (result.isSuccess) {
      toast({
        title: "Suggestions mises à jour",
        description: "Nouvelles suggestions chargées",
        duration: 2000,
      });
    }
  };

  const handleAddFriend = async (friendId: string, friendName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (addedFriends.includes(friendId)) return;
    setAddedFriends((prev) => [...prev, friendId]);

    try {
      await createConnection(friendId);
      toast({
        title: "Demande envoyée !",
        description: `Demande envoyée à ${friendName}`,
        duration: 2500,
      });
    } catch {
      setAddedFriends((prev) => prev.filter((id) => id !== friendId));
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden py-3 border-b border-border/40">
      <div className="flex items-center justify-between mb-2.5 px-3.5 sm:px-4">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-1 bg-primary rounded-full" />
          <h2 className="text-[12px] font-bold tracking-tight text-foreground/85">Suggestions de connexion</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/connections")}
            className="h-6 px-2.5 text-[11px] text-muted-foreground hover:text-foreground font-medium rounded-full hover:bg-muted/60 transition-colors"
          >
            Voir tout
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleManualRefresh} 
            disabled={isFetching}
            className="h-7 w-7 rounded-full hover:bg-muted"
            aria-label="Rafraîchir les suggestions"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="w-full overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-3.5 sm:px-4">
        <div className="flex gap-2.5 pb-2 min-w-max">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[124px] flex-shrink-0 animate-pulse bg-muted/30 rounded-xl h-[156px] border border-border/50" />
            ))
          ) : friends.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-6 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/60 min-w-[280px]">
              <Link className="h-5 w-5 mb-1.5 opacity-30 text-muted-foreground" />
              <p className="text-[11px]">Aucune suggestion pour le moment</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => navigate(`/profile/${friend.username || friend.id}`)}
                className="group relative w-[124px] flex-shrink-0 p-3 rounded-xl border border-border/40 bg-card hover:border-border/80 hover:bg-muted/25 transition-all flex flex-col items-center text-center cursor-pointer select-none"
              >
                <div className="relative mb-2 mt-0.5">
                  <Avatar className="h-12 w-12 border border-border/60 group-hover:border-primary/40 transition-colors">
                    <AvatarImage src={friend.avatar || undefined} className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                      {friend.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {friend.mutualFriends && friend.mutualFriends > 0 ? (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-muted text-muted-foreground rounded-full h-4 w-4 flex items-center justify-center text-[8px] font-bold border border-background">
                      {friend.mutualFriends}
                    </div>
                  ) : null}
                </div>

                <div className="w-full mb-2.5">
                  <p className="font-semibold text-xs truncate text-foreground group-hover:text-primary transition-colors">
                    {friend.name}
                  </p>
                  
                  <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                    {friend.faculty || friend.university || "Etudiant"}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => handleAddFriend(friend.id, friend.name, e)}
                  disabled={addedFriends.includes(friend.id)}
                  className={cn(
                    "w-full h-7 rounded-lg text-[11px] font-medium transition-colors shadow-none",
                    addedFriends.includes(friend.id)
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25"
                  )}
                >
                  {addedFriends.includes(friend.id) ? (
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 stroke-[2.5]" />
                      <span>Ajouté</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <Link className="h-3 w-3 stroke-[2.5]" />
                      <span>Connect</span>
                    </div>
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
