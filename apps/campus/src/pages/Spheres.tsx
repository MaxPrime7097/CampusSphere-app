import { Suspense, lazy, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { listSpheres, joinSphere, getUserSpheres, leaveSphere } from "@/services/api";
import { SPHERE_AUDIENCE_OPTIONS } from "@/constants/sphereCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sphere as SphereIcon, MagnifyingGlass as Search, UsersThree as Users, TrendUp as TrendingUp, Clock, Spinner as Loader2, Check, ArrowClockwise as RefreshCw, Plus, X, Funnel as Filter, BookOpen, FolderSimple as FolderGit2, Sparkle as Sparkles, GraduationCap, ShieldCheck, GridFour as LayoutGrid, List, UsersFour, Target } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { openVerificationModal } from "@/lib/events";
import { SphereCard } from "@/components/sphere/SphereCard";
import { EmptyState } from "@/components/ui/empty-state";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { SphereSkeleton } from "@/components/ui/skeletons";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getVerificationAccessStatus } from "@/utils/verification";
import { normalizeSphereType } from "@/config/sphereFeatures";
import type { Sphere } from "@/types";

const CreateSphereModal = lazy(() =>
  import("@/components/modals/CreateSphereModal").then((module) => ({
    default: module.CreateSphereModal,
  }))
);

export function Spheres() {
  const { t } = useTranslation("spheres");
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const { canPerformAction } = getVerificationAccessStatus(currentUser);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAudience, setFilterAudience] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isCreateSphereOpen, setIsCreateSphereOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [allSpheres, setAllSpheres] = useState<Sphere[]>(() => {
    const cached = queryClient.getQueryData<Sphere[]>(["spheres"]);
    return Array.isArray(cached) ? cached : [];
  });
  const [userSpheres, setUserSpheres] = useState<Sphere[]>(() => {
    const cached = queryClient.getQueryData<Sphere[]>(["user-spheres"]);
    return Array.isArray(cached) ? cached : [];
  });
  const [userJoinedSpheres, setUserJoinedSpheres] = useState<string[]>(() => {
    const cached = queryClient.getQueryData<Sphere[]>(["user-spheres"]);
    return Array.isArray(cached) ? cached.map((s: any) => String(s.id)) : [];
  });
  const [pendingJoinRequests, setPendingJoinRequests] = useState<string[]>([]);
  const [userSpheresLoadError, setUserSpheresLoadError] = useState<string | null>(null);
  const [loadingSpheres, setLoadingSpheres] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const spheresQuery = useQuery({
    queryKey: ["spheres"],
    queryFn: () => listSpheres(),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const userSpheresQuery = useQuery({
    queryKey: ["user-spheres"],
    queryFn: () => getUserSpheres(),
    enabled: Boolean(currentUser?.id),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
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
      !spheresQuery.data &&
      !userSpheresQuery.data);

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

    const canonicalType = normalizeSphereType(
      sphere.sphere_type || sphere.sphereType || (sphere as any).category
    );
    const matchesType = filterType === "all" || canonicalType === filterType;

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

    if (!canPerformAction) {
      toast({
        title: t("page.toasts.uncertifiedTitle"),
        description: t("page.toasts.uncertifiedDesc"),
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
            {t("page.toasts.verify")}
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
        toast({
          title: t("page.toasts.requestedTitle"),
          description: t("page.toasts.requestedDesc", { name: sphereName }),
        });
      } else {
        toast({
          title: t("page.toasts.joinedTitle", { name: sphereName }),
          description: t("page.toasts.joinedDesc"),
        });
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
      toast({ title: t("detail.toasts.error"), description: e?.message || t("page.toasts.joinError"), variant: "destructive" });
    } finally {
      setIsJoining(null);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshMembershipState();
      toast({
        title: t("page.toasts.refreshedTitle"),
        description: t("page.toasts.refreshedDesc"),
      });
    } catch (e: any) {
      debugApiError("GET /spheres + GET /users/me/spheres", e);
      toast({ title: t("detail.toasts.error"), description: e?.message || t("page.toasts.joinError"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSphereCreated = (sphere: any) => {
    if (!sphere) return;
    queryClient.setQueryData(["spheres"], (old: any) => [
      sphere,
      ...(Array.isArray(old) ? old.filter((item: any) => String(item.id) !== String(sphere.id)) : []),
    ]);
    queryClient.setQueryData(["user-spheres"], (old: any) => [
      sphere,
      ...(Array.isArray(old) ? old.filter((item: any) => String(item.id) !== String(sphere.id)) : []),
    ]);
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
              {t("page.title")}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {t("page.subtitle")}
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
              <span className="hidden sm:inline">{t("page.refresh")}</span>
            </Button>

            {canPerformAction ? (
              <>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-1 sm:flex-none font-semibold"
                  onClick={() => setIsCreateSphereOpen(true)}
                >
                  <Plus className="h-4 w-4" /> <span>{t("page.create")}</span>
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
                    title: t("page.toasts.uncertifiedTitle"),
                    description: t("page.toasts.uncertifiedDesc"),
                    variant: "destructive",
                    action: (
                      <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
                        {t("page.toasts.verify")}
                      </Button>
                    ),
                  });
                }}
              >
                <Plus className="h-4 w-4" /> <span>{t("page.create")}</span>
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
                placeholder={t("page.searchPlaceholder")}
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
              title={t("page.filters")}
            >
              <Filter className="h-4 w-4" />
            </Button>

            {/* Desktop Audience Select */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Select value={filterAudience} onValueChange={setFilterAudience}>
                <SelectTrigger className="w-56 h-10 rounded-xl text-xs border-border/80 bg-card">
                  <SelectValue placeholder={t("page.allAudiences")} />
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
                  {t("page.reset")}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Collapsible Filters */}
          {showMobileFilters && (
            <div className="flex items-center gap-2 sm:hidden animate-in fade-in duration-200">
              <Select value={filterAudience} onValueChange={setFilterAudience}>
                <SelectTrigger className="w-full h-10 rounded-xl text-xs border-border/80 bg-card">
                  <SelectValue placeholder={t("page.allAudiences")} />
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
                  {t("page.clear")}
                </Button>
              )}
            </div>
          )}

          {/* Bottom Row: Horizontal Type Chips (Sans scrollbar visible) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-1 border-t border-border/40">
            {[
              { value: "all", label: t("page.allSpheres") },
              { value: "cours", label: t("card.cours") },
              { value: "projet", label: t("card.projet") },
              { value: "communaute", label: t("card.communaute") },
            ].map((chip) => {
              const isSelected = filterType === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setFilterType(chip.value)}
                  className={cn(
                    "flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer",
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
              ? (filteredSpheres.length > 1 ? t("page.found_other", { count: filteredSpheres.length }) : t("page.found_one", { count: filteredSpheres.length }))
              : (allSpheres.length > 1 ? t("page.available_other", { count: allSpheres.length }) : t("page.available_one", { count: allSpheres.length }))}
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
              <span className="hidden sm:inline">{t("page.grid")}</span>
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
              <span className="hidden sm:inline">{t("page.list")}</span>
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
                icon={SphereIcon}
                title={t("page.emptyTitle")}
                description={t("page.emptyDesc")}
                actionLabel={t("page.emptyReset")}
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
                      {t("page.sections.mySpheres", { count: mySpheres.length })}
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
                      {t("page.sections.trending")}
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
              { value: "cours", label: t("page.sections.academic") },
              { value: "projet", label: t("page.sections.projects") },
              { value: "communaute", label: t("page.sections.community") },
              { value: "club", label: t("page.sections.clubs") },
              { value: "revision", label: t("page.sections.revision") },
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
                        {t("page.sections.viewAllCount", { count: catSpheres.length })}
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
