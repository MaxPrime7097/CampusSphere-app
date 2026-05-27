import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Sparkles, BookOpen, BrainCircuit, Columns, Upload, Loader2,
  FileText, Zap, Plus, Scroll,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Composants migrés depuis components/study/
import { StudySessionCard } from "@/sphera/components/study/StudySessionCard";
import { StudyToolsModal } from "@/sphera/components/study/StudyToolsModal";

// Nouveaux composants Sphera V2
import { AnnaleUploadModal } from "../components/AnnaleUploadModal";

// Annale card simplifiée
import { AnnaleCard } from "../components/AnnaleCard";

// Service
import { getStudySessions, deleteStudySession, getAnnaleSessions, deleteAnnaleSession } from "../services/spheraService";
import type { StudySessionListItem, AnnaleSessionListItem } from "../types/sphera.types";

type Tab = "sessions" | "annales";
type ToolFilter = "all" | "fiche" | "quiz" | "flashcards";

const FILTER_OPTIONS: { value: ToolFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all",        label: "Toutes",      icon: <Sparkles className="h-3.5 w-3.5" /> },
  { value: "fiche",      label: "Fiches",      icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: "quiz",       label: "Quiz",        icon: <BrainCircuit className="h-3.5 w-3.5" /> },
  { value: "flashcards", label: "Flashcards",  icon: <Columns className="h-3.5 w-3.5" /> },
];

const getSpheraStandaloneUrl = () => {
  const envUrl = (import.meta.env.VITE_SPHERA_STANDALONE_URL as string)?.trim();
  const isLocal = ["localhost", "127.0.0.1"].some((host) => window.location.hostname.includes(host));
  const baseUrl = envUrl || (isLocal ? "http://localhost:4173" : "https://sphera.campussphere.app");
  const accessToken = localStorage.getItem("access") || localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh");
  const params = new URLSearchParams();

  if (accessToken) params.set("access_token", accessToken);
  if (refreshToken) params.set("refresh_token", refreshToken);

  const query = params.toString();
  return `${baseUrl.replace(/\/$/, "")}/app${query ? `?${query}` : ""}`;
};

export const SpheraHome: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("sessions");

  // Sessions V1
  const [sessions, setSessions] = useState<StudySessionListItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [filter, setFilter] = useState<ToolFilter>("all");
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Annales V2
  const [annales, setAnnales] = useState<AnnaleSessionListItem[]>([]);
  const [loadingAnnales, setLoadingAnnales] = useState(true);
  const [annaleModalOpen, setAnnaleModalOpen] = useState(false);

  useEffect(() => {
    loadSessions();
    loadAnnales();
  }, []);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await getStudySessions();
      setSessions(res?.data || []);
    } catch {
      toast({ title: "Impossible de charger les sessions", variant: "destructive" });
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadAnnales = async () => {
    setLoadingAnnales(true);
    try {
      const res = await getAnnaleSessions();
      setAnnales(res?.data || []);
    } catch {
      // Silencieux si pas encore de données
    } finally {
      setLoadingAnnales(false);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await deleteStudySession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast({ title: "Session supprimée" });
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const handleDeleteAnnale = async (id: number) => {
    try {
      await deleteAnnaleSession(id);
      setAnnales((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Annale supprimée" });
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
    filter === "all" ? sessions : sessions.filter((s) => s.tool_types?.includes(filter as any));

  return (
    <>
      <Helmet>
        <title>Sphera — Assistant IA · CampusSphere</title>
        <meta name="description" content="Générez des fiches, quiz, flashcards et corrections d'annales intelligentes avec l'IA Sphera." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
        <div className="container max-w-6xl mx-auto py-4 md:py-8 px-4">

          {/* ─── Top CTA Header ─── */}
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-hidden rounded-[2rem] border border-[#ff9800]/20 bg-gradient-to-br from-[#fff3e0] via-[#fff7ed] to-[#fff1d1] shadow-xl">
              <div className="relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-[#ff9800] via-[#ffb74d] to-[#ff9800] opacity-90"></div>
                <div className="relative px-6 py-6 sm:px-8 sm:py-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="relative rounded-3xl bg-white/10 p-3 shadow-glow">
                        <img src="/sphera-logo-dark.png" alt="Logo Sphera" className="h-14 w-auto" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/80">Sphera</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">Assistant IA académique</h2>
                        <p className="mt-3 max-w-2xl text-sm md:text-base text-white/90">
                          Ouvre l’application Sphera standalone avec connexion automatique.
                          Accède directement à la V2 déjà connectée pour réviser, générer des fiches,
                          corriger des annales et poser des questions à l’IA.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 md:items-end">
                      <Button
                        onClick={() => { window.location.href = getSpheraStandaloneUrl(); }}
                        className="rounded-full bg-slate-950 px-6 py-3 text-white shadow-lg shadow-slate-950/20 hover:bg-slate-900"
                      >
                        Ouvrir l'app Sphera
                      </Button>
                      <p className="text-xs text-white/75 max-w-sm">
                        Connexion transparente via le même backend Django et le même token JWT.
                        Tu arrives directement dans la V2, prêt à chatter.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Header ─── */}
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#ff9800]/15 ring-1 ring-[#ff9800]/25 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#ff9800]" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Assistante <span className="text-[#ff9800]">Sphera</span>
                  </h1>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Fiches · Quiz · Flashcards · Q&A · Corrections d'annales
                  {" "}<span className="text-muted-foreground/60">·</span>{" "}
                  <span className="text-foreground/60">
                    {sessions.length} session{sessions.length !== 1 ? "s" : ""} · {annales.length} annale{annales.length !== 1 ? "s" : ""}
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 bg-[#ff9800] hover:bg-[#ff9800]/90 text-white"
                >
                  <Upload className="h-4 w-4" />
                  Uploader un cours
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAnnaleModalOpen(true)}
                  className="gap-2 border-[#ff9800]/30 text-[#ff9800] hover:bg-[#ff9800]/10"
                >
                  <Scroll className="h-4 w-4" />
                  Corriger une annale
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelected}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <div className="flex gap-1 p-1 bg-accent/30 rounded-xl w-fit mb-6 border border-border/30">
            {[
              { id: "sessions" as Tab, label: "Sessions d'étude", icon: <BookOpen className="h-3.5 w-3.5" />, count: sessions.length },
              { id: "annales"  as Tab, label: "Annales",           icon: <Scroll className="h-3.5 w-3.5" />,   count: annales.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/40"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  activeTab === tab.id ? "bg-[#ff9800]/15 text-[#ff9800]" : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ─── Tab : Sessions ─── */}
          {activeTab === "sessions" && (
            <div className="animate-in fade-in duration-300">
              {/* Filtres */}
              <div className="flex gap-2 flex-wrap mb-5">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                      filter === opt.value
                        ? "bg-[#ff9800] border-[#ff9800] text-white shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-[#ff9800]/40 hover:text-foreground"
                    )}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              {loadingSessions ? (
                <div className="flex flex-col items-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-[#ff9800] animate-spin" />
                  <p className="text-sm text-muted-foreground">Chargement des sessions…</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center py-20 gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#ff9800]/10 ring-1 ring-[#ff9800]/20 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-[#ff9800]/60" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Aucune session{filter !== "all" ? " de ce type" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Clique sur «&nbsp;Réviser avec l'IA&nbsp;» sur une ressource, ou uploade un document.
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 bg-[#ff9800] hover:bg-[#ff9800]/90 text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Uploader un cours
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSessions.map((session) => (
                    <StudySessionCard
                      key={session.id}
                      session={session}
                      onResume={(id) => navigate(`/sphera/sessions/${id}`)}
                      onDelete={handleDeleteSession}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Tab : Annales ─── */}
          {activeTab === "annales" && (
            <div className="animate-in fade-in duration-300">
              {loadingAnnales ? (
                <div className="flex flex-col items-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-[#ff9800] animate-spin" />
                  <p className="text-sm text-muted-foreground">Chargement des annales…</p>
                </div>
              ) : annales.length === 0 ? (
                <div className="flex flex-col items-center py-20 gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#ff9800]/10 ring-1 ring-[#ff9800]/20 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-[#ff9800]/60" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Aucune annale corrigée</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Uploade une épreuve passée et laisse Sphera la corriger en mode complet ou rapide.
                    </p>
                  </div>
                  <Button
                    onClick={() => setAnnaleModalOpen(true)}
                    className="gap-2 bg-[#ff9800] hover:bg-[#ff9800]/90 text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Corriger une annale
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {annales.map((annale) => (
                    <AnnaleCard
                      key={annale.id}
                      annale={annale}
                      onOpen={(id) => navigate(`/sphera/annales/${id}`)}
                      onDelete={handleDeleteAnnale}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedUploadFile && (
        <StudyToolsModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          uploadFile={selectedUploadFile}
          onSuccess={async () => {
            toast({ title: "Session générée avec succès !" });
            await loadSessions();
          }}
        />
      )}
      <AnnaleUploadModal
        open={annaleModalOpen}
        onClose={() => { setAnnaleModalOpen(false); loadAnnales(); }}
      />
    </>
  );
};
