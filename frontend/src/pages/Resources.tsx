import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { resourceService, taskService } from "@/services/api/contentServices";
import { authService } from "@/services/api/authService";
import { Search, Filter, Upload, Download, FileText, Heart, Star, Eye, Bookmark, Loader2, RefreshCw, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadResourceModal } from "@/components/modals/UploadResourceModal";

export function Resources() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [likedResources, setLikedResources] = useState<Set<string>>(new Set());
  const [savedResources, setSavedResources] = useState<Set<string>>(new Set());

  const [resources, setResources] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  // Load resources
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await resourceService.getResources();
        if (isMounted) {
          const mapped = (data || []).map((r: any) => ({
            id: String(r.id),
            title: r.title,
            description: r.description || '',
            subject: r.subject || 'other',
            type: r.type || 'notes',
            authorId: r.author || r.created_by,
            authorName: r.author_info?.name || r.author_name || 'Unknown',
            visibility: r.visibility || 'public',
            fileUrl: r.file_url || r.file || '',
            fileSize: r.file_size || '0 MB',
            tags: r.tags || [],
            impactScore: r.impact_score || 0,
            createdAt: r.created_at || new Date().toISOString(),
            downloadCount: r.download_count || 0,
            viewCount: r.view_count || 0,
          }));
          setResources(mapped);
        }
      } catch (e: any) {
        toast({
          title: "Erreur",
          description: e?.message || "Impossible de charger les ressources",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const subjects = [
    { value: "all", label: "Toutes matières" },
    { value: "math", label: "Mathématiques" },
    { value: "cs", label: "Informatique" },
    { value: "physics", label: "Physique" },
    { value: "economics", label: "Économie" },
    { value: "language", label: "Langues" }
  ];

  const types = [
    { value: "all", label: "Tous types" },
    { value: "notes", label: "Notes de cours" },
    { value: "summary", label: "Résumés" },
    { value: "exercises", label: "Exercices" },
    { value: "projects", label: "Projets" },
    { value: "slides", label: "Présentations" }
  ];


  // Charger les données sauvegardées depuis localStorage
  useEffect(() => {
    const savedLikes = localStorage.getItem('likedResources');
    const savedBookmarks = localStorage.getItem('savedResources');
    
    if (savedLikes) {
      setLikedResources(new Set(JSON.parse(savedLikes)));
    }
    if (savedBookmarks) {
      setSavedResources(new Set(JSON.parse(savedBookmarks)));
    }
  }, []);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === "all" || resource.subject === selectedSubject;
    const matchesType = selectedType === "all" || resource.type === selectedType;
    return matchesSearch && matchesSubject && matchesType;
  });

  const getSortedResources = () => {
    const sorted = [...filteredResources];
    
    switch (activeTab) {
      case "suggestions":
        return sorted.sort((a, b) => b.impactScore - a.impactScore);
      case "recent":
        return sorted.sort((a, b) => {
          // Simuler un tri par date (plus récent en premier)
          const dateA = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
          const dateB = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
          return dateB.getTime() - dateA.getTime();
        });
      default:
        return sorted;
    }
  };

  const handleLike = (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    
    const newLikedResources = new Set(likedResources);
    if (newLikedResources.has(resourceId)) {
      newLikedResources.delete(resourceId);
      toast({ 
        title: "Like retiré", 
        description: "Vous n'aimez plus cette ressource",
        duration: 2000,
      });
    } else {
      newLikedResources.add(resourceId);
      toast({ 
        title: "Ressource aimée !", 
        description: "Cette ressource a été ajoutée à vos favoris",
        duration: 2000,
      });
    }
    
    setLikedResources(newLikedResources);
    localStorage.setItem('likedResources', JSON.stringify([...newLikedResources]));
  };

  const handleSave = (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    
    const newSavedResources = new Set(savedResources);
    if (newSavedResources.has(resourceId)) {
      newSavedResources.delete(resourceId);
      toast({ 
        title: "Ressource retirée", 
        description: "Cette ressource a été retirée de vos sauvegardes",
        duration: 2000,
      });
    } else {
      newSavedResources.add(resourceId);
      toast({ 
        title: "Ressource sauvegardée !", 
        description: "Cette ressource a été ajoutée à vos sauvegardes",
        duration: 2000,
      });
    }
    
    setSavedResources(newSavedResources);
    localStorage.setItem('savedResources', JSON.stringify([...newSavedResources]));
  };

  const handleDownload = (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    
    setIsLoading(true);
    
    // Simuler le téléchargement
    setTimeout(() => {
      setIsLoading(false);
      toast({ 
        title: "Téléchargement démarré !", 
        description: "Votre fichier va être téléchargé dans quelques instants",
        duration: 3000,
      });
    }, 1500);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Ressources actualisées",
        description: "La liste des ressources a été mise à jour",
        duration: 2000,
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-6xl mx-auto py-4 md:py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 campus-animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground">
              Ressources Étudiantes
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Partagez et accédez aux ressources partagées par la communauté
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
            <UploadResourceModal>
              <Button size="sm" className="campus-gradient text-white hover:opacity-90 gap-2 w-full sm:w-auto">
                <Upload className="h-4 w-4" />
                <span className="inline">Uploader</span>
              </Button>
            </UploadResourceModal>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="recent">Récentes</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Filters */}
            <Card className="campus-card">
              <CardContent className="p-3 md:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Matière" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Resources Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {getSortedResources().map((resource) => (
                <Card 
                  key={resource.id}
                  className="campus-card hover:campus-glow transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/resources/${resource.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="h-24 rounded-t-lg bg-input flex items-center justify-center mb-0">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="px-2 py-2">
                    <h3 className="flex-1 font-semibold text-sm line-clamp-2 mb-2">
                      {resource.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <p className="text-left">
                        Par {resource.authorName || 'Utilisateur'}
                      </p>
                      <span className="flex items-center gap-1 text-primary">
                        <Zap className="h-3 w-3" />
                        {resource.impactScore || 0}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs mb-2">
                      {types.find(t => t.value === resource.type)?.label}
                    </Badge>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 flex-1 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implémenter la prévisualisation du fichier
                          toast({
                            title: "Prévisualisation",
                            description: "Fonctionnalité de prévisualisation à venir",
                            duration: 2000,
                          });
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className={`h-7 flex-1 text-xs gap-1 ${
                          savedResources.has(resource.id) 
                            ? 'text-blue-500 hover:text-blue-600' 
                            : ''
                        }`}
                        onClick={(e) => handleSave(e, resource.id)}
                      >
                        <Bookmark className={`h-3 w-3 ${savedResources.has(resource.id) ? 'fill-current' : ''}`} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="h-7 flex-1 text-xs gap-1 campus-gradient text-white"
                        onClick={(e) => handleDownload(e, resource.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                      </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {getSortedResources().map((resource) => (
                <Card 
                  key={resource.id}
                  className="campus-card hover:campus-glow transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/resources/${resource.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="h-24 rounded-t-lg bg-input flex items-center justify-center mb-0">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="px-2 py-2">
                    <h3 className="flex-1 font-semibold text-sm line-clamp-2 mb-2">
                      {resource.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <p className="text-left">
                        Par {resource.authorName || 'Utilisateur'}
                      </p>
                      <span className="flex items-center gap-1 text-primary">
                        <Zap className="h-3 w-3" />
                        {resource.impactScore || 0}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs mb-2">
                      {types.find(t => t.value === resource.type)?.label}
                    </Badge>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 flex-1 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implémenter la prévisualisation du fichier
                          toast({
                            title: "Prévisualisation",
                            description: "Fonctionnalité de prévisualisation à venir",
                            duration: 2000,
                          });
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className={`h-7 flex-1 text-xs gap-1 ${
                          savedResources.has(resource.id) 
                            ? 'text-blue-500 hover:text-blue-600' 
                            : ''
                        }`}
                        onClick={(e) => handleSave(e, resource.id)}
                      >
                        <Bookmark className={`h-3 w-3 ${savedResources.has(resource.id) ? 'fill-current' : ''}`} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="h-7 flex-1 text-xs gap-1 campus-gradient text-white"
                        onClick={(e) => handleDownload(e, resource.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                      </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {getSortedResources().map((resource) => (
                <Card 
                  key={resource.id}
                  className="campus-card hover:campus-glow transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/resources/${resource.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="h-24 rounded-t-lg bg-input flex items-center justify-center mb-0">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="px-2 py-2">
                    <h3 className="flex-1 font-semibold text-sm line-clamp-2 mb-2">
                      {resource.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <p className="text-left">
                        Par {resource.authorName || 'Utilisateur'}
                      </p>
                      <span className="flex items-center gap-1 text-primary">
                        <Zap className="h-3 w-3" />
                        {resource.impactScore || 0}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs mb-2">
                      {types.find(t => t.value === resource.type)?.label}
                    </Badge>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 flex-1 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implémenter la prévisualisation du fichier
                          toast({
                            title: "Prévisualisation",
                            description: "Fonctionnalité de prévisualisation à venir",
                            duration: 2000,
                          });
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className={`h-7 flex-1 text-xs gap-1 ${
                          savedResources.has(resource.id) 
                            ? 'text-blue-500 hover:text-blue-600' 
                            : ''
                        }`}
                        onClick={(e) => handleSave(e, resource.id)}
                      >
                        <Bookmark className={`h-3 w-3 ${savedResources.has(resource.id) ? 'fill-current' : ''}`} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="h-7 flex-1 text-xs gap-1 campus-gradient text-white"
                        onClick={(e) => handleDownload(e, resource.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                      </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune ressource trouvée</h3>
            <p className="text-muted-foreground mb-6">
              Soyez le premier à partager une ressource dans cette catégorie !
            </p>
            <Button className="campus-gradient text-white hover:opacity-90">
              Partager une ressource
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
