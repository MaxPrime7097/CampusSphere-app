import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { listSpheres } from "@/services/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Share2, AlertCircle, Loader2, Check, MessageCircleQuestion, BookOpen, BrainCircuit, Columns, GitFork, AudioLines } from "lucide-react";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { FicheRevision } from "@/sphera/components/study/FicheRevision";
import { QuizInteractif } from "@/sphera/components/study/QuizInteractif";
import { Flashcards } from "@/sphera/components/study/Flashcards";
import { MindMapView } from "@/sphera/components/study/MindMapView";
import { AudioPlayerView } from "@/sphera/components/study/AudioPlayerView";

// V2 : Q&A
import { QAChat } from "../components/QAChat";

// Sphera service
import { getStudySession, shareStudySession, addToolToSession } from "../services/spheraService";
import type { StudySession, ToolType } from "../types/sphera.types";

const TAB_STYLE =
  "rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff9800] data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 data-[state=active]:text-[#ff9800] text-muted-foreground transition-colors";

export const StudySessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Partage
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [spheres, setSpheres] = useState<any[]>([]);
  const [selectedSphere, setSelectedSphere] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [loadingSpheres, setLoadingSpheres] = useState(false);

  // Génération
  const [isGeneratingTool, setIsGeneratingTool] = useState(false);
  const [toolError, setToolError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await getStudySession(id);
        if (res.success && res.data) setSession(res.data);
        else setError("Impossible de charger la session.");
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue.");
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
      await shareStudySession(id, selectedSphere);
      setShared(true);
      toast({ title: "Session partagée avec succès !" });
      setTimeout(() => setIsShareModalOpen(false), 1500);
    } catch (err: any) {
      toast({ title: "Erreur de partage", description: err?.message, variant: "destructive" });
    } finally {
      setSharing(false);
    }
  };

  const handleAddTool = async (tool: string) => {
    if (!id) return;
    setIsGeneratingTool(true);
    setToolError(null);
    try {
      const res = await addToolToSession(id, tool as any);
      if (res.success && res.data) {
        setSession(res.data);
      } else {
        setToolError(res.error || `Impossible de générer le ${tool}.`);
      }
    } catch (err: any) {
      setToolError(err.message || `Une erreur est survenue lors de la génération de ${tool}.`);
    } finally {
      setIsGeneratingTool(false);
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
  const hasQA = session.has_qa || session.qa_history?.length > 0;
  const defaultTab = toolTypes[0] || (hasQA ? "qa" : "fiche");

  return (
    <div className="w-full max-w-5xl mx-auto py-4 sm:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Helmet>
        <title>
          {session.resource_title || session.source_filename || "Session d'étude"} — CampusSphere
        </title>
      </Helmet>

      {/* ─── Header ─── */}
      <div className="mb-6 sm:mb-8 px-4 sm:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-4 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#ff9800]/10 text-[#ff9800] px-2.5 py-1 rounded-full text-xs font-semibold flex items-center border border-[#ff9800]/20">
                <SpheraIcon size="sm" className="mr-1.5" />
                Assistante Sphera
              </span>
              {hasQA && (
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center border border-emerald-500/20">
                  <MessageCircleQuestion className="w-3.5 h-3.5 mr-1.5" />
                  Q&A disponible
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
              {session.resource_title || session.source_filename || "Session d'étude"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Généré le{" "}
              {new Date(session.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {session.qa_history?.length > 0 && (
                <> · {session.qa_history.length} question{session.qa_history.length > 1 ? "s" : ""} posée{session.qa_history.length > 1 ? "s" : ""}</>
              )}
            </p>
          </div>
          <Button variant="outline" className="gap-2 w-full md:w-auto mt-4 md:mt-0" onClick={handleOpenShare} disabled={shared}>
            {shared ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            {shared ? "Partagé" : "Partager"}
          </Button>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="px-4 sm:px-8">
          <TabsList className="flex overflow-x-auto w-full h-auto border-b justify-start sm:justify-center gap-1 sm:gap-4 no-scrollbar">
            {(["fiche", "quiz", "flashcards", "mindmap", "audio"] as ToolType[]).map((t) => {
              const isGenerated = toolTypes.includes(t);
              const label =
                t === "fiche"
                  ? "Fiche"
                  : t === "quiz"
                  ? "Quiz"
                  : t === "flashcards"
                  ? "Flashcards"
                  : t === "mindmap"
                  ? "Carte mentale"
                  : "Résumé audio";
              return (
                <TabsTrigger 
                  key={t} 
                  value={t}
                  className={!isGenerated ? "opacity-70 whitespace-nowrap" : "whitespace-nowrap"}
                >
                  <div className="flex items-center">
                    {t === "fiche" && <BookOpen className="h-4 w-4 mr-2 hidden sm:block" />}
                    {t === "quiz" && <BrainCircuit className="h-4 w-4 mr-2 hidden sm:block" />}
                    {t === "flashcards" && <Columns className="h-4 w-4 mr-2 hidden sm:block" />}
                    {t === "mindmap" && <GitFork className="h-4 w-4 mr-2 hidden sm:block text-emerald-500" />}
                    {t === "audio" && <AudioLines className="h-4 w-4 mr-2 hidden sm:block text-emerald-500" />}
                    {label}
                    {!isGenerated && (
                      <span className="ml-2 text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full border hidden sm:inline-block">
                        + Générer
                      </span>
                    )}
                  </div>
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="qa" className="whitespace-nowrap">
              <div className="flex items-center">
                <MessageCircleQuestion className="h-4 w-4 mr-2 hidden sm:block" />
                Q&A
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4 sm:mt-8">
          {(["fiche", "quiz", "flashcards", "mindmap", "audio"] as ToolType[]).map((t) => {
            const isGenerated = toolTypes.includes(t);
            const toolName =
              t === "fiche"
                ? "la fiche"
                : t === "quiz"
                ? "le quiz"
                : t === "flashcards"
                ? "les flashcards"
                : t === "mindmap"
                ? "la carte mentale"
                : "le résumé audio";
            return (
              <TabsContent key={t} value={t} className="mt-0 focus-visible:outline-none focus-visible:ring-0 px-4 sm:px-8">
                {!isGenerated ? (
                  <div className="flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-card rounded-2xl border">
                    <SpheraIcon size="xl" className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold mb-2">Cet outil n'a pas encore été généré</h3>
                    <p className="text-sm text-muted-foreground mb-8 max-w-sm">
                      Génère ce contenu instantanément en utilisant l'analyse déjà effectuée sur ton document.
                    </p>
                    <Button 
                      onClick={() => handleAddTool(t)}
                      disabled={isGeneratingTool}
                      className="campus-gradient text-white flex items-center gap-2"
                    >
                      {isGeneratingTool ? (
                        <><Loader2 className="w-4 h-4 animate-spin"/> Génération...</>
                      ) : (
                        <><SpheraIcon size="md" variant="white" /> Générer {toolName}</>
                      )}
                    </Button>
                    {toolError && <p className="text-destructive text-sm mt-4">{toolError}</p>}
                  </div>
                ) : (
                  <>
                    {t === "fiche" && content.fiche && <FicheRevision data={content.fiche} />}
                    {t === "quiz" && content.quiz && <QuizInteractif data={content.quiz} />}
                    {t === "flashcards" && content.flashcards && <Flashcards data={content.flashcards} />}
                    {t === "mindmap" && content.mindmap && <MindMapView data={content.mindmap} />}
                    {t === "audio" && content.audio && <AudioPlayerView data={content.audio} />}
                  </>
                )}
              </TabsContent>
            );
          })}

          {/* ─── Q&A Tab ─── */}
          <TabsContent value="qa" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="w-full">
              <p className="text-sm text-muted-foreground mb-4 px-4 sm:px-8 hidden sm:block">
                Pose tes questions sur le contenu de ce cours. Sphera répond uniquement depuis le document original.
              </p>
              <QAChat
                sessionId={session.id}
                initialHistory={session.qa_history || []}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* ─── Modal partage ─── */}
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
              {shared ? "Partagé" : "Partager"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
