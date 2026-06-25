import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Upload, FileText, X, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { listFolders, createResource } from "@/services/api";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [...ACCEPTED_RESOURCE_MIME_TYPES];

interface UploadResourceModalProps {
  children?: React.ReactNode;
  onResourceUploaded?: (resource?: unknown) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UploadResourceModal({ children, onResourceUploaded, open: controlledOpen, onOpenChange: setControlledOpen }: UploadResourceModalProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [visibility, setVisibility] = useState("");
  const [audience, setAudience] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [folders, setFolders] = useState<Array<{id: number; name: string; resource_count: number}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  // Load user's folders when modal opens
  useEffect(() => {
    if (open) {
      listFolders().then(setFolders).catch(() => null);
    }
  }, [open]);


  const subjects = [
    { value: "math", label: "Mathématiques" },
    { value: "cs", label: "Informatique" },
    { value: "electronics", label: "Électronique" },
    { value: "mechanics", label: "Mécanique" },
    { value: "physics", label: "Physique" },
    { value: "chemistry", label: "Chimie" },
    { value: "biology", label: "Biologie / Santé" },
    { value: "economics", label: "Économie / Gestion" },
    { value: "law", label: "Droit / Sc. Politiques" },
    { value: "language", label: "Langues / Lettres" },
    { value: "history", label: "Histoire / Géo" },
    { value: "arts", label: "Arts / Design" },
    { value: "other", label: "Autre" }
  ];

  const resourceSchema = z.object({
    title: z.string().trim().min(3, { message: t('modals.uploadResource.titleRequired') }).max(100, { message: t('modals.uploadResource.titleTooLong') }),
    description: z.string().trim().min(10, { message: t('modals.uploadResource.descriptionRequired', { defaultValue: "La description est requise" }) }).max(500, { message: t('modals.uploadResource.descriptionTooLong') }),
    subject: z.string().optional(),
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

  const validateAndSetFile = (selectedFile: File) => {
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
      const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
      setTitle(fileName);
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
      if (subject) formData.append('subject', subject);
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
    setSubject(""); 
    setType(""); 
    setFile(null); 
    setTags([]);
    setVisibility("");
    setAudience("");
    setSelectedFolderId("");
    setOpen(false);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('modals.uploadResource.title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>{t('modals.uploadResource.file')} *</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-3">
                  {file.type.startsWith('image/') && (
                    <div className="rounded-lg overflow-hidden border">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full max-h-48 object-contain bg-muted/30"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={isUploading}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-2">
                    <label htmlFor="file-upload">
                      <Button 
                        variant="outline" 
                        type="button" 
                        asChild
                        disabled={isUploading}
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
                  <p className="text-xs text-muted-foreground mt-2">
                    Glissez-déposez un fichier ou cliquez pour sélectionner
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fichiers acceptés (Images, Documents, Archives...) jusqu'à 50MB
                  </p>
                </>
              )}
              
              {/* Progress Bar */}
              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Upload en cours...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300 progress-bar"
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore - Style nécessaire pour la barre de progression dynamique
                      style={{ '--progress-width': `${uploadProgress}%` } as React.CSSProperties}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="title">{t('modals.uploadResource.title_field')} *</Label>
            <Input id="title" placeholder={t('modals.uploadResource.titlePlaceholder', { defaultValue: "Ex : Notes complètes - Algèbre linéaire" })} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="description">{t('modals.uploadResource.description')}</Label>
            <Textarea id="description" placeholder={t('modals.uploadResource.descPlaceholder', { defaultValue: "Décrivez votre ressource..." })} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} className="mt-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type de ressource *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sélectionner..." />
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
            <div>
              <Label>Matière <span className="text-muted-foreground font-normal text-xs">(optionnel)</span></Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visibility & Audience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Niveau d'audience *</Label>
              <Select value={audience || "all"} onValueChange={setAudience}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Tous niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous niveaux</SelectItem>
                  {audiences.map((audience) => (
                    <SelectItem key={audience.value} value={audience.value}>
                      {audience.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Visibilité *</Label>
              <Select value={visibility || "public"} onValueChange={setVisibility}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Public" />
                </SelectTrigger>
                <SelectContent>
                  {visibilities.map((visibility) => (
                    <SelectItem key={visibility.value} value={visibility.value}>
                      {visibility.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Folder */}
          {folders.length > 0 && (
            <div>
              <Label>Ajouter à un dossier <span className="text-muted-foreground">(optionnel)</span></Label>
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun dossier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun dossier</SelectItem>
                  {folders.map((f) => (
                    <SelectItem
                      key={f.id}
                      value={String(f.id)}
                      disabled={f.resource_count >= 20}
                    >
                      {f.name} ({f.resource_count}/20)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Ajouter un tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-xs"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={isUploading}
            >
              {t('modals.uploadResource.cancel')}
            </Button>
            <Button 
              className="flex-1 campus-gradient text-white hover:opacity-90" 
              onClick={handleSubmit} 
              disabled={!title || !type || !file || isUploading}
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
