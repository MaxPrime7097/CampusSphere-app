import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, File, Image, Video, MusicNote as Music, Archive, FileText, X, Check, WarningCircle as AlertCircle } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { compressImageFiles } from "@/lib/imageCompression";

interface FileUploadProps {
  onFileUploaded?: (file: File) => void;
  onUploadComplete?: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  multiple?: boolean;
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

export function FileUpload({
  onFileUploaded,
  onUploadComplete,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ["*/*"],
  className = "",
  multiple = true
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (type.startsWith("video/")) return <Video className="h-4 w-4" />;
    if (type.startsWith("audio/")) return <Music className="h-4 w-4" />;
    if (type.includes("pdf") || type.includes("document")) return <FileText className="h-4 w-4" />;
    if (type.includes("zip") || type.includes("rar")) return <Archive className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Vérifier la taille
    if (file.size > maxSize * 1024 * 1024) {
      return `Le fichier "${file.name}" est trop volumineux (max ${maxSize}MB)`;
    }

    // Vérifier le type (si pas wildcard)
    if (!acceptedTypes.includes("*/*")) {
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.replace("/*", "/"));
        }
        return file.type === type;
      });
      
      if (!isValidType) {
        return `Le type de fichier "${file.type}" n'est pas autorisé`;
      }
    }

    return null;
  };

  const simulateUpload = useCallback(async (file: File, fileId: string) => {
    // Simuler l'upload avec progression
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, progress }
            : f
        )
      );
    }

    // Marquer comme terminé
    setUploadedFiles(prev => 
      prev.map(f => 
        f.id === fileId 
          ? { ...f, status: "completed" as const, progress: 100 }
          : f
      )
    );

    if (onFileUploaded) {
      onFileUploaded(file);
    }
  }, [onFileUploaded]);

    const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    let fileArray = Array.from(files);
    
    // Compress images automatically
    fileArray = await compressImageFiles(fileArray);
    
    // Vérifier le nombre de fichiers
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      toast({
        title: "Trop de fichiers",
        description: `Vous ne pouvez uploader que ${maxFiles} fichiers maximum`,
        variant: "destructive"
      });
      return;
    }

    const newFiles: UploadedFile[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      const fileId = `${Date.now()}-${Math.random()}`;
      
      if (error) {
        newFiles.push({
          file,
          id: fileId,
          progress: 0,
          status: "error",
          error
        });
        
        toast({
          title: "Erreur de validation",
          description: error,
          variant: "destructive"
        });
      } else {
        newFiles.push({
          file,
          id: fileId,
          progress: 0,
          status: "uploading"
        });
        
        // Démarrer l'upload
        simulateUpload(file, fileId);
      }
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, [uploadedFiles.length, maxFiles, validateFile, simulateUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const completedFiles = uploadedFiles.filter(f => f.status === "completed");
  const hasCompletedFiles = completedFiles.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone de drop */}
      <div 
        className={`border-2 border-dashed rounded-xl transition-colors cursor-pointer flex flex-col items-center justify-center py-8 px-4 ${
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-base font-semibold mb-1 text-foreground">
          {isDragging ? "Déposez vos fichiers ici" : "Glissez-déposez vos fichiers"}
        </h3>
        <p className="text-xs text-muted-foreground text-center mb-3">
          ou cliquez pour sélectionner des fichiers
        </p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {acceptedTypes.map(type => (
            <Badge key={type} variant="secondary" className="text-xs font-normal">
              {type === "*/*" ? "Tous types" : type}
            </Badge>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Max {maxSize}MB par fichier • {maxFiles} fichiers max
        </p>
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(",")}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Liste des fichiers */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Fichiers sélectionnés ({uploadedFiles.length})</h4>
          {uploadedFiles.map((uploadedFile) => (
            <div key={uploadedFile.id} className="p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getFileIcon(uploadedFile.file)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {uploadedFile.file.name}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(uploadedFile.file.size)}
                    </Badge>
                  </div>
                  
                  {uploadedFile.status === "uploading" && (
                    <div className="space-y-1">
                      <Progress value={uploadedFile.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Upload en cours... {uploadedFile.progress}%
                      </p>
                    </div>
                  )}
                  
                  {uploadedFile.status === "completed" && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <p className="text-xs text-green-600">Upload terminé</p>
                    </div>
                  )}
                  
                  {uploadedFile.status === "error" && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-xs text-red-600">{uploadedFile.error}</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(uploadedFile.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton de finalisation */}
      {hasCompletedFiles && onUploadComplete && (
        <div className="flex justify-end">
          <Button
            onClick={() => onUploadComplete(completedFiles.map(f => f.file))}
            className="bg-secondary hover:bg-muted text-secondary-foreground border border-border/60"
          >
            <Check className="h-4 w-4 mr-2" />
            Finaliser l'upload ({completedFiles.length})
          </Button>
        </div>
      )}
    </div>
  );
}

