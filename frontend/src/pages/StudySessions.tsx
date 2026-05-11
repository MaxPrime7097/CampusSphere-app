import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Sparkles, BookOpen, Brain, Layers, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudySessionCard } from "@/components/study/StudySessionCard";
import { StudyToolsModal } from "@/components/study/StudyToolsModal";
import {
  getStudySessions,
  deleteStudySession,
} from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type ToolFilter = "all" | "fiche" | "quiz" | "flashcards";

const FILTER_OPTIONS: { value: ToolFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "Toutes", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { value: "fiche", label: "Fiches", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: "quiz", label: "Quiz", icon: <Brain className="h-3.5 w-3.5" /> },
  { value: "flashcards", label: "Flashcards", icon: <Layers className="h-3.5 w-3.5" /> },
];

export const StudySessions: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ToolFilter>("all");

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

  const handleResume = (sessionId: number) => {
    navigate(`/study-sessions/${sessionId}`);
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
        <title>Assistant Sphera — CampusSphere</title>
        <meta name="description" content="Retrouvez toutes vos sessions de révision générées par l'IA." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
        <div className="container max-w-6xl mx-auto py-4 md:py-6 px-0">
          {/* Header */}
          <div className="flex flex-col px-4 sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 campus-animate-fade-in px-0">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-[#ff9800]" />
                <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground">
                  Assistant Sphera
                </h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Générez des fiches, quiz et flashcards intelligents. {sessions.length} session(s) sauvegardée(s).
              </p>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 campus-gradient text-white w-full sm:w-auto"
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
          </div>

          <div className="px-4 md:px-0">
            {/* Filtres */}
            <div className="flex gap-2 flex-wrap mb-6">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                    filter === opt.value
                      ? "bg-[#ff9800] border-[#ff9800] text-white"
                      : "border-border bg-card text-muted-foreground hover:border-[#ff9800]/50 hover:text-foreground"
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
        </div>
      </div>

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
