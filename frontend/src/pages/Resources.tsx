import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  listResources,
  getCurrentUser,
  downloadResource,
  saveResource,
  getSavedResources,
} from "@/services/api";
import {
  Search,
  Upload,
  Download,
  FileText,
  Eye,
  Bookmark,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadResourceModal } from "@/components/modals/UploadResourceModal";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { RESOURCE_TYPE_OPTIONS, normalizeResourceType } from "@/constants/resourceTypes";

function mapResourceCard(r: any) {
  return {
    id: String(r.id),
    title: r.title,
    description: r.description || "",
    subject: r.subject || "other",
    type: normalizeResourceType(r.type),
    authorId: r.authorId || r.author || r.created_by,
    authorName: r.author?.name || r.author_info?.name || r.author_name || "Unknown",
    visibility: r.visibility || "public",
    fileUrl: r.fileUrl || r.file_url || r.file || "",
    fileSize: r.fileSize || r.file_size || "0 MB",
    tags: r.tags || [],
    impactScore: r.impactScore || r.impact_score || 0,
    createdAt: r.createdAt || r.created_at || null,
    downloadCount: r.downloadCount || r.download_count || r.stats?.downloads || 0,
    viewCount: r.viewCount || r.view_count || r.stats?.views || 0,
    isSaved: Boolean(r.isSaved || r.is_saved),
  };
}

export function Resources() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // ✅ Same tab state
  const [activeTab, setActiveTab] = useState("all");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [savedResources, setSavedResources] = useState<Set<string>>(new Set());

  const [resources, setResources] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await listResources();
      if (Array.isArray(data)) {
        const mapped = data.map(mapResourceCard);
        setResources(mapped);
      }
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e?.message || "Impossible de charger les ressources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (isMounted) setCurrentUser(data);
      } catch (e) {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    loadResources();
  }, []);

  const subjects = [
    { value: "all", label: "Toutes matières" },
    { value: "math", label: "Mathématiques" },
    { value: "cs", label: "Informatique" },
    { value: "physics", label: "Physique" },
    { value: "economics", label: "Économie" },
    { value: "language", label: "Langues" },
  ];

  const types = [{ value: "all", label: "Tous types" }, ...RESOURCE_TYPE_OPTIONS];

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await getSavedResources();
        if (isMounted && saved) {
          const savedIds = new Set(saved.map((r: any) => String(r.id || r.resource_id)));
          setSavedResources(savedIds);
        }
      } catch (e) {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

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
        return sorted.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      default:
        return sorted;
    }
  };

  const handleSave = async (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();

    try {
      const newSavedResources = new Set(savedResources);
      const response = await saveResource(resourceId);
      const saved = Boolean(response?.data?.saved);

      if (saved) {
        newSavedResources.add(resourceId);
      } else {
        newSavedResources.delete(resourceId);
      }

      setSavedResources(newSavedResources);
      setResources((prev) =>
        prev.map((resource) =>
          resource.id === resourceId
            ? {
                ...resource,
                isSaved: saved,
              }
            : resource
        )
      );

      toast({
        title: saved ? "Ressource sauvegardée !" : "Ressource retirée",
        description: saved
          ? "Cette ressource a été ajoutée à vos sauvegardes"
          : "Cette ressource a été retirée de vos sauvegardes",
        duration: 2000,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de sauvegarder la ressource",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    if (downloadingIds.has(resourceId)) return;
    setDownloadingIds((prev) => {
      const next = new Set(prev);
      next.add(resourceId);
      return next;
    });

    try {
      const result = await downloadResource(resourceId);
      const objectUrl = window.URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);

      setResources((prev) =>
        prev.map((resource) =>
          resource.id === resourceId
            ? { ...resource, downloadCount: Number(resource.downloadCount || 0) + 1 }
            : resource
        )
      );

      toast({
        title: "Téléchargement démarré !",
        description: "Votre fichier va être téléchargé dans quelques instants",
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de télécharger la ressource",
        variant: "destructive",
      });
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      const data = await listResources();
      const mapped = (data || []).map(mapResourceCard);
      setResources(mapped);

      toast({
        title: "Ressources actualisées",
        description: "La liste des ressources a été mise à jour",
        duration: 2000,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de rafraîchir les ressources",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const cardClasses = cn(
    "transition-all duration-300",
    isMobile
      ? "rounded-none border-x-0 border-t-0 shadow-none bg-card"
      : "campus-card hover:campus-glow"
  );

  const handleResourceUploaded = (resource?: unknown) => {
    if (!resource) {
      void loadResources();
      return;
    }

    const mapped = mapResourceCard(resource as Record<string, unknown>);
    setResources((prev) => [mapped, ...prev.filter((item) => item.id !== mapped.id)]);
  };

  const handlePreview = (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    navigate(`/resources/${resourceId}?mode=preview`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-6xl mx-auto py-4 md:py-6 px-0">
        {/* Header */}
        <div className="flex flex-col px-4 sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 campus-animate-fade-in px-0">
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
              disabled={isRefreshing}
              className="gap-2"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Actualiser
            </Button>
            <UploadResourceModal onResourceUploaded={handleResourceUploaded}>
              <Button
                size="sm"
                className="campus-gradient text-white hover:opacity-90 gap-2 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                <span className="inline">Uploader</span>
              </Button>
            </UploadResourceModal>
          </div>
        </div>

        {/* Tab Navigation */}
        <ul className="grid grid-flow-col text-center border-b border-gray-200 text-gray-500 mb-6">
          {[
            { id: "all", label: "Toutes" },
            { id: "suggestions", label: "Suggestions" },
            { id: "recent", label: "Récentes" },
          ].map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex justify-center border-b-4 py-4 transition-all duration-200 text-sm font-medium",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent hover:text-primary hover:border-primary"
                )}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        {/* ======= CONTENT ======= */}
        {activeTab === "all" && (
          <>
            {/* Filters */}
            <Card className={cardClasses}>
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
                  className={cardClasses}
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
                          Par {resource.authorName || "Utilisateur"}
                        </p>
                        <span className="flex items-center gap-1 text-primary">
                          <Zap className="h-3 w-3" />
                          {resource.impactScore || 0}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs mb-2">
                        {types.find((t) => t.value === resource.type)?.label}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 flex-1 text-xs gap-1"
                          onClick={(e) => handlePreview(e, resource.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-7 flex-1 text-xs gap-1 ${
                            savedResources.has(resource.id)
                              ? "text-blue-500 hover:text-blue-600"
                              : ""
                          }`}
                          onClick={(e) => handleSave(e, resource.id)}
                        >
                          <Bookmark
                            className={`h-3 w-3 ${
                              savedResources.has(resource.id) ? "fill-current" : ""
                            }`}
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 flex-1 text-xs gap-1 campus-gradient text-white"
                          onClick={(e) => handleDownload(e, resource.id)}
                          disabled={downloadingIds.has(resource.id)}
                        >
                          {downloadingIds.has(resource.id) ? (
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
          </>
        )}

        {activeTab === "suggestions" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {getSortedResources().map((resource) => (
              <Card
                key={resource.id}
                className={cardClasses}
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
                        Par {resource.authorName || "Utilisateur"}
                      </p>
                      <span className="flex items-center gap-1 text-primary">
                        <Zap className="h-3 w-3" />
                        {resource.impactScore || 0}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs mb-2">
                      {types.find((t) => t.value === resource.type)?.label}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 flex-1 text-xs gap-1"
                        onClick={(e) => handlePreview(e, resource.id)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 flex-1 text-xs gap-1 ${
                          savedResources.has(resource.id)
                            ? "text-blue-500 hover:text-blue-600"
                            : ""
                        }`}
                        onClick={(e) => handleSave(e, resource.id)}
                      >
                        <Bookmark
                          className={`h-3 w-3 ${
                            savedResources.has(resource.id) ? "fill-current" : ""
                          }`}
                        />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 flex-1 text-xs gap-1 campus-gradient text-white"
                        onClick={(e) => handleDownload(e, resource.id)}
                        disabled={downloadingIds.has(resource.id)}
                      >
                        {downloadingIds.has(resource.id) ? (
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
        )}

        {activeTab === "recent" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {getSortedResources().map((resource) => (
              <Card
                key={resource.id}
                className={cardClasses}
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
                        Par {resource.authorName || "Utilisateur"}
                      </p>
                      <span className="flex items-center gap-1 text-primary">
                        <Zap className="h-3 w-3" />
                        {resource.impactScore || 0}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs mb-2">
                      {types.find((t) => t.value === resource.type)?.label}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 flex-1 text-xs gap-1"
                        onClick={(e) => handlePreview(e, resource.id)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 flex-1 text-xs gap-1 ${
                          savedResources.has(resource.id)
                            ? "text-blue-500 hover:text-blue-600"
                            : ""
                        }`}
                        onClick={(e) => handleSave(e, resource.id)}
                      >
                        <Bookmark
                          className={`h-3 w-3 ${
                            savedResources.has(resource.id) ? "fill-current" : ""
                          }`}
                        />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 flex-1 text-xs gap-1 campus-gradient text-white"
                        onClick={(e) => handleDownload(e, resource.id)}
                        disabled={downloadingIds.has(resource.id)}
                      >
                        {downloadingIds.has(resource.id) ? (
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
        )}

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
