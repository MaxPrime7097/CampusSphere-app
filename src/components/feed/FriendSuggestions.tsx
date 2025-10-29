import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, RefreshCw, Check } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const suggestedFriends = [
  {
    id: "1",
    name: "Sophie Martin",
    username: "sophie_m",
    avatar: "/placeholder-avatar.jpg",
    mutualFriends: 5,
    faculty: "Médecine"
  },
  {
    id: "2",
    name: "Lucas Dubois",
    username: "lucas_dev",
    avatar: "/placeholder-avatar.jpg",
    mutualFriends: 8,
    faculty: "Informatique"
  },
  {
    id: "3",
    name: "Emma Petit",
    username: "emma_design",
    avatar: "/placeholder-avatar.jpg",
    mutualFriends: 3,
    faculty: "Design"
  },
  {
    id: "4",
    name: "Thomas Bernard",
    username: "thomas_b",
    avatar: "/placeholder-avatar.jpg",
    mutualFriends: 12,
    faculty: "Droit"
  },
  {
    id: "5",
    name: "Marie Leroy",
    username: "marie_l",
    avatar: "/placeholder-avatar.jpg",
    mutualFriends: 6,
    faculty: "Commerce"
  }
];

export function FriendSuggestions() {
  const { toast } = useToast();
  const [friends, setFriends] = useState(suggestedFriends);
  const [addedFriends, setAddedFriends] = useState<string[]>([]);

  const handleAddFriend = (friendId: string, friendName: string) => {
    setAddedFriends(prev => [...prev, friendId]);
    toast({
      title: "Demande d'amitié envoyée !",
      description: `Vous avez envoyé une demande d'amitié à ${friendName}`,
      duration: 3000,
    });
  };

  const handleRefresh = () => {
    // Simuler un refresh des suggestions
    const shuffled = [...suggestedFriends].sort(() => Math.random() - 0.5);
    setFriends(shuffled);
    toast({
      title: "Suggestions mises à jour",
      description: "Nouvelles suggestions d'amis chargées",
      duration: 2000,
    });
  };

  return (
    <Card className="campus-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Suggestions d'amis</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {friends.map((friend) => (
              <Card
                key={friend.id}
                className="campus-card w-[200px] flex-shrink-0"
              >
                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={friend.avatar} />
                    <AvatarFallback className="campus-gradient text-white">
                      {friend.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 w-full">
                    <p className="font-semibold text-sm truncate">{friend.name}</p>
                    <p className="text-xs text-muted-foreground">@{friend.username}</p>
                    <p className="text-xs text-muted-foreground">{friend.faculty}</p>
                    <p className="text-xs text-primary">{friend.mutualFriends} amis en commun</p>
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
