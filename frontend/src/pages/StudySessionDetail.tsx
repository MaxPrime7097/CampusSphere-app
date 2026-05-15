import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getStudySession, listSpheres, shareStudySession } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Share2, Sparkles, AlertCircle, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FicheRevision } from "@/components/study/FicheRevision";
import { QuizInteractif } from "@/components/study/QuizInteractif";
import { Flashcards } from "@/components/study/Flashcards";
import { Skeleton } from "@/components/ui/skeleton";

export const StudySessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Partage
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [spheres, setSpheres] = useState<any[]>([]);
  const [selectedSphere, setSelectedSphere] = useState<string>("");
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [loadingSpheres, setLoadingSpheres] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await getStudySession(id);
        if (res.success && res.data) {
          setSession(res.data);
        } else {
          setError("Impossible de charger la session.");
        }
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
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
      await shareStudySession(id, selectedSphere);
      setShared(true);
      toast({ title: "Session partagée avec succès !" });
      setTimeout(() => setIsShareModalOpen(false), 1500);
    } catch (err: any) {
      toast({
        title: "Erreur de partage",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-5xl space-y-6 animate-in fade-in">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-full max-w-lg" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="container py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-4 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error || "Session introuvable"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const toolTypes = session.tool_types || [];
  const content = session.content || {};

  return (
    <div className="container py-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Helmet>
        <title>Session IA - CampusSphere</title>
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
                Assistante Sphera
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {session.resource_title || session.source_filename || "Session d'étude"}
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center">
              Généré le {new Date(session.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleOpenShare}
              disabled={shared}
            >
              {shared ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
              {shared ? "Partagé" : "Partager"}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={toolTypes[0] || "fiche"} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b rounded-none h-auto p-0 space-x-6">
          {toolTypes.includes("fiche") && (
            <TabsTrigger 
              value="fiche"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff9800] data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 data-[state=active]:text-[#ff9800] text-muted-foreground"
            >
              Fiche de révision
            </TabsTrigger>
          )}
          {toolTypes.includes("quiz") && (
            <TabsTrigger 
              value="quiz"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff9800] data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 data-[state=active]:text-[#ff9800] text-muted-foreground"
            >
              Quiz interactif
            </TabsTrigger>
          )}
          {toolTypes.includes("flashcards") && (
            <TabsTrigger 
              value="flashcards"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff9800] data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 data-[state=active]:text-[#ff9800] text-muted-foreground"
            >
              Flashcards
            </TabsTrigger>
          )}
        </TabsList>
        
        <div className="mt-8">
          {toolTypes.includes("fiche") && content.fiche && (
            <TabsContent value="fiche" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <FicheRevision data={content.fiche} />
            </TabsContent>
          )}
          {toolTypes.includes("quiz") && content.quiz && (
            <TabsContent value="quiz" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <QuizInteractif data={content.quiz} />
            </TabsContent>
          )}
          {toolTypes.includes("flashcards") && content.flashcards && (
            <TabsContent value="flashcards" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <Flashcards data={content.flashcards} />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* Modal de partage */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Partager la session
            </DialogTitle>
            <DialogDescription>
              Choisis une sphère pour partager tes fiches, quiz ou flashcards avec tes camarades.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sélectionner une sphère</label>
              <Select value={selectedSphere} onValueChange={setSelectedSphere} disabled={loadingSpheres}>
                <SelectTrigger>
                  {loadingSpheres ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Chargement des sphères...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Choisir une sphère..." />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {loadingSpheres ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : spheres.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      Aucune sphère disponible
                    </SelectItem>
                  ) : (
                    spheres.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleShare} 
              disabled={!selectedSphere || sharing || shared}
              className="campus-gradient text-white gap-2"
            >
              {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {shared ? "Partagé" : "Partager"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
