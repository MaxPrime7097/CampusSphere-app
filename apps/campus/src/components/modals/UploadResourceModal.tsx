import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Upload,
  FileText,
  X,
  Spinner as Loader2,
  Check,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  SlidersHorizontal,
  FolderSimple as FolderIcon,
  Trash,
  Plus,
  BookOpen,
  GraduationCap,
  FolderSimple as FolderGit2,
  BookBookmark,
  Notepad,
  Question as QuestionMark,
  FileZip,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  RESOURCE_TYPE_OPTIONS,
  RESOURCE_TYPE_DISPLAY,
  type CanonicalResourceType,
} from "@/constants/resourceTypes";
import {
  MAX_RESOURCE_FILE_SIZE,
  MAX_RESOURCE_FILE_SIZE_LABEL,
  ACCEPTED_RESOURCE_MIME_TYPES,
  ACCEPTED_RESOURCE_FILE_EXTENSIONS,
} from "@/constants/resourceUpload";
import { listFolders, type ResourceFolder } from "@/services/api";
import { compressImageFile } from "@/lib/imageCompression";
import { compressFolderToZip } from "@/lib/folderCompression";
import { useUploadQueue } from "@/contexts/UploadQueueContext";
import { cn, formatFileSize } from "@/lib/utils";

const cleanFileNameToTitle = (filename: string): string => {
  const rawName = filename.substring(0, filename.lastIndexOf(".")) || filename;
  const cleaned = rawName.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return filename;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

function getCategoryIcon(type: CanonicalResourceType, className = "h-4 w-4") {
  switch (type) {
    case "course_notes": return <BookOpen className={className} />;
    case "td_tp":        return <Notepad className={className} />;
    case "exams":        return <GraduationCap className={className} />;
    case "project":      return <FolderGit2 className={className} />;
    case "book":         return <BookBookmark className={className} />;
    default:             return <QuestionMark className={className} />;
  }
}

export interface StagedResourceFile {
  id: string;
  file: File;
  title: string;
  type: CanonicalResourceType;
  description: string;
  tags: string[];
  isExpanded?: boolean;
}

interface UploadResourceModalProps {
  children?: React.ReactNode;
  onResourceUploaded?: (resource?: unknown) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UploadResourceModal({
  children,
  onResourceUploaded,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: UploadResourceModalProps) {
  const { t } = useTranslation("resources");
  const { toast } = useToast();
  const { enqueueItems } = useUploadQueue();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  // Staging list
  const [stagedFiles, setStagedFiles] = useState<StagedResourceFile[]>([]);

  // Batch defaults
  const [defaultType, setDefaultType] = useState<CanonicalResourceType>("course_notes");
  const [batchVisibility, setBatchVisibility] = useState("public");
  const [batchAudience, setBatchAudience] = useState("all");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [showBatchOptions, setShowBatchOptions] = useState(false);

  // Drag and compression state
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCompressingFolder, setIsCompressingFolder] = useState(false);
  const [compressingFolderName, setCompressingFolderName] = useState("");
  const [compressionProgress, setCompressionProgress] = useState(0);

  // Hidden inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Load user folders
  useEffect(() => {
    if (open) {
      listFolders().then(setFolders).catch((): void => {});
    }
  }, [open]);

  const resetForm = () => {
    setStagedFiles([]);
    setShowBatchOptions(false);
    setSelectedFolderId("");
    setBatchVisibility("public");
    setBatchAudience("all");
    setIsCompressingFolder(false);
  };

  const addFilesToStaging = async (filesToAdd: File[]) => {
    const newItems: StagedResourceFile[] = [];

    for (let f of filesToAdd) {
      if (f.size > MAX_RESOURCE_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: t("uploadResource.fileTooLargeTitle"),
          description: `"${f.name}" dépasse la limite de ${MAX_RESOURCE_FILE_SIZE_LABEL}.`,
        });
        continue;
      }

      // Optimiser les images si nécessaire
      if (f.type.startsWith("image/")) {
        f = await compressImageFile(f);
      }

      newItems.push({
        id: `staged-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file: f,
        title: cleanFileNameToTitle(f.name),
        type: defaultType,
        description: "",
        tags: [],
        isExpanded: false,
      });
    }

    if (newItems.length > 0) {
      setStagedFiles((prev) => [...prev, ...newItems]);
      toast({
        title: `${newItems.length} fichier(s) ajouté(s)`,
        description: "Vous pouvez personnaliser la catégorie et le titre de chaque fichier.",
      });
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void addFilesToStaging(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleFolderSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsCompressingFolder(true);
      setCompressionProgress(0);

      const result = await compressFolderToZip(files, (percent, curFile) => {
        setCompressionProgress(percent);
        if (curFile) setCompressingFolderName(curFile);
      });

      setIsCompressingFolder(false);

      const zipFile = result.zipFile;
      const stagedZip: StagedResourceFile = {
        id: `staged-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file: zipFile,
        title: cleanFileNameToTitle(result.folderName),
        type: "project",
        description: `Archive contenant ${result.totalFiles} fichier(s) du dossier "${result.folderName}".`,
        tags: ["archive", "dossier"],
        isExpanded: false,
      };

      setStagedFiles((prev) => [...prev, stagedZip]);

      toast({
        title: "Dossier compressé avec succès !",
        description: `"${zipFile.name}" (${formatFileSize(zipFile.size)}) est prêt à être téléversé.`,
      });
    } catch (err: any) {
      setIsCompressingFolder(false);
      toast({
        variant: "destructive",
        title: "Erreur de compression",
        description: err?.message || "Impossible de compresser le dossier sélectionné.",
      });
    } finally {
      e.target.value = "";
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const normalFiles: File[] = [];

      // Vérifier si des dossiers ont été glissés
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const entry = (item as any).webkitGetAsEntry?.();
          if (entry && entry.isDirectory) {
            // Un dossier a été déposé : on utilise le FileList standard ou on avertit
            toast({
              title: "Importation de dossier",
              description: "Utilisez le bouton 'Importer un dossier' pour une compression optimale.",
            });
          } else {
            const file = item.getAsFile();
            if (file) normalFiles.push(file);
          }
        }
      }

      if (normalFiles.length > 0) {
        await addFilesToStaging(normalFiles);
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await addFilesToStaging(Array.from(e.dataTransfer.files));
    }
  };

  // Staged item updates
  const updateStagedItem = (id: string, updates: Partial<StagedResourceFile>) => {
    setStagedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeStagedItem = (id: string) => {
    setStagedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const applyCategoryToAll = (newType: CanonicalResourceType) => {
    setDefaultType(newType);
    setStagedFiles((prev) => prev.map((item) => ({ ...item, type: newType })));
    toast({
      title: "Catégorie appliquée à tous",
      description: `Tous les fichiers sont maintenant catégorisés en : ${RESOURCE_TYPE_DISPLAY[newType]}.`,
    });
  };

  // Soumission vers la file de téléversement en tâche de fond
  const handleSubmit = () => {
    if (stagedFiles.length === 0) {
      toast({ variant: "destructive", title: "Veuillez sélectionner au moins un fichier." });
      return;
    }

    // Vérifier que tous les fichiers ont un titre
    const invalidItem = stagedFiles.find((item) => !item.title.trim());
    if (invalidItem) {
      toast({
        variant: "destructive",
        title: "Titre requis",
        description: `Le fichier "${invalidItem.file.name}" doit avoir un titre.`,
      });
      return;
    }

    const payload = stagedFiles.map((item) => ({
      file: item.file,
      title: item.title.trim(),
      type: item.type,
      description: item.description.trim(),
      tags: item.tags,
      visibility: batchVisibility,
      audience: batchAudience,
      folderId: selectedFolderId || undefined,
    }));

    enqueueItems(payload);

    if (onResourceUploaded) {
      onResourceUploaded();
    }

    resetForm();
    setOpen(false);
  };

  const totalBatchSize = stagedFiles.reduce((acc, curr) => acc + curr.file.size, 0);

  const visibilities = [
    { value: "public", label: t("uploadResource.visibilities.public", { defaultValue: "Public" }) },
    { value: "university", label: t("uploadResource.visibilities.university", { defaultValue: "Université uniquement" }) },
    { value: "friends", label: t("uploadResource.visibilities.friends", { defaultValue: "Amis uniquement" }) },
  ];

  const audiences = [
    { value: "all", label: "Tous publics" },
    { value: "b1/h1", label: "BTS 1 / HND 1" },
    { value: "b2/h2", label: "BTS 2 / HND 2" },
    { value: "l1/h1", label: "Licence 1 / Bachelor 1" },
    { value: "l2/b2", label: "Licence 2 / Bachelor 2" },
    { value: "l3/b3", label: "Licence 3 / Bachelor 3" },
    { value: "m1", label: "Master 1" },
    { value: "m2", label: "Master 2" },
    { value: "doc", label: "Doctorat / Recherche" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border-border/80">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Upload className="h-5 w-5 text-primary" />
              Téléverser des ressources
            </DialogTitle>
            {stagedFiles.length > 0 && (
              <Badge variant="secondary" className="text-xs px-2.5 py-0.5 rounded-full font-medium">
                {stagedFiles.length} fichier(s) · {formatFileSize(totalBatchSize)}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Sélectionnez un ou plusieurs fichiers ou importez un dossier complet. Le téléversement se fera en arrière-plan.
          </DialogDescription>
        </DialogHeader>

        {/* Corps défilable */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Dropzone & Actions de sélection */}
          <div
            className={cn(
              "border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all",
              isDragOver
                ? "border-primary bg-primary/10 scale-[0.99]"
                : "border-border/80 hover:border-primary/40 bg-muted/10"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isCompressingFolder ? (
              <div className="py-4 space-y-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Compression du dossier en cours... {compressionProgress}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {compressingFolderName || "Traitement des fichiers..."}
                  </p>
                </div>
                <Progress value={compressionProgress} className="h-1.5 w-64 max-w-full mx-auto" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="h-10 w-10 rounded-xl bg-muted/80 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-foreground/80" />
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-muted/80 flex items-center justify-center">
                    <FolderIcon className="h-5 w-5 text-foreground/80" />
                  </div>
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    Glissez-déposez vos fichiers ici, ou choisissez une option :
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Formats acceptés : PDF, Word, Excel, PPT, ZIP, Code, Images — max {MAX_RESOURCE_FILE_SIZE_LABEL} par fichier
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 text-xs font-medium gap-1.5 cursor-pointer rounded-lg"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Parcourir des fichiers
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => folderInputRef.current?.click()}
                    className="h-8 text-xs font-medium gap-1.5 cursor-pointer rounded-lg border-primary/30 hover:border-primary text-primary"
                  >
                    <FileZip className="h-4 w-4" />
                    Importer un dossier (.zip auto)
                  </Button>
                </div>

                {/* Hidden input for files */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelected}
                  accept={ACCEPTED_RESOURCE_FILE_EXTENSIONS}
                />

                {/* Hidden input for folder (webkitdirectory) */}
                <input
                  ref={folderInputRef}
                  type="file"
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                  className="hidden"
                  onChange={handleFolderSelected}
                />
              </div>
            )}
          </div>

          {/* Staged Files List */}
          {stagedFiles.length > 0 && (
            <div className="space-y-3">
              {/* Batch category shortcut bar */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground font-medium shrink-0">Catégorie par défaut :</span>
                  <Select
                    value={defaultType}
                    onValueChange={(val) => applyCategoryToAll(val as CanonicalResourceType)}
                  >
                    <SelectTrigger className="h-7 text-xs w-[140px] sm:w-[160px] bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStagedFiles([])}
                  className="h-7 text-[11px] text-muted-foreground hover:text-destructive px-2"
                >
                  Tout vider
                </Button>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {stagedFiles.map((item, index) => {
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border/70 bg-card p-3 space-y-2.5 transition-all shadow-sm hover:border-border"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5 border border-border/40 text-primary">
                          {getCategoryIcon(item.type, "h-5 w-5")}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          {/* File original name & size */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-muted-foreground truncate" title={item.file.name}>
                              {item.file.name}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground/80 shrink-0">
                              {formatFileSize(item.file.size)}
                            </span>
                          </div>

                          {/* Title input + Category select */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <div className="sm:col-span-7">
                              <Input
                                value={item.title}
                                onChange={(e) => updateStagedItem(item.id, { title: e.target.value })}
                                placeholder="Titre de la ressource *"
                                className="h-8 text-xs font-medium"
                              />
                            </div>
                            <div className="sm:col-span-5">
                              <Select
                                value={item.type}
                                onValueChange={(val) =>
                                  updateStagedItem(item.id, { type: val as CanonicalResourceType })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs bg-muted/40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {RESOURCE_TYPE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Remove item button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStagedItem(item.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 rounded-lg"
                          title="Retirer ce fichier"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Optional Expand for Description & Tags */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => updateStagedItem(item.id, { isExpanded: !item.isExpanded })}
                          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer font-medium"
                        >
                          {item.isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {item.isExpanded ? "Moins de détails" : "Ajouter une description / tags"}
                        </button>

                        {item.isExpanded && (
                          <div className="mt-2 space-y-2 pt-2 border-t border-border/40 text-xs">
                            <Textarea
                              placeholder="Description spécifique à ce document (facultatif)..."
                              value={item.description}
                              onChange={(e) => updateStagedItem(item.id, { description: e.target.value })}
                              rows={2}
                              className="text-xs resize-none min-h-[50px]"
                            />
                            <Input
                              placeholder="Tags séparés par des virgules (ex: algebre, td1, thermo)..."
                              value={item.tags.join(", ")}
                              onChange={(e) =>
                                updateStagedItem(item.id, {
                                  tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                                })
                              }
                              className="h-7 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Batch Options (Dossier, Visibilité, Public) */}
          <div className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowBatchOptions(!showBatchOptions)}
              className={cn(
                "text-xs font-semibold tracking-tight h-8 px-3 rounded-full gap-1.5 transition-all border border-border/40",
                showBatchOptions ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Paramètres du lot (dossier, visibilité, niveau)</span>
              {showBatchOptions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>

            {showBatchOptions && (
              <div className="space-y-3 p-3.5 mt-2 rounded-xl border border-border/50 bg-muted/10 campus-animate-slide-up">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Niveau d'études</Label>
                    <Select value={batchAudience} onValueChange={setBatchAudience}>
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {audiences.map((aud) => (
                          <SelectItem key={aud.value} value={aud.value} className="text-xs">
                            {aud.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Visibilité</Label>
                    <Select value={batchVisibility} onValueChange={setBatchVisibility}>
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {visibilities.map((vis) => (
                          <SelectItem key={vis.value} value={vis.value} className="text-xs">
                            {vis.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {folders.length > 0 && (
                  <div>
                    <Label className="text-xs font-medium">Ajouter au dossier</Label>
                    <Select value={selectedFolderId || "none"} onValueChange={setSelectedFolderId}>
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue placeholder="Aucun dossier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">Aucun dossier (bibliothèque générale)</SelectItem>
                        {folders.map((f) => (
                          <SelectItem
                            key={f.id}
                            value={String(f.id)}
                            disabled={Number(f.resource_count || 0) >= 20}
                            className="text-xs"
                          >
                            {f.name} ({f.resource_count || 0}/20)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="text-xs h-9 px-4"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          >
            Annuler
          </Button>

          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm h-9 px-5 gap-2 font-medium"
            onClick={handleSubmit}
            disabled={stagedFiles.length === 0 || isCompressingFolder}
          >
            <Check className="h-4 w-4" />
            {stagedFiles.length <= 1
              ? "Publier en arrière-plan"
              : `Publier (${stagedFiles.length} ressources) en arrière-plan`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
