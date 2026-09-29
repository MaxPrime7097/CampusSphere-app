import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  createConnection,
  deleteConnection,
  globalSearch,
  listSpheres,
  listResources,
} from "@/services/api";
import { getEvents } from "@/services/eventService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  Loader2,
  BadgeCheck,
  X,
  Calendar,
  MessageCircle,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn, formatSlugToLabel } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/date";
import {
  DEFAULT_SORT,
  SEARCH_SORT_KEYS,
  type SearchSortKey,
  ensureValidSortKey,
} from "@/constants/defaultSort";
import {
  getCategoryLabel,
  getTypeLabel,
  normalizeCategory,
  normalizeResourceType,
  normalizeSubject,
} from "@/lib/resourceMetadata";
import { getSphereCategoryLabel } from "@/constants/sphereCategories";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

const SUGGESTED_SEARCHES = [
  "Algorithmique",
  "Génie Logiciel",
  "Mathématiques",
  "Droit des Affaires",
  "Réseaux & Systèmes",
  "Annales d'examens",
  "Club Tech",
  "Comptabilité",
];

interface SearchUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  university: string;
  faculty: string;
  isVerified: boolean;
}

interface SearchResource {
  id: string;
  title: string;
  description: string;
  subject: string;
  type: string;
  category: string;
  authorName: string;
  createdAt: string;
  tags: string[];
}

interface SearchSphere {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar: string | null;
  memberCount: number;
}

interface SearchPost {
  id: string;
  content: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null;
  isVerified: boolean;
  category: string;
  subject: string;
  impactScore: number;
  commentsCount?: number;
  createdAt: string;
  tags: string[];
  thumbnail?: string | null;
}

interface SearchEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate?: string;
  location: string;
  isOnline: boolean;
  coverImage?: string | null;
  attendeeCount: number;
}

export function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const query = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(query);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(query);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "posts" | "events" | "users" | "resources" | "spheres">("all");
  const [sortBy, setSortBy] = useState<SearchSortKey>(DEFAULT_SORT.search);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [connectionIdsByUser, setConnectionIdsByUser] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followLoadingUserId, setFollowLoadingUserId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{
    users: SearchUser[];
    resources: SearchResource[];
    spheres: SearchSphere[];
    posts: SearchPost[];
    events: SearchEvent[];
  }>({
    users: [],
    resources: [],
    spheres: [],
    posts: [],
    events: [],
  });

  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.id != null) {
      setCurrentUserId(String(currentUser.id));
    }
  }, [currentUser?.id]);

  useEffect(() => {
    setSearchTerm(query);
    setDebouncedSearchTerm(query);
    setSearchError(null);
  }, [query]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm.trim() !== query.trim()) {
        setSearchParams(searchTerm.trim() ? { q: searchTerm.trim() } : {}, { replace: true });
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, query, setSearchParams]);

  // Query: Global Search Results (users, spheres, posts, resources) + Events
  const searchQueryResult = useQuery({
    queryKey: ["search", debouncedSearchTerm, sortBy],
    queryFn: async () => {
      const [searchRes, eventsRes] = await Promise.all([
        globalSearch(debouncedSearchTerm, "all", 30),
        getEvents({ search: debouncedSearchTerm }).catch((): any[] => []),
      ]);
      return {
        search: searchRes,
        events: eventsRes,
      };
    },
    enabled: Boolean(debouncedSearchTerm.trim()),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Query: Upcoming events for Discovery state
  const discoveryEventsQuery = useQuery({
    queryKey: ["search-discovery-events"],
    queryFn: () => getEvents({ upcoming: true }),
    enabled: !debouncedSearchTerm.trim(),
    staleTime: 5 * 60 * 1000,
    select: (events) => (Array.isArray(events) ? events : []).slice(0, 3),
  });

  // Query: Popular spheres for Discovery state
  const discoverySpheresQuery = useQuery({
    queryKey: ["search-discovery-spheres"],
    queryFn: () => listSpheres(),
    enabled: !debouncedSearchTerm.trim(),
    staleTime: 5 * 60 * 1000,
    select: (spheres) => (Array.isArray(spheres) ? spheres : []).slice(0, 3),
  });

  // Query: Recent resources for Discovery state
  const discoveryResourcesQuery = useQuery({
    queryKey: ["search-discovery-resources"],
    queryFn: () => listResources({ ordering: "-created_at" }),
    enabled: !debouncedSearchTerm.trim(),
    staleTime: 5 * 60 * 1000,
    select: (resources) => (Array.isArray(resources) ? resources : []).slice(0, 3),
  });

  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setSearchResults({ users: [], resources: [], spheres: [], posts: [], events: [] });
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(searchQueryResult.isLoading);
    setSearchError(
      searchQueryResult.error
        ? (searchQueryResult.error as any)?.message || "Impossible d'effectuer la recherche."
        : null
    );

    if (searchQueryResult.data) {
      const searchData = searchQueryResult.data.search?.data || {};
      const eventsData = Array.isArray(searchQueryResult.data.events)
        ? searchQueryResult.data.events
        : [];

      setSearchResults({
        users: (searchData.users || []).map((u: any) => ({
          id: String(u.id),
          name: u.name || [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username,
          username: u.username,
          avatar: u.avatar || "",
          bio: u.bio || [formatSlugToLabel(u.faculty), formatSlugToLabel(u.university)].filter(Boolean).join(" • "),
          university: formatSlugToLabel(u.university),
          faculty: formatSlugToLabel(u.faculty),
          isVerified: Boolean(u.is_verified ?? u.isVerified),
        })),
        resources: (searchData.resources || []).map((r: any) => ({
          id: String(r.id),
          title: r.title,
          description: r.description || "",
          subject: normalizeSubject(r.subject),
          type: normalizeResourceType(r.type),
          category: normalizeCategory(r.category),
          authorName: r.author_info?.name || r.author_name || r.author?.name || "Auteur inconnu",
          createdAt: r.created_at || r.createdAt,
          tags: r.tags || [],
        })),
        spheres: (searchData.spheres || []).map((s: any) => ({
          id: String(s.id),
          name: s.name,
          description: s.description || "",
          category: s.category || "",
          avatar: s.avatar || null,
          memberCount: s.member_count || s.members_count || 0,
        })),
        posts: (searchData.posts || []).map((p: any) => ({
          id: String(p.id),
          content: p.content || "",
          authorName:
            p.author_info?.name ||
            [p.author_info?.first_name, p.author_info?.last_name].filter(Boolean).join(" ") ||
            p.author_info?.username ||
            "Auteur",
          authorUsername: p.author_info?.username || "",
          authorAvatar: p.author_info?.avatar || null,
          isVerified: Boolean(p.author_info?.is_verified),
          category: p.category || "",
          subject: p.subject || "",
          impactScore: Number(p.impact_score ?? p.impactScore ?? 0),
          commentsCount: Number(p.commentsCount ?? p.comments_count ?? p.comments ?? 0),
          createdAt: p.created_at || p.createdAt,
          tags: p.tags || [],
          thumbnail:
            p.image ||
            p.image_url ||
            p.imageUrl ||
            (Array.isArray(p.media_urls) ? p.media_urls[0] : null) ||
            (Array.isArray(p.files) && p.files.length > 0
              ? (typeof p.files[0] === "string" ? p.files[0] : p.files[0]?.url || p.files[0]?.file_url || p.files[0]?.preview)
              : null) ||
            null,
        })),
        events: eventsData.map((e: any) => ({
          id: String(e.id),
          title: e.title,
          description: e.description || "",
          category: e.category || "",
          startDate: e.startDate || e.start_date,
          endDate: e.endDate || e.end_date,
          location: e.location || (e.isOnline ? "En ligne" : "Campus"),
          isOnline: Boolean(e.isOnline),
          coverImage: e.coverImage || e.cover_image || null,
          attendeeCount:
            e.attendeesCount ??
            e.attendee_count ??
            (Array.isArray(e.attendees) ? e.attendees.length : 0),
        })),
      });
    } else if (searchQueryResult.error) {
      toast({
        title: "Erreur de recherche",
        description: (searchQueryResult.error as any)?.message || "Impossible d'effectuer la recherche.",
        variant: "destructive",
      });
      setSearchResults({ users: [], resources: [], spheres: [], posts: [], events: [] });
    }
  }, [debouncedSearchTerm, searchQueryResult.data, searchQueryResult.error, searchQueryResult.isLoading, toast]);

  const handleFollowUser = async (userId: string, userName: string) => {
    if (!currentUserId || followLoadingUserId) {
      toast({
        title: "Action indisponible",
        description: "Impossible de modifier la connexion.",
        variant: "destructive",
      });
      return;
    }

    const isFollowing = followedUsers.has(userId);
    const previousFollowedUsers = new Set(followedUsers);
    const previousConnectionId = connectionIdsByUser[userId];
    setFollowLoadingUserId(userId);

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
        if (!previousConnectionId) {
          throw new Error("Connexion introuvable.");
        }
        await deleteConnection(currentUserId, previousConnectionId);
        setConnectionIdsByUser((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      } else {
        const response = await createConnection(userId);
        if (response?.id != null) {
          setConnectionIdsByUser((prev) => ({ ...prev, [userId]: String(response.id) }));
        }
      }

      toast({
        title: isFollowing ? "Connexion retirée" : "Demande envoyée",
        description: isFollowing
          ? `Vous ne suivez plus ${userName}`
          : `Demande de connexion envoyée à ${userName}`,
        duration: 2000,
      });
    } catch (error: any) {
      setFollowedUsers(previousFollowedUsers);
      setConnectionIdsByUser((prev) => ({
        ...prev,
        ...(previousConnectionId ? { [userId]: previousConnectionId } : {}),
      }));

      toast({
        title: "Erreur",
        description: error?.message || "Impossible de mettre à jour la connexion.",
        variant: "destructive",
      });
    } finally {
      setFollowLoadingUserId(null);
    }
  };

  const handleSelectSuggestedSearch = (keyword: string) => {
    setSearchTerm(keyword);
    setDebouncedSearchTerm(keyword);
    setSearchParams({ q: keyword }, { replace: true });
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSearchParams({}, { replace: true });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setDebouncedSearchTerm(searchTerm.trim());
      setSearchParams({ q: searchTerm.trim() }, { replace: true });
    }
  };

  const resolvedSearchSort = ensureValidSortKey(sortBy, SEARCH_SORT_KEYS, DEFAULT_SORT.search);

  // Sorted Results
  const sortedResults = useMemo(() => {
    const sortResults = (items: any[]) => {
      switch (resolvedSearchSort) {
        case "name":
          return [...items].sort((a, b) => {
            const left = a.name || a.title || a.authorName || a.content || "";
            const right = b.name || b.title || b.authorName || b.content || "";
            return left.localeCompare(right);
          });
        case "relevance":
        default:
          return items;
      }
    };

    return {
      users: sortResults(searchResults.users),
      posts: sortResults(searchResults.posts),
      events: sortResults(searchResults.events),
      resources: sortResults(searchResults.resources),
      spheres: sortResults(searchResults.spheres),
    };
  }, [searchResults, resolvedSearchSort]);

  const totalResults =
    sortedResults.users.length +
    sortedResults.posts.length +
    sortedResults.events.length +
    sortedResults.resources.length +
    sortedResults.spheres.length;
  const hasActiveQuery = debouncedSearchTerm.trim().length > 0;
  const hasEmptyResults = hasActiveQuery && totalResults === 0 && !isSearching && !searchError;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ─── 1. HERO SEARCH BAR ─── */}
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="relative flex items-center w-full h-14 sm:h-16 rounded-2xl border border-border/60 bg-card shadow-xs transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 px-4 sm:px-5 gap-3">
              <Search className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher des publications, événements, étudiants, cours, TD, sphères..."
                className="w-full bg-transparent text-sm sm:text-base md:text-lg font-medium text-foreground placeholder:text-muted-foreground/60 outline-none border-none ring-0 focus:ring-0 focus:outline-none"
                autoFocus
              />

              {searchTerm && !isSearching && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                  title="Effacer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {isSearching && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />
              )}
            </div>
          </form>

          {/* ─── 2. FILTER PILLS & SORT BAR ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            {/* Pill Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  activeTab === "all"
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted/30 hover:bg-muted text-muted-foreground border border-border/30"
                )}
              >
                Tout {hasActiveQuery && `(${totalResults})`}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("posts")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  activeTab === "posts"
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted/30 hover:bg-muted text-muted-foreground border border-border/30"
                )}
              >
                Publications {hasActiveQuery && `(${sortedResults.posts.length})`}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("events")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  activeTab === "events"
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted/30 hover:bg-muted text-muted-foreground border border-border/30"
                )}
              >
                Événements {hasActiveQuery && `(${sortedResults.events.length})`}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  activeTab === "users"
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted/30 hover:bg-muted text-muted-foreground border border-border/30"
                )}
              >
                Personnes {hasActiveQuery && `(${sortedResults.users.length})`}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("resources")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  activeTab === "resources"
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted/30 hover:bg-muted text-muted-foreground border border-border/30"
                )}
              >
                Ressources {hasActiveQuery && `(${sortedResults.resources.length})`}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("spheres")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  activeTab === "spheres"
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted/30 hover:bg-muted text-muted-foreground border border-border/30"
                )}
              >
                Sphères {hasActiveQuery && `(${sortedResults.spheres.length})`}
              </button>
            </div>

            {/* Sort Selector */}
            {hasActiveQuery && (
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <span className="text-xs text-muted-foreground">Trier :</span>
                <Select
                  value={sortBy}
                  onValueChange={(val) => setSortBy(ensureValidSortKey(val, SEARCH_SORT_KEYS, "relevance"))}
                >
                  <SelectTrigger className="w-32 h-8 text-xs rounded-xl border-border/40">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Pertinence</SelectItem>
                    <SelectItem value="name">Nom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* ─── 3. DISCOVERY VIEW (Quand il n'y a pas de recherche en cours) ─── */}
        {!hasActiveQuery && (
          <div className="space-y-10 py-4 animate-in fade-in duration-300">
            {/* Suggestions Chips */}
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 block">
                Recherches suggérées
              </span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SEARCHES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelectSuggestedSearch(item)}
                    className="px-3.5 py-1.5 rounded-full border border-border/40 bg-card hover:border-border text-xs font-medium text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Événements à découvrir */}
            {discoveryEventsQuery.data && discoveryEventsQuery.data.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Événements du campus</h3>
                  <button
                    type="button"
                    onClick={() => navigate("/events")}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Tous les événements
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {discoveryEventsQuery.data.map((evt: any) => {
                    const startDate = evt.startDate ? new Date(evt.startDate) : new Date();
                    const day = !isNaN(startDate.getTime()) ? startDate.getDate() : 1;
                    const month = !isNaN(startDate.getTime())
                      ? startDate.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()
                      : "EVT";

                    return (
                      <div
                        key={evt.id}
                        onClick={() => navigate(`/events/${evt.id}`)}
                        className="p-4 rounded-2xl border border-border/40 bg-card hover:border-border transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="flex flex-col items-center justify-center h-9 w-9 rounded-xl bg-muted border border-border/40 shrink-0">
                                <span className="text-xs font-bold text-foreground leading-none">{day}</span>
                                <span className="text-[9px] font-semibold text-muted-foreground uppercase leading-none mt-0.5">{month}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium text-muted-foreground">
                                {evt.category || "Événement"}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {evt.isOnline ? "En ligne" : (evt.location || "Campus")}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">
                              {evt.title}
                            </h4>
                            {evt.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                {evt.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{evt.attendeesCount ?? evt.attendee_count ?? (Array.isArray(evt.attendees) ? evt.attendees.length : 0)} participants</span>
                          </span>
                          <span className="font-medium text-foreground">Voir l'événement</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sphères à découvrir */}
            {discoverySpheresQuery.data && discoverySpheresQuery.data.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Sphères d'étude à explorer</h3>
                  <button
                    type="button"
                    onClick={() => navigate("/spheres")}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Toutes les sphères
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {discoverySpheresQuery.data.map((sphere: any) => (
                    <div
                      key={sphere.id}
                      onClick={() => navigate(`/spheres/${sphere.id}`)}
                      className="p-4 rounded-2xl border border-border/40 bg-card hover:border-border transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Avatar className="h-10 w-10 rounded-xl border border-border/40">
                            <AvatarImage src={sphere.avatar || undefined} />
                            <AvatarFallback className="rounded-xl font-bold text-xs bg-muted text-muted-foreground">
                              {sphere.name?.[0]?.toUpperCase() || "S"}
                            </AvatarFallback>
                          </Avatar>
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-normal">
                            {getSphereCategoryLabel(String(sphere.category).trim().toLowerCase()) || "Sphère"}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground truncate">{sphere.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {sphere.description || "Sphère d'entraide et de partage académique."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{sphere.memberCount || 0} membres</span>
                        </span>
                        <span className="font-medium text-foreground">Explorer</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ressources récentes à découvrir */}
            {discoveryResourcesQuery.data && discoveryResourcesQuery.data.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Ressources de cours récentes</h3>
                  <button
                    type="button"
                    onClick={() => navigate("/resources")}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Toutes les ressources
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {discoveryResourcesQuery.data.map((res: any) => (
                    <div
                      key={res.id}
                      onClick={() => navigate(`/resources/${res.id}`)}
                      className="p-4 rounded-2xl border border-border/40 bg-card hover:border-border transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium text-muted-foreground">
                            {getTypeLabel(res.type)}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {formatRelativeTime(res.createdAt || res.created_at)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">
                          {res.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                        <span className="truncate">{res.authorName || "Étudiant"}</span>
                        <span className="font-medium text-foreground">Consulter</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── 4. RESULTS VIEW ─── */}
        {hasActiveQuery && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Empty State */}
            {hasEmptyResults && (
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="h-14 w-14 rounded-2xl bg-muted/60 border border-border/40 flex items-center justify-center mx-auto text-muted-foreground">
                  <Search className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    Aucun résultat pour « {debouncedSearchTerm} »
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Vérifiez l'orthographe de vos termes ou essayez un mot-clé plus générique (matière, université, nom).
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  {SUGGESTED_SEARCHES.slice(0, 4).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSelectSuggestedSearch(item)}
                      className="px-3 py-1 rounded-full border border-border/40 bg-card hover:bg-muted/40 text-xs font-medium transition-colors cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: TOUT */}
            {activeTab === "all" && !hasEmptyResults && (
              <div className="space-y-8">
                {/* 1. PUBLICATIONS */}
                {sortedResults.posts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <h3 className="text-sm font-bold text-foreground">
                        Publications ({sortedResults.posts.length})
                      </h3>
                      {sortedResults.posts.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("posts")}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Voir tout
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {sortedResults.posts.slice(0, 3).map((post) => (
                        <div
                          key={post.id}
                          onClick={() => navigate(`/posts/${post.id}`)}
                          className="group flex items-start justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-muted/30 hover:border-border transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                              <AvatarImage src={post.authorAvatar || undefined} />
                              <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                                {post.authorName?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:underline">
                                  {post.authorName}
                                </span>
                                {post.isVerified && (
                                  <BadgeCheck className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                                )}
                                <span className="text-xs text-muted-foreground/50">·</span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {post.createdAt ? formatRelativeTime(post.createdAt) : "Récemment"}
                                </span>
                                {post.category && post.category.toLowerCase() !== "général" && post.category.toLowerCase() !== "general" && (
                                  <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0">
                                    {post.category}
                                  </span>
                                )}
                                {post.subject && (
                                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                                    {post.subject}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs sm:text-sm text-foreground/90 line-clamp-2 leading-relaxed">
                                {post.content}
                              </p>

                              <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1 font-medium">
                                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                                  {post.impactScore}
                                </span>
                                {post.commentsCount != null && (
                                  <span className="inline-flex items-center gap-1 font-medium">
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    {post.commentsCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {post.thumbnail && (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted border border-border/30 shrink-0 ml-2">
                              <img
                                src={post.thumbnail}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. ÉVÉNEMENTS */}
                {sortedResults.events.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <h3 className="text-sm font-bold text-foreground">
                        Événements ({sortedResults.events.length})
                      </h3>
                      {sortedResults.events.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("events")}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Voir tout
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedResults.events.slice(0, 3).map((evt) => {
                        const startDate = evt.startDate ? new Date(evt.startDate) : new Date();
                        const day = !isNaN(startDate.getTime()) ? startDate.getDate() : 1;
                        const month = !isNaN(startDate.getTime())
                          ? startDate.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()
                          : "EVT";

                        return (
                          <div
                            key={evt.id}
                            onClick={() => navigate(`/events/${evt.id}`)}
                            className="p-4 rounded-2xl border border-border/40 bg-card hover:border-border transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex flex-col items-center justify-center h-9 w-9 rounded-xl bg-muted border border-border/40 shrink-0">
                                    <span className="text-xs font-bold text-foreground leading-none">{day}</span>
                                    <span className="text-[9px] font-semibold text-muted-foreground uppercase leading-none mt-0.5">{month}</span>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium text-muted-foreground">
                                    {evt.category || "Événement"}
                                  </Badge>
                                </div>
                                <span className="text-[11px] text-muted-foreground truncate">
                                  {evt.isOnline ? "En ligne" : (evt.location || "Campus")}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">
                                  {evt.title}
                                </h4>
                                {evt.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                    {evt.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                <span>{evt.attendeeCount} participant{evt.attendeeCount > 1 ? "s" : ""}</span>
                              </span>
                              <span className="font-medium text-foreground">Voir l'événement</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. PERSONNES (Grid 2 colonnes sur PC) */}
                {sortedResults.users.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <h3 className="text-sm font-bold text-foreground">
                        Personnes ({sortedResults.users.length})
                      </h3>
                      {sortedResults.users.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("users")}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Voir tout
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sortedResults.users.slice(0, 4).map((user) => (
                        <div
                          key={user.id}
                          className="p-3.5 rounded-2xl border border-border/40 bg-card hover:border-border transition-all flex items-center justify-between gap-3"
                        >
                          <div
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            onClick={() => navigate(`/profile/${user.username}`)}
                          >
                            <Avatar className="h-11 w-11 rounded-full shrink-0 border border-border/40">
                              <AvatarImage src={user.avatar} className="object-cover" />
                              <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                                {user.name?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-sm text-foreground truncate hover:underline">
                                  {user.name}
                                </span>
                                {user.isVerified && (
                                  <BadgeCheck className="h-4 w-4 text-amber-500 fill-amber-500/20 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {user.bio || [user.faculty, user.university].filter(Boolean).join(" • ") || "Étudiant CampusSphere"}
                              </p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFollowUser(user.id, user.name)}
                            disabled={followLoadingUserId === user.id || !currentUserId}
                            className={cn(
                              "h-8 px-3 text-xs shrink-0 rounded-xl transition-colors font-medium shadow-none",
                              !followedUsers.has(user.id)
                                ? "bg-primary/15 text-primary hover:bg-primary/25 border-primary/30"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {followedUsers.has(user.id) ? "Retirer" : "Connecter"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. SPHÈRES (Grid 3 colonnes sur PC) */}
                {sortedResults.spheres.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <h3 className="text-sm font-bold text-foreground">
                        Sphères collaboratives ({sortedResults.spheres.length})
                      </h3>
                      {sortedResults.spheres.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("spheres")}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Voir tout
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedResults.spheres.slice(0, 3).map((sphere) => (
                        <div
                          key={sphere.id}
                          onClick={() => navigate(`/spheres/${sphere.id}`)}
                          className="p-4 rounded-2xl border border-border/40 bg-card hover:border-border transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <Avatar className="h-10 w-10 rounded-xl border border-border/40">
                                <AvatarImage src={sphere.avatar || undefined} />
                                <AvatarFallback className="rounded-xl font-bold text-xs bg-muted text-muted-foreground">
                                  {sphere.name?.[0]?.toUpperCase() || "S"}
                                </AvatarFallback>
                              </Avatar>
                              {sphere.category && (
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-normal">
                                  {getSphereCategoryLabel(String(sphere.category).trim().toLowerCase()) || sphere.category}
                                </Badge>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-foreground truncate">{sphere.name}</h4>
                              {sphere.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                                  {sphere.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              <span>{sphere.memberCount} membre{sphere.memberCount > 1 ? "s" : ""}</span>
                            </span>
                            <span className="font-medium text-foreground">Visiter</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. RESSOURCES (Grid 3 colonnes sur PC) */}
                {sortedResults.resources.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <h3 className="text-sm font-bold text-foreground">
                        Ressources ({sortedResults.resources.length})
                      </h3>
                      {sortedResults.resources.length > 6 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("resources")}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Voir tout
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedResults.resources.slice(0, 6).map((res) => (
                        <div
                          key={res.id}
                          onClick={() => navigate(`/resources/${res.id}`)}
                          className="p-4 rounded-2xl border border-border/40 bg-card hover:border-border transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
                                {getTypeLabel(res.type)}
                              </Badge>
                              {res.category && (
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                                  {getCategoryLabel(res.category)}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug hover:underline">
                              {res.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                            <span className="truncate">{res.authorName}</span>
                            <span className="font-medium text-foreground">Consulter</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PUBLICATIONS (comme dans Saved) */}
            {activeTab === "posts" && !hasEmptyResults && (
              <div className="space-y-3">
                {sortedResults.posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/posts/${post.id}`)}
                    className="group flex items-start justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-muted/30 hover:border-border transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                        <AvatarImage src={post.authorAvatar || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                          {post.authorName?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:underline">
                            {post.authorName}
                          </span>
                          {post.isVerified && (
                            <BadgeCheck className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                          )}
                          <span className="text-xs text-muted-foreground/50">·</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {post.createdAt ? formatRelativeTime(post.createdAt) : "Récemment"}
                          </span>
                          {post.category && post.category.toLowerCase() !== "général" && post.category.toLowerCase() !== "general" && (
                            <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0">
                              {post.category}
                            </span>
                          )}
                          {post.subject && (
                            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                              {post.subject}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-foreground/90 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                            {post.impactScore}
                          </span>
                          {post.commentsCount != null && (
                            <span className="inline-flex items-center gap-1 font-medium">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {post.commentsCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {post.thumbnail && (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted border border-border/30 shrink-0 ml-2">
                        <img
                          src={post.thumbnail}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB: ÉVÉNEMENTS */}
            {activeTab === "events" && !hasEmptyResults && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedResults.events.map((evt) => {
                  const startDate = evt.startDate ? new Date(evt.startDate) : new Date();
                  const day = !isNaN(startDate.getTime()) ? startDate.getDate() : 1;
                  const month = !isNaN(startDate.getTime())
                    ? startDate.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()
                    : "EVT";

                  return (
                    <div
                      key={evt.id}
                      onClick={() => navigate(`/events/${evt.id}`)}
                      className="p-4 rounded-2xl border border-border/40 bg-card hover:border-border transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex flex-col items-center justify-center h-9 w-9 rounded-xl bg-muted border border-border/40 shrink-0">
                              <span className="text-xs font-bold text-foreground leading-none">{day}</span>
                              <span className="text-[9px] font-semibold text-muted-foreground uppercase leading-none mt-0.5">{month}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium text-muted-foreground">
                              {evt.category || "Événement"}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {evt.isOnline ? "En ligne" : (evt.location || "Campus")}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">
                            {evt.title}
                          </h4>
                          {evt.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                              {evt.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{evt.attendeeCount} participant{evt.attendeeCount > 1 ? "s" : ""}</span>
                        </span>
                        <span className="font-medium text-foreground">Voir l'événement</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB: PERSONNES */}
            {activeTab === "users" && !hasEmptyResults && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {sortedResults.users.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-2xl border border-border/40 bg-card hover:border-border transition-all flex items-center justify-between gap-3"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => navigate(`/profile/${user.username}`)}
                    >
                      <Avatar className="h-11 w-11 rounded-full shrink-0 border border-border/40">
                        <AvatarImage src={user.avatar} className="object-cover" />
                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground truncate hover:underline">
                            {user.name}
                          </span>
                          {user.isVerified && (
                            <BadgeCheck className="h-4 w-4 text-amber-500 fill-amber-500/20 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {user.bio || [user.faculty, user.university].filter(Boolean).join(" • ") || "Étudiant CampusSphere"}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFollowUser(user.id, user.name)}
                      disabled={followLoadingUserId === user.id || !currentUserId}
                      className={cn(
                        "h-8 px-3 text-xs shrink-0 rounded-xl transition-colors font-medium shadow-none",
                        !followedUsers.has(user.id)
                          ? "bg-primary/15 text-primary hover:bg-primary/25 border-primary/30"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {followedUsers.has(user.id) ? "Retirer" : "Connecter"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: RESSOURCES */}
            {activeTab === "resources" && !hasEmptyResults && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedResults.resources.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => navigate(`/resources/${res.id}`)}
                    className="p-4 rounded-2xl border border-border/40 bg-card hover:border-border transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
                          {getTypeLabel(res.type)}
                        </Badge>
                        {res.category && (
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                            {getCategoryLabel(res.category)}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug hover:underline">
                        {res.title}
                      </h4>
                      {res.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {res.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                      <span className="truncate">{res.authorName}</span>
                      <span className="font-medium text-foreground">Consulter</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: SPHÈRES */}
            {activeTab === "spheres" && !hasEmptyResults && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedResults.spheres.map((sphere) => (
                  <div
                    key={sphere.id}
                    onClick={() => navigate(`/spheres/${sphere.id}`)}
                    className="p-4 rounded-2xl border border-border/40 bg-card hover:border-border transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Avatar className="h-10 w-10 rounded-xl border border-border/40">
                          <AvatarImage src={sphere.avatar || undefined} />
                          <AvatarFallback className="rounded-xl font-bold text-xs bg-muted text-muted-foreground">
                            {sphere.name?.[0]?.toUpperCase() || "S"}
                          </AvatarFallback>
                        </Avatar>
                        {sphere.category && (
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-normal">
                            {getSphereCategoryLabel(String(sphere.category).trim().toLowerCase()) || sphere.category}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground truncate">{sphere.name}</h4>
                        {sphere.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {sphere.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{sphere.memberCount} membre{sphere.memberCount > 1 ? "s" : ""}</span>
                      </span>
                      <span className="font-medium text-foreground">Visiter</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
