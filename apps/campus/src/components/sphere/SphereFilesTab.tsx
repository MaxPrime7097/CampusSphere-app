import { Suspense, lazy, useState, useMemo, useRef } from "react";
import {
  Plus,
  MagnifyingGlass as Search,
  FileText,
  FilePdf,
  FileImage,
  FileArchive,
  Download,
  Trash,
  Eye,
  Spinner as Loader2,
  CheckCircle,
  UploadSimple,
  GridFour,
  ListBullets,
  Copy,
  Check,
  FileArrowUp,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { getFullUrl, uploadSphereFile } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const SphereUploadResourceModal = lazy(() =>
  import("@/components/modals/SphereUploadResourceModal").then((module) => ({
    default: module.SphereUploadResourceModal,
  }))
);

interface SphereFilesTabProps {
  sphereId: string;
  resources: any[];
  canModerateMembers: boolean;
  currentUserId: string | null;
  onDeleteFile: (fileId: string | number) => Promise<void>;
  onFileUploaded: () => void;
  isLoading?: boolean;
}

type FileCategory = "all" | "pdf" | "images" | "docs" | "archives";

export function SphereFilesTab({
  sphereId,
  resources = [],
  canModerateMembers,
  currentUserId,
  onDeleteFile,
  onFileUploaded,
  isLoading = false,
}: SphereFilesTabProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FileCategory>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploadResourceOpen, setIsUploadResourceOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentlyUploaded, setRecentlyUploaded] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [copiedFileId, setCopiedFileId] = useState<string | number | null>(null);

  const getFileCategory = (fileName: string, fileType: string): FileCategory | "other" => {
    const name = (fileName || "").toLowerCase();
    const type = (fileType || "").toLowerCase();
    if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
    if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name)) return "images";
    if (
      type.includes("word") ||
      type.includes("document") ||
      type.includes("excel") ||
      type.includes("sheet") ||
      type.includes("presentation") ||
      type.includes("powerpoint") ||
      type.includes("text") ||
      /\.(docx?|xlsx?|pptx?|txt|csv|md)$/i.test(name)
    )
      return "docs";
    if (
      type.includes("zip") ||
      type.includes("tar") ||
      type.includes("rar") ||
      type.includes("compressed") ||
      /\.(zip|tar|gz|rar|7z)$/i.test(name)
    )
      return "archives";
    return "other";
  };

  const getFileVisual = (fileName: string, fileType: string) => {
    const cat = getFileCategory(fileName, fileType);
    switch (cat) {
      case "pdf":
        return {
          icon: <FilePdf className="h-7 w-7 text-red-500 shrink-0" weight="fill" />,
          badgeCls: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
          label: "PDF",
        };
      case "images":
        return {
          icon: <FileImage className="h-7 w-7 text-purple-500 shrink-0" weight="fill" />,
          badgeCls: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          label: "IMAGE",
        };
      case "docs":
        return {
          icon: <FileText className="h-7 w-7 text-blue-500 shrink-0" weight="fill" />,
          badgeCls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          label: "DOCUMENT",
        };
      case "archives":
        return {
          icon: <FileArchive className="h-7 w-7 text-amber-500 shrink-0" weight="fill" />,
          badgeCls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          label: "ARCHIVE",
        };
      default:
        return {
          icon: <FileText className="h-7 w-7 text-slate-500 shrink-0" weight="fill" />,
          badgeCls: "bg-muted text-muted-foreground border-border",
          label: "FICHIER",
        };
    }
  };

  const counts = useMemo(() => {
    let pdf = 0;
    let images = 0;
    let docs = 0;
    let archives = 0;
    for (const r of resources) {
      const cat = getFileCategory(r.title || "", r.file_type || r.fileType || "");
      if (cat === "pdf") pdf++;
      else if (cat === "images") images++;
      else if (cat === "docs") docs++;
      else if (cat === "archives") archives++;
    }
    return { all: resources.length, pdf, images, docs, archives };
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const title = (res.title || "Fichier").toLowerCase();
      const matchesSearch = !fileSearchQuery.trim() || title.includes(fileSearchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (categoryFilter === "all") return true;
      return getFileCategory(res.title || "", res.file_type || res.fileType || "") === categoryFilter;
    });
  }, [resources, fileSearchQuery, categoryFilter]);

  const handleDirectDrop = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    setIsUploadingFiles(true);
    let uploadedCount = 0;
    try {
      for (const file of filesArray) {
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: "Fichier trop volumineux",
            description: `"${file.name}" dépasse la limite autorisée de 50 Mo.`,
            variant: "destructive",
          });
          continue;
        }
        await uploadSphereFile(sphereId, file, file.name);
        uploadedCount++;
      }
      if (uploadedCount > 0) {
        setRecentlyUploaded(
          `${uploadedCount} fichier${uploadedCount > 1 ? "s" : ""} partagé${uploadedCount > 1 ? "s" : ""} avec succès !`
        );
        setTimeout(() => setRecentlyUploaded(null), 4500);
        onFileUploaded();
      }
    } catch (err: any) {
      toast({
        title: "Erreur de téléversement",
        description: err?.message || "Impossible de téléverser les fichiers.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleCopyLink = async (url: string, id: string | number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedFileId(id);
      setTimeout(() => setCopiedFileId(null), 2000);
      toast({ title: "Lien copié dans le presse-papier !" });
    } catch {
      toast({ title: "Impossible de copier le lien", variant: "destructive" });
    }
  };

  const handleUploadComplete = async () => {
    setIsRefreshing(true);
    setRecentlyUploaded("Fichier ajouté à la bibliothèque de la sphère !");
    try {
      await onFileUploaded();
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
      setTimeout(() => setRecentlyUploaded(null), 4500);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Hidden file input for fast direct upload */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleDirectDrop(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card p-3 md:p-4 rounded-xl border shadow-2xs">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <span>Bibliothèque de la sphère</span>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
              {resources.length}
            </span>
            {(isRefreshing || isLoading) && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Documents, fiches de cours, ressources et fichiers partagés avec les membres.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5 text-xs font-medium"
          >
            <UploadSimple className="h-4 w-4 text-primary" />
            <span>Téléverser</span>
          </Button>

          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs font-semibold shadow-xs"
            onClick={() => setIsUploadResourceOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau fichier</span>
          </Button>

          {isUploadResourceOpen && (
            <Suspense fallback={<ModalLoadingFallback />}>
              <SphereUploadResourceModal
                open={isUploadResourceOpen}
                onOpenChange={setIsUploadResourceOpen}
                sphereId={sphereId}
                onUploaded={handleUploadComplete}
              />
            </Suspense>
          )}
        </div>
      </div>

      {/* Drag & Drop interactive zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDraggingOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(false);
          void handleDirectDrop(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all duration-200 select-none ${
          isDraggingOver
            ? "border-primary bg-primary/10 scale-[1.008] ring-4 ring-primary/20 shadow-md"
            : "border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/30"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <FileArrowUp className="h-5 w-5" />
          </div>
          <div className="text-left sm:text-left text-center">
            <p className="text-sm font-semibold text-foreground">
              {isDraggingOver ? "Déposez vos fichiers pour les téléverser" : "Glissez-déposez des fichiers ici ou cliquez pour parcourir"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Formats acceptés : PDF, Word, Excel, PowerPoint, Images, Archives ZIP (max 50 Mo par fichier)
            </p>
          </div>
        </div>
      </div>

      {/* Live sync / upload feedback banner */}
      {(isRefreshing || isUploadingFiles) && (
        <div className="p-3 border border-primary/40 bg-primary/5 rounded-xl flex items-center gap-3 text-xs sm:text-sm text-primary font-medium animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <span>Téléversement et enregistrement du fichier... Actualisation de la bibliothèque.</span>
        </div>
      )}

      {/* Success banner */}
      {!isRefreshing && !isUploadingFiles && recentlyUploaded && (
        <div className="p-3 border border-emerald-500/40 bg-emerald-500/10 rounded-xl flex items-center justify-between text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-medium animate-in fade-in slide-in-from-top-1">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {recentlyUploaded}
          </span>
          <button
            type="button"
            onClick={() => setRecentlyUploaded(null)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Search, Filter Pills & View Mode Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom de fichier..."
            className="pl-9 h-9 text-xs sm:text-sm rounded-xl"
            value={fileSearchQuery}
            onChange={(e) => setFileSearchQuery(e.target.value)}
          />
          {fileSearchQuery && (
            <button
              type="button"
              onClick={() => setFileSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* View toggle (Grid / List) */}
        <div className="flex items-center gap-1 self-end sm:self-auto bg-muted/50 p-0.5 rounded-lg border">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
              viewMode === "grid" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Vue en grille"
          >
            <GridFour className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
              viewMode === "list" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Vue en liste"
          >
            <ListBullets className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
            categoryFilter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground hover:text-foreground border-border"
          }`}
        >
          Tous ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter("pdf")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
            categoryFilter === "pdf"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground hover:text-foreground border-border"
          }`}
        >
          PDF ({counts.pdf})
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter("images")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
            categoryFilter === "images"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground hover:text-foreground border-border"
          }`}
        >
          Images ({counts.images})
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter("docs")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
            categoryFilter === "docs"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground hover:text-foreground border-border"
          }`}
        >
          Documents ({counts.docs})
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter("archives")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
            categoryFilter === "archives"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground hover:text-foreground border-border"
          }`}
        >
          Archives ({counts.archives})
        </button>
      </div>

      {/* Loading Skeletons */}
      {isLoading && resources.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border rounded-2xl bg-card p-4 space-y-3 animate-pulse">
              <div className="h-28 bg-muted rounded-xl" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 px-4 border border-dashed rounded-2xl bg-card/50">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <FileText className="h-6 w-6 opacity-60" />
          </div>
          <h4 className="font-semibold text-sm">
            {fileSearchQuery
              ? "Aucun fichier ne correspond à votre recherche"
              : categoryFilter !== "all"
              ? "Aucun fichier dans cette catégorie"
              : "Aucun fichier partagé pour le moment"}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {fileSearchQuery
              ? "Essayez avec d'autres mots-clés ou réinitialisez le filtre de recherche."
              : "Partagez des documents, synthèses ou supports pour enrichir la sphère."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {fileSearchQuery ? (
              <Button size="sm" variant="outline" onClick={() => setFileSearchQuery("")} className="text-xs">
                Effacer la recherche
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs font-semibold"
              >
                <UploadSimple className="h-4 w-4" />
                <span>Partager un premier fichier</span>
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredResources.map((res: any) => {
            const rawUrl = res.file_url || res.fileUrl || "";
            const fullFileUrl = getFullUrl(rawUrl);
            const fileName = res.title || "Fichier";
            const fileType = res.file_type || res.fileType || "";
            const fileSize = res.file_size || res.fileSize || 0;
            const isImage = fileType.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(fileName);
            const uploaderName = res.uploaded_by?.name || res.uploadedBy?.name || "";
            const uploaderAvatar = res.uploaded_by?.avatar || res.uploadedBy?.avatar || null;
            const createdAt = res.created_at || res.createdAt;
            const canDelete =
              canModerateMembers || String(res.uploaded_by?.id) === String(currentUserId);
            const visual = getFileVisual(fileName, fileType);

            return (
              <div
                key={res.id}
                className="group border rounded-2xl bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Card preview header */}
                  {isImage && fullFileUrl ? (
                    <a
                      href={fullFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative w-full h-36 bg-muted/40 overflow-hidden cursor-zoom-in"
                    >
                      <OptimizedImage
                        src={fullFileUrl}
                        alt={fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        containerClassName="w-full h-full bg-muted/40"
                      />
                      <Badge className={`absolute top-2.5 left-2.5 text-[9px] font-bold px-1.5 py-0.5 border ${visual.badgeCls}`}>
                        {visual.label}
                      </Badge>
                    </a>
                  ) : (
                    <div
                      onClick={() => fullFileUrl && window.open(fullFileUrl, "_blank")}
                      className="h-28 bg-muted/30 border-b flex items-center justify-center relative cursor-pointer group-hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-3 rounded-2xl bg-background border shadow-2xs group-hover:scale-110 transition-transform">
                        {visual.icon}
                      </div>
                      <Badge className={`absolute top-2.5 left-2.5 text-[9px] font-bold px-1.5 py-0.5 border ${visual.badgeCls}`}>
                        {visual.label}
                      </Badge>
                      {fileSize > 0 && (
                        <span className="absolute bottom-2 right-2.5 text-[10px] text-muted-foreground font-medium bg-background/80 backdrop-blur px-1.5 py-0.5 rounded border">
                          {(fileSize / 1024 / 1024).toFixed(1)} MB
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card content */}
                  <div className="p-3">
                    <h4
                      title={fileName}
                      onClick={() => fullFileUrl && window.open(fullFileUrl, "_blank")}
                      className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors cursor-pointer"
                    >
                      {fileName}
                    </h4>

                    {/* Meta info */}
                    <div className="flex items-center gap-2 mt-2.5 text-[11px] text-muted-foreground">
                      {uploaderAvatar ? (
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={uploaderAvatar} />
                          <AvatarFallback className="text-[8px]">
                            {(uploaderName || "U").slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                      <span className="truncate max-w-[110px]">{uploaderName || "Membre"}</span>
                      {createdAt && (
                        <>
                          <span>•</span>
                          <span>
                            {new Date(createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card action footer */}
                <div className="px-3 py-2 border-t bg-muted/15 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {fullFileUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="h-7 px-2 text-xs font-medium text-foreground/80 hover:text-foreground"
                      >
                        <a href={fullFileUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-3.5 w-3.5 mr-1" /> Ouvrir
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {fullFileUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Copier le lien"
                        onClick={() => handleCopyLink(fullFileUrl, res.id)}
                      >
                        {copiedFileId === res.id ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}

                    {fullFileUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Télécharger"
                      >
                        <a href={fullFileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}

                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => setFileToDelete(res)}
                        title="Supprimer"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filteredResources.map((res: any) => {
            const rawUrl = res.file_url || res.fileUrl || "";
            const fullFileUrl = getFullUrl(rawUrl);
            const fileName = res.title || "Fichier";
            const fileType = res.file_type || res.fileType || "";
            const fileSize = res.file_size || res.fileSize || 0;
            const uploaderName = res.uploaded_by?.name || res.uploadedBy?.name || "";
            const createdAt = res.created_at || res.createdAt;
            const canDelete =
              canModerateMembers || String(res.uploaded_by?.id) === String(currentUserId);
            const visual = getFileVisual(fileName, fileType);

            return (
              <div
                key={res.id}
                className="group border rounded-xl bg-card p-3 flex items-center justify-between gap-3 hover:border-primary/40 hover:shadow-2xs transition-all duration-200"
              >
                <div
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  onClick={() => fullFileUrl && window.open(fullFileUrl, "_blank")}
                >
                  <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {visual.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate hover:text-primary transition-colors">
                        {fileName}
                      </p>
                      <Badge className={`text-[9px] font-bold px-1.5 py-0 border ${visual.badgeCls}`}>
                        {visual.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {uploaderName && <span>{uploaderName} · </span>}
                      {fileSize > 0 && <span>{(fileSize / 1024 / 1024).toFixed(1)} MB · </span>}
                      {createdAt && (
                        <span>
                          {new Date(createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {fullFileUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title="Copier le lien"
                      onClick={() => handleCopyLink(fullFileUrl, res.id)}
                    >
                      {copiedFileId === res.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {fullFileUrl && (
                    <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" title="Consulter">
                      <a href={fullFileUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {fullFileUrl && (
                    <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" title="Télécharger">
                      <a href={fullFileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => setFileToDelete(res)}
                      title="Supprimer le fichier"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation de suppression */}
      <AlertDialog open={Boolean(fileToDelete)} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fichier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{fileToDelete?.title || "ce fichier"}" ?
              Cette action est irréversible et supprimera le fichier pour tous les membres de la sphère.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!fileToDelete) return;
                setIsDeleting(true);
                try {
                  await onDeleteFile(fileToDelete.id);
                  toast({ title: "Fichier supprimé avec succès." });
                } catch (e: any) {
                  toast({
                    title: "Erreur",
                    description: e?.message || "Impossible de supprimer le fichier.",
                    variant: "destructive",
                  });
                } finally {
                  setIsDeleting(false);
                  setFileToDelete(null);
                }
              }}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
export default SphereFilesTab;
