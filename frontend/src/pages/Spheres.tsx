import { Suspense, lazy, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listSpheres, joinSphere, getUserSpheres, leaveSphere } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SPHERE_CATEGORY_OPTIONS, getSphereCategoryLabel, SPHERE_AUDIENCE_OPTIONS } from "@/constants/sphereCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { UnifiedSearchFiltersBar } from "@/components/ui/unified-search-filters-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Search, Users, TrendingUp, Clock, Loader2, Check, RefreshCw, Plus, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openVerificationModal } from "@/lib/events";
import { SphereCard } from "@/components/sphere/SphereCard";
import { EmptyState } from "@/components/ui/empty-state";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SORT,
  SPHERE_SORT_KEYS,
  type SphereSortKey,
  ensureValidSortKey,
} from "@/constants/defaultSort";
import { SphereSkeleton } from "@/components/ui/skeletons";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const CreateSphereModal = lazy(() => import("@/components/modals/CreateSphereModal").then((module) => ({ default: module.CreateSphereModal })));

export function Spheres() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isCreateSphereOpen, setIsCreateSphereOpen] = useState(false);

  const [userJoinedSpheres, setUserJoinedSpheres] = useState<string[]>([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState<string[]>([]);
  const [userSpheres, setUserSpheres] = useState<any[]>([]);
  const [userSpheresLoadError, setUserSpheresLoadError] = useState<string | null>(null);
  const [allSpheres, setAllSpheres] = useState<any[]>([]);
  const [loadingSpheres, setLoadingSpheres] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const spheresQuery = useQuery({
    queryKey: ["spheres"],
    queryFn: listSpheres,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const userSpheresQuery = useQuery({
    queryKey: ["user-spheres"],
    queryFn: getUserSpheres,
    enabled: Boolean(currentUser?.id),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Tab State - Initialized to page1
  const [activeTab, setActiveTab] = useState("page1");
  const debugApiError = (endpoint: string, error: unknown) => {
    const safeMsg = String(
      (error as any)?.message ?? (error as any)?.detail ?? error ?? ""
    ).replace(/[\r\n\t]/g, " ").slice(0, 200);
    console.debug(`[Spheres] API error (${endpoint}): ${safeMsg}`);
  };

  useEffect(() => {
    if (userSpheresQuery.data) {
      const userSpheresData = userSpheresQuery.data;
      const sphereIds = (userSpheresData || []).map((s: any) => String(s.id));
      setUserJoinedSpheres(sphereIds);
      setUserSpheres(userSpheresData || []);
      setUserSpheresLoadError(null);
    }
  }, [userSpheresQuery.data]);

  useEffect(() => {
    if (spheresQuery.data) {
      setAllSpheres(spheresQuery.data || []);
      setLoadError(null);
    }
    if (spheresQuery.error) {
      setLoadError((spheresQuery.error as any)?.message || "Erreur de chargement");
    }
  }, [spheresQuery.data, spheresQuery.error]);

  const isSpheresLoading = isAuthLoading || userSpheresQuery.isLoading || spheresQuery.isLoading;

  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);

  const refreshMembershipState = async () => {
    const [spheresResult, userSpheresResult] = await Promise.all([
      spheresQuery.refetch(),
      userSpheresQuery.refetch()
    ]);
    const spheresData = spheresResult.data || [];
    setAllSpheres(spheresData);
    const userSpheresData = userSpheresResult.data || [];
    const sphereIds = userSpheresData.map((s: any) => String(s.id));
    setUserJoinedSpheres(sphereIds);
    setPendingJoinRequests([]);
    setUserSpheres(userSpheresData);
    setUserSpheresLoadError(null);
    setLoadError(null);
  };

  const resolveJoinConflict = (error: unknown): "already_active" | "already_pending" | null => {
    const rawMessage =
      (error as any)?.response?.data?.detail ??
      (error as any)?.response?.data?.message ??
      (error as any)?.message ??
      "";

    let parsedPayload: any = null;
    if (typeof rawMessage === "string") {
      try {
        parsedPayload = JSON.parse(rawMessage);
      } catch {
        parsedPayload = null;
      }
    }

    const normalizedMessage = [
      rawMessage,
      parsedPayload?.detail,
      parsedPayload?.message,
      parsedPayload?.error,
      parsedPayload?.status,
      parsedPayload?.data?.status,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
      .join(" ");

    if (normalizedMessage.includes("already active")) return "already_active";
    if (normalizedMessage.includes("already pending")) return "already_pending";
    return null;
  };

  const filteredSpheres = allSpheres.filter(sphere => {
    const matchesSearch = sphere.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sphere.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesCategory = filterCategory === "all" || sphere.category === filterCategory;
    const matchesAudience = filterAudience === "all" || sphere.target_audience === filterAudience;
    return matchesSearch && matchesCategory && matchesAudience;
  });

  const resolvedSphereSort = ensureValidSortKey(activeTab, SPHERE_SORT_KEYS, DEFAULT_SORT.spheres);

  const getUnifiedMembershipState = (sphere: any): "active" | "pending" | "none" => {
    const sphereId = String(sphere?.id);
    // normalizeSphere() dans api.ts convertit is_member -> isMember et membership_status -> membershipStatus
    const membershipStatus = String(
      sphere?.membership_status ?? sphere?.membershipStatus ?? ""
    ).toLowerCase();
    const isCreator = currentUser?.id && (
      String(sphere?.created_by) === String(currentUser.id) ||
      String(sphere?.createdBy) === String(currentUser.id)
    );
    // Vérifier les deux formes (snake_case depuis API brute, camelCase après normalisation)
    const isMemberFromApi =
      sphere?.is_member === true ||
      sphere?.isMember === true ||
      membershipStatus === "active";
    const isPendingFromApi = membershipStatus === "pending";
    const isMemberFromLocal = userJoinedSpheres.includes(sphereId);
    const isPendingFromLocal = pendingJoinRequests.includes(sphereId);

    if (isCreator || isMemberFromApi || isMemberFromLocal) return "active";
    if (isPendingFromApi || isPendingFromLocal) return "pending";
    return "none";
  };

  const getSphereActionModel = (sphere: any) => {
    const membership = getUnifiedMembershipState(sphere);
    const sphereId = String(sphere?.id);
    const disabled = isSpheresLoading || isJoining === sphereId;

    if (membership === "active") {
      return {
        label: "Rejoint",
        className: "bg-green-500 hover:bg-green-600 text-white",
        disabled: true,
        icon: <Check className="h-3 w-3 mr-1" />,
        onClick: () => undefined,
      };
    }

    if (membership === "pending") {
      return {
        label: "En attente",
        className: "bg-amber-500 hover:bg-amber-600 text-white",
        disabled: true,
        icon: <Clock className="h-3 w-3 mr-1" />,
        onClick: () => undefined,
      };
    }

    return {
      label: "Rejoindre",
      className: "campus-gradient text-white",
      disabled,
      icon: null,
      onClick: () => handleJoinSphere(sphere.id, sphere.name),
    };
  };

  /**
   * Formule de classement Top Sphères (transparente) :
   *   score = (membres / maxMembres) × 0.5 + (progression / 100) × 0.5
   *
   * Poids : 50% popularité (membres), 50% avancement (progression)
   * Quand l'API fournira les posts récents, le poids activité sera ajouté.
   */
  const getSortedSpheres = (): any[] => {
    const sorted = [...filteredSpheres];
    switch (resolvedSphereSort) {
      case "top": {
        const maxMembers = Math.max(1, ...sorted.map((s: any) => Number(s.memberCount) || 0));
        const score = (s: any) => {
          const members  = (Number(s.memberCount)  || 0) / maxMembers;        // 0–1
          const progress = Math.min(100, Number(s.progression) || 0) / 100;   // 0–1
          return members * 0.5 + progress * 0.5;
        };
        return sorted.sort((a: any, b: any) => score(b) - score(a));
      }
      case "mySpheres":
        return sorted.filter((sphere: any) => getUnifiedMembershipState(sphere) === "active");
      case "discover":
      default:
        return sorted;
    }
  };

  const handleJoinSphere = async (sphereId: string, sphereName: string) => {
    if (!currentUser) return;
    
    if (!currentUser.isVerified) {
      toast({
        title: "Compte non certifié",
        description: "Vous devez être certifié pour rejoindre une sphère.",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>Vérifier</Button>
        )
      });
      return;
    }

    const currentSphere = allSpheres.find((sphere) => String(sphere.id) === String(sphereId));
    if (currentSphere && String(currentSphere.created_by) === String(currentUser.id)) {
      return;
    }
    setIsJoining(sphereId);
    try {
      const result = await joinSphere(sphereId);
      if (result?.data?.status === 'pending') {
        setPendingJoinRequests((prev) => (prev.includes(sphereId) ? prev : [...prev, sphereId]));
        setUserJoinedSpheres((prev) => prev.filter((id) => String(id) !== String(sphereId)));
        toast({ title: "Demande envoyée !", description: `Attente d'approbation pour ${sphereName}` });
      } else {
        toast({ title: "Sphère rejoint !", description: `Succès pour ${sphereName}` });
        setUserJoinedSpheres(prev => [...prev, sphereId]);
        setPendingJoinRequests((prev) => prev.filter((id) => String(id) !== String(sphereId)));
        const joinedSphere = allSpheres.find((sphere) => String(sphere.id) === String(sphereId));
        if (joinedSphere) {
          setUserSpheres((prev) => [joinedSphere, ...prev.filter((sphere) => String(sphere.id) !== String(sphereId))]);
        }
      }
    } catch (e: any) {
      debugApiError(`POST /spheres/${sphereId}/join`, e);
      const joinConflict = resolveJoinConflict(e);
      if (joinConflict === "already_active" || joinConflict === "already_pending") {
        try {
          await refreshMembershipState();
        } catch (refreshError: any) {
          debugApiError("GET /spheres + GET /users/me/spheres (join conflict refresh)", refreshError);
        }
      } else {
        toast({ title: "Erreur", description: e?.message, variant: "destructive" });
      }
    } finally {
      setIsJoining(null);
    }
  };

  const handleLeaveSphere = async (sphereId: string, sphereName: string) => {
    try {
      await leaveSphere(sphereId);
      toast({ title: "Sphère quittée", description: `Vous avez quitté "${sphereName}"` });
      setUserJoinedSpheres((prev) => prev.filter((id) => String(id) !== String(sphereId)));
      setPendingJoinRequests((prev) => prev.filter((id) => String(id) !== String(sphereId)));
      setUserSpheres((prev) => prev.filter((sphere) => String(sphere.id) !== String(sphereId)));
    } catch (e: any) {
      debugApiError(`POST /spheres/${sphereId}/leave`, e);
      toast({ title: "Erreur", description: e?.message || "Impossible de quitter la sphère", variant: "destructive" });
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshMembershipState();
    } catch (e: any) {
      debugApiError("GET /spheres + GET /users/me/spheres", e);
      toast({ title: "Erreur", description: e?.message || "Impossible d'actualiser", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSphereCreated = (sphere: any) => {
    if (!sphere) return;
    setAllSpheres((prev) => [sphere, ...prev.filter((item) => String(item.id) !== String(sphere.id))]);
    setUserJoinedSpheres((prev) =>
      prev.includes(String(sphere.id)) ? prev : [String(sphere.id), ...prev]
    );
    setPendingJoinRequests((prev) => prev.filter((id) => String(id) !== String(sphere.id)));
    setUserSpheres((prev) => [sphere, ...prev.filter((item) => String(item.id) !== String(sphere.id))]);
  };

  const categories = [
    ...SPHERE_CATEGORY_OPTIONS,
    ...Array.from(new Set(allSpheres.map(s => s.category))).
      filter((cat) => cat && !SPHERE_CATEGORY_OPTIONS.some(option => option.value === cat)).
      map((cat) => ({ value: cat, label: getSphereCategoryLabel(cat) }))
  ];


  const cardClasses = cn(
    "transition-all duration-200",
    isMobile ? "rounded-none border-x-0 border-t-0 shadow-none bg-card" : "cs-card"
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-6xl mx-auto py-4 md:py-5 px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 campus-animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground">Sphères Collaboratives</h1>
            <p className="text-muted-foreground mt-2">Rejoignez des projets, apprenez ensemble et créez l'impact</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="hidden sm:inline">Actualiser</span>

            </Button>
            {currentUser?.isVerified ? (
              <>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full sm:w-auto" onClick={() => setIsCreateSphereOpen(true)}>
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Créer</span>
                </Button>
                {isCreateSphereOpen && (
                  <Suspense fallback={<ModalLoadingFallback />}>
                    <CreateSphereModal
                      open={isCreateSphereOpen}
                      onOpenChange={setIsCreateSphereOpen}
                      onSphereCreated={handleSphereCreated}
                    />
                  </Suspense>
                )}
              </>
            ) : (
              <Button 
                size="sm" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full sm:w-auto"
                onClick={() => {
                  toast({
                    title: "Compte non vérifié",
                    description: "Vérifiez votre compte pour créer des sphères.",
                    variant: "destructive",
                    action: (
                      <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>Vérifier</Button>
                    )
                  });
                }}
              >
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Créer</span>
              </Button>
            )}
          </div>
        </div>

        <Card className={cn(cardClasses, "mb-6")}>
          <CardContent className="p-3">
            {/* Mobile */}
            <div className="flex gap-2 sm:hidden">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher une sphère..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Button variant="outline" size="icon" onClick={() => setShowMobileFilters((v) => !v)} className={showMobileFilters ? "border-primary text-primary" : ""}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            {showMobileFilters && (
              <div className="flex flex-col gap-2 mt-2 sm:hidden">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterAudience} onValueChange={setFilterAudience}>
                  <SelectTrigger><SelectValue placeholder="Public cible" /></SelectTrigger>
                  <SelectContent>
                    {SPHERE_AUDIENCE_OPTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Desktop */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher une sphère..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterAudience} onValueChange={setFilterAudience}>
                <SelectTrigger><SelectValue placeholder="Public cible" /></SelectTrigger>
                <SelectContent>
                  {SPHERE_AUDIENCE_OPTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs
          value={resolvedSphereSort}
          onValueChange={(value) => setActiveTab(value as SphereSortKey)}
          className="w-full"
        >

          <SharedTabsList containerClassName="mb-6">
            <SharedTabsTrigger value="discover">Découvrir</SharedTabsTrigger>
            <SharedTabsTrigger value="mySpheres">Mes Sphères</SharedTabsTrigger>
            <SharedTabsTrigger value="top">Top</SharedTabsTrigger>
          </SharedTabsList>

          {/* Section 1: Pilot Training */}
          <TabsContent value="discover" className="mt-0">
            <section id="discover" className="space-y-4">
              {loadError ? (
                <Card className={cardClasses}>
                  <CardContent className="py-8 text-center space-y-3">
                    <p className="text-sm text-destructive">{loadError}</p>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="gap-2">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              ) : !isSpheresLoading && getSortedSpheres().length === 0 ? (
                <EmptyState
                  icon={Globe}
                  title="Aucune sphère trouvée"
                  description="Essayez d'ajuster vos filtres pour trouver ce que vous cherchez."
                  actionLabel="Tout réinitialiser"
                  onAction={() => {
                    setSearchQuery("");
                    setFilterCategory("all");
                    setFilterAudience("all");
                  }}
                />
              ) : (
              <div className={cn(
                isMobile
                  ? "cs-scroll-row gap-3"
                  : "grid gap-3 grid-cols-2 lg:grid-cols-4"
              )}>
                {isSpheresLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={isMobile ? "cs-scroll-item w-[200px]" : ""}>
                      <SphereSkeleton />
                    </div>
                  ))
                ) : (
                  getSortedSpheres().map((sphere) => (
                    <div key={sphere.id} className={isMobile ? "cs-scroll-item w-[200px]" : ""}>
                      <SphereCard
                        sphere={sphere}
                        membership={getUnifiedMembershipState(sphere)}
                        isJoining={isJoining === String(sphere.id)}
                        onJoin={() => handleJoinSphere(sphere.id, sphere.name)}
                      />
                    </div>
                  ))
                )}
              </div>
              )}
            </section>
          </TabsContent>

          {/* Section 2: Titan maintenance */}
          <TabsContent value="mySpheres" className="mt-0">
            <section id="mySpheres" className="space-y-4">
              {userSpheresLoadError ? (
                <Card className={cardClasses}>
                  <CardContent className="py-8 text-center space-y-3">
                    <p className="text-sm text-destructive">{userSpheresLoadError}</p>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="gap-2">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Réessayer
                    </Button>
                  </CardContent>
                </Card>
              ) : isSpheresLoading ? (
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                  <SphereSkeleton />
                  <SphereSkeleton />
                  <SphereSkeleton />
                  <SphereSkeleton />
                </div>
              ) : getSortedSpheres().length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Vous n'avez rejoint aucune sphère pour le moment.</p>
                </div>
              ) : (
              <div className={cn(
                isMobile
                  ? "cs-scroll-row gap-3"
                  : "grid gap-3 grid-cols-2 lg:grid-cols-4"
              )}>
                {getSortedSpheres().map((sphere) => (
                  <div key={sphere.id} className={isMobile ? "cs-scroll-item w-[200px]" : ""}>
                    <SphereCard
                      sphere={sphere}
                      membership={getUnifiedMembershipState(sphere)}
                      isJoining={isJoining === String(sphere.id)}
                      onJoin={() => handleJoinSphere(sphere.id, sphere.name)}
                    />
                  </div>
                ))}
              </div>
              )}
            </section>
          </TabsContent>

          {/* Section 3: Loadout */}
          <TabsContent value="top" className="mt-0">
            <section id="top" className="space-y-4">
              <Card className={cardClasses}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-primary" /> Top Sphères du mois
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  {getSortedSpheres().slice(0, 5).map((sphere, index) => {
                    const membership = getUnifiedMembershipState(sphere);
                    const actionModel = getSphereActionModel(sphere);
                    const progress = Math.max(0, Math.min(100, Number(sphere.progression || 0)));
                    const rankColors = [
                      "bg-amber-400 text-white",
                      "bg-slate-400 text-white",
                      "bg-orange-400 text-white",
                      "bg-muted text-muted-foreground",
                      "bg-muted text-muted-foreground",
                    ];
                    return (
                      <div
                        key={sphere.id}
                        className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                        onClick={() => navigate(`/spheres/${sphere.id}`)}
                      >
                        {/* Rank */}
                        <span className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[11px] font-bold ${rankColors[index] ?? rankColors[3]}`}>
                          {index + 1}
                        </span>

                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${sphere.color || "from-primary/30 to-accent/30"} flex items-center justify-center text-white font-bold text-[10px] sm:text-sm`}>
                          {sphere.name?.charAt(0) || "?"}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 px-0.5">
                          <p className="font-semibold text-[11px] sm:text-sm truncate group-hover:text-primary transition-colors">
                            {sphere.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="flex-1 h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[8px] sm:text-[10px] text-muted-foreground flex-shrink-0 flex items-center gap-0.5">
                              <Users className="h-2 w-2 sm:h-2.5 sm:w-2.5" />{sphere.memberCount}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        <Button
                          size="sm"
                          className={`flex-shrink-0 h-6 sm:h-7 text-[9px] sm:text-xs px-1.5 sm:px-2.5 ${membership === "active" ? "campus-gradient text-white hover:opacity-90" : actionModel.className}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            membership === "active" ? navigate(`/spheres/${sphere.id}`) : actionModel.onClick();
                          }}
                          disabled={actionModel.disabled}
                        >
                          {isJoining === String(sphere.id)
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : membership === "active" ? "Voir" : actionModel.label
                          }
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
