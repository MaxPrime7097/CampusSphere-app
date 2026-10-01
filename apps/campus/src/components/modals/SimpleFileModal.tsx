import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Spinner as Loader2 } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";

interface SimpleFileModalProps {
  children: React.ReactNode;
  onFileUploaded?: (file: { name: string; file: File }) => void;
}

export function SimpleFileModal({ children, onFileUploaded }: SimpleFileModalProps) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!fileName.trim()) {
        setFileName(selectedFile.name.split('.')[0]); // Nom sans extension
      }
    }
  };

  const handleUpload = async () => {
    if (!fileName.trim() || !file) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez saisir un nom et sélectionner un fichier",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Simuler l'upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onFileUploaded) {
        onFileUploaded({ name: fileName, file });
      }
      
      toast({
        title: "Fichier ajouté !",
        description: "Le fichier a été ajouté avec succès",
        duration: 2000,
      });
      
      // Reset form
      setFileName("");
      setFile(null);
      setOpen(false);
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'upload",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setFileName("");
    setFile(null);
    setOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Ajouter un fichier
          </DialogTitle>
          <DialogDescription>
            Téléchargez un fichier pour le partager avec votre communauté.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="fileName">Nom du fichier *</Label>
            <Input
              id="fileName"
              placeholder="Ex: Notes de cours"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Fichier *</Label>
            <div className="mt-2">
              {file ? (
                <div className="space-y-2">
                  {file.type.startsWith('image/') && (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full max-h-48 object-contain bg-muted/30"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-6 w-6">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, PPT, images, etc.
                  </p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="*/*"
                aria-label="Sélectionner un fichier"
                title="Sélectionner un fichier"
                placeholder="Sélectionner un fichier"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={resetForm}
            disabled={isUploading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !fileName.trim() || !file}
            className="bg-secondary text-secondary-foreground hover:bg-muted border border-border/60"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Ajouter
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
