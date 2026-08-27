import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  BookOpen, BrainCircuit, Columns, Upload, Loader2,
  FileText, Plus, Scroll,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import { StudySessionCard } from "@/sphera/components/study/StudySessionCard";
import { StudyToolsModal } from "@/sphera/components/study/StudyToolsModal";
import { AnnaleUploadModal } from "../components/AnnaleUploadModal";
import { AnnaleCard } from "../components/AnnaleCard";
import { getStudySessions, deleteStudySession, getAnnaleSessions, deleteAnnaleSession } from "../services/spheraService";
import type { StudySessionListItem, AnnaleSessionListItem } from "../types/sphera.types";

type ToolFilter = "all" | "fiche" | "quiz" | "flashcards";

const FILTER_OPTIONS: { value: ToolFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all",        label: "Toutes",      icon: <SpheraIcon size="sm" /> },
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
      // Silencieux
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
        <title>Sphera - Assistant IA | CampusSphere</title>
        <meta name="description" content="Sphera, votre assistante IA academique sur CampusSphere." />
        <link rel="canonical" href="https://sphera.campussphere.app/" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="w-full max-w-6xl mx-auto py-4 md:py-5 px-2 sm:px-4">

          {/* Header — same pattern as Spheres/Resources pages */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-2 sm:px-0">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <img 
                  src="/sphera-logo.png" 
                  className="w-8 h-8 object-contain"
                  style={{ filter: "brightness(0) saturate(100%) invert(62%) sepia(97%) saturate(3195%) hue-rotate(13deg) brightness(103%) contrast(101%)" }}
                  alt="Sphera"
                />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Assistante <span className="text-primary">Sphera</span>
                </h1>
              </div>
              <p className="text-muted-foreground text-sm">
                Fiches, Quiz, Flashcards, Q&A et Corrections d'annales
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => { window.open(getSpheraStandaloneUrl(), "_blank"); }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                  <SpheraIcon size="md" />
                <span className="hidden sm:inline">Ouvrir</span> Sphera
              </Button>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Uploader un cours</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAnnaleModalOpen(true)} className="gap-2">
                <Scroll className="h-4 w-4" />
                <span className="hidden sm:inline">Corriger une annale</span>
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

          {/* Tabs — same SharedTabsList as Spheres/Resources */}
          <Tabs defaultValue="sessions" className="w-full">
            <SharedTabsList>
              <SharedTabsTrigger value="sessions">
                Sessions d'etude
                <Badge variant="muted" size="sm" className="ml-1.5">{sessions.length}</Badge>
              </SharedTabsTrigger>
              <SharedTabsTrigger value="annales">
                Annales
                <Badge variant="muted" size="sm" className="ml-1.5">{annales.length}</Badge>
              </SharedTabsTrigger>
            </SharedTabsList>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="mt-4">
              {/* Filters */}
              <div className="flex gap-2 flex-wrap mb-5">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                      filter === opt.value
                        ? "bg-primary border-primary text-primary-foreground"
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
                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">Chargement des sessions...</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <SpheraIcon size="xl" className="opacity-40" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Aucune session{filter !== "all" ? " de ce type" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Cliquez sur "Reviser avec l'IA" sur une ressource, ou uploadez un document.
                    </p>
                  </div>
                  <Button size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
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
            </TabsContent>

            {/* Annales Tab */}
            <TabsContent value="annales" className="mt-4">
              {loadingAnnales ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">Chargement des annales...</p>
                </div>
              ) : annales.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Aucune annale corrigee</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Uploadez une epreuve passee et laissez Sphera la corriger.
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setAnnaleModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
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
            </TabsContent>
          </Tabs>
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
