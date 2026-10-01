import { Suspense, lazy, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listSpheres, joinSphere, getUserSpheres, leaveSphere } from "@/services/api";
import { SPHERE_AUDIENCE_OPTIONS } from "@/constants/sphereCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Globe,
  Search,
  Users,
  TrendingUp,
  Clock,
  Loader2,
  Check,
  RefreshCw,
  Plus,
  X,
  Filter,
  BookOpen,
  FolderGit2,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  LayoutGrid,
  List,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openVerificationModal } from "@/lib/events";
import { SphereCard } from "@/components/sphere/SphereCard";
import { EmptyState } from "@/components/ui/empty-state";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { SphereSkeleton } from "@/components/ui/skeletons";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Sphere } from "@/types";

const CreateSphereModal = lazy(() =>
  import("@/components/modals/CreateSphereModal").then((module) => ({
    default: module.CreateSphereModal,
  }))
);

export const SPHERE_TYPE_CHIPS = [
  { value: "all", label: "Toutes les sphères", icon: Globe },
  { value: "cours", label: "Cours & TD", icon: BookOpen },
  { value: "projet", label: "Projets & Groupes", icon: FolderGit2 },
  { value: "communaute", label: "Communautés", icon: Users },
  { value: "club", label: "Clubs & Assos", icon: Sparkles },
  { value: "revision", label: "Révisions & Examens", icon: GraduationCap },
] as const;

export function Spheres() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAudience, setFilterAudience] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isCreateSphereOpen, setIsCreateSphereOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [userJoinedSpheres, setUserJoinedSpheres] = useState<string[]>([]);
  const [pendingJoinRequests, setPendingJoinRequests] = useState<string[]>([]);
  const [userSpheres, setUserSpheres] = useState<Sphere[]>([]);
  const [userSpheresLoadError, setUserSpheresLoadError] = useState<string | null>(null);
  const [allSpheres, setAllSpheres] = useState<Sphere[]>([]);
  const [loadingSpheres, setLoadingSpheres] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const spheresQuery = useQuery({
    queryKey: ["spheres"],
    queryFn: () => listSpheres(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const userSpheresQuery = useQuery({
    queryKey: ["user-spheres"],
    queryFn: () => getUserSpheres(),
    enabled: Boolean(currentUser?.id),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const debugApiError = (endpoint: string, error: unknown) => {
    const safeMsg = String(
      (error as any)?.message ?? (error as any)?.detail ?? error ?? ""
    )
      .replace(/[\r\n\t]/g, " ")
      .slice(0, 200);
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

  const isSpheresLoading =
    isAuthLoading ||
    ((userSpheresQuery.isLoading || spheresQuery.isLoading) &&
      allSpheres.length === 0 &&
      !spheresQuery.data);

  const refreshMembershipState = async () => {
    const [spheresRes, mySpheresRes] = await Promise.all([
      spheresQuery.refetch(),
      currentUser?.id ? userSpheresQuery.refetch() : Promise.resolve({ data: [] }),
    ]);
    if (spheresRes.data) setAllSpheres(spheresRes.data);
    if (mySpheresRes.data) {
      setUserSpheres(mySpheresRes.data);
      setUserJoinedSpheres((mySpheresRes.data || []).map((s: any) => String(s.id)));
    }
  };

  const filteredSpheres = allSpheres.filter((sphere) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      sphere.name?.toLowerCase().includes(query) ||
      sphere.description?.toLowerCase().includes(query) ||
      sphere.objective?.toLowerCase().includes(query);

    const sphereType = (sphere.sphere_type || sphere.sphereType || "").toLowerCase();
    const matchesType =
      filterType === "all" ||
      sphereType === filterType ||
      (filterType === "cours" && (sphereType === "cours" || sphereType === "revision")) ||
      (filterType === "revision" && (sphereType === "revision" || sphereType === "cours"));

    const matchesAudience =
      filterAudience === "all" ||
      sphere.target_audience === filterAudience ||
      sphere.targetAudience === filterAudience;

    return matchesSearch && matchesType && matchesAudience;
  });

  const getUnifiedMembershipState = (sphere: any): "active" | "pending" | "none" => {
    const sphereId = String(sphere?.id);
    const membershipStatus = String(
      sphere?.membership_status ?? sphere?.membershipStatus ?? ""
    ).toLowerCase();
    const isCreator =
      currentUser?.id &&
      (String(sphere?.created_by) === String(currentUser.id) ||
        String(sphere?.createdBy) === String(currentUser.id));

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

  const handleJoinSphere = async (sphereId: string, sphereName: string) => {
    if (!currentUser) return;

    if (!currentUser.isVerified) {
      toast({
        title: "Compte non certifié",
        description: "Vous devez être certifié pour rejoindre une sphère.",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
            Vérifier
          </Button>
        ),
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
      if (result?.data?.status === "pending") {
        setPendingJoinRequests((prev) => (prev.includes(sphereId) ? prev : [...prev, sphereId]));
        setUserJoinedSpheres((prev) => prev.filter((id) => String(id) !== String(sphereId)));
        toast({ title: "Demande envoyée", description: `Attente d'approbation pour ${sphereName}` });
      } else {
        toast({ title: "Sphère rejointe", description: `Vous avez rejoint ${sphereName}` });
        setUserJoinedSpheres((prev) => [...prev, sphereId]);
        setPendingJoinRequests((prev) => prev.filter((id) => String(id) !== String(sphereId)));
        const joinedSphere = allSpheres.find((sphere) => String(sphere.id) === String(sphereId));
        if (joinedSphere) {
          setUserSpheres((prev) => [
            joinedSphere,
            ...prev.filter((sphere) => String(sphere.id) !== String(sphereId)),
          ]);
        }
      }
    } catch (e: any) {
      debugApiError(`POST /spheres/${sphereId}/join`, e);
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setIsJoining(null);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshMembershipState();
      toast({
        title: "Sphères actualisées",
        description: "La liste des sphères a été mise à jour.",
      });
    } catch (e: any) {
      debugApiError("GET /spheres + GET /users/me/spheres", e);
      toast({ title: "Erreur", description: e?.message || "Impossible d'actualiser", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSphereCreated = (sphere: any) => {
    if (!sphere) return;
    setAllSpheres((prev) => [
      sphere,
      ...prev.filter((item) => String(item.id) !== String(sphere.id)),
    ]);
    setUserJoinedSpheres((prev) =>
      prev.includes(String(sphere.id)) ? prev : [String(sphere.id), ...prev]
    );
    setPendingJoinRequests((prev) => prev.filter((id) => String(id) !== String(sphere.id)));
    setUserSpheres((prev) => [
      sphere,
      ...prev.filter((item) => String(item.id) !== String(sphere.id)),
    ]);
  };

  const isFiltering =
    searchQuery.trim() !== "" || filterType !== "all" || filterAudience !== "all";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 space-y-6 animate-in fade-in duration-300">
        {/* ─── Top Header (Standardisé & Épuré) ─── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 campus-animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Sphères Collaboratives
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Rejoignez des projets, révisez ensemble et collaborez au sein de la communauté étudiante
            </p>
          </div>

          <div className="flex w-full sm:w-auto gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isSpheresLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", (isLoading || spheresQuery.isFetching) && "animate-spin")} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>

            {currentUser?.isVerified ? (
              <>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-1 sm:flex-none font-semibold"
                  onClick={() => setIsCreateSphereOpen(true)}
                >
                  <Plus className="h-4 w-4" /> <span>Créer</span>
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
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-1 sm:flex-none font-semibold"
                onClick={() => {
                  toast({
                    title: "Compte non certifié",
                    description: "Certifiez votre compte pour créer des sphères.",
                    variant: "destructive",
                    action: (
                      <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
                        Vérifier
                      </Button>
                    ),
                  });
                }}
              >
                <Plus className="h-4 w-4" /> <span>Créer</span>
              </Button>
            )}
          </div>
        </div>
        {/* ─── Search & Filters Bar (Épuré sans boîte de carte) ─── */}
        <div className="space-y-3">
          {/* Top Row: Search Input + Audience Select */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une sphère par nom, description ou projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 text-xs rounded-xl h-10 border-border/80 bg-card focus-visible:ring-primary shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowMobileFilters((v) => !v)}
              className={cn(
                "sm:hidden h-10 w-10 rounded-xl shrink-0 border-border/80",
                showMobileFilters || filterAudience !== "all"
                  ? "border-primary text-primary bg-primary/5"
                  : ""
              )}
              title="Filtres"
            >
              <Filter className="h-4 w-4" />
            </Button>

            {/* Desktop Audience Select */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Select value={filterAudience} onValueChange={setFilterAudience}>
                <SelectTrigger className="w-56 h-10 rounded-xl text-xs border-border/80 bg-card">
                  <SelectValue placeholder="Tous publics" />
                </SelectTrigger>
                <SelectContent>
                  {SPHERE_AUDIENCE_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value} className="text-xs">
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isFiltering && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                    setFilterAudience("all");
                  }}
                  className="rounded-xl text-xs h-10 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Collapsible Filters */}
          {showMobileFilters && (
            <div className="flex items-center gap-2 sm:hidden animate-in fade-in duration-200">
              <Select value={filterAudience} onValueChange={setFilterAudience}>
                <SelectTrigger className="w-full h-10 rounded-xl text-xs border-border/80 bg-card">
                  <SelectValue placeholder="Tous publics" />
                </SelectTrigger>
                <SelectContent>
                  {SPHERE_AUDIENCE_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value} className="text-xs">
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isFiltering && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                    setFilterAudience("all");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0 h-10"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Effacer
                </Button>
              )}
            </div>
          )}

          {/* Bottom Row: Horizontal Type Chips (Sans scrollbar visible) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-1 border-t border-border/40">
            {SPHERE_TYPE_CHIPS.map((chip) => {
              const isSelected = filterType === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setFilterType(chip.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer",
                    isSelected
                      ? "bg-primary/15 text-primary border border-primary/30 shadow-xs font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                  )}
                >
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode Switcher Toolbar */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <span className="text-xs text-muted-foreground font-medium">
            {isFiltering
              ? `${filteredSpheres.length} ${filteredSpheres.length > 1 ? "sphères trouvées" : "sphère trouvée"}`
              : `${allSpheres.length} ${allSpheres.length > 1 ? "sphères disponibles" : "sphère disponible"}`}
          </span>
          <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2.5 rounded-md text-xs gap-1.5 transition-all",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grille</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2.5 rounded-md text-xs gap-1.5 transition-all",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Liste</span>
            </Button>
          </div>
        </div>

        {/* ─── Main Content (Filtered Grid or Dashboard Sections) ─── */}
        {isFiltering ? (
          <div className="space-y-4 pt-2">
            {isSpheresLoading ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SphereSkeleton key={i} layout="grid" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col pt-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SphereSkeleton key={i} layout="list" />
                  ))}
                </div>
              )
            ) : filteredSpheres.length === 0 ? (
              <EmptyState
                icon={Globe}
                title="Aucune sphère trouvée"
                description="Essayez d'ajuster vos filtres pour trouver ce que vous cherchez."
                actionLabel="Tout réinitialiser"
                onAction={() => {
                  setSearchQuery("");
                  setFilterType("all");
                  setFilterAudience("all");
                }}
              />
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
                {filteredSpheres.map((sphere) => (
                  <SphereCard
                    key={sphere.id}
                    sphere={sphere}
                    layout="grid"
                    membership={getUnifiedMembershipState(sphere)}
                    isJoining={isJoining === String(sphere.id)}
                    onJoin={() => handleJoinSphere(String(sphere.id), sphere.name)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col pt-2">
                {filteredSpheres.map((sphere) => (
                  <SphereCard
                    key={sphere.id}
                    sphere={sphere}
                    layout="list"
                    membership={getUnifiedMembershipState(sphere)}
                    isJoining={isJoining === String(sphere.id)}
                    onJoin={() => handleJoinSphere(String(sphere.id), sphere.name)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8 mt-6 pb-12">
            {/* Row 1: Mes Sphères */}
            {(() => {
              const mySpheres = allSpheres.filter(
                (sphere) => getUnifiedMembershipState(sphere) === "active"
              );
              if (mySpheres.length === 0 && !isSpheresLoading) return null;
              return (
                <section className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 px-1">
                    <h2 className="text-sm font-semibold tracking-wide text-foreground">
                      Mes Sphères ({mySpheres.length})
                    </h2>
                  </div>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
                      {isSpheresLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <SphereSkeleton key={i} layout="grid" />
                        ))
                      ) : (
                        mySpheres.slice(0, 8).map((sphere) => (
                          <SphereCard
                            key={sphere.id}
                            sphere={sphere}
                            layout="grid"
                            membership={getUnifiedMembershipState(sphere)}
                            isJoining={isJoining === String(sphere.id)}
                            onJoin={() => handleJoinSphere(String(sphere.id), sphere.name)}
                          />
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col pt-2">
                      {isSpheresLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <SphereSkeleton key={i} layout="list" />
                        ))
                      ) : (
                        mySpheres.slice(0, 4).map((sphere) => (
                          <SphereCard
                            key={sphere.id}
                            sphere={sphere}
                            layout="list"
                            membership={getUnifiedMembershipState(sphere)}
                            isJoining={isJoining === String(sphere.id)}
                            onJoin={() => handleJoinSphere(String(sphere.id), sphere.name)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Row 2: Tendances */}
            {(() => {
              const topSpheres = [...allSpheres]
                .sort((a: any, b: any) => {
                  const membersA = Number(a.memberCount) || 0;
                  const membersB = Number(b.memberCount) || 0;
                  const progressA = Math.min(100, Number(a.progression) || 0);
                  const progressB = Math.min(100, Number(b.progression) || 0);
                  return membersB * 0.5 + progressB * 0.5 - (membersA * 0.5 + progressA * 0.5);
                })
                .slice(0, 8);

              if (topSpheres.length === 0 && !isSpheresLoading) return null;
              return (
                <section className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 px-1">
                    <h2 className="text-sm font-semibold tracking-wide text-foreground">
                      Sphères Populaires & Tendances
                    </h2>
                  </div>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
                      {isSpheresLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <SphereSkeleton key={i} layout="grid" />
                        ))
                      ) : (
                        topSpheres.map((sphere) => (
                          <SphereCard
                            key={sphere.id}
                            sphere={sphere}
                            layout="grid"
                            membership={getUnifiedMembershipState(sphere)}
                            isJoining={isJoining === String(sphere.id)}
                            onJoin={() => handleJoinSphere(String(sphere.id), sphere.name)}
                          />
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col pt-2">
                      {isSpheresLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <SphereSkeleton key={i} layout="list" />
                        ))
                      ) : (
                        topSpheres.map((sphere) => (
                          <SphereCard
                            key={sphere.id}
                            sphere={sphere}
                            layout="list"
                            membership={getUnifiedMembershipState(sphere)}
                            isJoining={isJoining === String(sphere.id)}
                            onJoin={() => handleJoinSphere(String(sphere.id), sphere.name)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Rows 3+: Par Type de Sphère */}
            {[
              { value: "cours", label: "Cours, TD & Académique" },
              { value: "projet", label: "Projets & Groupes de Travail" },
              { value: "communaute", label: "Communautés & Échanges" },
              { value: "club", label: "Clubs & Associations" },
              { value: "revision", label: "Groupes de Révision & Annales" },
            ].map((typeObj) => {
              const catSpheres = allSpheres.filter((s) => {
                const sType = (s.sphere_type || s.sphereType || "").toLowerCase();
                return sType === typeObj.value;
              });
              if (catSpheres.length === 0 && !isSpheresLoading) return null;
              return (
                <section key={typeObj.value} className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 px-1">
                    <h2 className="text-sm font-semibold tracking-wide text-foreground">
                      {typeObj.label}
                    </h2>
                    {catSpheres.length > 4 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-foreground font-medium h-7 px-2"
                        onClick={() => {
                          setFilterType(typeObj.value);
                        }}
                      >
                        Voir tout ({catSpheres.length})
                      </Button>
                    )}
                  </div>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
                      {isSpheresLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <SphereSkeleton key={i} layout="grid" />
                        ))
                      ) : (
                        catSpheres.slice(0, 8).map((sphere) => (
                          <SphereCard
                            key={sphere.id}
                            sphere={sphere}
                            layout="grid"
                            membership={getUnifiedMembershipState(sphere)}
                            isJoining={isJoining === String(sphere.id)}
                            onJoin={() => handleJoinSphere(String(sphere.id), sphere.name)}
                          />
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col pt-2">
                      {isSpheresLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <SphereSkeleton key={i} layout="list" />
                        ))
                      ) : (
                        catSpheres.slice(0, 4).map((sphere) => (
                          <SphereCard
                            key={sphere.id}
                            sphere={sphere}
                            layout="list"
                            membership={getUnifiedMembershipState(sphere)}
                            isJoining={isJoining === String(sphere.id)}
                            onJoin={() => handleJoinSphere(String(sphere.id), sphere.name)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
