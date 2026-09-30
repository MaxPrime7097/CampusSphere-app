import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Upload, FileText, X, Loader2, Check, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { FileUpload } from "@/components/upload/FileUpload";
import { RESOURCE_TYPE_OPTIONS } from "@/constants/resourceTypes";
import { ACCEPTED_RESOURCE_MIME_TYPES, ACCEPTED_RESOURCE_FILE_EXTENSIONS } from "@/constants/resourceUpload";
import { listFolders, createResource, type ResourceFolder } from "@/services/api";
import { compressImageFile } from "@/lib/imageCompression";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [...ACCEPTED_RESOURCE_MIME_TYPES];

const cleanFileNameToTitle = (filename: string): string => {
  const rawName = filename.substring(0, filename.lastIndexOf('.')) || filename;
  const cleaned = rawName.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return filename;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

interface UploadResourceModalProps {
  children?: React.ReactNode;
  onResourceUploaded?: (resource?: unknown) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UploadResourceModal({ children, onResourceUploaded, open: controlledOpen, onOpenChange: setControlledOpen }: UploadResourceModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [visibility, setVisibility] = useState("");
  const [audience, setAudience] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  // Load user's folders when modal opens
  useEffect(() => {
    if (open) {
      listFolders().then(setFolders).catch((): void => {});
    }
  }, [open]);
  const resourceSchema = z.object({
    title: z.string().trim().min(3, { message: t('modals.uploadResource.titleRequired') }).max(100, { message: t('modals.uploadResource.titleTooLong') }),
    description: z.string().trim().max(500, { message: t('modals.uploadResource.descriptionTooLong') }).optional(),
    type: z.string().min(1, { message: t('modals.uploadResource.typeRequired') }),
    file: z.custom<File>((val) => val instanceof File, { message: t('modals.uploadResource.fileRequired') })
      .refine((file) => file.size <= MAX_FILE_SIZE, { message: t('modals.uploadResource.fileTooLarge') })
      .refine((file) => (ACCEPTED_FILE_TYPES as string[]).includes(file.type), { message: t('modals.uploadResource.invalidFileType') }),
  });


  const types = RESOURCE_TYPE_OPTIONS;

  const visibilities = [
    { value: "public", label: "Public" },
    { value: "university", label: "Université uniquement" },
    { value: "friends", label: "Amis uniquement" }
  ];

  const audiences = [
    {value: "b1/h1",label:"BTS 1 / HND 1"},
    {value: "b2/h2",label:"BTS 2 / HND 2"},
    {value: "l1/h1",label:"Licence 1 / Bachelor 1"},
    {value: "l2/b2", label: "Licence 2 / Bachelor 2" },
    {value: "l3/b3", label: "Licence 3 / Bachelor 3" },
    {value: "l4/b4", label: "Licence 4 / Bachelor 4" },
    {value: "m1", label: "Master 1" },
    {value: "m2", label: "Master 2" },
    {value: "d1/p1", label: "Doctorat 1 / Phd 1" },
    {value: "d2/p2", label: "Doctorat 2 / Phd 2" },
    {value: "d3/p3", label: "Doctorat 3 / Phd 3" }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

    const validateAndSetFile = async (selectedFile: File) => {
    // Compress if it's an image
    selectedFile = await compressImageFile(selectedFile);
    
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({ 
        variant: "destructive", 
        title: "Fichier trop volumineux", 
        description: "La taille maximale est de 50MB" 
      });
      return;
    }

    const fileExtension = "." + selectedFile.name.split('.').pop()?.toLowerCase();
    const isMimeAccepted = (ACCEPTED_FILE_TYPES as string[]).includes(selectedFile.type);
    const isExtAccepted = ACCEPTED_RESOURCE_FILE_EXTENSIONS.split(',').includes(fileExtension);

    if (!isMimeAccepted && !isExtAccepted) {
      toast({ 
        variant: "destructive", 
        title: "Type de fichier non supporté", 
        description: "Ce format de fichier n'est pas autorisé. Vérifiez que l'extension est correcte." 
      });
      return;
    }

    setFile(selectedFile);
    
    // Auto-fill title if empty
    if (!title) {
      setTitle(cleanFileNameToTitle(selectedFile.name));
    }

    toast({
      title: "Fichier sélectionné",
      description: `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
      duration: 2000,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) return;
    if (trimmedTag.length > 20) {
      toast({ variant: "destructive", title: t('modals.uploadResource.tagTooLong') });
      return;
    }
    if (tags.length >= 5) {
      toast({ variant: "destructive", title: t('modals.uploadResource.maxTags') });
      return;
    }
    if (!tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ variant: "destructive", title: t('modals.uploadResource.fileRequired') });
      return;
    }

    if (!title.trim()) {
      toast({ variant: "destructive", title: "Le titre est requis" });
      return;
    }


    if (!type) {
      toast({ variant: "destructive", title: "Veuillez sélectionner un type de ressource" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description || "");
      formData.append('type', type);
      formData.append('file', file);
      formData.append('tags', JSON.stringify(tags));
      formData.append('visibility', visibility || 'public');
      formData.append('audience', audience || 'all');
      if (selectedFolderId && selectedFolderId !== 'none') formData.append('folder_id', selectedFolderId);


      const createdResource = await createResource(formData, undefined, (progress) => {
        setUploadProgress(progress);
      });
      
      setIsUploading(false);
      setUploadProgress(100);
      
      toast({ 
        title: "Ressource uploadée avec succès !", 
        description: `"${title}" est maintenant disponible dans la bibliothèque`,
        duration: 3000,
      });
      
      // Reset form and close modal
      resetForm();
      setOpen(false);
      
      // Trigger refresh in parent
      if (onResourceUploaded) {
        onResourceUploaded(createdResource);
      }

      const resourceId = createdResource?.id ?? createdResource?.data?.id;
      if (resourceId) {
        navigate(`/resources/${resourceId}`);
      } else {
        navigate('/resources');
      }
    } catch (error: any) {
      setIsUploading(false);
      toast({
        variant: "destructive",
        title: "Erreur d'upload",
        description: error?.message || "Une erreur est survenue lors de l'upload de la ressource",
      });
    }
  };

  const resetForm = () => {
    setTitle(""); 
    setDescription("");
    setType(""); 
    setFile(null); 
    setTags([]);
    setVisibility("");
    setAudience("");
    setSelectedFolderId("");
    setShowAdvanced(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('modals.uploadResource.title')}
          </DialogTitle>
          <DialogDescription className="sr-only">Formulaire d'upload de ressource</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 min-w-0 pt-1">
          {/* File Dropzone */}
          <div className="min-w-0">
            <div 
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors w-full min-w-0 overflow-hidden ${
                isDragOver 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50 bg-muted/10'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-2 w-full min-w-0">
                  {file.type.startsWith('image/') && (
                    <div className="rounded-lg overflow-hidden border max-h-36 mx-auto">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full max-h-36 object-contain bg-muted/30"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-background border border-border/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-6 w-6 shrink-0 text-primary" />
                      <div className="text-left min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate" title={file.name}>{file.name}</p>
                        <p className="text-[11px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isUploading} className="h-7 w-7 p-0 rounded-full">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground/70 mb-2" />
                  <div className="flex justify-center">
                    <label htmlFor="file-upload">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        type="button" 
                        asChild
                        disabled={isUploading}
                        className="cursor-pointer text-xs"
                      >
                        <span>{t('modals.uploadResource.chooseFile')}</span>
                      </Button>
                    </label>
                    <input 
                      ref={fileInputRef}
                      id="file-upload" 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileChange} 
                      accept={ACCEPTED_RESOURCE_FILE_EXTENSIONS}
                      disabled={isUploading}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Glissez-déposez un fichier ou parcourez (PDF, Docs, Images... max 50MB)
                  </p>
                </div>
              )}
              
              {/* Progress Bar */}
              {isUploading && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span>Upload en cours...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300 progress-bar"
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore - Style nécessaire pour la barre de progression dynamique
                      style={{ '--progress-width': `${uploadProgress}%` } as React.CSSProperties}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Primary Fields: Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <Label htmlFor="title" className="text-xs font-medium">{t('modals.uploadResource.title_field')} *</Label>
              <Input 
                id="title" 
                placeholder={t('modals.uploadResource.titlePlaceholder', { defaultValue: "Ex : Notes - Algèbre linéaire" })} 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                maxLength={100} 
                className="mt-1 h-9 text-xs sm:text-sm" 
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Type de ressource *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1 h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-xs sm:text-sm">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Collapsible Options Section */}
          <div className="pt-1">
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                "text-xs font-semibold tracking-tight h-8 px-3 rounded-full gap-1.5 transition-all border border-border/40",
                showAdvanced ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Options</span>
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>

            {showAdvanced && (
              <div className="space-y-3.5 p-3.5 mt-2 rounded-xl border border-border/50 bg-muted/10 campus-animate-slide-up">
                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-xs font-medium">
                    {t('modals.uploadResource.description')} <span className="text-muted-foreground font-normal">(optionnel)</span>
                  </Label>
                  <Textarea 
                    id="description" 
                    placeholder={t('modals.uploadResource.descPlaceholder', { defaultValue: "Décrivez brièvement le document..." })} 
                    rows={2} 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    maxLength={500} 
                    className="mt-1 resize-none text-xs sm:text-sm min-h-[60px]" 
                  />
                </div>

                {/* Visibility & Audience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Niveau d'audience</Label>
                    <Select value={audience || "all"} onValueChange={setAudience}>
                      <SelectTrigger className="mt-1 h-9 text-xs">
                        <SelectValue placeholder="Tous niveaux" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Tous niveaux</SelectItem>
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
                    <Select value={visibility || "public"} onValueChange={setVisibility}>
                      <SelectTrigger className="mt-1 h-9 text-xs">
                        <SelectValue placeholder="Public" />
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

                {/* Folder */}
                {folders.length > 0 && (
                  <div>
                    <Label className="text-xs font-medium">
                      Ajouter à un dossier <span className="text-muted-foreground font-normal">(optionnel)</span>
                    </Label>
                    <Select value={selectedFolderId || "none"} onValueChange={setSelectedFolderId}>
                      <SelectTrigger className="mt-1 h-9 text-xs">
                        <SelectValue placeholder="Aucun dossier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">Aucun dossier</SelectItem>
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

                {/* Tags */}
                <div>
                  <Label className="text-xs font-medium">Tags</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Ajouter un tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="h-8 text-xs"
                    />
                    <Button type="button" onClick={addTag} variant="secondary" size="sm" className="h-8 px-3 text-xs shrink-0">
                      Ajouter
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] gap-1 px-2 h-6">
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-3">
            <Button 
              variant="outline" 
              className="flex-1 text-xs sm:text-sm h-9" 
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={isUploading}
            >
              {t('modals.uploadResource.cancel')}
            </Button>
            <Button 
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-muted border border-border/60 text-xs sm:text-sm h-9" 
              onClick={handleSubmit} 
              disabled={!title.trim() || !type || !file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {t('modals.uploadResource.publish')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



