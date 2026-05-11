import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Sparkles, BookOpen, Brain, Layers, Upload, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudySessionCard } from "@/components/study/StudySessionCard";
import { StudyToolsModal } from "@/components/study/StudyToolsModal";
import {
  getStudySessions,
  getStudySession,
  deleteStudySession,
  generateFromUpload,
} from "@/services/api";
import { FicheRevision } from "@/components/study/FicheRevision";
import { QuizInteractif } from "@/components/study/QuizInteractif";
import { Flashcards } from "@/components/study/Flashcards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ToolFilter = "all" | "fiche" | "quiz" | "flashcards";

const FILTER_OPTIONS: { value: ToolFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "Toutes", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { value: "fiche", label: "Fiches", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: "quiz", label: "Quiz", icon: <Brain className="h-3.5 w-3.5" /> },
  { value: "flashcards", label: "Flashcards", icon: <Layers className="h-3.5 w-3.5" /> },
];

export const StudySessions: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ToolFilter>("all");

  // Modal "résultat" pour voir une session depuis la liste
  const [viewSession, setViewSession] = useState<any | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  // Upload direct
  const [uploadTool, setUploadTool] = useState<"fiche" | "quiz" | "flashcards">("fiche");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  React.useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await getStudySessions();
      setSessions(res?.data || []);
    } catch {
      toast({ title: "Impossible de charger les sessions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async (sessionId: number) => {
    try {
      const res = await getStudySession(sessionId);
      setViewSession(res?.data);
      setViewOpen(true);
    } catch {
      toast({ title: "Impossible de charger cette session", variant: "destructive" });
    }
  };

  const handleDelete = async (sessionId: number) => {
    try {
      await deleteStudySession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast({ title: "Session supprimée" });
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const res = await generateFromUpload(file, uploadTool);
      toast({ title: "Session générée avec succès !" });
      await loadSessions();
      // Ouvrir directement le résultat
      if (res?.data) {
        setViewSession(res.data);
        setViewOpen(true);
      }
    } catch (err: any) {
      toast({
        title: "Génération échouée",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
      setUploadOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredSessions =
    filter === "all" ? sessions : sessions.filter((s) => s.tool_type === filter);

  return (
    <>
      <Helmet>
        <title>Mes révisions IA — CampusSphere</title>
        <meta name="description" content="Retrouvez toutes vos sessions de révision générées par l'IA." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <Sparkles className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mes révisions IA</h1>
              <p className="text-sm text-muted-foreground">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} sauvegardée{sessions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setUploadOpen(true)}
            className="gap-2 campus-gradient text-white flex-shrink-0"
          >
            <Upload className="h-4 w-4" />
            Uploader un PDF
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                filter === opt.value
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "border-border text-muted-foreground hover:border-orange-500/50 hover:text-foreground"
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            <p className="text-sm text-muted-foreground">Chargement des sessions…</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-muted">
              <Sparkles className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Aucune session{filter !== "all" ? " de ce type" : ""}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Clique sur "Réviser avec l'IA" sur une ressource, ou uploade un PDF ci-dessus.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <StudySessionCard
                key={session.id}
                session={session}
                onResume={handleResume}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal : Voir une session */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <div>
                <DialogTitle className="text-base font-bold">
                  {viewSession?.content?.titre || "Session de révision"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {viewSession?.resource_title || viewSession?.source_filename}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {viewSession?.tool_type === "fiche" && (
              <FicheRevision data={viewSession.content} />
            )}
            {viewSession?.tool_type === "quiz" && (
              <QuizInteractif data={viewSession.content} />
            )}
            {viewSession?.tool_type === "flashcards" && (
              <Flashcards data={viewSession.content} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal : Upload direct */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-orange-500" />
              Générer depuis un PDF
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Upload un PDF personnel (non enregistré dans la bibliothèque) pour générer un outil de révision.
            </p>

            {/* Choix du type */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Type d'outil</p>
              <div className="grid grid-cols-3 gap-2">
                {(["fiche", "quiz", "flashcards"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setUploadTool(t)}
                    className={cn(
                      "flex flex-col items-center gap-1 border rounded-xl py-2.5 px-2 text-xs font-medium transition-all",
                      uploadTool === t
                        ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : "border-border text-muted-foreground hover:border-orange-500/50"
                    )}
                  >
                    {t === "fiche" && <BookOpen className="h-4 w-4" />}
                    {t === "quiz" && <Brain className="h-4 w-4" />}
                    {t === "flashcards" && <Layers className="h-4 w-4" />}
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              className="w-full gap-2 campus-gradient text-white"
              disabled={uploadLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Génération en cours…
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Choisir un PDF
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
