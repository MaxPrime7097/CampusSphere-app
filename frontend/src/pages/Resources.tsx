import { useState, useMemo, Suspense, lazy, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  listResources,
  listFolders,
  getFolderDetail,
  downloadResource,
  saveResource,
  getSavedResources,
  deleteFolder,
  downloadFolderZip,
} from "@/services/api";
import {
  Search,
  Upload,
  FileText,
  Bookmark,
  Loader2,
  RefreshCw,
  Folder,
  FolderOpen,
  Plus,
  X,
  Filter,
  BookOpen,
  FileSpreadsheet,
  GraduationCap,
  FolderGit2,
  Presentation,
  Archive,
  Layers,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openVerificationModal } from "@/lib/events";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { RESOURCE_TYPE_OPTIONS, normalizeResourceType } from "@/constants/resourceTypes";
import {
  DEFAULT_SORT,
  type ResourceSortKey,
} from "@/constants/defaultSort";
import { ResourceSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const UploadResourceModal = lazy(() =>
  import("@/components/modals/UploadResourceModal").then((module) => ({
    default: module.UploadResourceModal,
  }))
);
const CreateFolderModal = lazy(() =>
  import("@/components/modals/CreateFolderModal").then((module) => ({
    default: module.CreateFolderModal,
  }))
);

const RESOURCE_CHIPS = [
  { value: "all", label: "Toutes les ressources", icon: Layers },
  { value: "notes", label: "Notes de cours", icon: BookOpen },
  { value: "resumes", label: "Résumés & Fiches", icon: FileText },
  { value: "exercises", label: "Exercices & TD", icon: FileSpreadsheet },
  { value: "exam_papers", label: "Épreuves d'examen", icon: GraduationCap },
  { value: "annales", label: "Annales corrigées", icon: Archive },
  { value: "projects", label: "Projets & Rapports", icon: FolderGit2 },
  { value: "presentations", label: "Présentations / Slides", icon: Presentation },
] as const;

function mapResourceCard(r: any) {
  return {
    id: String(r.id),
    title: r.title,
    description: r.description || "",
    type: normalizeResourceType(r.type),
    authorId: r.authorId || r.author || r.created_by,
    authorName: r.author?.name || r.author_info?.name || r.author_name || "Membre CampusSphere",
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
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedFileFormat, setSelectedFileFormat] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isUploadResourceOpen, setIsUploadResourceOpen] = useState(false);

  const [viewAllCategory, setViewAllCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Folder states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [folderResources, setFolderResources] = useState<any[]>([]);

  // Action states
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [savedResources, setSavedResources] = useState<Set<string>>(new Set());
  const [resources, setResources] = useState<any[]>([]);

  // Fetch Resources
  const resourcesQuery = useQuery({
    queryKey: ["resources"],
    queryFn: listResources,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch Folders
  const foldersQuery = useQuery({
    queryKey: ["resource-folders"],
    queryFn: listFolders,
    enabled: Boolean(currentUser?.id),
    retry: false,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch Saved Resources
  const savedResourcesQuery = useQuery({
    queryKey: ["saved-resources"],
    queryFn: getSavedResources,
    enabled: Boolean(currentUser?.id),
    retry: false,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (resourcesQuery.data) {
      const raw = Array.isArray(resourcesQuery.data)
        ? resourcesQuery.data
        : (resourcesQuery.data as any)?.data || [];
      setResources(raw.map(mapResourceCard));
    }
  }, [resourcesQuery.data]);

  useEffect(() => {
    if (savedResourcesQuery.data) {
      const raw = Array.isArray(savedResourcesQuery.data)
        ? savedResourcesQuery.data
        : (savedResourcesQuery.data as any)?.data || [];
      setSavedResources(new Set(raw.map((r: any) => String(r.id))));
    }
  }, [savedResourcesQuery.data]);

  const folders = foldersQuery.data || [];
  const foldersLoading = foldersQuery.isLoading;

  const handleOpenFolder = async (folder: any) => {
    setSelectedFolder(folder);
    try {
      const res = await getFolderDetail(folder.id);
      const items = Array.isArray(res) ? res : (res as any)?.resources || (res as any)?.data || [];
      setFolderResources(items.map(mapResourceCard));
    } catch {
      setFolderResources([]);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      await queryClient.invalidateQueries({ queryKey: ["resource-folders"] });
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null);
        setFolderResources([]);
      }
      toast({ title: "Dossier supprimé", description: "Le dossier a bien été supprimé." });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Impossible de supprimer le dossier", variant: "destructive" });
    }
  };

  const handleDownload = async (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    if (!currentUser?.isVerified) {
      toast({
        title: "Compte non certifié",
        description: "Certifiez votre compte pour télécharger des ressources.",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
            Vérifier
          </Button>
        ),
      });
      return;
    }

    setDownloadingIds((prev) => new Set(prev).add(resourceId));
    try {
      await downloadResource(resourceId);
      toast({ title: "Téléchargement réussi", description: "La ressource a été téléchargée." });
    } catch (error: any) {
      toast({ title: "Erreur", description: error?.message || "Impossible de télécharger la ressource", variant: "destructive" });
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
    }
  };

  const handleSave = async (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    try {
      const newSaved = new Set(savedResources);
      const res = await saveResource(resourceId);
      const isSaved = Boolean(res?.data?.saved);
      if (isSaved) {
        newSaved.add(resourceId);
      } else {
        newSaved.delete(resourceId);
      }
      setSavedResources(newSaved);
      setResources((prev) =>
        prev.map((r) => (r.id === resourceId ? { ...r, isSaved } : r))
      );
      toast({
        title: isSaved ? "Ressource enregistrée" : "Ressource retirée",
        description: isSaved ? "Ajoutée à vos favoris." : "Retirée de vos favoris.",
      });
    } catch (error: any) {
      toast({ title: "Erreur", description: error?.message || "Action impossible", variant: "destructive" });
    }
  };

  const handlePreview = (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    navigate(`/resources/${resourceId}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        resourcesQuery.refetch(),
        foldersQuery.refetch(),
        savedResourcesQuery.refetch(),
      ]);
      toast({ title: "Ressources actualisées", description: "La bibliothèque est à jour." });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'actualiser", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResourceUploaded = () => {
    resourcesQuery.refetch();
  };

  // Filtered resources based on search, type chip and file format
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        r.title?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.tags?.some((t: string) => t.toLowerCase().includes(term));

      const matchesType =
        selectedType === "all" ||
        r.type === selectedType ||
        (selectedType === "notes" && (r.type === "notes" || r.type === "resumes")) ||
        (selectedType === "annales" && (r.type === "annales" || r.type === "exam_papers"));

      const ext = r.fileUrl?.split(".").pop()?.toLowerCase() || "";
      const matchesFormat =
        selectedFileFormat === "all" ||
        (selectedFileFormat === "pdf" && ext === "pdf") ||
        (selectedFileFormat === "doc" && (ext === "doc" || ext === "docx")) ||
        (selectedFileFormat === "image" && ["jpg", "jpeg", "png", "webp"].includes(ext));

      return matchesSearch && matchesType && matchesFormat;
    });
  }, [resources, searchTerm, selectedType, selectedFileFormat]);

  const fileFormats = [
    { value: "all", label: "Tous les formats" },
    { value: "pdf", label: "Documents PDF" },
    { value: "doc", label: "Word (.docx)" },
    { value: "image", label: "Images" },
  ];

  const isFiltering =
    searchTerm.trim() !== "" || selectedType !== "all" || selectedFileFormat !== "all";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 space-y-6 animate-in fade-in duration-300">
        {/* ─── Top Header (Standardisé & Harmonisé) ─── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 campus-animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Ressources Académiques
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Consultez, partagez et téléchargez les cours, annales corrigées, fiches et TD du campus
            </p>
          </div>

          <div className="flex w-full sm:w-auto gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || resourcesQuery.isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", (isRefreshing || resourcesQuery.isFetching) && "animate-spin")} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>

            {currentUser?.isVerified ? (
              <>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-1 sm:flex-none font-semibold"
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
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-1 sm:flex-none font-semibold"
                onClick={() => {
                  toast({
                    title: "Compte non certifié",
                    description: "Certifiez votre compte pour partager des ressources.",
                    variant: "destructive",
                    action: (
                      <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
                        Vérifier
                      </Button>
                    ),
                  });
                }}
              >
                <Upload className="h-4 w-4" />
                <span>Uploader</span>
              </Button>
            )}
          </div>
        </div>

        {/* ─── Search & Filters Bar (Épuré sans boîte de carte) ─── */}
        <div className="space-y-3">
          {/* Top Row: Search Input + Format Select */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par matière, mot-clé, cours ou auteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-9 text-xs rounded-xl h-10 border-border/80 bg-card focus-visible:ring-primary shadow-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowMobileFilters((v) => !v)}
              className={cn(
                "sm:hidden h-10 w-10 rounded-xl shrink-0 border-border/80",
                showMobileFilters || selectedFileFormat !== "all"
                  ? "border-primary text-primary bg-primary/5"
                  : ""
              )}
              title="Filtres"
            >
              <Filter className="h-4 w-4" />
            </Button>

            {/* Desktop Format Select */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Select value={selectedFileFormat} onValueChange={setSelectedFileFormat}>
                <SelectTrigger className="w-52 h-10 rounded-xl text-xs border-border/80 bg-card">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  {fileFormats.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="text-xs">
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isFiltering && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedType("all");
                    setSelectedFileFormat("all");
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
              <Select value={selectedFileFormat} onValueChange={setSelectedFileFormat}>
                <SelectTrigger className="w-full h-10 rounded-xl text-xs border-border/80 bg-card">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  {fileFormats.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="text-xs">
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isFiltering && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedType("all");
                    setSelectedFileFormat("all");
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
            {RESOURCE_CHIPS.map((chip) => {
              const isSelected = selectedType === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setSelectedType(chip.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Main Content (Filtered Grid or Dashboard Carousels) ─── */}
        {isFiltering ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-muted-foreground">
                {filteredResources.length}{" "}
                {filteredResources.length > 1 ? "ressources trouvées" : "ressource trouvée"}
              </span>
            </div>

            {resourcesQuery.isLoading ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ResourceSkeleton key={i} />
                ))}
              </div>
            ) : filteredResources.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Aucune ressource trouvée"
                description="Essayez d'ajuster vos filtres ou effectuez une recherche avec d'autres termes."
                actionLabel="Tout réinitialiser"
                onAction={() => {
                  setSearchTerm("");
                  setSelectedType("all");
                  setSelectedFileFormat("all");
                }}
              />
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredResources.map((resource) => (
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
        ) : viewAllCategory ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewAllCategory(null)}
                className="rounded-xl text-xs"
              >
                Retour
              </Button>
              <h2 className="text-lg font-bold text-foreground capitalize">
                {RESOURCE_TYPE_OPTIONS.find((opt) => opt.value === viewAllCategory)?.label ||
                  viewAllCategory}
              </h2>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredResources
                .filter((r) => r.type === viewAllCategory)
                .map((resource) => (
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
        ) : (
          <div className="flex flex-col gap-10 mt-6 pb-12">
            {/* Row 1: Mes Dossiers */}
            {(currentUser || localStorage.getItem("access")) && (
              <section className="flex flex-col w-full max-w-full overflow-hidden">
                <div className="flex justify-between items-center mb-3 px-1">
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Mes Dossiers ({folders.length}/4)
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-xs text-muted-foreground hover:text-foreground font-semibold",
                      folders.length >= 4 && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => {
                      setEditingFolder(null);
                      setShowCreateFolder(true);
                    }}
                    disabled={folders.length >= 4}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Nouveau dossier
                  </Button>
                </div>

                <NetflixCarousel className="gap-4 pb-1">
                  {foldersLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="cs-scroll-item w-[220px] sm:w-[260px] h-32 bg-muted/40 rounded-2xl animate-pulse"
                      />
                    ))
                  ) : folders.length === 0 ? (
                    <div
                      className="cs-scroll-item w-[220px] sm:w-[260px] h-32 border border-border/70 rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-all bg-card/50"
                      onClick={() => setShowCreateFolder(true)}
                    >
                      <Folder className="h-6 w-6 mb-2 text-primary/70" />
                      <span className="text-xs font-semibold">Créer un dossier</span>
                    </div>
                  ) : (
                    folders.map((folder) => (
                      <div key={folder.id} className="cs-scroll-item w-[220px] sm:w-[260px]">
                        <FolderCard
                          folder={folder}
                          isSelected={selectedFolder?.id === folder.id}
                          onOpen={handleOpenFolder}
                          onDownloadZip={async (f) => {
                            if (!currentUser?.isVerified) {
                              toast({
                                title: "Compte non certifié",
                                description: "Certifiez votre compte pour télécharger des dossiers ZIP.",
                                variant: "destructive",
                                action: (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openVerificationModal()}
                                  >
                                    Vérifier
                                  </Button>
                                ),
                              });
                              return;
                            }
                            await downloadFolderZip(f.id, f.name);
                            toast({ title: "Téléchargement en cours..." });
                          }}
                          onEdit={(f) => {
                            setEditingFolder(f);
                            setShowCreateFolder(true);
                          }}
                          onDelete={handleDeleteFolder}
                        />
                      </div>
                    ))
                  )}
                </NetflixCarousel>

                {/* Expanded Selected Folder */}
                {selectedFolder && (
                  <div className="mt-4 bg-muted/30 p-4 rounded-2xl border border-border/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        <h3 className="font-bold text-sm text-foreground">{selectedFolder.name}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setSelectedFolder(null)}
                      >
                        Fermer
                      </Button>
                    </div>
                    {folderResources.length === 0 ? (
                      <div className="py-6 text-center text-muted-foreground text-xs">
                        Ce dossier est actuellement vide.
                      </div>
                    ) : (
                      <NetflixCarousel className="gap-4 pb-1">
                        {folderResources.map((resource) => (
                          <div key={resource.id} className="cs-scroll-item w-[200px] sm:w-[260px]">
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

            {/* Row 2: Suggestions Populaires */}
            {(() => {
              const suggestions = [...filteredResources]
                .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
                .slice(0, 10);
              if (suggestions.length === 0 || resourcesQuery.isLoading) return null;
              return (
                <section>
                  <h2 className="text-base sm:text-lg font-bold mb-3 px-1 text-foreground">
                    Ressources Recommandées & Populaires
                  </h2>
                  <NetflixCarousel className="gap-4 pb-1">
                    {suggestions.map((resource) => (
                      <div key={resource.id} className="cs-scroll-item w-[220px] sm:w-[260px]">
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

            {/* Rows 3+: Par Catégorie / Type */}
            {RESOURCE_TYPE_OPTIONS.map((opt) => {
              const categoryResources = filteredResources.filter((r) => r.type === opt.value);
              if (categoryResources.length === 0 && !resourcesQuery.isLoading) return null;

              return (
                <section key={opt.value}>
                  <div className="flex justify-between items-center mb-3 px-1">
                    <h2 className="text-base sm:text-lg font-bold text-foreground">{opt.label}</h2>
                    {categoryResources.length > 4 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                        onClick={() => setViewAllCategory(opt.value)}
                      >
                        Voir tout ({categoryResources.length})
                      </Button>
                    )}
                  </div>
                  <NetflixCarousel className="gap-4 pb-1">
                    {resourcesQuery.isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="cs-scroll-item w-[220px] sm:w-[260px]">
                          <ResourceSkeleton />
                        </div>
                      ))
                    ) : (
                      categoryResources.map((resource) => (
                        <div key={resource.id} className="cs-scroll-item w-[220px] sm:w-[260px]">
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
        )}

        {showCreateFolder && (
          <Suspense fallback={<ModalLoadingFallback />}>
            <CreateFolderModal
              open={showCreateFolder}
              onOpenChange={setShowCreateFolder}
              existingCount={folders.length}
              folder={editingFolder}
              onSuccess={async (folder) => {
                await queryClient.invalidateQueries({ queryKey: ["resource-folders"] });
                if (editingFolder && selectedFolder?.id === folder.id) {
                  setSelectedFolder(folder);
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
