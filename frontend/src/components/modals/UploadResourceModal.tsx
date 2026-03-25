import { useState, useRef } from "react";
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

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed'
];

interface UploadResourceModalProps {
  children: React.ReactNode;
  onResourceUploaded?: () => void;
}

export function UploadResourceModal({ children, onResourceUploaded }: UploadResourceModalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();


  const subjects = [
    { value: "math", label: "Mathématiques" },
    { value: "cs", label: "Informatique" },
    { value: "physics", label: "Physique" },
    { value: "economics", label: "Économie" },
    { value: "language", label: "Langues" }
  ];

  const resourceSchema = z.object({
    title: z.string().trim().min(3, { message: t('modals.uploadResource.titleRequired') }).max(100, { message: t('modals.uploadResource.titleTooLong') }),
    description: z.string().trim().min(10, { message: t('modals.uploadResource.descriptionRequired', { defaultValue: "La description est requise" }) }).max(500, { message: t('modals.uploadResource.descriptionTooLong') }),
    subject: z.string().min(1, { message: t('modals.uploadResource.subjectRequired') }),
    type: z.string().min(1, { message: t('modals.uploadResource.typeRequired') }),
    file: z.custom<File>((val) => val instanceof File, { message: t('modals.uploadResource.fileRequired') })
      .refine((file) => file.size <= MAX_FILE_SIZE, { message: t('modals.uploadResource.fileTooLarge') })
      .refine((file) => ACCEPTED_FILE_TYPES.includes(file.type), { message: t('modals.uploadResource.invalidFileType') }),
  });


  const types = [
    { value: "notes", label: "Notes de cours" },
    { value: "summary", label: "Résumés" },
    { value: "exercises", label: "Exercices" },
    { value: "projects", label: "Projets" },
    { value: "slides", label: "Présentations" }
  ];

  const visibilities = [
    { value: "public", label: "Public" },
    { value: "university", label: "Université uniquement" },
    { value: "private", label: "Amis uniquement" }
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

    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      toast({ 
        variant: "destructive", 
        title: "Type de fichier non supporté", 
        description: "Seuls les fichiers PDF, DOC, PPT et ZIP sont acceptés" 
      });
      return;
    }

    setFile(selectedFile);
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

    const validation = resourceSchema.safeParse({ title, description, subject, type, file });
    if (!validation.success) {
      toast({ variant: "destructive", title: t('modals.uploadResource.validationFailed', { defaultValue: "Validation échouée" }), description: validation.error.errors[0].message });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Import API function dynamically to avoid circular deps
      const { createResource } = await import('@/services/api');
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('subject', subject);
      formData.append('type', type);
      formData.append('file', file);
      formData.append('tags', JSON.stringify(tags));
      formData.append('visibility', visibility || 'public');
      formData.append('audience', audience || '');

      await createResource(formData);
      
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
        onResourceUploaded();
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
    setOpen(false);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setFile(null)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                      disabled={isUploading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Glissez-déposez un fichier ou cliquez pour sélectionner
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, PPT, ZIP jusqu'à 50MB
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
            <Input id="title" placeholder={t('modals.uploadResource.titlePlaceholder', { defaultValue: "Ex : Notes complètes - Algèbre linéaire" })} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
          </div>

          <div>
            <Label htmlFor="description">{t('modals.uploadResource.description')} *</Label>
            <Textarea id="description" placeholder={t('modals.uploadResource.descPlaceholder', { defaultValue: "Décrivez votre ressource..." })} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </div>

          {/* Subject & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Matière *</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
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
            <div>
              <Label>Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
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
          </div>

          {/* Visibility & Audience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label> Pour des étudiants de *</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
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
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
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
              disabled={!title || !description || !subject || !type || !file || !visibility || !audience || isUploading}
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
