import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Upload, BookOpen, Zap, FileText, Loader2, ChevronDown } from "lucide-react";
import { generateAnnale, getStudySessions } from "../services/spheraService";
import type { AnnaleMode } from "../types/sphera.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AnnaleUploadModalProps {
  open: boolean;
  onClose: () => void;
}

export function AnnaleUploadModal({ open, onClose }: AnnaleUploadModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<"upload" | "options">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<AnnaleMode>("complete");
  const [coursResourceId, setCoursResourceId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx") && !name.endsWith(".txt")) {
      toast({ title: "Format invalide", description: "Seuls les fichiers PDF, DOCX et TXT sont acceptés.", variant: "destructive" });
      return;
    }
    setFile(f);
    setStep("options");
    // Charger les sessions pour le croisement cours+annale
    setLoadingSessions(true);
    getStudySessions()
      .then((res) => setSessions(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    try {
      const res = await generateAnnale({
        file,
        mode,
        cours_resource_id: coursResourceId || undefined,
      });
      if (res.success && res.data) {
        toast({ title: "Correction générée !", description: `${res.data.content?.corrections?.length || 0} question(s) corrigée(s).` });
        onClose();
        navigate(`/sphera/annales/${res.data.id}`);
      }
    } catch (err: any) {
      toast({ title: "Erreur de génération", description: err?.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setMode("complete");
    setCoursResourceId("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#ff9800]" />
            Corriger une annale
          </DialogTitle>
          <DialogDescription>
            Uploade ton épreuve passée et laisse Sphera la corriger pour toi.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          /* Étape 1 : Upload */
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              mt-2 flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
              ${isDragging
                ? "border-[#ff9800] bg-[#ff9800]/10 scale-[1.01]"
                : "border-border/50 hover:border-[#ff9800]/50 hover:bg-accent/30"
              }
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="w-14 h-14 rounded-2xl bg-[#ff9800]/10 ring-1 ring-[#ff9800]/25 flex items-center justify-center">
              <Upload className="w-7 h-7 text-[#ff9800]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Glisse ton annale ici</p>
              <p className="text-xs text-muted-foreground mt-1">ou clique pour choisir un fichier</p>
              <p className="text-xs text-muted-foreground/60 mt-2">PDF, DOCX, TXT, Images (PNG, JPG) · max 50 MB</p>
            </div>
          </div>
        ) : (
          /* Étape 2 : Options */
          <div className="mt-2 space-y-5">
            {/* Fichier sélectionné */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/40 border border-border/40">
              <FileText className="w-4 h-4 text-[#ff9800] flex-shrink-0" />
              <p className="text-sm text-foreground flex-1 truncate">{file?.name}</p>
              <button onClick={() => setStep("upload")} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Choix du mode */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Mode de correction</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Complète */}
                <button
                  onClick={() => setMode("complete")}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    mode === "complete"
                      ? "border-[#ff9800] bg-[#ff9800]/10 shadow-sm"
                      : "border-border/40 hover:border-[#ff9800]/40 hover:bg-accent/20"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${mode === "complete" ? "bg-[#ff9800]/20" : "bg-accent"}`}>
                    <BookOpen className={`w-5 h-5 ${mode === "complete" ? "text-[#ff9800]" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Complète</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Réponse + explication + chapitre + à retenir</p>
                  </div>
                </button>

                {/* Rapide */}
                <button
                  onClick={() => setMode("rapide")}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    mode === "rapide"
                      ? "border-[#ff9800] bg-[#ff9800]/10 shadow-sm"
                      : "border-border/40 hover:border-[#ff9800]/40 hover:bg-accent/20"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${mode === "rapide" ? "bg-[#ff9800]/20" : "bg-accent"}`}>
                    <Zap className={`w-5 h-5 ${mode === "rapide" ? "text-[#ff9800]" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Rapide</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Réponses directes, zéro blabla</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Croiser avec un cours (optionnel) */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-1.5">
                Croiser avec un cours <span className="text-muted-foreground font-normal">(optionnel)</span>
              </p>
              <p className="text-xs text-muted-foreground mb-2">Sphera citera les chapitres de ton cours dans la correction.</p>
              <div className="relative">
                <select
                  value={coursResourceId}
                  onChange={(e) => setCoursResourceId(e.target.value)}
                  disabled={loadingSessions}
                  className="w-full appearance-none bg-accent/40 border border-border/40 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#ff9800]/30 disabled:opacity-50 pr-8"
                >
                  <option value="">Aucun cours sélectionné</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.resource || ""}>
                      {s.resource_title || s.source_filename || `Session #${s.id}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-2.5 pt-1">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Annuler
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 bg-[#ff9800] hover:bg-[#ff9800]/90 text-white gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Générer la correction
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
