import { useState, useEffect, useMemo } from "react";
import { searchUsers, getCurrentUser, getUserConnections, createConnection, disconnectFromUser, getMutualConnectionCounts } from "@/services/api";
import { Users, Link, Search, Filter, Zap, UserPlus, UserCheck, Check, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ConnectionSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
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
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
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
            mutualFriends: 0,
            status: conn.status,
            isIncomingRequest: conn.recipient === currentUser.id && conn.status === 'pending'
          }));
          setConnections(mapped.filter((c: any) => c.status === 'accepted'));
          setPendingRequests(mapped.filter((c: any) => c.isIncomingRequest));

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
                  ? "Même université"
                  : normalizeFaculty(u.faculty) &&
                      normalizeFaculty(currentUser.faculty) &&
                      normalizeFaculty(u.faculty) === normalizeFaculty(currentUser.faculty)
                    ? "Même filière"
                    : "Suggéré pour vous",
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
        <div className="mb-6">
          {/* Mobile */}
          <div className="flex gap-2 sm:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher des connexions..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button variant="outline" size="icon" onClick={() => setShowMobileFilters((v) => !v)} className={showMobileFilters ? "border-primary text-primary" : ""}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          {showMobileFilters && (
            <div className="mt-2 sm:hidden">
              <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as ConnectionFilter)}>
                <SelectTrigger><SelectValue placeholder="Filtrer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="university">Université</SelectItem>
                  <SelectItem value="faculty">Filière</SelectItem>
                  <SelectItem value="mutual">Amis communs</SelectItem>
                  <SelectItem value="impact">Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Desktop */}
          <div className="hidden sm:flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher des connexions..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as ConnectionFilter)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Filtrer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="university">Université</SelectItem>
                <SelectItem value="faculty">Filière</SelectItem>
                <SelectItem value="mutual">Amis communs</SelectItem>
                <SelectItem value="impact">Impact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <SharedTabsList>
            <SharedTabsTrigger value="all">
              Mes Connexions ({filteredConnections.length})
            </SharedTabsTrigger>
            <SharedTabsTrigger value="requests">
              Demandes ({pendingRequests.length})
            </SharedTabsTrigger>
            <SharedTabsTrigger value="suggestions">
              Suggestions ({filteredSuggestions.length})
            </SharedTabsTrigger>
          </SharedTabsList>

          {/* All Connections */}
          <TabsContent value="all" className="space-y-3">
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <ConnectionSkeleton key={i} />)}
              </div>
            ) : filteredConnections.length === 0 ? (
              <EmptyState
                icon={Users}
                title={hasActiveFilters ? "Aucune connexion pour ces critères" : "Aucune connexion"}
                description={hasActiveFilters ? "Essayez de changer les filtres." : "Commencez à vous connecter avec d'autres étudiants !"}
                actionLabel={hasActiveFilters ? "Réinitialiser" : undefined}
                onAction={hasActiveFilters ? () => { setSearchQuery(""); setActiveFilter("all"); } : undefined}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredConnections.map((connection) => (
                  <Card key={connection.id} className="border bg-card hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => navigate(`/profile/${connection.username}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src={connection.avatar} />
                          <AvatarFallback className="campus-gradient text-white font-bold">
                            {connection.name?.slice(0, 2).toUpperCase() || 'US'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm truncate">{connection.name}</h3>
                            {connection.isVerified && (
                              <div className="w-3.5 h-3.5 campus-gradient rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-[8px]">✓</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">@{connection.username}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {connection.university && (
                              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 py-0 max-w-[100px] truncate">
                                {getUniversityLabel(connection.university)}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Zap className="h-2.5 w-2.5 text-primary" />{connection.impactScore}
                            </span>
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">
                              {connection.mutualFriends} communs
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0 h-8 w-8 sm:w-auto p-0 sm:px-3 text-xs"
                          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${connection.username}`); }}
                        >
                          <User className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Profil</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Requests */}
          <TabsContent value="requests" className="space-y-3">
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => <ConnectionSkeleton key={i} />)}
              </div>
            ) : pendingRequests.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title="Aucune demande en attente"
                description="Vous n'avez pas de demandes de connexion pour le moment."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="border bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 flex-shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${request.username}`)}>
                          <AvatarImage src={request.avatar} />
                          <AvatarFallback className="campus-gradient text-white font-bold">
                            {request.name?.slice(0, 2).toUpperCase() || 'US'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate cursor-pointer hover:underline" onClick={() => navigate(`/profile/${request.username}`)}>{request.name}</h3>
                          <p className="text-xs text-muted-foreground">@{request.username}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            className="h-8 w-8 sm:w-auto p-0 sm:px-3 text-xs campus-gradient text-white hover:opacity-90"
                            onClick={async () => {
                              try {
                                const { acceptConnection } = await import("@/services/api");
                                await acceptConnection(request.id);
                                toast({ title: "Connexion acceptée", description: `Vous êtes maintenant connecté(e) à ${request.name}` });
                                setConnections(prev => [...prev, { ...request, status: 'accepted' }]);
                                setPendingRequests(prev => prev.filter(r => r.id !== request.id));
                              } catch (error: any) {
                                toast({ title: "Erreur", description: error?.message || "Impossible d'accepter la demande", variant: "destructive" });
                              }
                            }}
                          >
                            <Check className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Accepter</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 sm:w-auto p-0 sm:px-3 text-xs text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              try {
                                await disconnectFromUser(request.id);
                                toast({ title: "Demande refusée", description: `Vous avez refusé la demande de ${request.name}` });
                                setPendingRequests(prev => prev.filter(r => r.id !== request.id));
                              } catch (error: any) {
                                toast({ title: "Erreur", description: error?.message || "Impossible de refuser la demande", variant: "destructive" });
                              }
                            }}
                          >
                            <X className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Refuser</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Suggestions */}
          <TabsContent value="suggestions" className="space-y-3">
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <ConnectionSkeleton key={i} />)}
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title={hasActiveFilters ? "Aucune suggestion pour ces critères" : "Aucune suggestion"}
                description={hasActiveFilters ? "Essayez de changer les filtres." : "Revenez plus tard, de nouveaux étudiants rejoignent la plateforme."}
                actionLabel={hasActiveFilters ? "Réinitialiser" : undefined}
                onAction={hasActiveFilters ? () => { setSearchQuery(""); setActiveFilter("all"); } : undefined}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="border bg-card hover:shadow-md transition-shadow duration-200" onClick={() => navigate(`/profile/${suggestion.username}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src={suggestion.avatar} />
                          <AvatarFallback className="campus-gradient text-white font-bold">
                            {suggestion.name?.slice(0, 2).toUpperCase() || 'US'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{suggestion.name}</h3>
                          <p className="text-xs text-muted-foreground">@{suggestion.username}</p>
                          <p className="text-[10px] text-primary/80 italic mt-0.5 truncate w-full">
                            {suggestion.reason}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {suggestion.university && (
                              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 py-0 max-w-[100px] truncate">
                                {getUniversityLabel(suggestion.university)}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Zap className="h-2.5 w-2.5 text-primary" />{suggestion.impactScore}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="flex-shrink-0 h-8 w-8 sm:w-auto p-0 sm:px-3 text-xs campus-gradient text-white hover:opacity-90"
                          onClick={async () => {
                            try {
                              await createConnection(suggestion.id);
                              toast({ title: "Demande envoyée", description: `Demande envoyée à ${suggestion.name}`, duration: 2000 });
                              setConnections((prev) => [...prev, suggestion]);
                              setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
                            } catch (error: any) {
                              toast({ title: "Erreur", description: error?.message || "Impossible d'envoyer la demande", variant: "destructive" });
                            }
                          }}
                        >
                          <Link className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Connecter</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
