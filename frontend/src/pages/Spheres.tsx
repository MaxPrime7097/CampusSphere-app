import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listSpheres, getCurrentUser, joinSphere, getUserSpheres, leaveSphere } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SPHERE_CATEGORY_OPTIONS, getSphereCategoryLabel } from "@/constants/sphereCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, TrendingUp, Clock, Loader2, Check, RefreshCw, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateSphereModal } from "@/components/modals/CreateSphereModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SORT,
  SPHERE_SORT_KEYS,
  type SphereSortKey,
  ensureValidSortKey,
} from "@/constants/defaultSort";

export function Spheres() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userJoinedSpheres, setUserJoinedSpheres] = useState<string[]>([]);
  const [userSpheres, setUserSpheres] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<SphereSortKey>(DEFAULT_SORT.spheres);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (isMounted) {
          setCurrentUser(data);
          try {
            const userSpheresData = await getUserSpheres();
            if (isMounted && userSpheresData) {
              const sphereIds = (userSpheresData || []).map((s: any) => String(s.id));
              setUserJoinedSpheres(sphereIds);
              setUserSpheres(userSpheresData || []);
            }
          } catch (e) {}
        }
      } catch (e) {}
    })();
    return () => { isMounted = false; };
  }, []);

  const [allSpheres, setAllSpheres] = useState<any[]>([]);
  const [loadingSpheres, setLoadingSpheres] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingSpheres(true);
        const data = await listSpheres();
        if (isMounted) setAllSpheres(data || []);
      } catch (e: any) {
        if (isMounted) setLoadError(e?.message || "Erreur de chargement");
      } finally {
        if (isMounted) setLoadingSpheres(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);

  const filteredSpheres = allSpheres.filter(sphere => {
    const matchesSearch = sphere.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sphere.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesCategory = filterCategory === "all" || sphere.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const resolvedSphereSort = ensureValidSortKey(activeTab, SPHERE_SORT_KEYS, DEFAULT_SORT.spheres);

  const getSortedSpheres = () => {
    const sorted = [...filteredSpheres];
    switch (resolvedSphereSort) {
      case "top":
        return sorted.sort((a: any, b: any) => (b.progression || 0) - (a.progression || 0));
      case "mySpheres":
        if (userSpheres.length > 0) return userSpheres;
        return sorted.filter((sphere: any) => userJoinedSpheres.includes(String(sphere.id)));
      case "discover":
        return sorted;
    }
  };

  const handleJoinSphere = async (sphereId: string, sphereName: string) => {
    if (!currentUser) return;
    setIsJoining(sphereId);
    try {
      const result = await joinSphere(sphereId);
      if (result?.data?.status === 'pending') {
        toast({ title: "Demande envoyée !", description: `Attente d'approbation pour ${sphereName}` });
      } else {
        toast({ title: "Sphère rejoint !", description: `Succès pour ${sphereName}` });
        setUserJoinedSpheres(prev => [...prev, sphereId]);
        const joinedSphere = allSpheres.find((sphere) => String(sphere.id) === String(sphereId));
        if (joinedSphere) {
          setUserSpheres((prev) => [joinedSphere, ...prev.filter((sphere) => String(sphere.id) !== String(sphereId))]);
        }
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setIsJoining(null);
    }
  };

  const handleLeaveSphere = async (sphereId: string, sphereName: string) => {
    try {
      await leaveSphere(sphereId);
      toast({ title: "Sphère quittée", description: `Vous avez quitté "${sphereName}"` });
      setUserJoinedSpheres((prev) => prev.filter((id) => String(id) !== String(sphereId)));
      setUserSpheres((prev) => prev.filter((sphere) => String(sphere.id) !== String(sphereId)));
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Impossible de quitter la sphère", variant: "destructive" });
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const [spheresData, userSpheresData] = await Promise.all([listSpheres(), getUserSpheres()]);
      setAllSpheres(spheresData || []);
      const sphereIds = (userSpheresData || []).map((s: any) => String(s.id));
      setUserJoinedSpheres(sphereIds);
      setUserSpheres(userSpheresData || []);
    } catch (e: any) {
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

        {/* Tab Navigation */}
        <ul className="grid grid-flow-col text-center border-b border-gray-200 text-gray-500 mb-6">
          {[
            { id: "discover", label: "Découvrir" },
            { id: "mySpheres", label: "Mes Sphères" },
            { id: "top", label: "Top" },
          ].map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id as SphereSortKey)}
                className={cn(
                  "w-full flex justify-center border-b-4 py-4 transition-all duration-200 text-sm font-medium",
                  resolvedSphereSort === tab.id 
                    ? "border-primary text-primary" // Active Color
                    : "border-transparent hover:text-primary hover:border-primary" // Hover/Inactive
                )}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
        
          {/* Section 1: Pilot Training */}
          {resolvedSphereSort === "discover" && (
            <section id="discover" className="space-y-4">
              <Card className={cardClasses}>
                <CardContent className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher une sphère..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
              </CardContent>
              </Card>

              {loadError && <div className="text-sm text-red-500">{loadError}</div>}
              
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {(loadingSpheres ? Array.from({ length: 4 }).map((_, i) => ({ id: `skeleton-${i}`, name: "", category: "", memberCount: 0, color: "from-muted to-muted", requireApproval: false })) : getSortedSpheres()).map((sphere) => (
                  <Card key={sphere.id} className={cardClasses} onClick={() => navigate(`/spheres/${sphere.id}`)}>
                    <CardContent className="p-0">
                      <div className={`aspect-video bg-gradient-to-br ${sphere.color || "from-muted to-muted"} rounded-t-lg flex items-center justify-center text-white font-bold text-2xl`}>
                        {sphere.name?.charAt?.(0) || ""}
                      </div>
                      <div className="px-4 py-2">
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="outline" className="text-xs">{getSphereCategoryLabel(sphere.category)}</Badge>
                          {sphere.requireApproval && <Badge variant="destructive" className="text-xs">Approbation</Badge>}
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-2 mb-2">{sphere.name || ""}</h3>
                        <div className="space-y-1 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {sphere.memberCount || 0} membres</div>
                        </div>
                        <Button 
                          size="sm" 
                          className={`w-full h-7 text-xs ${userJoinedSpheres.includes(String(sphere.id)) ? 'bg-green-500 hover:bg-green-600 text-white' : 'campus-gradient text-white'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (userJoinedSpheres.includes(String(sphere.id))) {
                              handleLeaveSphere(sphere.id, sphere.name);
                            } else {
                              handleJoinSphere(sphere.id, sphere.name);
                            }
                          }}
                          disabled={isJoining === sphere.id || loadingSpheres}
                        >
                          {isJoining === sphere.id ? <Loader2 className="h-3 w-3 animate-spin" /> : userJoinedSpheres.includes(String(sphere.id)) ? <><Check className="h-3 w-3 mr-1" /> Rejoint</> : "Rejoindre"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Section 2: Titan maintenance */}
          {resolvedSphereSort === "mySpheres" && (
            <section id="mySpheres" className="space-y-4">
              <Card className={cardClasses}>
                <CardContent className="p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher mes sphères..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {getSortedSpheres().map((sphere) => {
                  const hasProgression = Number.isFinite(sphere.progression);
                  const progressionValue = hasProgression ? Math.max(0, Math.min(100, Number(sphere.progression))) : null;

                  return (
                  <Card key={sphere.id} className={cardClasses}>
                    <CardHeader className="pb-3">
                      <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${sphere.color} mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl`}>{sphere.name.charAt(0)}</div>
                      <CardTitle className="text-sm text-center line-clamp-1">{sphere.name}</CardTitle>
                      <p className="text-xs text-muted-foreground text-center">{sphere.memberCount} membres</p>
                    </CardHeader>
                    <CardContent className="pt-0 px-3 pb-3">
                      {progressionValue !== null && (
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Progression</span><span className="font-semibold">{progressionValue}%</span></div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full bg-gradient-to-r ${sphere.color} progress-bar`} style={{ '--progress-width': `${progressionValue}%` } as React.CSSProperties} />
                          </div>
                        </div>
                      )}
                      <Button size="sm" className="w-full campus-gradient text-white hover:opacity-90" onClick={() => navigate(`/spheres/${sphere.id}`)}>Accéder</Button>
                    </CardContent>
                  </Card>
                )})}
              </div>
            </section>
          )}

          {/* Section 3: Loadout */}
          {resolvedSphereSort === "top" && (
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
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${sphere.color} flex items-center justify-center text-white font-bold text-sm`}>#{index + 1}</div>
                              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${sphere.color} flex items-center justify-center text-white font-bold`}>{sphere.name.charAt(0)}</div>
                              <div className="flex-1">
                                <p className="font-semibold">{sphere.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{sphere.memberCount} membres</p>
                              </div>
                              <div className="text-right">
                                <div className="text-primary font-bold">{Math.max(0, Math.min(100, Number(sphere.progression || 0)))}%</div>
                                <Badge variant="secondary" className="text-xs mt-1">{sphere.category}</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Empty State */}
          {getSortedSpheres().length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune sphère trouvée.</p>
            </div>
          )}
      </div>
    </div>
  );
}
