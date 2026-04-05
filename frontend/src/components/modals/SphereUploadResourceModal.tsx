import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createResource } from "@/services/api";

interface Props {
  sphereId: string;
  children: React.ReactNode;
  onUploaded?: () => void;
}

export function SphereUploadResourceModal({ sphereId, children, onUploaded }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (f: File) => {
    if (f.size > 50 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Max 50MB", variant: "destructive" });
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim());
      fd.append("description", title.trim());
      fd.append("subject", "other");
      fd.append("type", "other");
      fd.append("visibility", "public");
      fd.append("sphere", sphereId);
      await createResource(fd);
      toast({ title: "Fichier partagé !", duration: 2000 });
      setOpen(false);
      setFile(null);
      setTitle("");
      onUploaded?.();
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setFile(null); setTitle(""); } }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Partager un fichier
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zone drop */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            {file ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Cliquez ou glissez un fichier</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, PPT, ZIP, images — max 50MB</p>
              </>
            )}
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* Titre */}
          <div>
            <Label htmlFor="res-title">Titre *</Label>
            <Input
              id="res-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom du fichier..."
              maxLength={100}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={uploading}>Annuler</Button>
            <Button
              className="flex-1 campus-gradient text-white"
              onClick={handleSubmit}
              disabled={!file || !title.trim() || uploading}
            >
              {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Upload...</> : "Partager"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
