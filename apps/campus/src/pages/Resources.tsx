import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { useToast } from "@/hooks/use-toast";
import { openVerificationModal } from "@/lib/events";
import { Button } from "@/components/ui/button";
import { normalizeResourceType } from "@/constants/resourceTypes";
import { useAuth } from "@/contexts/AuthContext";
import { getVerificationAccessStatus } from "@/utils/verification";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GridFour as LayoutGrid, List } from "@phosphor-icons/react";
import { cn, getResourceUrl } from "@/lib/utils";
import { parseSlugId, encodeHashId } from "@/lib/hashids";
import type { Resource, ResourceFolder, ResourceCardData } from "@/types";
import {
  ResourcesPageHeader,
  ResourcesFilterBar,
  ResourcesFolderSection,
  ResourcesFilteredGrid,
  ResourcesCategoryCarousels,
} from "@/components/resources";

function mapResourceCard(r: Resource | any): ResourceCardData {
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
  const { t } = useTranslation("resources");
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { canPerformAction } = getVerificationAccessStatus(currentUser);
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedFileFormat, setSelectedFileFormat] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isUploadResourceOpen, setIsUploadResourceOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [viewAllCategory, setViewAllCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Folder states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ResourceFolder | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<ResourceFolder | null>(null);
  const [folderResources, setFolderResources] = useState<ResourceCardData[]>([]);

  // Action states
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [savedResources, setSavedResources] = useState<Set<string>>(new Set());
  const [resources, setResources] = useState<ResourceCardData[]>([]);

  // Fetch Resources
  const resourcesQuery = useQuery({
    queryKey: ["resources"],
    queryFn: () => listResources(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch Folders
  const foldersQuery = useQuery({
    queryKey: ["resource-folders"],
    queryFn: () => listFolders(),
    enabled: Boolean(currentUser?.id),
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch Saved Resources
  const savedResourcesQuery = useQuery({
    queryKey: ["saved-resources"],
    queryFn: () => getSavedResources(),
    enabled: Boolean(currentUser?.id),
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
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
  const foldersLoading = foldersQuery.isLoading && folders.length === 0 && !foldersQuery.data;
  const isResourcesLoading = resourcesQuery.isLoading && resources.length === 0 && !resourcesQuery.data;

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
      toast({ title: t("page.toasts.folderDeleted"), description: t("page.toasts.folderDeletedDesc") });
    } catch (e: any) {
      toast({ title: t("page.toasts.error"), description: e?.message || t("page.toasts.deleteFolderError"), variant: "destructive" });
    }
  };

  const handleDownload = async (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    if (!canPerformAction) {
      toast({
        title: t("page.toasts.uncertifiedTitle"),
        description: t("page.toasts.uncertifiedDownloadDesc"),
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
            {t("page.toasts.certify")}
          </Button>
        ),
      });
      return;
    }

    setDownloadingIds((prev) => new Set(prev).add(resourceId));
    try {
      await downloadResource(resourceId);
      toast({ title: t("page.toasts.downloadSuccess"), description: t("page.toasts.downloadSuccessDesc") });
    } catch (error: any) {
      toast({ title: t("page.toasts.error"), description: error?.message || t("page.toasts.downloadError"), variant: "destructive" });
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
        title: isSaved ? t("page.toasts.saved") : t("page.toasts.unsaved"),
        description: isSaved ? t("page.toasts.savedDesc") : t("page.toasts.unsavedDesc"),
      });
    } catch (error: any) {
      toast({ title: t("page.toasts.error"), description: error?.message || t("page.toasts.actionError"), variant: "destructive" });
    }
  };

  const handlePreview = (e: React.MouseEvent, resourceIdOrObj: string | any) => {
    e.stopPropagation();
    if (typeof resourceIdOrObj === "object" && resourceIdOrObj?.id) {
      navigate(getResourceUrl(resourceIdOrObj));
      return;
    }
    const idStr = String(resourceIdOrObj || "");
    const found = (resourcesQuery.data || []).find((r: any) => String(r.id) === idStr);
    if (found) {
      navigate(getResourceUrl(found));
      return;
    }
    const parsed = parseSlugId(idStr);
    const hash = parsed ? encodeHashId(parsed) : null;
    navigate(hash ? `/resources/${hash}` : `/resources/${idStr}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        resourcesQuery.refetch(),
        foldersQuery.refetch(),
        savedResourcesQuery.refetch(),
      ]);
      toast({ title: t("page.toasts.refreshed"), description: t("page.toasts.refreshedDesc") });
    } catch {
      toast({ title: t("page.toasts.error"), description: t("page.toasts.refreshError"), variant: "destructive" });
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
        (selectedType === "course_notes" && (r.type === "course_notes" || r.type === "notes" || r.type === "resumes")) ||
        (selectedType === "exams" && (r.type === "exams" || r.type === "annales" || r.type === "exam_papers")) ||
        (selectedType === "td_tp" && (r.type === "td_tp" || r.type === "exercises")) ||
        (selectedType === "project" && (r.type === "project" || r.type === "projects")) ||
        (selectedType === "book" && (r.type === "book" || r.type === "books"));

      const ext = r.fileUrl?.split(".").pop()?.toLowerCase() || "";
      const matchesFormat =
        selectedFileFormat === "all" ||
        (selectedFileFormat === "pdf" && ext === "pdf") ||
        (selectedFileFormat === "doc" && (ext === "doc" || ext === "docx")) ||
        (selectedFileFormat === "image" && ["jpg", "jpeg", "png", "webp"].includes(ext));

      return matchesSearch && matchesType && matchesFormat;
    });
  }, [resources, searchTerm, selectedType, selectedFileFormat]);

  const isFiltering =
    searchTerm.trim() !== "" || selectedType !== "all" || selectedFileFormat !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setSelectedFileFormat("all");
  };

  const handlePromptVerification = () => {
    toast({
      title: t("page.toasts.uncertifiedTitle"),
      description: t("page.toasts.uncertifiedUploadDesc"),
      variant: "destructive",
      action: (
        <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
          {t("page.toasts.verify")}
        </Button>
      ),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 space-y-6 animate-in fade-in duration-300">
        {/* Top Header */}
        <ResourcesPageHeader
          isRefreshing={isRefreshing}
          isFetching={resourcesQuery.isFetching}
          onRefresh={handleRefresh}
          isVerified={canPerformAction}
          isUploadOpen={isUploadResourceOpen}
          setIsUploadOpen={setIsUploadResourceOpen}
          onResourceUploaded={handleResourceUploaded}
          onVerificationPrompt={handlePromptVerification}
        />

        {/* Search & Filters Bar */}
        <ResourcesFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          selectedFileFormat={selectedFileFormat}
          onSelectFileFormat={setSelectedFileFormat}
          showMobileFilters={showMobileFilters}
          onToggleMobileFilters={() => setShowMobileFilters((v) => !v)}
          isFiltering={isFiltering}
          onResetFilters={handleResetFilters}
        />

        {/* View Mode Switcher Toolbar */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <span className="text-xs text-muted-foreground font-medium">
            {isFiltering
              ? (filteredResources.length > 1
                  ? t("page.found_other", { count: filteredResources.length })
                  : t("page.found_one", { count: filteredResources.length }))
              : (resources.length > 1
                  ? t("page.available_other", { count: resources.length })
                  : t("page.available_one", { count: resources.length }))}
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

        {/* Main Content */}
        {isFiltering ? (
          <ResourcesFilteredGrid
            resources={filteredResources}
            isLoading={isResourcesLoading}
            downloadingIds={downloadingIds}
            savedResources={savedResources}
            onDownload={handleDownload}
            onSave={handleSave}
            onPreview={handlePreview}
            onResetFilters={handleResetFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        ) : (
          <div className="flex flex-col gap-10 mt-6 pb-12">
            {/* Mes Dossiers */}
            {(currentUser || localStorage.getItem("access")) && (
              <ResourcesFolderSection
                folders={folders}
                foldersLoading={foldersLoading}
                selectedFolder={selectedFolder}
                folderResources={folderResources}
                downloadingIds={downloadingIds}
                savedResources={savedResources}
                showCreateFolder={showCreateFolder}
                editingFolder={editingFolder}
                onOpenFolder={handleOpenFolder}
                onCloseFolder={() => setSelectedFolder(null)}
                onDownloadZip={async (f) => {
                  if (!canPerformAction) {
                    toast({
                      title: t("page.toasts.uncertifiedTitle"),
                      description: t("page.toasts.uncertifiedZipDesc"),
                      variant: "destructive",
                      action: (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openVerificationModal()}
                        >
                          {t("page.toasts.certify")}
                        </Button>
                      ),
                    });
                    return;
                  }
                  await downloadFolderZip(f.id, f.name);
                  toast({ title: t("page.toasts.downloadingZip") });
                }}
                onEditFolder={(f) => {
                  setEditingFolder(f);
                  setShowCreateFolder(true);
                }}
                onDeleteFolder={handleDeleteFolder}
                onOpenCreateFolder={() => {
                  setEditingFolder(null);
                  setShowCreateFolder(true);
                }}
                onCloseCreateFolder={setShowCreateFolder}
                onFolderCreated={async (folder) => {
                  await queryClient.invalidateQueries({ queryKey: ["resource-folders"] });
                  if (editingFolder && selectedFolder?.id === folder.id) {
                    setSelectedFolder(folder);
                  }
                  setEditingFolder(null);
                }}
                onDownloadResource={handleDownload}
                onSaveResource={handleSave}
                onPreviewResource={handlePreview}
              />
            )}

            {/* Suggestions & Catégories */}
            <ResourcesCategoryCarousels
              resources={filteredResources}
              isLoading={isResourcesLoading}
              viewAllCategory={viewAllCategory}
              onSelectCategory={setViewAllCategory}
              downloadingIds={downloadingIds}
              savedResources={savedResources}
              onDownload={handleDownload}
              onSave={handleSave}
              onPreview={handlePreview}
              viewMode={viewMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
