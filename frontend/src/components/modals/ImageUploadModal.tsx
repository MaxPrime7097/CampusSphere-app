import React, { useState, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Upload, Camera, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import getCroppedImg from '@/lib/cropImage';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { compressImageFile } from '@/lib/imageCompression';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
  title: string;
  description: string;
  currentImage?: string;
  shape?: 'rect' | 'round';
  aspectRatio?: number;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  onSave,
  title,
  description,
  currentImage,
  shape = 'round',
  aspectRatio = 1
}: ImageUploadModalProps) {
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Fichier trop volumineux", description: "Veuillez choisir une image de moins de 10Mo", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImageSrc(e.target?.result as string);
        setCroppedPreview(null);
        setFinalFile(null);
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels || !selectedImageSrc) return;
    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(selectedImageSrc, croppedAreaPixels, 0);
      if (croppedFile) {
        const compressed = await compressImageFile(croppedFile);
        setFinalFile(compressed);
        
        // Créer un aperçu
        const reader = new FileReader();
        reader.onload = (e) => setCroppedPreview(e.target?.result as string);
        reader.readAsDataURL(compressed);
        
        setSelectedImageSrc(null); // Quitter le mode recadrage
      }
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de recadrer l'image.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!finalFile) return;
    setIsProcessing(true);
    try {
      await onSave(finalFile);
      handleClose();
    } catch (e) {
      // Error is handled by parent
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedImageSrc(null);
    setCroppedPreview(null);
    setFinalFile(null);
    onClose();
  };

  // VUE 1 : Mode Recadrage (Cropper)
  if (selectedImageSrc) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => setSelectedImageSrc(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              Recadrer l'image
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative w-full h-[300px] bg-black/5 rounded-md overflow-hidden mt-2">
            <Cropper
              image={selectedImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              cropShape={shape}
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={handleCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-medium text-muted-foreground">Zoom</span>
            <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(val) => setZoom(val[0])} className="flex-1" />
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSelectedImageSrc(null)} disabled={isProcessing}>Annuler</Button>
            <Button onClick={handleApplyCrop} disabled={isProcessing} className="campus-gradient text-white">
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Appliquer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // VUE 2 : Mode Aperçu & Sélection
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center justify-center gap-6">
          {shape === 'round' ? (
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={croppedPreview || currentImage} />
              <AvatarFallback className="bg-muted"><Camera className="h-8 w-8 text-muted-foreground opacity-50" /></AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-full h-32 bg-muted rounded-lg overflow-hidden relative shadow-inner">
              {(croppedPreview || currentImage) ? (
                <img src={croppedPreview || currentImage} alt="Cover preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              {croppedPreview ? "Changer" : "Sélectionner une image"}
            </Button>
            {croppedPreview && (
              <Button variant="ghost" size="icon" onClick={() => { setCroppedPreview(null); setFinalFile(null); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={!finalFile || isProcessing} className="campus-gradient text-white">
            {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
