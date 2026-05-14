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
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pb-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <CardTitle className="text-lg font-medium tracking-tight">Suggestions de connexions</CardTitle>
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
        <div className="flex gap-3 pb-4 overflow-x-auto scrollbar-hide px-4 md:px-0 -mx-4 md:mx-0">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[140px] md:w-[160px] flex-shrink-0 animate-pulse bg-muted rounded-xl h-[200px]" />
            ))
          ) : friends.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-8 text-center text-muted-foreground bg-accent/20 rounded-xl border border-dashed mx-4 md:mx-0">
              <UserPlus className="h-6 w-6 mb-2 opacity-20" />
              <p className="text-[10px]">Plus aucune suggestion pour le moment.</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="group relative w-[140px] md:w-[160px] flex-shrink-0 bg-card border border-border/50 hover:border-primary/30 rounded-xl p-3 transition-all duration-200 flex flex-col items-center text-center shadow-sm"
              >
                {/* Small Reason Badge */}
                <div className="absolute top-1.5 right-1.5 z-10">
                  <Badge variant="secondary" className="text-[6px] px-1 py-0 bg-primary/5 text-primary border-none font-bold uppercase tracking-wider rounded-sm">
                    {friend.reason}
                  </Badge>
                </div>

                <div className="relative mb-2">
                  <Avatar className="h-14 w-14 border shadow-sm relative z-10">
                    <AvatarImage src={friend.avatar || undefined} className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground font-bold text-base">
                      {friend.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {friend.mutualFriends && friend.mutualFriends > 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full h-4 w-4 flex items-center justify-center text-[8px] font-bold border border-background shadow-sm z-20">
                      {friend.mutualFriends}
                    </div>
                  )}
                </div>

                <div className="space-y-0.5 w-full mb-3 relative z-10">
                  <p className="font-bold text-[11px] truncate group-hover:text-primary transition-colors">
                    {friend.name}
                  </p>
                  
                  <div className="flex flex-col gap-0">
                    <div className="flex items-center justify-center gap-1 text-[8px] text-muted-foreground truncate">
                      <GraduationCap className="h-2.5 w-2.5 opacity-60" />
                      <span className="truncate">{friend.faculty || "Étudiant"}</span>
                    </div>
                    {friend.university && (
                      <div className="flex items-center justify-center gap-0.5 text-[7px] text-muted-foreground/40 truncate uppercase tracking-tighter">
                        <MapPin className="h-2 w-2" />
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
                    "w-full h-7 rounded-lg text-[9px] font-bold transition-all duration-200 relative z-10",
                    addedFriends.includes(friend.id)
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "campus-gradient text-white"
                  )}
                >
                  {addedFriends.includes(friend.id) ? (
                    <div className="flex items-center gap-1">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                      <span>Ajouté</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <UserPlus className="h-2.5 w-2.5 stroke-[3]" />
                      <span>Connecter</span>
                    </div>
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
