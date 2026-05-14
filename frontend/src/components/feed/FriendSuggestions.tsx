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
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-[180px] flex-shrink-0 animate-pulse bg-muted/50 rounded-2xl h-[240px]" />
              ))
            ) : friends.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-card/50 rounded-2xl border border-dashed">
                <UserPlus className="h-8 w-8 mb-3 opacity-20" />
                <p className="text-xs">Plus aucune suggestion pour le moment.</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="group relative w-[170px] md:w-[190px] flex-shrink-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-slate-900/60 border border-white/20 dark:border-slate-800/20 hover:border-primary/30 rounded-3xl p-5 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 flex flex-col items-center text-center overflow-hidden"
                >
                  {/* Floating Reason Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <Badge variant="secondary" className="text-[7px] px-1.5 py-0.5 bg-primary/10 text-primary border-none font-black uppercase tracking-widest rounded-full">
                      {friend.reason}
                    </Badge>
                  </div>

                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Avatar className="h-20 w-20 border-4 border-background ring-1 ring-primary/5 group-hover:scale-105 transition-transform duration-500 shadow-md relative z-10">
                      <AvatarImage src={friend.avatar || undefined} className="object-cover" />
                        <AvatarFallback className="bg-input text-muted-foreground font-bold text-lg">
                        {friend.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {friend.mutualFriends && friend.mutualFriends > 0 && (
                      <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center text-[10px] font-black border-2 border-background shadow-lg z-20 scale-90 group-hover:scale-100 transition-transform">
                        {friend.mutualFriends} connexions communes
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 w-full mb-5 relative z-10">
                    <p className="font-black text-sm truncate group-hover:text-primary transition-colors tracking-tight">
                      {friend.name}
                    </p>
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-medium truncate">
                        <GraduationCap className="h-3 w-3 text-primary/60" />
                        <span className="truncate">{friend.faculty || "Étudiant"}</span>
                      </div>
                      {friend.university && (
                        <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground/60 truncate uppercase tracking-widest font-bold">
                          <MapPin className="h-2.5 w-2.5" />
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
                      "w-full h-10 rounded-2xl text-[11px] font-black transition-all duration-500 relative z-10",
                      addedFriends.includes(friend.id)
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : "campus-gradient text-white hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
                    )}
                  >
                    {addedFriends.includes(friend.id) ? (
                      <div className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>AJOUTÉ</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Link className="h-3.5 w-3.5 stroke-[3]" />
                        <span>SE CONNECTER</span>
                      </div>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
