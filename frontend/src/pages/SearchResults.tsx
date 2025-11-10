import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { utilsService } from "@/services/api/utilsService";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Calendar, BookOpen, ShoppingBag, Loader2, UserPlus, UserMinus, Filter, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const query = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(query);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [filterType, setFilterType] = useState("all");
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [searchResults, setSearchResults] = useState<{ users: any[]; resources: any[]; spheres: any[] }>({
    users: [],
    resources: [],
    spheres: []
  });

  // Recherche en temps réel
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults({ users: [], resources: [], spheres: [] });
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);
    
    (async () => {
      try {
        const data = await utilsService.search(searchTerm, 'all');
        if (isMounted && data) {
          setSearchResults({
            users: (data.users || []).map((u: any) => ({
              id: String(u.id),
              name: u.name || u.first_name + ' ' + u.last_name,
              username: u.username,
              avatar: u.avatar || '/placeholder-avatar.jpg',
              university: u.university || '',
              faculty: u.faculty || '',
            })),
            resources: (data.resources || []).map((r: any) => ({
              id: String(r.id),
              title: r.title,
              description: r.description || '',
              subject: r.subject || 'other',
              type: r.type || 'notes',
              tags: r.tags || [],
            })),
            spheres: (data.spheres || []).map((s: any) => ({
              id: String(s.id),
              name: s.name,
              description: s.description || '',
              category: s.category || '',
              tags: s.tags || [],
              memberCount: s.member_count || 0,
            }))
          });
        }
      } catch (e: any) {
        // Error searching
      } finally {
        if (isMounted) setIsSearching(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [searchTerm]);

  const handleFollowUser = async (userId: string, userName: string) => {
    const isFollowing = followedUsers.has(userId);
    
    if (isFollowing) {
      setFollowedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      toast({
        title: "Ne suit plus",
        description: `Vous ne suivez plus ${userName}`,
        duration: 2000,
      });
    } else {
      setFollowedUsers(prev => new Set(prev).add(userId));
      toast({
        title: "Suit maintenant",
        description: `Vous suivez maintenant ${userName}`,
        duration: 2000,
      });
    }
  };

  const handleViewProfile = (userId: string, userName: string) => {
    toast({
      title: "Navigation vers profil",
      description: `Ouverture du profil de ${userName}`,
      duration: 2000,
    });
    navigate(`/profile/${userId}`);
  };

  const handleViewResource = (resourceId: string, resourceTitle: string) => {
    toast({
      title: "Ouverture de la ressource",
      description: `Ouverture de "${resourceTitle}"`,
      duration: 2000,
    });
    navigate(`/resources/${resourceId}`);
  };

  const handleViewSphere = (sphereId: string, sphereName: string) => {
    toast({
      title: "Ouverture de la sphère",
      description: `Ouverture de "${sphereName}"`,
      duration: 2000,
    });
    navigate(`/spheres/${sphereId}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Résultats triés et filtrés
  const sortedResults = useMemo(() => {
    const sortResults = (items: any[], type: string) => {
      switch (sortBy) {
        case "name":
          return [...items].sort((a, b) => a.name.localeCompare(b.name));
        case "relevance":
        default:
          return items;
      }
    };

    return {
      users: sortResults(searchResults.users, "users"),
      resources: sortResults(searchResults.resources, "resources"),
      spheres: sortResults(searchResults.spheres, "spheres")
    };
  }, [searchResults, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-4xl mx-auto py-4 md:py-6 px-4">
        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des personnes, ressources, sphères..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </form>
          
          {query && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-muted-foreground">
              Résultats pour "<span className="font-semibold">{query}</span>"
            </p>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Pertinence</SelectItem>
                    <SelectItem value="name">Nom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all" className="text-xs md:text-sm">
              Tout ({sortedResults.users.length + sortedResults.resources.length + sortedResults.spheres.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">
              Personnes ({sortedResults.users.length})
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-xs md:text-sm">
              Ressources ({sortedResults.resources.length})
            </TabsTrigger>
            <TabsTrigger value="spheres" className="text-xs md:text-sm">
              Sphères ({sortedResults.spheres.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Users Section */}
            {sortedResults.users.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personnes ({sortedResults.users.length})
                </h3>
                <div className="space-y-2">
                  {sortedResults.users.map((user) => (
                    <Card key={user.id} className="campus-card hover:campus-glow transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar 
                            className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleViewProfile(user.id, user.name)}
                          >
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p 
                              className="font-semibold cursor-pointer hover:underline"
                              onClick={() => handleViewProfile(user.id, user.name)}
                            >
                              {user.name}
                            </p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant={followedUsers.has(user.id) ? "outline" : "default"}
                            onClick={() => handleFollowUser(user.id, user.name)}
                            className={!followedUsers.has(user.id) ? "campus-gradient text-white hover:opacity-90" : ""}
                          >
                            {followedUsers.has(user.id) ? (
                              <>
                                <UserMinus className="h-4 w-4 mr-2" />
                                Ne plus suivre
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Suivre
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Resources Section */}
            {sortedResults.resources.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Ressources ({sortedResults.resources.length})
                </h3>
                <div className="space-y-2">
                  {sortedResults.resources.map((res) => (
                    <Card key={res.id} className="campus-card hover:campus-glow transition-all">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p 
                            className="font-semibold cursor-pointer hover:underline"
                            onClick={() => handleViewResource(res.id, res.title)}
                          >
                            {res.title}
                          </p>
                          <p className="text-sm text-muted-foreground">Type: {res.type}</p>
                          <p className="text-sm text-muted-foreground">Auteur: {res.author}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewResource(res.id, res.title)}
                        >
                          Voir
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Spheres Section */}
            {sortedResults.spheres.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Sphères ({sortedResults.spheres.length})
                </h3>
                <div className="space-y-2">
                  {sortedResults.spheres.map((sphere) => (
                    <Card key={sphere.id} className="campus-card hover:campus-glow transition-all">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p 
                            className="font-semibold cursor-pointer hover:underline"
                            onClick={() => handleViewSphere(sphere.id, sphere.name)}
                          >
                            {sphere.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{sphere.description}</p>
                          <p className="text-sm text-muted-foreground">{sphere.members} membres</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewSphere(sphere.id, sphere.name)}
                        >
                          Voir
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {sortedResults.users.length === 0 && sortedResults.resources.length === 0 && sortedResults.spheres.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Aucun résultat trouvé</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Essayez avec d'autres mots-clés ou explorez nos suggestions
                </p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="users" className="space-y-6">
            {sortedResults.users.length > 0 ? (
              <div className="space-y-2">
                {sortedResults.users.map((user) => (
                  <Card key={user.id} className="campus-card hover:campus-glow transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar 
                          className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleViewProfile(user.id, user.name)}
                        >
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p 
                            className="font-semibold cursor-pointer hover:underline"
                            onClick={() => handleViewProfile(user.id, user.name)}
                          >
                            {user.name}
                          </p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant={followedUsers.has(user.id) ? "outline" : "default"}
                          onClick={() => handleFollowUser(user.id, user.name)}
                          className={!followedUsers.has(user.id) ? "campus-gradient text-white hover:opacity-90" : ""}
                        >
                          {followedUsers.has(user.id) ? (
                            <>
                              <UserMinus className="h-4 w-4 mr-2" />
                              Ne plus suivre
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Suivre
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Aucun utilisateur trouvé</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Essayez avec d'autres mots-clés
                </p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="resources" className="space-y-6">
            {sortedResults.resources.length > 0 ? (
              <div className="space-y-2">
                {sortedResults.resources.map((res) => (
                  <Card key={res.id} className="campus-card hover:campus-glow transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p 
                          className="font-semibold cursor-pointer hover:underline"
                          onClick={() => handleViewResource(res.id, res.title)}
                        >
                          {res.title}
                        </p>
                        <p className="text-sm text-muted-foreground">Type: {res.type}</p>
                        <p className="text-sm text-muted-foreground">Auteur: {res.author}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewResource(res.id, res.title)}
                      >
                        Voir
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Aucune ressource trouvée</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Essayez avec d'autres mots-clés
                </p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="spheres" className="space-y-6">
            {sortedResults.spheres.length > 0 ? (
              <div className="space-y-2">
                {sortedResults.spheres.map((sphere) => (
                  <Card key={sphere.id} className="campus-card hover:campus-glow transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p 
                          className="font-semibold cursor-pointer hover:underline"
                          onClick={() => handleViewSphere(sphere.id, sphere.name)}
                        >
                          {sphere.name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{sphere.description}</p>
                        <p className="text-sm text-muted-foreground">{sphere.members} membres</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewSphere(sphere.id, sphere.name)}
                      >
                        Voir
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Aucune sphère trouvée</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Essayez avec d'autres mots-clés
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
