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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Upload direct via StudyToolsModal
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

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

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedUploadFile(file);
    setUploadModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredSessions =
    filter === "all" ? sessions : sessions.filter((s) => s.tool_types?.includes(filter));

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
            <div className="p-2.5 rounded-2xl bg-[#ff9800]/10 border border-[#ff9800]/20">
              <Sparkles className="h-6 w-6 text-[#ff9800]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mes révisions IA</h1>
              <p className="text-sm text-muted-foreground">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} sauvegardée{sessions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 campus-gradient text-white flex-shrink-0"
          >
            <Upload className="h-4 w-4" />
            Uploader un Document
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain"
            onChange={handleFileSelected}
            className="hidden"
          />
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
                  ? "bg-[#ff9800] border-[#ff9800] text-white"
                  : "border-border text-muted-foreground hover:border-[#ff9800]/50 hover:text-foreground"
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
            <Loader2 className="h-8 w-8 text-[#ff9800] animate-spin" />
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
                Clique sur "Réviser avec l'IA" sur une ressource, ou uploade un document ci-dessus.
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
              <Sparkles className="h-5 w-5 text-[#ff9800]" />
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
            {viewSession?.content && Object.keys(viewSession.content).length > 1 ? (
              <Tabs defaultValue={Object.keys(viewSession.content)[0]} className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-4">
                  {Object.keys(viewSession.content).map((type) => (
                    <TabsTrigger key={type} value={type} className="capitalize">
                      {type}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.keys(viewSession.content).map((type) => (
                  <TabsContent key={type} value={type} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    {type === "fiche" && <FicheRevision data={viewSession.content[type]} />}
                    {type === "quiz" && <QuizInteractif data={viewSession.content[type]} />}
                    {type === "flashcards" && <Flashcards data={viewSession.content[type]} />}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              viewSession?.content && Object.keys(viewSession.content).map((type) => (
                <div key={type}>
                  {type === "fiche" && <FicheRevision data={viewSession.content[type]} />}
                  {type === "quiz" && <QuizInteractif data={viewSession.content[type]} />}
                  {type === "flashcards" && <Flashcards data={viewSession.content[type]} />}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale unifiée pour la génération via Upload */}
      {selectedUploadFile && (
        <StudyToolsModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          uploadFile={selectedUploadFile}
          onSuccess={async (data) => {
            toast({ title: "Session générée avec succès !" });
            await loadSessions();
          }}
        />
      )}
    </>
  );
};
