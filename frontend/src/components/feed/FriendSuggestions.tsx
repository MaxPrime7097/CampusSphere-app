import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, RefreshCw, Check, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getConnectionRecommendations } from "@/services/api";
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
      const recommendations = await getConnectionRecommendations();
      const mapped = (recommendations || []).map((user: any) => ({
        id: String(user.id),
        name: user.name || "Utilisateur",
        username: user.username || "user",
        avatar: user.avatar,
        faculty: user.faculty || "",
        university: user.university || "",
        mutualFriends:
          typeof user.mutualFriends === "number"
            ? user.mutualFriends
            : typeof user.mutual_friends === "number"
              ? user.mutual_friends
              : typeof user.mutual_connections_count === "number"
                ? user.mutual_connections_count
                : null,
      }));

      setFriends(mapped);

      if (showToast) {
        toast({
          title: "Suggestions mises à jour",
          description: "Nouvelles suggestions chargées",
          duration: 2000,
        });
      }
    } catch {
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
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pb-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <CardTitle className="text-lg font-bold tracking-tight">Suggestions d'étudiants</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => loadSuggestions(true)} 
            disabled={isRefreshing}
            className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary transition-all active:rotate-180"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-0">
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[180px] h-[220px] rounded-2xl border bg-card/50 p-4 flex flex-col items-center justify-center space-y-3">
                   <Skeleton className="h-16 w-16 rounded-full" />
                   <Skeleton className="h-4 w-24" />
                   <Skeleton className="h-3 w-20" />
                   <Skeleton className="h-8 w-full rounded-xl" />
                </div>
              ))
            ) : friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full py-8 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm italic">Plus de suggestions pour le moment</p>
              </div>
            ) : (
              friends.map((friend) => (
                <Card 
                  key={friend.id} 
                  className="w-[190px] flex-shrink-0 border-border/40 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group overflow-hidden rounded-2xl"
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    {/* Badge de Faculté au hover */}
                    <div className="relative mb-3">
                      <Avatar className="h-16 w-16 border-2 border-background ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all shadow-sm">
                        <AvatarImage src={friend.avatar || undefined} className="object-cover" />
                        <AvatarFallback className="campus-gradient text-white text-lg font-bold">
                          {friend.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {friend.mutualFriends && friend.mutualFriends > 0 && (
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full px-1.5 py-0.5 shadow-sm border border-border flex items-center gap-1">
                          <span className="text-[10px] font-bold text-primary">{friend.mutualFriends}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 w-full mb-4">
                      <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{friend.name}</p>
                      
                      {/* Localisation / Faculté */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground italic truncate">
                          <GraduationCap className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{friend.faculty || "Étudiant"}</span>
                        </div>
                        {friend.university && (
                          <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground/70 truncate uppercase tracking-tighter">
                            <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate">{friend.university}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleAddFriend(friend.id, friend.name)}
                      disabled={addedFriends.includes(friend.id)}
                      className={cn(
                        "w-full h-8 rounded-xl text-xs font-bold transition-all duration-300",
                        addedFriends.includes(friend.id)
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20"
                          : "campus-gradient text-white hover:shadow-md hover:shadow-primary/20"
                      )}
                    >
                      {addedFriends.includes(friend.id) ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Envoyé
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          Se connecter
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
