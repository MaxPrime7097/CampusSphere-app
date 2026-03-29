import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, RefreshCw, Check } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getConnectionRecommendations } from "@/services/api";

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
          description: "Nouvelles suggestions d'amis chargées",
          duration: 2000,
        });
      }
    } catch {
      setError("Impossible de charger les suggestions pour le moment.");
      if (showToast) {
        toast({
          title: "Échec du rafraîchissement",
          description: "Veuillez réessayer dans un instant.",
          variant: "destructive",
        });
      }
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
      title: "Demande d'amitié envoyée !",
      description: `Vous avez envoyé une demande d'amitié à ${friendName}`,
      duration: 3000,
    });
  };

  const handleRefresh = () => {
    loadSuggestions(true);
  };

  const getProgramLabel = (friend: FriendSuggestion) => {
    if (friend.faculty && friend.university) return `${friend.faculty} • ${friend.university}`;
    return friend.faculty || friend.university || "Programme non renseigné";
  };

  return (
    <Card className="campus-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Suggestions d'amis</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {isLoading && Array.from({ length: 4 }).map((_, index) => (
              <Card key={`friend-suggestion-skeleton-${index}`} className="campus-card w-[200px] flex-shrink-0">
                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                    <Skeleton className="h-3 w-2/3 mx-auto" />
                    <Skeleton className="h-3 w-4/5 mx-auto" />
                    <Skeleton className="h-3 w-1/2 mx-auto" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}

            {!isLoading && error && (
              <div className="w-full rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center whitespace-normal">
                <p className="text-sm text-destructive mb-3">{error}</p>
                <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                  Réessayer
                </Button>
              </div>
            )}

            {!isLoading && !error && friends.length === 0 && (
              <div className="w-full rounded-lg border bg-muted/20 p-4 text-center whitespace-normal">
                <p className="text-sm text-muted-foreground">Aucune suggestion disponible pour le moment.</p>
              </div>
            )}

            {!isLoading && !error && friends.map((friend) => (
              <Card key={friend.id} className="campus-card w-[200px] flex-shrink-0">
                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={friend.avatar || "/placeholder-avatar.jpg"} />
                    <AvatarFallback className="campus-gradient text-white">
                      {friend.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 w-full">
                    <p className="font-semibold text-sm truncate">{friend.name}</p>
                    <p className="text-xs text-muted-foreground">@{friend.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{getProgramLabel(friend)}</p>
                    {typeof friend.mutualFriends === "number" && (
                      <p className="text-xs text-primary">{friend.mutualFriends} amis en commun</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="w-full campus-gradient text-white hover:opacity-90"
                    onClick={() => handleAddFriend(friend.id, friend.name)}
                    disabled={addedFriends.includes(friend.id)}
                  >
                    {addedFriends.includes(friend.id) ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Ajouté
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3 mr-1" />
                        Ajouter
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
