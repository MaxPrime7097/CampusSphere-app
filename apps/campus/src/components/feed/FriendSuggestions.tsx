import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, RefreshCw, Check, GraduationCap, MapPin, Link } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { searchUsers, getUserConnections } from "@/services/api";
import { normalizeUniversity, normalizeFaculty } from "@/lib/profileMetadata";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
  const { user: currentUser } = useAuth();
  const [friends, setFriends] = useState<FriendSuggestion[]>([]);
  const [addedFriends, setAddedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestionsQuery = useQuery({
    queryKey: ["friend-suggestions", currentUser?.id || "anon"],
    queryFn: () => searchUsers(""),
    enabled: Boolean(currentUser?.id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const loadSuggestions = useCallback(async (showToast = false) => {
    setError(null);
    setIsRefreshing(true);

    try {
      if (!currentUser) throw new Error("Non authentifié");

      const userConnections = await getUserConnections(currentUser.id);
      const connectionIds = new Set((userConnections || []).map((c: any) => 
        String(c.requester === currentUser.id ? c.recipient : c.requester)
      ));

      const users = suggestionsQuery.data || [];
      
      const mapped = (users || [])
        .filter((u: any) => u.id !== currentUser.id && !connectionIds.has(String(u.id)))
        .slice(0, 10)
        .map((user: any) => ({
          id: String(user.id),
          name: user.name || "Utilisateur",
          username: user.username || "user",
          avatar: user.avatar,
          faculty: user.faculty || "",
          university: user.university || "",
          mutualFriends: user.mutualFriends ?? user.mutual_friends ?? 0,
        }));

      setFriends(mapped);

      if (showToast) {
        toast({
          title: "Suggestions mises à jour",
          description: "Nouvelles suggestions chargées",
          duration: 2000,
        });
      }
    } catch (err: any) {
      console.error("Error loading suggestions:", err);
      setError("Impossible de charger les suggestions.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast, currentUser, suggestionsQuery.data]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleAddFriend = (friendId: string, friendName: string) => {
    setAddedFriends(prev => [...prev, friendId]);
    toast({
      title: "Demande envoyée !",
      description: `Demande envoyée à ${friendName}`,
      duration: 3000,
    });
  };

  return (
    <div className="w-full max-w-full overflow-hidden py-4 border-b border-border/40">
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 campus-gradient rounded-full" />
          <h2 className="text-[12px] font-bold tracking-tight text-foreground/80">Suggestions de connexion</h2>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => loadSuggestions(true)} 
          disabled={isRefreshing}
          className="h-7 w-7 rounded-full hover:bg-muted"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      <div className="w-full overflow-x-auto scrollbar-hide px-4">
        <div className="flex gap-3 pb-2 min-w-max">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-[130px] flex-shrink-0 animate-pulse bg-muted/30 rounded-2xl h-[160px] border border-border/50" />
            ))
          ) : friends.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-8 text-center text-muted-foreground bg-accent/5 rounded-2xl border border-dashed min-w-[300px]">
              <UserPlus className="h-6 w-6 mb-2 opacity-20" />
              <p className="text-[10px]">Aucune suggestion pour le moment</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="group relative w-[130px] flex-shrink-0 bg-card/50 border border-border/40 hover:border-primary/30 rounded-2xl p-3 transition-all duration-300 flex flex-col items-center text-center shadow-sm"
              >
                <div className="relative mb-2 mt-1">
                  <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                    <AvatarImage src={friend.avatar || undefined} className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-lg">
                      {friend.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {friend.mutualFriends && friend.mutualFriends > 0 && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-white rounded-full h-4.5 w-4.5 flex items-center justify-center text-[8px] font-bold border-2 border-background shadow-sm">
                      {friend.mutualFriends}
                    </div>
                  )}
                </div>

                <div className="w-full mb-3">
                  <p className="font-bold text-[13px] truncate text-foreground/90">
                    {friend.name}
                  </p>
                  
                  <div className="mt-0.5">
                    <p className="text-[10px] text-muted-foreground truncate leading-tight">
                      {friend.faculty || "Étudiant"}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={addedFriends.includes(friend.id) ? "secondary" : "default"}
                  onClick={() => handleAddFriend(friend.id, friend.name)}
                  disabled={addedFriends.includes(friend.id)}
                  className={cn(
                    "w-full h-8 rounded-xl text-[11px] font-bold transition-all border-none shadow-none",
                    addedFriends.includes(friend.id)
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      : "campus-gradient text-white hover:opacity-90"
                  )}
                >
                  {addedFriends.includes(friend.id) ? (
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 stroke-[3]" />
                      <span>Ajouté</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <UserPlus className="h-3 w-3 stroke-[3]" />
                      <span>Suivre</span>
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
