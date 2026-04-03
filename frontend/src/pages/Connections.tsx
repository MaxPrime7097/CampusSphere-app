import { useState, useEffect, useMemo } from "react";
import { searchUsers, getCurrentUser, getUserConnections, createConnection, deleteConnection, getMutualConnectionCounts } from "@/services/api";
import { Users, Link, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedSearchFiltersBar } from "@/components/ui/unified-search-filters-bar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  getFacultyLabel,
  getUniversityLabel,
  normalizeFaculty,
  normalizeUniversity,
} from "@/lib/profileMetadata";

type ConnectionFilter = "all" | "university" | "faculty" | "mutual" | "impact";

export function Connections() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutualCountStatus, setMutualCountStatus] = useState<string | null>(null);

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
            normalizedUniversity: normalizeUniversity(
              conn.requester === currentUser.id
                ? conn.recipient_info?.university
                : conn.requester_info?.university
            ),
            normalizedFaculty: normalizeFaculty(
              conn.requester === currentUser.id
                ? conn.recipient_info?.faculty
                : conn.requester_info?.faculty
            ),
            isVerified: false,
            impactScore:
              (conn.requester === currentUser.id
                ? conn.recipient_info?.impact_score
                : conn.requester_info?.impact_score) || 0,
            mutualFriends: 0
          }));
          setConnections(mapped);

          try {
            setMutualCountStatus("Calcul des amis communs...");
            const mutualCounts = await getMutualConnectionCounts({
              currentUserId: currentUser.id,
              connectionUserIds: mapped.map((connection: any) => connection.id),
            });

            if (isMounted) {
              setConnections((prev) =>
                prev.map((connection) => ({
                  ...connection,
                  mutualFriends: mutualCounts.counts[String(connection.id)] ?? 0,
                }))
              );
              setMutualCountStatus("Amis communs mis à jour.");
            }
          } catch {
            if (isMounted) {
              setMutualCountStatus(null);
              toast({
                title: "Information",
                description: "Le calcul des amis communs n'est pas disponible pour le moment.",
                duration: 2000,
              });
            }
          }
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
              normalizedUniversity: normalizeUniversity(u.university),
              normalizedFaculty: normalizeFaculty(u.faculty),
              reason:
                normalizeUniversity(u.university) &&
                normalizeUniversity(currentUser.university) &&
                normalizeUniversity(u.university) === normalizeUniversity(currentUser.university)
                  ? `Même université - ${getUniversityLabel(u.university)}`
                  : normalizeFaculty(u.faculty) &&
                      normalizeFaculty(currentUser.faculty) &&
                      normalizeFaculty(u.faculty) === normalizeFaculty(currentUser.faculty)
                    ? `Même filière - ${getFacultyLabel(u.faculty)}`
                    : "Suggestions pour vous",
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
  const [activeFilter, setActiveFilter] = useState<ConnectionFilter>("all");

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesSearch = (entry: any) => {
    if (!normalizedQuery) return true;
    return [entry.name, entry.username, entry.university, entry.faculty, entry.field]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  };

  const matchesFilter = (entry: any) => {
    switch (activeFilter) {
      case "university":
        return Boolean(
          currentUser?.university &&
            entry.university &&
            String(entry.university).toLowerCase() === String(currentUser.university).toLowerCase()
        );
      case "faculty":
        return Boolean(
          currentUser?.faculty &&
            entry.faculty &&
            String(entry.faculty).toLowerCase() === String(currentUser.faculty).toLowerCase()
        );
      case "mutual":
        return Number(entry.mutualFriends || 0) > 0;
      case "impact":
        return Number(entry.impactScore || 0) >= 50;
      default:
        return true;
    }
  };

  const filteredConnections = useMemo(
    () => connections.filter((entry) => matchesSearch(entry) && matchesFilter(entry)),
    [connections, normalizedQuery, activeFilter, currentUser]
  );

  const filteredSuggestions = useMemo(
    () => suggestions.filter((entry) => matchesSearch(entry) && matchesFilter(entry)),
    [suggestions, normalizedQuery, activeFilter, currentUser]
  );

  const hasActiveFilters = normalizedQuery.length > 0 || activeFilter !== "all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground">
              Connexions
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Gérez vos connexions et découvrez de nouveaux étudiants
            </p>
          </div>
          {mutualCountStatus && (
            <p className="text-xs text-muted-foreground mt-1">{mutualCountStatus}</p>
          )}
        </div>

        {/* Search Bar */}
        <UnifiedSearchFiltersBar className="mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des connexions..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={activeFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("all")}>
              <Filter className="h-4 w-4 mr-2" />
              Tous
            </Button>
            <Button variant={activeFilter === "university" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("university")}>
              Université
            </Button>
            <Button variant={activeFilter === "faculty" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("faculty")}>
              Filière
            </Button>
            <Button variant={activeFilter === "mutual" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("mutual")}>
              Amis communs
            </Button>
            <Button variant={activeFilter === "impact" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("impact")}>
              Impact
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </UnifiedSearchFiltersBar>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <SharedTabsList
            className="grid w-full grid-cols-2 max-w-md"
            containerClassName="mb-6"
          >
            <SharedTabsTrigger value="all">
              Mes Connexions ({filteredConnections.length})
            </SharedTabsTrigger>
            <SharedTabsTrigger value="suggestions">
              Suggestions ({filteredSuggestions.length})
            </SharedTabsTrigger>
          </SharedTabsList>

          {/* All Connections */}
          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredConnections.map((connection) => (
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
                          {getUniversityLabel(connection.university)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getFacultyLabel(connection.field)}
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
            {!loading && filteredConnections.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune connexion trouvée pour ces critères.</p>
            )}
          </TabsContent>

          {/* Suggestions */}
          <TabsContent value="suggestions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSuggestions.map((suggestion) => (
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
                          {getUniversityLabel(suggestion.university)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getFacultyLabel(suggestion.field)}
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
                            await createConnection(suggestion.id);
                            toast({
                              title: "Demande envoyée",
                              description: `Demande de connexion envoyée à ${suggestion.name}`,
                              duration: 2000,
                            });
                            // Move to connections list
                            setConnections((prev) => [...prev, suggestion]);
                            setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
                          } catch (error: any) {
                            toast({
                              title: "Erreur",
                              description: error?.message || "Impossible d'envoyer la demande",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {!loading && filteredSuggestions.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune suggestion trouvée pour ces critères.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
