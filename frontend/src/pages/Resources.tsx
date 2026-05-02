import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  listResources,
  getCurrentUser,
  downloadResource,
  saveResource,
  getSavedResources,
  listFolders,
  deleteFolder,
  downloadFolderZip,
  type ResourceFolder,
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
import { ResourceCard } from "@/components/resources/ResourceCard";
import { FolderCard } from "@/components/resources/FolderCard";
import { CreateFolderModal } from "@/components/modals/CreateFolderModal";
import { EmptyState } from "@/components/ui/empty-state";
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

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [savedResources, setSavedResources] = useState<Set<string>>(new Set());

  const [resources, setResources] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Folders state
  const [showFoldersTab, setShowFoldersTab] = useState(false);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<ResourceFolder | null>(null);
  const [folderResources, setFolderResources] = useState<any[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ResourceFolder | null>(null);

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
      const { getFolderDetail } = await import('@/services/api');
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
        description: error?.message || "Impossible de rafraichir les ressources",
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
              Partagez et accédez aux ressources partagées par la communautés
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
              <span className="hidden sm:inline">Actualiser</span>

            </Button>
            <UploadResourceModal onResourceUploaded={handleResourceUploaded}>
              <Button
                size="sm"
                className="campus-gradient text-white hover:opacity-90 gap-2 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Uploader</span>

              </Button>
            </UploadResourceModal>
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
                  <SelectTrigger><SelectValue placeholder="MatiÃ¨re" /></SelectTrigger>
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
        </Card>

        {/* Tab Navigation */}
        <div>
        <ul className="grid grid-flow-col text-center border-b border-gray-200 text-gray-500 mb-6">
          {[
            { id: "all", label: "Toutes" },
            { id: "suggestions", label: "Suggestions" },
          ].map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => { setActiveTab(tab.id as ResourceSortKey); setShowFoldersTab(false); }}
                className={cn(
                  "w-full flex justify-center border-b-4 py-4 transition-all duration-200 text-sm font-medium",
                  !showFoldersTab && resolvedResourceSort === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent hover:text-primary hover:border-primary"
                )}
              >
                {tab.label}
              </button>
            </li>
          ))}
          {currentUser && (
            <li>
              <button
                onClick={() => { setShowFoldersTab(true); loadFolders(); }}
                className={cn(
                  "w-full flex justify-center border-b-4 py-4 transition-all duration-200 text-sm font-medium",
                  showFoldersTab
                    ? "border-primary text-primary"
                    : "border-transparent hover:text-primary hover:border-primary"
                )}
              >
                Dossiers
              </button>
            </li>
          )}
        </ul>
        </div>

        {/* ======= FOLDERS TAB ======= */}
        {showFoldersTab ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">
                Mes dossiers ({folders.length}/4)
              </h2>
              <button
                className={cn(
                  "text-sm font-medium px-3 py-1.5 rounded-lg transition-all",
                  folders.length >= 4
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-primary hover:bg-primary/10"
                )}
                onClick={() => { setEditingFolder(null); setShowCreateFolder(true); }}
                disabled={folders.length >= 4}
              >
                + Nouveau dossier
              </button>
            </div>

            {foldersLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-36 bg-muted/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : folders.length === 0 ? (
              <EmptyState
                icon={Folder}
                title="Aucun dossier"
                description="Créez jusqu'à 3 dossiers pour organiser vos ressources."
                actionLabel="Créer un dossier"
                onAction={() => setShowCreateFolder(true)}
              />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {folders.map(folder => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    isSelected={selectedFolder?.id === folder.id}
                    onOpen={handleOpenFolder}
                    onDownloadZip={async (f) => {
                      await downloadFolderZip(f.id, f.name);
                      toast({ title: 'Téléchargement du ZIP en cours...' });
                    }}
                    onEdit={(f) => { setEditingFolder(f); setShowCreateFolder(true); }}
                    onDelete={handleDeleteFolder}
                  />
                ))}
              </div>
            )}

            {selectedFolder && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{selectedFolder.name}</h3>
                  <span className="text-xs text-muted-foreground ml-auto">{folderResources.length} fichier{folderResources.length !== 1 ? 's' : ''}</span>
                </div>
                {folderResources.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Ce dossier est vide.</p>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {folderResources.map((resource) => (
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
            )}
          </div>
        ) : (
        <>
        {loading ? (

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <ResourceSkeleton key={i} />
            ))}
          </div>
        ) : getSortedResources().length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucune ressource trouvée"
            description="Aucun fichier ne correspond à vos critères. Essayez de changer de sujet ou de type."
            actionLabel="Tout voir"
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

        {!loading && filteredResources.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune ressource trouvée</h3>
            <p className="text-muted-foreground mb-6">
              Soyez le premier a partager une ressource dans cette catégorie !
            </p>
            <UploadResourceModal onResourceUploaded={handleResourceUploaded}>
              <Button className="campus-gradient text-white hover:opacity-90">
                Partager une ressource
              </Button>
            </UploadResourceModal>
          </div>
        )}
        </>
        )}

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
      </div>
    </div>
  );
}
