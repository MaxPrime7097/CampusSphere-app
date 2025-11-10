import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sphereService } from "@/services/api/sphereService";
import { authService } from "@/services/api/authService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, TrendingUp, Clock, Sparkles, Loader2, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateSphereModal } from "@/components/modals/CreateSphereModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User, Sphere, ApiError } from "@/types/api";


export function Spheres() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userJoinedSpheres, setUserJoinedSpheres] = useState<string[]>([]);

  // Load current user
  const loadSpheres = useCallback(async (signal?: AbortSignal) => {
    setLoadingSpheres(true);
    try {
      const data = await sphereService.getAllSpheres();
      setAllSpheres(data || []);

      // Mettre à jour les sphères rejointes
      if (currentUser) {
        const userSpheres = data.filter(sphere => 
          sphere.members?.some(member => member.id === currentUser.id)
        );
        setUserJoinedSpheres(userSpheres.map(s => s.id));
      }
    } catch (error) {
      const err = error as ApiError;
      console.error('Error loading spheres:', err);
      setLoadError(err.message || "Erreur de chargement des sphères");
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des sphères",
        variant: "destructive"
      });
    } finally {
      setLoadingSpheres(false);
    }
  }, [currentUser, toast]);

  // Charger l'utilisateur courant
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        const response = await authService.getCurrentUser();
        if (isMounted && response) {
          setCurrentUser(response);
        }
      } catch (error) {
        const err = error as ApiError;
        console.error('Error loading current user:', err);
        // User not logged in - no need to show error
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);
  
  // Chargement des sphères depuis l'API
  const [allSpheres, setAllSpheres] = useState<Sphere[]>([]);
  const [loadingSpheres, setLoadingSpheres] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSpheres = async (signal?: AbortSignal) => {
    setLoadingSpheres(true);
    try {
      const data = await listSpheres(undefined, getAccessToken());
      setAllSpheres(data || []);

      // Mettre à jour les sphères rejointes
      if (currentUser) {
        const userSpheres = data.filter(sphere => 
          sphere.members?.some(member => member.id === currentUser.id)
        );
        setUserJoinedSpheres(userSpheres.map(s => s.id));
      }
    } catch (error) {
      const err = error as ApiError;
      console.error('Error loading spheres:', err);
      setLoadError(err.message || "Erreur de chargement des sphères");
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des sphères",
        variant: "destructive"
      });
    } finally {
      setLoadingSpheres(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    if (isMounted) {
      loadSpheres(controller.signal);
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [currentUser, loadSpheres]);
  const [activeTab, setActiveTab] = useState("discover");
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);

  const filteredSpheres = allSpheres.filter(sphere => {
    const matchesSearch = (sphere.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sphere.description?.toLowerCase().includes(searchQuery.toLowerCase())) ?? false;
    const matchesCategory = filterCategory === "all" || sphere.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getSortedSpheres = () => {
    const sorted = [...filteredSpheres];
    
    switch (activeTab) {
      case "top":
        return sorted.sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0));
      case "my-spheres":
        return sorted.filter(sphere => userJoinedSpheres.includes(String(sphere.id)));
      default:
        return sorted;
    }
  };

  const handleJoinSphere = async (sphereId: string, sphereName: string) => {
    if (!currentUser) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour rejoindre une sphère",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(sphereId);
    
    try {
  const result = await sphereService.joinSphere(sphereId);

  if (result?.status === 'pending' || result?.data?.status === 'pending') {
        toast({
          title: "Demande envoyée !",
          description: `Votre demande d'adhésion à "${sphereName}" est en attente d'approbation`,
          duration: 3000,
        });
      } else {
        toast({
          title: "Sphère rejointe !",
          description: `Vous avez rejoint "${sphereName}" avec succès`,
          duration: 3000,
        });
        setUserJoinedSpheres(prev => [...prev, sphereId]);
      }
      
      // Recharger la liste des sphères pour avoir les nombres de membres à jour
      await loadSpheres();
      
    } catch (error) {
      const err = error as ApiError;
      console.error('Error joining sphere:', err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de rejoindre la sphère",
        variant: "destructive",
      });
    } finally {
      setIsJoining(null);
    }
  };

  const handleLeaveSphere = async (sphereId: string, sphereName: string) => {
    if (!currentUser) return;
    
    try {
  await sphereService.leaveSphere(sphereId);
      setUserJoinedSpheres(prev => prev.filter(id => id !== sphereId));
      
      toast({
        title: "Sphère quittée",
        description: `Vous avez quitté "${sphereName}"`,
        duration: 2000,
      });
      
      // Recharger la liste des sphères
      await loadSpheres();
      
    } catch (error) {
      const err = error as ApiError;
      console.error('Error leaving sphere:', err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de quitter la sphère",
        variant: "destructive"
      });
    }
  };

  const handleCancelRequest = async (sphereId: string, sphereName: string) => {
    // TODO: Ajouter l'endpoint d'annulation de demande à l'API
    toast({
      title: "Indisponible",
      description: "L'annulation de demande n'est pas disponible pour le moment",
      duration: 2000,
    });
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    
    try {
      await loadSpheres();
      toast({
        title: "Sphères actualisées",
        description: "La liste des sphères a été mise à jour",
        duration: 2000,
      });
    } catch (error) {
      const err = error as ApiError;
      console.error('Error refreshing spheres:', err);
      toast({
        title: "Erreur", 
        description: "Impossible d'actualiser la liste des sphères",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: "all", label: "Toutes" },
    ...Array.from(new Set(allSpheres.map(s => s.category))).map(cat => ({ id: cat, label: cat }))
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="w-full max-w-6xl mx-auto py-4 md:py-6 px-3 md:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 campus-animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground">
              Sphères Collaboratives
            </h1>
            <p className="text-muted-foreground mt-2">
              Rejoignez des projets, apprenez ensemble et créez l'impact
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Actualiser
            </Button>
            <CreateSphereModal>
              <Button size="sm" className="campus-gradient text-white hover:opacity-90 gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="inline">Créer</span>
              </Button>
            </CreateSphereModal>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="discover" className="gap-2">
              Découvrir
            </TabsTrigger>
            <TabsTrigger value="my-spheres" className="gap-2">
              Mes sphères ({userJoinedSpheres.length})
            </TabsTrigger>
            <TabsTrigger value="top" className="gap-2">
              Top
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4">
            {/* Filters */}
            <div className="rounded-lg border bg-card p-3">
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
                    <SelectTrigger>
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>

            {loadError && (
              <div className="text-sm text-red-500">{loadError}</div>
            )}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              {(loadingSpheres ? Array.from({ length: 4 }).map((_, i) => ({ id: `skeleton-${i}`, name: "", category: "", memberCount: 0, color: "from-muted to-muted", requireApproval: false })) : getSortedSpheres()).map((sphere) => (
                <Card
                  key={sphere.id}
                  className="campus-card hover:campus-glow transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/spheres/${sphere.id}`)}
                >
                  <CardContent className="p-0">
                    <div className={`aspect-video bg-gradient-to-br ${sphere.color || "from-muted to-muted"} rounded-t-lg flex items-center justify-center mb-0 text-white font-bold text-2xl`}>
                      {sphere.name?.charAt?.(0) || ""}
                    </div>
                    <div className="px-4 py-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {sphere.category || ""}
                      </Badge>
                      {sphere.requireApproval && (
                        <Badge variant="destructive" className="text-xs">
                          Approbation
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                      {sphere.name || ""}
                    </h3>
                    <div className="space-y-1 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {sphere.memberCount || 0} membres
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className={`w-full h-7 text-xs ${
                        userJoinedSpheres.includes(String(sphere.id))
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'campus-gradient text-white'
                      }`}
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
                      {isJoining === sphere.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : userJoinedSpheres.includes(String(sphere.id)) ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Rejoint
                        </>
                      ) : (
                        "Rejoindre"
                      )}
                    </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {getSortedSpheres().length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {activeTab === "my-spheres" 
                    ? "Vous n'avez rejoint aucune sphère pour le moment"
                    : `Aucune sphère trouvée pour "${searchQuery}"`
                  }
                </p>
                {activeTab === "my-spheres" && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("discover")}
                  >
                    Découvrir des sphères
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-spheres" className="space-y-4">
            <div className="rounded-lg border bg-card p-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher mes sphères..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              {getSortedSpheres().map((sphere) => (
                <Card
                  key={sphere.id}
                  className="campus-card hover:campus-glow transition-all duration-300"
                >
                  <CardHeader className="pb-3">
                    <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${sphere.color} mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl`}>
                      {sphere.name.charAt(0)}
                    </div>
                    <CardTitle className="text-sm text-center line-clamp-1">
                      {sphere.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground text-center">
                      {sphere.memberCount} membres
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 pb-3">
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-semibold">75%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full bg-gradient-to-r ${sphere.color} progress-bar`}
                          style={{ '--progress-width': `75%` } as React.CSSProperties}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full campus-gradient text-white hover:opacity-90"
                      onClick={() => navigate(`/spheres/${sphere.id}`)}
                    >
                      Accéder
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="top" className="space-y-4">
            <Card className="campus-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Top Sphères du mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getSortedSpheres()
                    .slice(0, 5)
                    .map((sphere, index) => (
                      <Card
                        key={sphere.id}
                        className="campus-card cursor-pointer hover:campus-glow transition-all"
                        onClick={() => navigate(`/spheres/${sphere.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${sphere.color} flex items-center justify-center text-white font-bold text-sm`}>
                              #{index + 1}
                            </div>
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${sphere.color} flex items-center justify-center text-white font-bold`}>
                              {sphere.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{sphere.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {sphere.memberCount} membres
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-primary font-bold">
                                ⚡ {sphere.impactScore}
                              </div>
                              <Badge variant="secondary" className="text-xs mt-1">
                                {sphere.category}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
