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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedPatternTabsList, SharedPatternTabsTrigger } from "@/components/ui/shared-pattern-tabs";
import { SharedFilterSortBar } from "@/components/ui/shared-filter-sort-bar";
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
import { getSubjectLabel, getTypeLabel, normalizeSubject } from "@/lib/resourceMetadata";
import {
  DEFAULT_SORT,
  RESOURCE_SORT_KEYS,
  type ResourceSortKey,
  ensureValidSortKey,
} from "@/constants/defaultSort";

function mapResourceCard(r: any) {
  return {
    id: String(r.id),
    title: r.title,
    description: r.description || "",
    subject: normalizeSubject(r.subject),
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

  const [activeTab, setActiveTab] = useState<ResourceSortKey>(DEFAULT_SORT.resources);

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

  const resolvedResourceSort = ensureValidSortKey(activeTab, RESOURCE_SORT_KEYS, DEFAULT_SORT.resources);

  const hasActiveFilters =
    searchTerm.trim().length > 0 || selectedSubject !== "all" || selectedType !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedSubject("all");
    setSelectedType("all");
    setActiveTab(DEFAULT_SORT.resources);
  };


  const getSortedResources = () => {
    const sorted = [...filteredResources];

    switch (resolvedResourceSort) {
      case "all":
        return sorted;
      case "suggestions":
        return sorted.sort((a, b) => b.impactScore - a.impactScore);
      case "recent":
        return sorted.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
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

        <Tabs
          value={resolvedResourceSort}
          onValueChange={(value) => setActiveTab(value as ResourceSortKey)}
          className="space-y-6"
        >
          <SharedPatternTabsList>
            <SharedPatternTabsTrigger value="all">Toutes</SharedPatternTabsTrigger>
            <SharedPatternTabsTrigger value="suggestions">Suggestions</SharedPatternTabsTrigger>
            <SharedPatternTabsTrigger value="recent">Récentes</SharedPatternTabsTrigger>
          </SharedPatternTabsList>

          <SharedFilterSortBar
            searchValue={searchTerm}
            onSearchValueChange={setSearchTerm}
            searchPlaceholder="Rechercher..."
            hasActiveFilters={hasActiveFilters || resolvedResourceSort !== DEFAULT_SORT.resources}
            onReset={handleResetFilters}
            controls={
              <>
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
              </>
            }
          />

          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {getSortedResources().map((resource) => (
                <Card
                  key={resource.id}
                  className={cardClasses}
                  onClick={() => navigate(`/resources/${resource.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="mb-0 flex h-24 items-center justify-center rounded-t-lg bg-input">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="px-2 py-2">
                      <h3 className="mb-2 flex-1 line-clamp-2 text-sm font-semibold">{resource.title}</h3>
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <p className="text-left">Par {resource.authorName || "Utilisateur"}</p>
                        <span className="flex items-center gap-1 text-primary">
                          <Zap className="h-3 w-3" />
                          {resource.impactScore || 0}
                        </span>
                      </div>
                      <div className="mb-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(resource.type)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getSubjectLabel(resource.subject)}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 flex-1 gap-1 text-xs"
                          onClick={(e) => handlePreview(e, resource.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-7 flex-1 gap-1 text-xs ${
                            savedResources.has(resource.id)
                              ? "text-blue-500 hover:text-blue-600"
                              : ""
                          }`}
                          onClick={(e) => handleSave(e, resource.id)}
                        >
                          <Bookmark
                            className={`h-3 w-3 ${savedResources.has(resource.id) ? "fill-current" : ""}`}
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="campus-gradient h-7 flex-1 gap-1 text-xs text-white"
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
          </TabsContent>

          <TabsContent value="suggestions" className="mt-0">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {getSortedResources().map((resource) => (
                <Card
                  key={resource.id}
                  className={cardClasses}
                  onClick={() => navigate(`/resources/${resource.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="mb-0 flex h-24 items-center justify-center rounded-t-lg bg-input">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="px-2 py-2">
                      <h3 className="mb-2 flex-1 line-clamp-2 text-sm font-semibold">{resource.title}</h3>
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <p className="text-left">Par {resource.authorName || "Utilisateur"}</p>
                        <span className="flex items-center gap-1 text-primary">
                          <Zap className="h-3 w-3" />
                          {resource.impactScore || 0}
                        </span>
                      </div>
                      <div className="mb-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">{getTypeLabel(resource.type)}</Badge>
                        <Badge variant="secondary" className="text-xs">{getSubjectLabel(resource.subject)}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 flex-1 gap-1 text-xs" onClick={(e) => handlePreview(e, resource.id)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-7 flex-1 gap-1 text-xs ${savedResources.has(resource.id) ? "text-blue-500 hover:text-blue-600" : ""}`}
                          onClick={(e) => handleSave(e, resource.id)}
                        >
                          <Bookmark className={`h-3 w-3 ${savedResources.has(resource.id) ? "fill-current" : ""}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="campus-gradient h-7 flex-1 gap-1 text-xs text-white"
                          onClick={(e) => handleDownload(e, resource.id)}
                          disabled={downloadingIds.has(resource.id)}
                        >
                          {downloadingIds.has(resource.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {getSortedResources().map((resource) => (
                <Card
                  key={resource.id}
                  className={cardClasses}
                  onClick={() => navigate(`/resources/${resource.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="mb-0 flex h-24 items-center justify-center rounded-t-lg bg-input">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="px-2 py-2">
                      <h3 className="mb-2 flex-1 line-clamp-2 text-sm font-semibold">{resource.title}</h3>
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <p className="text-left">Par {resource.authorName || "Utilisateur"}</p>
                        <span className="flex items-center gap-1 text-primary">
                          <Zap className="h-3 w-3" />
                          {resource.impactScore || 0}
                        </span>
                      </div>
                      <div className="mb-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">{getTypeLabel(resource.type)}</Badge>
                        <Badge variant="secondary" className="text-xs">{getSubjectLabel(resource.subject)}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 flex-1 gap-1 text-xs" onClick={(e) => handlePreview(e, resource.id)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-7 flex-1 gap-1 text-xs ${savedResources.has(resource.id) ? "text-blue-500 hover:text-blue-600" : ""}`}
                          onClick={(e) => handleSave(e, resource.id)}
                        >
                          <Bookmark className={`h-3 w-3 ${savedResources.has(resource.id) ? "fill-current" : ""}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="campus-gradient h-7 flex-1 gap-1 text-xs text-white"
                          onClick={(e) => handleDownload(e, resource.id)}
                          disabled={downloadingIds.has(resource.id)}
                        >
                          {downloadingIds.has(resource.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
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
