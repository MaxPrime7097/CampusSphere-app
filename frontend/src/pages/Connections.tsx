import { useState, useEffect } from "react";
import { searchUsers, getCurrentUser, getUserConnections, createConnection, deleteConnection } from "@/services/api";
import { Users, UserPlus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function Connections() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load current user
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (isMounted) setCurrentUser(data);
      } catch (e) {
        // User not logged in
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load connections
  useEffect(() => {
    if (!currentUser?.id) return;
    
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        // Load user's connections
        const connectionsData = await getUserConnections(currentUser.id);
        if (isMounted && connectionsData) {
          const mapped = (connectionsData || []).map((conn: any) => ({
            id: String(
              conn.requester === currentUser.id
                ? conn.recipient_info?.id || conn.recipient
                : conn.requester_info?.id || conn.requester
            ),
            name:
              (conn.requester === currentUser.id
                ? conn.recipient_info?.full_name
                : conn.requester_info?.full_name) || "Utilisateur",
            username:
              (conn.requester === currentUser.id
                ? conn.recipient_info?.username
                : conn.requester_info?.username) || "user",
            avatar:
              (conn.requester === currentUser.id
                ? conn.recipient_info?.avatar
                : conn.requester_info?.avatar) || '/placeholder-avatar.jpg',
            university:
              (conn.requester === currentUser.id
                ? conn.recipient_info?.university
                : conn.requester_info?.university) || '',
            faculty:
              (conn.requester === currentUser.id
                ? conn.recipient_info?.faculty
                : conn.requester_info?.faculty) || '',
            field:
              (conn.requester === currentUser.id
                ? conn.recipient_info?.faculty
                : conn.requester_info?.faculty) || '',
            isVerified: false,
            impactScore:
              (conn.requester === currentUser.id
                ? conn.recipient_info?.impact_score
                : conn.requester_info?.impact_score) || 0,
            mutualFriends: 0 // TODO: Calculate mutual connections if API provides this
          }));
          setConnections(mapped);
        }
      } catch (e) {
        // Error loading connections
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Load suggestions
  useEffect(() => {
    if (!currentUser) return;
    
    let isMounted = true;
    (async () => {
      try {
        // Load user suggestions (using search as fallback)
        const users = await searchUsers("");
        if (isMounted && users) {
          const connectionIds = new Set(connections.map(c => c.id));
          const mapped = (users || [])
            .filter((u: any) => u.id !== currentUser.id && !connectionIds.has(String(u.id)))
            .map((u: any) => ({
              id: String(u.id),
              name: u.name || u.first_name + ' ' + u.last_name,
              username: u.username,
              avatar: u.avatar || '/placeholder-avatar.jpg',
              university: u.university || '',
              faculty: u.faculty || '',
              field: u.faculty || '',
              isVerified: u.is_verified || false,
              impactScore: u.impact_score || 0,
              reason: u.university === currentUser.university ? 
                `Même université - ${u.university}` : 
                u.faculty === currentUser.faculty ?
                `Même filière - ${u.faculty}` :
                "Suggestions pour vous"
            }));
          setSuggestions(mapped.slice(0, 20));
        }
      } catch (e) {
        // Error loading suggestions
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [currentUser, connections]);

  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 campus-gradient p-1.5 rounded-lg text-white" />
            <h1 className="text-3xl font-bold campus-gradient bg-clip-text text-transparent">
              Connexions
            </h1>
          </div>
          <p className="text-muted-foreground">
            Gérez vos connexions et découvrez de nouveaux étudiants
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des connexions..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="all">
              Mes Connexions ({connections.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              Suggestions ({suggestions.length})
            </TabsTrigger>
          </TabsList>

          {/* All Connections */}
          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => (
                <Card key={connection.id} className="campus-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={connection.avatar} />
                        <AvatarFallback className="campus-gradient text-white text-xl font-bold">
                          {connection.name?.slice(0, 2).toUpperCase() || 'US'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <h3 className="font-semibold">{connection.name}</h3>
                          {connection.isVerified && (
                            <div className="w-4 h-4 campus-gradient rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{connection.username}</p>
                      </div>

                      <div className="flex gap-2 flex-wrap justify-center">
                        <Badge variant="secondary" className="text-xs">
                          {connection.university}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {connection.field}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-primary">⚡ {connection.impactScore}</span>
                        </div>
                        <div>
                          {connection.mutualFriends} amis communs
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="sm"
                        onClick={() => navigate(`/profile/${connection.username}`)}
                      >
                        Voir le profil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Suggestions */}
          <TabsContent value="suggestions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="campus-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={suggestion.avatar} />
                        <AvatarFallback className="campus-gradient text-white text-xl font-bold">
                          {suggestion.name?.slice(0, 2).toUpperCase() || 'US'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <h3 className="font-semibold">{suggestion.name}</h3>
                          {suggestion.isVerified && (
                            <div className="w-4 h-4 campus-gradient rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{suggestion.username}</p>
                      </div>

                      <div className="flex gap-2 flex-wrap justify-center">
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.university}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.field}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground italic">
                        {suggestion.reason}
                      </p>

                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-primary">⚡ {suggestion.impactScore}</span>
                      </div>

                      <Button 
                        className="w-full campus-gradient text-white" 
                        size="sm"
                        onClick={async () => {
                          try {
                            await createConnection(suggestion.id, currentUser.id);
                            toast({
                              title: "Demande envoyée",
                              description: `Demande de connexion envoyée à ${suggestion.name}`,
                              duration: 2000,
                            });
                            // Move to connections list
                            setConnections([...connections, suggestion]);
                            setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
                          } catch (error: any) {
                            toast({
                              title: "Erreur",
                              description: error?.message || "Impossible d'envoyer la demande",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Se connecter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
