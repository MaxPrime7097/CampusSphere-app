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

import { StudySessionCard } from "@/sphera/components/study/StudySessionCard";
import { StudyToolsModal } from "@/sphera/components/study/StudyToolsModal";
import { AnnaleUploadModal } from "../components/AnnaleUploadModal";
import { AnnaleCard } from "../components/AnnaleCard";
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
  const baseUrl = envUrl || (isLocal ? "http://localhost:5174" : "https://sphera.campussphere.app");
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

  const [sessions, setSessions] = useState<StudySessionListItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [filter, setFilter] = useState<ToolFilter>("all");
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

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
      // Silencieux si pas encore de donnees
    } finally {
      setLoadingAnnales(false);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await deleteStudySession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast({ title: "Session supprimee" });
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const handleDeleteAnnale = async (id: number) => {
    try {
      await deleteAnnaleSession(id);
      setAnnales((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Annale supprimee" });
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
        <title>Sphera -- Assistant IA -- CampusSphere</title>
        <meta name="description" content="Sphera, votre assistante IA academique, genere fiches, quiz, flashcards, corrige les annales et offre un chat IA en direct." />
        <link rel="canonical" href="https://sphera.campussphere.app/" />
        <meta property="og:title" content="Sphera -- Assistant IA" />
        <meta property="og:description" content="Generez des fiches de revision, des quiz, des flashcards, corrigez vos annales et discutez avec une IA academique grace a Sphera." />
        <meta property="og:url" content="https://sphera.campussphere.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://sphera.campussphere.app/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sphera -- Assistant IA" />
        <meta name="twitter:description" content="Votre aide IA pour reviser, creer des quiz, flashcards et corriger des annales." />
        <meta name="twitter:image" content="https://sphera.campussphere.app/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto py-4 md:py-6 px-4">

          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <img 
                      src="/sphera-logo.png" 
                      className="w-9 h-9 object-contain"
                      style={{ filter: "brightness(0) saturate(100%) invert(62%) sepia(97%) saturate(3195%) hue-rotate(13deg) brightness(103%) contrast(101%)" }}
                      alt="Sphera Logo"
                    />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Assistante <span className="text-primary">Sphera</span>
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Fiches -- Quiz -- Flashcards -- Q&A -- Corrections d'annales
                  {" "}<span className="text-muted-foreground/50">|</span>{" "}
                  <span className="text-foreground/50">
                    {sessions.length} session{sessions.length !== 1 ? "s" : ""} -- {annales.length} annale{annales.length !== 1 ? "s" : ""}
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => { window.open(getSpheraStandaloneUrl(), "_blank"); }}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-none"
                >
                  <Sparkles className="h-4 w-4" />
                  Ouvrir Sphera
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Uploader un cours
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setAnnaleModalOpen(true)}
                  className="gap-2"
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

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit mb-5 border border-border/30">
            {[
              { id: "sessions" as Tab, label: "Sessions d'etude", icon: <BookOpen className="h-3.5 w-3.5" />, count: sessions.length },
              { id: "annales"  as Tab, label: "Annales",           icon: <Scroll className="h-3.5 w-3.5" />,   count: annales.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab : Sessions */}
          {activeTab === "sessions" && (
            <div>
              {/* Filters — horizontal scroll */}
              <div className="cs-scroll-row gap-2 mb-5 pb-1">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={cn(
                      "cs-scroll-item flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all whitespace-nowrap",
                      filter === opt.value
                        ? "bg-primary border-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              {loadingSessions ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Loader2 className="h-7 w-7 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Chargement des sessions...</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-4 text-center">
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Aucune session{filter !== "all" ? " de ce type" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Cliquez sur "Reviser avec l'IA" sur une ressource, ou uploadez un document.
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Uploader un cours
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

          {/* Tab : Annales */}
          {activeTab === "annales" && (
            <div>
              {loadingAnnales ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Loader2 className="h-7 w-7 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Chargement des annales...</p>
                </div>
              ) : annales.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-4 text-center">
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                    <FileText className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Aucune annale corrigee</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Uploadez une epreuve passee et laissez Sphera la corriger.
                    </p>
                  </div>
                  <Button
                    onClick={() => setAnnaleModalOpen(true)}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Corriger une annale
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            toast({ title: "Session generee avec succes !" });
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
