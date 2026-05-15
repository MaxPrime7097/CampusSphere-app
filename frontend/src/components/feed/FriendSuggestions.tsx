import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, RefreshCw, Check, GraduationCap, MapPin, Link } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { searchUsers, getCurrentUser, getUserConnections } from "@/services/api";
import { normalizeUniversity, normalizeFaculty } from "@/lib/profileMetadata";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type FriendSuggestion = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  faculty: string;
  university: string;
  mutualFriends: number | null;
  reason: string;
};

export function FriendSuggestions() {
  const { toast } = useToast();
  const [friends, setFriends] = useState<FriendSuggestion[]>([]);
  const [addedFriends, setAddedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = useCallback(async (showToast = false) => {
    setError(null);
    setIsRefreshing(true);

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error("Non authentifié");

      const userConnections = await getUserConnections(currentUser.id);
      const connectionIds = new Set((userConnections || []).map((c: any) => 
        String(c.requester === currentUser.id ? c.recipient : c.requester)
      ));

      const users = await searchUsers("");
      
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
          reason:
            normalizeUniversity(user.university) &&
            normalizeUniversity(currentUser.university) &&
            normalizeUniversity(user.university) === normalizeUniversity(currentUser.university)
              ? "Même université"
              : normalizeFaculty(user.faculty) &&
                  normalizeFaculty(currentUser.faculty) &&
                  normalizeFaculty(user.faculty) === normalizeFaculty(currentUser.faculty)
                ? "Même filière"
                : "Suggéré pour vous",
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
  }, [toast]);

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
    <div className="w-full min-w-0 overflow-hidden campus-animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 campus-gradient rounded-full" />
          <h2 className="text-sm font-bold tracking-tight text-foreground/80 uppercase">Suggestions pour vous</h2>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => loadSuggestions(true)} 
          disabled={isRefreshing}
          className="h-7 w-7 rounded-full hover:bg-primary/10 text-primary transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[160px] flex-shrink-0 animate-pulse bg-muted/40 rounded-2xl h-[210px] border border-border/50" />
            ))
          ) : friends.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-10 text-center text-muted-foreground bg-accent/5 rounded-2xl border border-dashed">
              <UserPlus className="h-7 w-7 mb-2 opacity-20" />
              <p className="text-[10px] font-medium">Aucune suggestion disponible</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="group relative w-[160px] flex-shrink-0 bg-card/40 hover:bg-card border border-border/60 hover:border-primary/30 rounded-2xl p-4 transition-all duration-300 flex flex-col items-center text-center"
              >
                {/* Connection Reason */}
                <div className="absolute top-2 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="outline" className="text-[7px] px-1.5 py-0 bg-background/80 backdrop-blur-sm border-primary/20 text-primary font-bold uppercase tracking-tighter">
                    {friend.reason}
                  </Badge>
                </div>

                <div className="relative mb-3">
                  <Avatar className="h-16 w-16 border-2 border-background ring-1 ring-border/50 shadow-sm relative z-10 transition-transform group-hover:scale-105">
                    <AvatarImage src={friend.avatar || undefined} className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground font-bold text-base">
                      {friend.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="space-y-1 w-full mb-4 relative z-10">
                  <p className="font-bold text-[12px] truncate group-hover:text-primary transition-colors leading-tight">
                    {friend.name}
                  </p>
                  
                  <div className="flex flex-col gap-0.5 min-h-[32px] justify-center">
                    <p className="text-[9px] text-muted-foreground/80 truncate font-medium">
                      {friend.faculty || "Étudiant"}
                    </p>
                    {friend.university && (
                      <p className="text-[8px] text-muted-foreground/50 truncate uppercase tracking-tight">
                        {friend.university}
                      </p>
                    )}
                  </div>

                  {friend.mutualFriends !== null && friend.mutualFriends > 0 && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {[1, 2].map((i) => (
                          <div key={i} className="inline-block h-3 w-3 rounded-full ring-1 ring-background bg-muted-foreground/20" />
                        ))}
                      </div>
                      <span className="text-[8px] text-primary/70 font-bold">
                        {friend.mutualFriends} en commun
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={() => handleAddFriend(friend.id, friend.name)}
                  disabled={addedFriends.includes(friend.id)}
                  className={cn(
                    "w-full h-8 rounded-xl text-[10px] font-bold transition-all border-none",
                    addedFriends.includes(friend.id)
                      ? "bg-emerald-50 text-emerald-600"
                      : "campus-gradient text-white shadow-sm hover:shadow-primary/20"
                  )}
                >
                  {addedFriends.includes(friend.id) ? (
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 stroke-[3]" />
                      <span>Ajouté</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <UserPlus className="h-3 w-3 stroke-[3]" />
                      <span>Connecter</span>
                    </div>
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  );
}
