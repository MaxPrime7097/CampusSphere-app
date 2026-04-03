import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { connectWithUser, disconnectFromUser, getCurrentUser, globalSearch, getUserConnectionRelation, isApiRequestErrorStatus } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { UnifiedSearchFiltersBar } from "@/components/ui/unified-search-filters-bar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, BookOpen, ShoppingBag, Loader2, Link, Unlink, FolderOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_SORT,
  SEARCH_SORT_KEYS,
  type SearchSortKey,
  ensureValidSortKey,
} from "@/constants/defaultSort";
import {
  getCategoryLabel,
  getSubjectLabel,
  getTypeLabel,
  normalizeCategory,
  normalizeResourceType,
  normalizeSubject,
} from "@/lib/resourceMetadata";

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const query = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(query);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(query);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<SearchSortKey>(DEFAULT_SORT.search);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [connectionIdsByUser, setConnectionIdsByUser] = useState<Record<string, string>>({});
  const [relationActionUnavailableUsers, setRelationActionUnavailableUsers] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followLoadingUserId, setFollowLoadingUserId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{ users: any[]; resources: any[]; spheres: any[] }>({
    users: [],
    resources: [],
    spheres: []
  });

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const me = await getCurrentUser();
        if (isMounted && me?.id != null) {
          setCurrentUserId(String(me.id));
        }
      } catch {
        // Current user is optional for read-only search experience.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSearchTerm(query);
    setDebouncedSearchTerm(query);
    setActiveTab("all");
    setSearchError(null);
  }, [query]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 350);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  // Recherche en temps réel
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setSearchResults({ users: [], resources: [], spheres: [] });
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    let isMounted = true;
    setIsSearching(true);
    setSearchError(null);
    
    (async () => {
      try {
        const searchType = "all";
        const searchLimit = 20;
        console.debug("[SearchResults] globalSearch params", {
          searchTerm: debouncedSearchTerm,
          type: searchType,
          limit: searchLimit,
        });
        const result = await globalSearch(debouncedSearchTerm, searchType, searchLimit);
        if (isMounted && result.success) {
          const data = result.data || {};
          setSearchResults({
            users: (data.users || []).map((u: any) => ({
              id: String(u.id),
              name: u.name || u.first_name + ' ' + u.last_name,
              username: u.username,
              avatar: u.avatar || '/placeholder-avatar.jpg',
              bio: u.bio || [u.university, u.faculty].filter(Boolean).join(" • "),
              university: u.university || '',
              faculty: u.faculty || '',
            })),
            resources: (data.resources || []).map((r: any) => ({
              id: String(r.id),
              title: r.title,
              description: r.description || '',
              subject: normalizeSubject(r.subject),
              type: normalizeResourceType(r.type),
              category: normalizeCategory(r.category),
              authorName: r.author_info?.name || r.author_name || r.author?.name || "Auteur inconnu",
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
      } catch (error: any) {
        if (isMounted) {
          const message = error?.message || "Impossible d'effectuer la recherche pour le moment.";
          setSearchError(message);
          toast({
            title: "Erreur de recherche",
            description: message,
            variant: "destructive",
          });
          setSearchResults({ users: [], resources: [], spheres: [] });
        }
      } finally {
        if (isMounted) setIsSearching(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearchTerm, toast]);

  const handleFollowUser = async (userId: string, userName: string) => {
    if (!currentUserId || followLoadingUserId) {
      toast({
        title: "Action indisponible",
        description: "Impossible de modifier la connexion pour le moment.",
        variant: "destructive",
      });
      return;
    }

    const isFollowing = followedUsers.has(userId);
    const previousFollowedUsers = new Set(followedUsers);
    const previousConnectionId = connectionIdsByUser[userId];
    setFollowLoadingUserId(userId);
    setRelationActionUnavailableUsers((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });

    // Optimistic update
    setFollowedUsers((prev) => {
      const next = new Set(prev);
      if (isFollowing) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });

    try {
      if (isFollowing) {
        await disconnectFromUser(userId);
        setConnectionIdsByUser((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      } else {
        const response = await connectWithUser(userId);
        if (response?.id != null) {
          setConnectionIdsByUser((prev) => ({ ...prev, [userId]: String(response.id) }));
        }
      }

      toast({
        title: isFollowing ? "Ne suit plus" : "Suit maintenant",
        description: isFollowing
          ? `Vous ne suivez plus ${userName}`
          : `Vous suivez maintenant ${userName}`,
        duration: 2000,
      });
    } catch (error: any) {
      setFollowedUsers(previousFollowedUsers);
      setConnectionIdsByUser((prev) => ({
        ...prev,
        ...(previousConnectionId ? { [userId]: previousConnectionId } : {}),
      }));

      if (isApiRequestErrorStatus(error, 403)) {
        setRelationActionUnavailableUsers((prev) => new Set(prev).add(userId));
        toast({
          title: "Action non autorisée",
          description: "La relation avec ce profil n'est pas accessible actuellement.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Erreur",
        description:
          error?.message ||
          (isFollowing
            ? "Impossible de supprimer la connexion."
            : "Impossible de créer la connexion."),
        variant: "destructive",
      });
    } finally {
      setFollowLoadingUserId(null);
    }
  };

  useEffect(() => {
    if (!currentUserId || !searchResults.users.length) return;

    let isMounted = true;
    (async () => {
      const users = searchResults.users.filter((u) => String(u.id) !== currentUserId);
      const relationChecks = await Promise.allSettled(
        users.map(async (user) => ({ userId: String(user.id), relation: await getUserConnectionRelation(user.id) }))
      );

      if (!isMounted) return;

      const nextFollowedUsers = new Set<string>();
      const nextConnectionIds: Record<string, string> = {};
      const unavailableUsers = new Set<string>();

      relationChecks.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const userId = result.value.userId;
          const relation = result.value.relation;
          if (relation?.is_connected) {
            nextFollowedUsers.add(userId);
            if (relation?.connection?.id != null) {
              nextConnectionIds[userId] = String(relation.connection.id);
            }
          }
          return;
        }

        const userId = users[index]?.id;
        if (userId && isApiRequestErrorStatus(result.reason, 403)) {
          unavailableUsers.add(String(userId));
        }
      });

      setFollowedUsers(nextFollowedUsers);
      setConnectionIdsByUser(nextConnectionIds);
      setRelationActionUnavailableUsers(unavailableUsers);
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUserId, searchResults.users]);

  const handleViewProfile = (username?: string, userName?: string) => {
    if (!username) {
      toast({
        title: "Profil indisponible",
        description: "Impossible d'ouvrir ce profil : username introuvable.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Navigation vers profil",
      description: `Ouverture du profil de ${userName || username}`,
      duration: 2000,
    });
    navigate(`/profile/${username}`);
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

  const resolvedSearchSort = ensureValidSortKey(sortBy, SEARCH_SORT_KEYS, DEFAULT_SORT.search);

  // Résultats triés et filtrés
  const sortedResults = useMemo(() => {
    const sortResults = (items: any[]) => {
      switch (resolvedSearchSort) {
        case "name":
          return [...items].sort((a, b) => {
            const left = a.name || a.title || "";
            const right = b.name || b.title || "";
            return left.localeCompare(right);
          });
        case "relevance":
          return items;
      }
    };

    return {
      users: sortResults(searchResults.users),
      resources: sortResults(searchResults.resources),
      spheres: sortResults(searchResults.spheres)
    };
  }, [searchResults, resolvedSearchSort]);
  const totalResults = sortedResults.users.length + sortedResults.resources.length + sortedResults.spheres.length;
  const hasActiveQuery = debouncedSearchTerm.trim().length > 0;
  const hasEmptyResults = hasActiveQuery && totalResults === 0 && !isSearching && !searchError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-4xl mx-auto py-4 md:py-6 px-4">
        {/* Search Bar */}
        <UnifiedSearchFiltersBar className="mb-6 campus-card" contentClassName="space-y-3">
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
          
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-muted-foreground">
              {query ? (
                <>
                  Résultats pour "<span className="font-semibold">{query}</span>"
                </>
              ) : (
                "Trie les résultats"
              )}
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
        </UnifiedSearchFiltersBar>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <SharedTabsList className="mb-6 w-full">
            <SharedTabsTrigger value="all">
              Tout ({totalResults})
            </SharedTabsTrigger>
            <SharedTabsTrigger value="users">
              Personnes ({sortedResults.users.length})
            </SharedTabsTrigger>
            <SharedTabsTrigger value="resources">
              Ressources ({sortedResults.resources.length})
            </SharedTabsTrigger>
            <SharedTabsTrigger value="spheres">
              Sphères ({sortedResults.spheres.length})
            </SharedTabsTrigger>
          </SharedTabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Users Section */}
            {sortedResults.users.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personnes ({sortedResults.users.length})
                </h3>
                <div className="space-y-2">
                  {sortedResults.users.map((user) => (
                    <Card key={user.id} className="campus-card hover:campus-glow transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar 
                            className={`h-12 w-12 transition-opacity ${user.username ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-60"}`}
                            onClick={() => handleViewProfile(user.username, user.name)}
                          >
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p 
                              className={`font-semibold ${user.username ? "cursor-pointer hover:underline" : "cursor-not-allowed opacity-60"}`}
                              onClick={() => handleViewProfile(user.username, user.name)}
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
                            disabled={followLoadingUserId === user.id || !currentUserId || relationActionUnavailableUsers.has(user.id)}
                            className={!followedUsers.has(user.id) ? "campus-gradient text-white hover:opacity-90" : ""}
                          >
                            {followedUsers.has(user.id) ? (
                              <>
                                <Unlink className="h-4 w-4 mr-2" />
                                Disconnect
                              </>
                            ) : (
                              <>
                                <Link className="h-4 w-4 mr-2" />
                                Connect
                              </>
                            )}
                          </Button>
                          {relationActionUnavailableUsers.has(user.id) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Connexion indisponible pour ce profil.
                            </p>
                          )}
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
                  <FolderOpen className="h-5 w-5" />
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
                          <p className="text-sm text-muted-foreground">
                            Type: {getTypeLabel(res.type)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Matière: {getSubjectLabel(res.subject)}
                          </p>
                          {res.category && (
                            <p className="text-sm text-muted-foreground">
                              Catégorie: {getCategoryLabel(res.category)}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">Auteur: {res.authorName}</p>
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
                  <Users className="h-5 w-5" />
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
                          <p className="text-sm text-muted-foreground">{sphere.memberCount} membres</p>
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

            {searchError && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive text-lg">La recherche a échoué</p>
                <p className="text-sm text-muted-foreground mt-2">{searchError}</p>
              </div>
            )}

            {hasEmptyResults && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Aucun résultat pour “{debouncedSearchTerm}”</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Aucun élément ne correspond à votre recherche pour le moment.
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
                          className={`h-12 w-12 transition-opacity ${user.username ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-60"}`}
                          onClick={() => handleViewProfile(user.username, user.name)}
                        >
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p 
                            className={`font-semibold ${user.username ? "cursor-pointer hover:underline" : "cursor-not-allowed opacity-60"}`}
                            onClick={() => handleViewProfile(user.username, user.name)}
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
                          disabled={followLoadingUserId === user.id || !currentUserId || relationActionUnavailableUsers.has(user.id)}
                          className={!followedUsers.has(user.id) ? "campus-gradient text-white hover:opacity-90" : ""}
                        >
                          {followedUsers.has(user.id) ? (
                            <>
                              <Unlink className="h-4 w-4 mr-2" />
                              Disconnect
                            </>
                          ) : (
                            <>
                              <Link className="h-4 w-4 mr-2" />
                              Connect
                            </>
                          )}
                        </Button>
                        {relationActionUnavailableUsers.has(user.id) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Connexion indisponible pour ce profil.
                          </p>
                        )}
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
                        <p className="text-sm text-muted-foreground">
                          Type: {getTypeLabel(res.type)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Matière: {getSubjectLabel(res.subject)}
                        </p>
                        {res.category && (
                          <p className="text-sm text-muted-foreground">
                            Catégorie: {getCategoryLabel(res.category)}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">Auteur: {res.authorName}</p>
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
                        <p className="text-sm text-muted-foreground">{sphere.memberCount} membres</p>
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
