import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Share2, Sparkles, AlertCircle, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { listSpheres } from "@/services/api";
import { getAnnaleSession, shareAnnaleSession } from "../services/spheraService";
import { AnnaleCorrection } from "../components/AnnaleCorrection";
import type { AnnaleSession } from "../types/sphera.types";

export const AnnaleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [annale, setAnnale] = useState<AnnaleSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Partage
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [spheres, setSpheres] = useState<any[]>([]);
  const [selectedSphere, setSelectedSphere] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [loadingSpheres, setLoadingSpheres] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await getAnnaleSession(id);
        if (res.success && res.data) setAnnale(res.data);
        else setError("Impossible de charger la correction.");
      } catch (e: any) {
        setError(e?.message || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleOpenShare = async () => {
    setIsShareModalOpen(true);
    if (spheres.length === 0) {
      try {
        setLoadingSpheres(true);
        const mySpheres = await listSpheres({ my_spheres: "true" });
        setSpheres(mySpheres || []);
      } catch {
        toast({ title: "Impossible de charger les sphères", variant: "destructive" });
      } finally {
        setLoadingSpheres(false);
      }
    }
  };

  const handleShare = async () => {
    if (!id || !selectedSphere) return;
    setSharing(true);
    try {
      await shareAnnaleSession(id, selectedSphere);
      setShared(true);
      toast({ title: "Annale partagée avec succès !" });
      setTimeout(() => setIsShareModalOpen(false), 1500);
    } catch (err: any) {
      toast({ title: "Erreur de partage", description: err?.message, variant: "destructive" });
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-5xl space-y-6 animate-in fade-in">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-full max-w-lg" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (error || !annale) {
    return (
      <div className="container py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-4 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error || "Annale introuvable"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Helmet>
        <title>{annale.source_title || "Correction d'annale"} — CampusSphere</title>
      </Helmet>

      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-4 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#ff9800]/10 text-[#ff9800] px-2.5 py-1 rounded-full text-xs font-semibold flex items-center border border-[#ff9800]/20">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Correction Sphera
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {annale.source_title || annale.source_filename || "Correction d'annale"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Corrigée le {new Date(annale.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              {annale.cours_title && (
                <> · Croisée avec <span className="font-medium text-foreground">{annale.cours_title}</span></>
              )}
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleOpenShare} disabled={shared}>
            {shared ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            {shared ? "Partagée" : "Partager"}
          </Button>
        </div>
      </div>

      {/* Correction */}
      <AnnaleCorrection annale={annale} />

      {/* Modal partage */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Partager la correction
            </DialogTitle>
            <DialogDescription>
              Partage cette correction d'annale avec les membres d'une sphère.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sélectionner une sphère</label>
              <Select value={selectedSphere} onValueChange={setSelectedSphere} disabled={loadingSpheres}>
                <SelectTrigger>
                  {loadingSpheres ? (
                    <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span>Chargement...</span></div>
                  ) : (
                    <SelectValue placeholder="Choisir une sphère..." />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {loadingSpheres ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : spheres.length === 0 ? (
                    <SelectItem value="__none__" disabled>Aucune sphère disponible</SelectItem>
                  ) : (
                    spheres.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareModalOpen(false)}>Annuler</Button>
            <Button onClick={handleShare} disabled={!selectedSphere || sharing || shared} className="campus-gradient text-white gap-2">
              {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {shared ? "Partagée" : "Partager"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
