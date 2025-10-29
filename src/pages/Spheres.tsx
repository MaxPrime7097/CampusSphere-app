import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mockDB } from "@/services/mockDatabaseService";
import { mockDatabase } from "@/data/mockDatabase";
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


export function Spheres() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Charger l'utilisateur actuel et les sphères
  useEffect(() => {
    mockDB.loadCurrentUser();
  }, []);

  const currentUser = mockDB.getCurrentUser();
  const userData = mockDB.getCurrentUserData();
  
  // Obtenir toutes les sphères depuis le mock database
  const allSpheres = mockDB.getAllSpheres();
  const [activeTab, setActiveTab] = useState("discover");
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);

  const filteredSpheres = allSpheres.filter(sphere => {
    const creator = mockDB.getUser(sphere.creatorId);
    const matchesSearch = sphere.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sphere.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (creator?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesCategory = filterCategory === "all" || sphere.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getSortedSpheres = () => {
    const sorted = [...filteredSpheres];
    
    switch (activeTab) {
      case "top":
        return sorted.sort((a, b) => b.impactScore - a.impactScore);
      case "my-spheres":
        return sorted.filter(sphere => currentUser ? mockDB.isUserMemberOfSphere(currentUser.id, sphere.id) : false);
      default:
        return sorted;
    }
  };

  const handleJoinSphere = async (sphereId: string, sphereName: string) => {
    if (!currentUser) return;

    setIsJoining(sphereId);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = mockDB.joinSphere(sphereId, currentUser.id);
    
    if (success) {
      const sphere = mockDB.getSphere(sphereId);
      if (sphere?.requireApproval) {
        toast({
          title: "Demande envoyée !",
          description: `Votre demande d'adhésion à "${sphereName}" est en attente d'approbation`,
          duration: 3000,
        });
      } else {
        toast({
          title: "Sphère rejoint !",
          description: `Vous avez rejoint "${sphereName}" avec succès`,
          duration: 3000,
        });
      }
    }
    
    setIsJoining(null);
  };

  const handleLeaveSphere = (sphereId: string, sphereName: string) => {
    if (!currentUser) return;
    
    // Simuler la sortie de sphère
    const success = true;
    
    if (success) {
      toast({
        title: "Sphère quittée",
        description: `Vous avez quitté "${sphereName}"`,
        duration: 2000,
      });
    }
  };

  const handleCancelRequest = (sphereId: string, sphereName: string) => {
    if (!currentUser) return;
    
    const success = mockDB.cancelJoinRequest(sphereId, currentUser.id);
    
    if (success) {
      toast({
        title: "Demande annulée",
        description: `Votre demande pour "${sphereName}" a été annulée`,
        duration: 2000,
      });
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Sphères actualisées",
        description: "La liste des sphères a été mise à jour",
        duration: 2000,
      });
    }, 1000);
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
              Mes sphères ({userData?.joinedSpheres.length || 0})
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

            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              {getSortedSpheres().map((sphere) => (
                <Card
                  key={sphere.id}
                  className="campus-card hover:campus-glow transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/spheres/${sphere.id}`)}
                >
                  <CardContent className="p-0">
                    <div className={`aspect-video bg-gradient-to-br ${sphere.color} rounded-t-lg flex items-center justify-center mb-0 text-white font-bold text-2xl`}>
                      {sphere.name.charAt(0)}
                    </div>
                    <div className="px-4 py-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {sphere.category}
                      </Badge>
                      {sphere.requireApproval && (
                        <Badge variant="destructive" className="text-xs">
                          Approbation
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                      {sphere.name}
                    </h3>
                    <div className="space-y-1 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {sphere.memberCount} membres
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className={`w-full h-7 text-xs ${
                        (currentUser && mockDB.isUserMemberOfSphere(currentUser.id, sphere.id))
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : (currentUser && mockDB.isUserPendingForSphere(currentUser.id, sphere.id))
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'campus-gradient text-white'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentUser && mockDB.isUserMemberOfSphere(currentUser.id, sphere.id)) {
                          handleLeaveSphere(sphere.id, sphere.name);
                        } else if (currentUser && mockDB.isUserPendingForSphere(currentUser.id, sphere.id)) {
                          handleCancelRequest(sphere.id, sphere.name);
                        } else {
                          handleJoinSphere(sphere.id, sphere.name);
                        }
                      }}
                      disabled={isJoining === sphere.id}
                    >
                      {isJoining === sphere.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (currentUser && mockDB.isUserMemberOfSphere(currentUser.id, sphere.id)) ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Rejoint
                        </>
                      ) : (currentUser && mockDB.isUserPendingForSphere(currentUser.id, sphere.id)) ? (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
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
