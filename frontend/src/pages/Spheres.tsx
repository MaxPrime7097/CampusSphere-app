import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listSpheres, getCurrentUser, joinSphere, getUserSpheres, leaveSphere } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SPHERE_CATEGORY_OPTIONS, getSphereCategoryLabel, SPHERE_AUDIENCE_OPTIONS } from "@/constants/sphereCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { UnifiedSearchFiltersBar } from "@/components/ui/unified-search-filters-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, TrendingUp, Clock, Loader2, Check, RefreshCw, Plus, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateSphereModal } from "@/components/modals/CreateSphereModal";
import { SphereCard } from "@/components/sphere/SphereCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SORT,
  SPHERE_SORT_KEYS,
  type SphereSortKey,
  ensureValidSortKey,
} from "@/constants/defaultSort";
import { SphereSkeleton } from "@/components/ui/skeletons";

export function Spheres() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userJoinedSpheres, setUserJoinedSpheres] = useState<string[]>([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState<string[]>([]);
  const [userSpheres, setUserSpheres] = useState<any[]>([]);
  const [userSpheresLoadError, setUserSpheresLoadError] = useState<string | null>(null);
  const [allSpheres, setAllSpheres] = useState<any[]>([]);
  const [loadingSpheres, setLoadingSpheres] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Tab State - Initialized to page1
  const [activeTab, setActiveTab] = useState("page1");
  const debugApiError = (endpoint: string, error: unknown) => {
    const safeMsg = String(
      (error as any)?.message ?? (error as any)?.detail ?? error ?? ""
    ).replace(/[\r\n\t]/g, " ").slice(0, 200);
    console.debug(`[Spheres] API error (${endpoint}): ${safeMsg}`);
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingSpheres(true);
        setLoadError(null);
        // Charger tout en parallèle pour éviter la race condition
        const [userData, spheresData, userSpheresData] = await Promise.allSettled([
          getCurrentUser(),
          listSpheres(),
          getUserSpheres(),
        ]);

        if (!isMounted) return;

        if (userData.status === "fulfilled") setCurrentUser(userData.value);
        else debugApiError("GET /users/me", userData.reason);

        if (spheresData.status === "fulfilled") {
          setAllSpheres(spheresData.value || []);
        } else {
          debugApiError("GET /spheres", spheresData.reason);
          setLoadError(spheresData.reason?.message || "Erreur de chargement");
        }

        if (userSpheresData.status === "fulfilled" && userSpheresData.value) {
          const sphereIds = (userSpheresData.value || []).map((s: any) => String(s.id));
          setUserJoinedSpheres(sphereIds);
          setUserSpheres(userSpheresData.value || []);
          setUserSpheresLoadError(null);

          // Extraire les pending depuis allSpheres (is_member=false + membership_status=pending)
          if (spheresData.status === "fulfilled") {
            const pendingIds = (spheresData.value || [])
              .filter((s: any) => {
                const st = String(s?.membership_status ?? s?.membershipStatus ?? "").toLowerCase();
                return st === "pending";
              })
              .map((s: any) => String(s.id));
            if (pendingIds.length > 0) setPendingJoinRequests(pendingIds);
          }
        } else if (userSpheresData.status === "rejected") {
          debugApiError("GET /users/me/spheres", userSpheresData.reason);
          setUserSpheresLoadError(userSpheresData.reason?.message || "Impossible de charger vos sphères.");
        }
      } finally {
        if (isMounted) setLoadingSpheres(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);

  const refreshMembershipState = async () => {
    const [spheresData, userSpheresData] = await Promise.all([listSpheres(), getUserSpheres()]);
    setAllSpheres(spheresData || []);
    const sphereIds = (userSpheresData || []).map((s: any) => String(s.id));
    setUserJoinedSpheres(sphereIds);
    setPendingJoinRequests([]);
    setUserSpheres(userSpheresData || []);
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
    const disabled = loadingSpheres || isJoining === sphereId;

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

  const getSortedSpheres = (): any[] => {
    const sorted = [...filteredSpheres];
    switch (resolvedSphereSort) {
      case "top":
        return sorted.sort((a: any, b: any) => (b.progression || 0) - (a.progression || 0));
      case "mySpheres":
        return sorted.filter((sphere: any) => getUnifiedMembershipState(sphere) === "active");
      case "discover":
      default:
        return sorted;
    }
  };

  const handleJoinSphere = async (sphereId: string, sphereName: string) => {
    if (!currentUser) return;
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
    "transition-all duration-300",
    isMobile ? "rounded-none border-x-0 border-t-0 shadow-none bg-card" : "campus-card hover:campus-glow"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="w-full max-w-6xl mx-auto py-4 md:py-6 px-0">
        {/* Header */}
        <div className="flex flex-col px-4 sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 campus-animate-fade-in px-0">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground">Sphères Collaboratives</h1>
            <p className="text-muted-foreground mt-2">Rejoignez des projets, apprenez ensemble et créez l'impact</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Actualiser
            </Button>
            <CreateSphereModal onSphereCreated={handleSphereCreated}>
              <Button size="sm" className="campus-gradient text-white hover:opacity-90 gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" /> <span>Créer</span>
              </Button>
            </CreateSphereModal>
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
              ) : !loadingSpheres && getSortedSpheres().length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune sphère à découvrir pour le moment.</p>
                </div>
              ) : (
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {loadingSpheres ? (
                  <>
                    <SphereSkeleton />
                    <SphereSkeleton />
                    <SphereSkeleton />
                    <SphereSkeleton />
                  </>
                ) : (
                  getSortedSpheres().map((sphere) => (
                    <SphereCard
                      key={sphere.id}
                      sphere={sphere}
                      membership={getUnifiedMembershipState(sphere)}
                      isJoining={isJoining === String(sphere.id)}
                      onJoin={() => handleJoinSphere(sphere.id, sphere.name)}
                    />
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
              ) : loadingSpheres ? (
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
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {getSortedSpheres().map((sphere) => (
                  <SphereCard
                    key={sphere.id}
                    sphere={sphere}
                    membership={getUnifiedMembershipState(sphere)}
                    isJoining={isJoining === String(sphere.id)}
                    onJoin={() => handleJoinSphere(sphere.id, sphere.name)}
                  />
                ))}
              </div>
              )}
            </section>
          </TabsContent>

          {/* Section 3: Loadout */}
          <TabsContent value="top" className="mt-0">
            <section id="top" className="space-y-4">
              <Card className={cardClasses}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Top Sphères du mois</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getSortedSpheres().slice(0, 5).map((sphere, index) => (
                        <Card key={sphere.id} className={cardClasses} onClick={() => navigate(`/spheres/${sphere.id}`)}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${sphere.color || "from-primary/20 to-accent/20"} flex items-center justify-center text-white font-bold text-sm`}>#{index + 1}</div>
                              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${sphere.color || "from-primary/20 to-accent/20"} flex items-center justify-center text-white font-bold`}>{sphere.name?.charAt(0) || ""}</div>
                              <div className="flex-1">
                                <p className="font-semibold">{sphere.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{sphere.memberCount} membres</p>
                              </div>
                              <div className="text-right">
                                <div className="text-primary font-bold">{Math.max(0, Math.min(100, Number(sphere.progression || 0)))}%</div>
                                <Badge variant="secondary" className="text-xs mt-1">{sphere.category}</Badge>
                              </div>
                            </div>
                            <div className="mt-3">
                              {(() => {
                                const membership = getUnifiedMembershipState(sphere);
                                const actionModel = getSphereActionModel(sphere);
                                return membership === "active" ? (
                                  <Button
                                    size="sm"
                                    className="w-full h-7 text-xs campus-gradient text-white hover:opacity-90"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/spheres/${sphere.id}`);
                                    }}
                                  >
                                    Accéder
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className={`w-full h-7 text-xs ${actionModel.className}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      actionModel.onClick();
                                    }}
                                    disabled={actionModel.disabled}
                                  >
                                    {isJoining === String(sphere.id)
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <>{actionModel.icon}{actionModel.label}</>}
                                  </Button>
                                );
                              })()}
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
