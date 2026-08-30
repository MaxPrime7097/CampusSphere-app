import { Suspense, lazy, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  listResources,
  downloadResource,
  saveResource,
  getSavedResources,
  listFolders,
  deleteFolder,
  downloadFolderZip,
  type ResourceFolder,
  getFolderDetail,
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
  Filter,
  FolderPlus,
  Folder,
  FolderOpen,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openVerificationModal } from "@/lib/events";
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
import { ResourceCard } from "@/components/resources/ResourceCard";
import { FolderCard } from "@/components/resources/FolderCard";
import { NetflixCarousel } from "@/components/ui/netflix-carousel";
import { cn, formatFileSize } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { RESOURCE_TYPE_OPTIONS, normalizeResourceType } from "@/constants/resourceTypes";
import { getSubjectLabel, getTypeLabel, normalizeSubject } from "@/lib/resourceMetadata";
import {
  DEFAULT_SORT,
  RESOURCE_SORT_KEYS,
  type ResourceSortKey,
  ensureValidSortKey,
} from "@/constants/defaultSort";
import { ResourceSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

const UploadResourceModal = lazy(() => import("@/components/modals/UploadResourceModal").then((module) => ({ default: module.UploadResourceModal })));
const CreateFolderModal = lazy(() => import("@/components/modals/CreateFolderModal").then((module) => ({ default: module.CreateFolderModal })));

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
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [isUploadResourceOpen, setIsUploadResourceOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<ResourceSortKey>(DEFAULT_SORT.resources);
  const [viewAllCategory, setViewAllCategory] = useState<string | null>(null);

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [savedResources, setSavedResources] = useState<Set<string>>(new Set());

  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Folders state
  const [showFoldersTab, setShowFoldersTab] = useState(false);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<ResourceFolder | null>(null);
  const [folderResources, setFolderResources] = useState<any[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ResourceFolder | null>(null);
  const resourcesQuery = useQuery({
    queryKey: ["resources"],
    queryFn: listResources,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (Array.isArray(resourcesQuery.data)) {
      setResources(resourcesQuery.data.map(mapResourceCard));
      setLoading(false);
      return;
    }

    if (resourcesQuery.isLoading) {
      setLoading(true);
      return;
    }

    if (resourcesQuery.error) {
      setLoading(false);
      toast({
        title: "Erreur",
        description: (resourcesQuery.error as any)?.message || "Impossible de charger les ressources",
        variant: "destructive",
      });
    }
  }, [resourcesQuery.data, resourcesQuery.error, resourcesQuery.isLoading, toast]);

  const loadFolders = async () => {
    setFoldersLoading(true);
    try {
      const data = await listFolders();
      setFolders(data);
    } catch (e) {
      // silently fail if not authenticated or no folders yet
    } finally {
      setFoldersLoading(false);
    }
  };

  const handleOpenFolder = async (folder: ResourceFolder) => {
    if (selectedFolder?.id === folder.id) {
      setSelectedFolder(null);
      setFolderResources([]);
      return;
    }
    setSelectedFolder(folder);
    try {
      
      const detail = await getFolderDetail(folder.id);
      setFolderResources((detail.resources || []).map(mapResourceCard));
    } catch {
      setFolderResources([]);
    }
  };

  const handleDeleteFolder = async (folder: ResourceFolder) => {
    if (!confirm(`Supprimer le dossier "${folder.name}" ? Les fichiers resteront accessibles.`)) return;
    try {
      await deleteFolder(folder.id);
      setFolders(prev => prev.filter(f => f.id !== folder.id));
      if (selectedFolder?.id === folder.id) {
        setSelectedFolder(null);
        setFolderResources([]);
      }
      toast({ title: 'Dossier supprimé' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message, variant: 'destructive' });
    }
  };

  const subjects = [
    { value: "all", label: "Toutes matières" },
    { value: "math", label: "Mathématiques" },
    { value: "cs", label: "Informatique" },
    { value: "physics", label: "Physique" },
    { value: "economics", label: "Économie" },
    { value: "language", label: "Langues" },
  ];

  const types = [{ value: "all", label: "Tous types" }, ...RESOURCE_TYPE_OPTIONS];

  const savedResourcesQuery = useQuery({
    queryKey: ["saved-resources"],
    queryFn: getSavedResources,
    enabled: Boolean(currentUser?.id),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (savedResourcesQuery.data) {
      const savedIds = new Set(savedResourcesQuery.data.map((r: any) => String(r.id || r.resource_id)));
      setSavedResources(savedIds);
    }
  }, [savedResourcesQuery.data]);

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
    if (!currentUser?.isVerified) {
      toast({
        title: "Compte non certifié",
        description: "Vérifiez votre compte pour télécharger des ressources.",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>Vérifier</Button>
        )
      });
      return;
    }
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
      const result = await resourcesQuery.refetch();
      const mapped = (result.data || []).map(mapResourceCard);
      setResources(mapped);

      toast({
        title: "Ressources actualisées",
        description: "La liste des ressources a été mise à jour",
        duration: 2000,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de rafraichir les ressources",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const cardClasses = cn(
    "transition-all duration-200",
    isMobile
      ? "rounded-none border-x-0 border-t-0 shadow-none bg-card"
      : "cs-card"
  );

  const handleResourceUploaded = (resource?: unknown) => {
    if (!resource) {
      void resourcesQuery.refetch();
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
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-4 md:py-5 px-0">
        {/* Header */}
        <div className="flex flex-col px-4 sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 campus-animate-fade-in px-0">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground">
              Ressources Étudiantes
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Partagez et accédez aux ressources partagées par la communautés
            </p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
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
              <span className="hidden sm:inline">Actualiser</span>

            </Button>
            {isAuthLoading ? (
              <Button size="sm" variant="outline" className="gap-2 w-full sm:w-auto opacity-70" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Chargement...</span>
              </Button>
            ) : currentUser?.isVerified ? (
              <>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-1 sm:flex-none"
                  onClick={() => setIsUploadResourceOpen(true)}
                >
                  <Upload className="h-4 w-4" />
                  <span>Uploader</span>
                </Button>
                {isUploadResourceOpen && (
                  <Suspense fallback={<ModalLoadingFallback />}>
                    <UploadResourceModal
                      open={isUploadResourceOpen}
                      onOpenChange={setIsUploadResourceOpen}
                      onResourceUploaded={handleResourceUploaded}
                    />
                  </Suspense>
                )}
              </>
            ) : (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-1 sm:flex-none"
                onClick={() => {
                  toast({
                    title: "Compte non vérifié",
                    description: "Vérifiez votre compte pour uploader des ressources.",
                    variant: "destructive",
                    action: (
                      <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>Vérifier</Button>
                    )
                  });
                }}
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Uploader</span>
              </Button>
            )}
          </div>
        </div>

        {/* Recherche/Filtre */}
        <Card className={cardClasses}>
          <CardContent className="p-3 md:p-4">
            {/* Mobile: recherche + bouton filtre */}
            <div className="flex gap-2 sm:hidden">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowMobileFilters((v) => !v)}
                className={showMobileFilters ? "border-primary text-primary" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            {showMobileFilters && (
              <div className="flex flex-col gap-2 mt-2 sm:hidden">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger><SelectValue placeholder="Matière" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Desktop */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger><SelectValue placeholder="Matière" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>        {/* DASHBOARD OR SEARCH RESULTS */}
        {(() => {
          const isSearchOrFilterActive = searchTerm !== "" || selectedSubject !== "all" || selectedType !== "all";

          if (isSearchOrFilterActive) {
            return (
              <div className="mt-6">
                {loading || resourcesQuery.isLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => <ResourceSkeleton key={i} />)}
                  </div>
                ) : getSortedResources().length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="Aucune ressource trouvée"
                    description="Ajustez vos filtres pour trouver ce que vous cherchez."
                    actionLabel="Tout réinitialiser"
                    onAction={() => {
                      setSearchTerm("");
                      setSelectedSubject("all");
                      setSelectedType("all");
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {getSortedResources().map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        isDownloading={downloadingIds.has(resource.id)}
                        isSaved={savedResources.has(resource.id)}
                        onDownload={(e) => handleDownload(e, resource.id)}
                        onSave={(e) => handleSave(e, resource.id)}
                        onPreview={(e) => handlePreview(e, resource.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          if (viewAllCategory) {
            const categoryLabel = RESOURCE_TYPE_OPTIONS.find(opt => opt.value === viewAllCategory)?.label || "Catégorie";
            const categoryResources = getSortedResources().filter(r => r.type === viewAllCategory);
            
            return (
              <div className="space-y-4 mt-6">
                <div className="ml-2 flex items-center gap-8 mb-4">
                  <Button variant="outline" size="sm" onClick={() => setViewAllCategory(null)}>
                    Retour
                  </Button>
                  <h2 className="text-xl font-medium">{categoryLabel}</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {categoryResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      isDownloading={downloadingIds.has(resource.id)}
                      isSaved={savedResources.has(resource.id)}
                      onDownload={(e) => handleDownload(e, resource.id)}
                      onSave={(e) => handleSave(e, resource.id)}
                      onPreview={(e) => handlePreview(e, resource.id)}
                    />
                  ))}
                </div>
              </div>
            );
          }

          // DASHBOARD (Netflix Mode)
          return (
            <div className="flex flex-col gap-10 mt-8 pb-12">
              
              {/* Row 1: Mes Dossiers */}
              {(currentUser || localStorage.getItem('access')) && (
                <section className="flex flex-col w-full max-w-full overflow-hidden">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      Mes dossiers ({folders.length}/4)
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "text-muted-foreground hover:text-foreground",
                        folders.length >= 4 && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => { setEditingFolder(null); setShowCreateFolder(true); }}
                      disabled={folders.length >= 4}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nouveau
                    </Button>
                  </div>
                  
                  <NetflixCarousel className="gap-3 pb-1">
                    {foldersLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="cs-scroll-item w-[200px] sm:w-[250px] h-32 bg-muted/40 rounded-xl animate-pulse" />
                      ))
                    ) : folders.length === 0 ? (
                      <div className="cs-scroll-item w-[200px] sm:w-[250px] h-32 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setShowCreateFolder(true)}>
                        <Folder className="h-6 w-6 mb-2 opacity-50" />
                        <span className="text-sm font-medium">Créer un dossier</span>
                      </div>
                    ) : (
                      folders.map(folder => (
                        <div key={folder.id} className="cs-scroll-item w-[200px] sm:w-[250px]">
                          <FolderCard
                            folder={folder}
                            isSelected={selectedFolder?.id === folder.id}
                            onOpen={handleOpenFolder}
                            onDownloadZip={async (f) => {
                              if (!currentUser?.isVerified) {
                                toast({
                                  title: "Compte non certifié",
                                  description: "Vérifiez votre compte pour télécharger des dossiers.",
                                  variant: "destructive",
                                  action: (
                                    <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>Vérifier</Button>
                                  )
                                });
                                return;
                              }
                              await downloadFolderZip(f.id, f.name);
                              toast({ title: 'Téléchargement du ZIP en cours...' });
                            }}
                            onEdit={(f) => { setEditingFolder(f); setShowCreateFolder(true); }}
                            onDelete={handleDeleteFolder}
                          />
                        </div>
                      ))
                    )}
                  </NetflixCarousel>

                  {/* FOLDER CONTENTS (Expanded when selectedFolder exists) */}
                  {selectedFolder && (
                    <div className="mt-6 bg-muted/30 p-4 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2 border-b pb-2 mb-4">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{selectedFolder.name}</h3>
                        <Button variant="ghost" size="sm" className="ml-auto h-7 px-2" onClick={() => setSelectedFolder(null)}>
                          Fermer
                        </Button>
                      </div>
                      {folderResources.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                          Dossier vide
                        </div>
                      ) : (
                        <NetflixCarousel className="gap-3 pb-1">
                          {folderResources.map((resource) => (
                            <div key={resource.id} className="cs-scroll-item w-[180px] sm:w-[250px]">
                              <ResourceCard
                                resource={resource}
                                isDownloading={downloadingIds.has(resource.id)}
                                isSaved={savedResources.has(resource.id)}
                                onDownload={(e) => handleDownload(e, resource.id)}
                                onSave={(e) => handleSave(e, resource.id)}
                                onPreview={(e) => handlePreview(e, resource.id)}
                              />
                            </div>
                          ))}
                        </NetflixCarousel>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Row 2: Suggestions */}
              {(() => {
                const suggestions = [...filteredResources].sort((a, b) => b.impactScore - a.impactScore).slice(0, 10);
                if (suggestions.length === 0 || loading || resourcesQuery.isLoading) return null;
                return (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 px-1 flex items-center gap-2">Suggestions pour vous</h2>
                    <NetflixCarousel className="gap-3 pb-1">
                      {suggestions.map((resource) => (
                        <div key={resource.id} className="cs-scroll-item w-[180px] sm:w-[250px]">
                          <ResourceCard
                            resource={resource}
                            isDownloading={downloadingIds.has(resource.id)}
                            isSaved={savedResources.has(resource.id)}
                            onDownload={(e) => handleDownload(e, resource.id)}
                            onSave={(e) => handleSave(e, resource.id)}
                            onPreview={(e) => handlePreview(e, resource.id)}
                          />
                        </div>
                      ))}
                    </NetflixCarousel>
                  </section>
                );
              })()}

              {/* Rows 3+: Par Catégorie */}
              {RESOURCE_TYPE_OPTIONS.map((opt) => {
                const categoryResources = filteredResources.filter(r => r.type === opt.value);
                if (categoryResources.length === 0 && !loading && !resourcesQuery.isLoading) return null;

                return (
                  <section key={opt.value}>
                    <div className="flex justify-between items-center mb-4 px-1">
                      <h2 className="text-lg font-semibold">{opt.label}</h2>
                      {categoryResources.length > 4 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setViewAllCategory(opt.value)}
                        >
                          Voir tout ({categoryResources.length})
                        </Button>
                      )}
                    </div>
                    <NetflixCarousel className="gap-3 pb-1">
                      {loading || resourcesQuery.isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="cs-scroll-item w-[180px] sm:w-[250px]">
                            <ResourceSkeleton />
                          </div>
                        ))
                      ) : (
                        categoryResources.map((resource) => (
                          <div key={resource.id} className="cs-scroll-item w-[180px] sm:w-[250px]">
                            <ResourceCard
                              resource={resource}
                              isDownloading={downloadingIds.has(resource.id)}
                              isSaved={savedResources.has(resource.id)}
                              onDownload={(e) => handleDownload(e, resource.id)}
                              onSave={(e) => handleSave(e, resource.id)}
                              onPreview={(e) => handlePreview(e, resource.id)}
                            />
                          </div>
                        ))
                      )}
                    </NetflixCarousel>
                  </section>
                );
              })}
            </div>
          );
        })()}{showCreateFolder && (
          <Suspense fallback={<ModalLoadingFallback />}>
            <CreateFolderModal
              open={showCreateFolder}
              onOpenChange={setShowCreateFolder}
              existingCount={folders.length}
              folder={editingFolder}
              onSuccess={(folder) => {
                if (editingFolder) {
                  setFolders(prev => prev.map(f => f.id === folder.id ? folder : f));
                  if (selectedFolder?.id === folder.id) setSelectedFolder(folder);
                } else {
                  setFolders(prev => [...prev, folder]);
                }
                setEditingFolder(null);
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}





