import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { BookOpen, Brain as BrainCircuit, Upload, Spinner as Loader2, FileText, Plus, Scroll, Exam, Stack as SquareStack } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { StudySessionCard } from "@/sphera/components/study/StudySessionCard";
import { StudyToolsModal } from "@/sphera/components/study/StudyToolsModal";
import { AnnaleUploadModal } from "../components/AnnaleUploadModal";
import { AnnaleCard } from "../components/AnnaleCard";
import { QuotaIndicator } from "../components/QuotaIndicator";
import { getStudySessions, deleteStudySession, getAnnaleSessions, deleteAnnaleSession } from "../services/spheraService";
import type { StudySessionListItem, AnnaleSessionListItem } from "../types/sphera.types";

type ToolFilter = "all" | "fiche" | "quiz" | "flashcards";

const FILTER_OPTIONS: { value: ToolFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all",        label: "Toutes",      icon: <SpheraIcon size="sm" variant="white"/> },
  { value: "fiche",      label: "Fiches",      icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: "quiz",       label: "Quiz",        icon: <BrainCircuit className="h-3.5 w-3.5" /> },
  { value: "flashcards", label: "Flashcards",  icon: <SquareStack className="h-3.5 w-3.5" /> },
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
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filter, setFilter] = useState<ToolFilter>("all");
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [annaleModalOpen, setAnnaleModalOpen] = useState(false);

  // TanStack Query SWR for study sessions
  const sessionsQuery = useQuery({
    queryKey: ["sphera", "sessions"],
    queryFn: async () => {
      const res = await getStudySessions();
      return (res?.data || []) as StudySessionListItem[];
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
    refetchOnMount: true,
  });

  // TanStack Query SWR for annale sessions
  const annalesQuery = useQuery({
    queryKey: ["sphera", "annales"],
    queryFn: async () => {
      const res = await getAnnaleSessions();
      return (res?.data || []) as AnnaleSessionListItem[];
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
    refetchOnMount: true,
  });

  const [sessions, setSessions] = useState<StudySessionListItem[]>(() => {
    const cached = queryClient.getQueryData<StudySessionListItem[]>(["sphera", "sessions"]);
    return Array.isArray(cached) ? cached : [];
  });

  const [annales, setAnnales] = useState<AnnaleSessionListItem[]>(() => {
    const cached = queryClient.getQueryData<AnnaleSessionListItem[]>(["sphera", "annales"]);
    return Array.isArray(cached) ? cached : [];
  });

  useEffect(() => {
    if (sessionsQuery.data) setSessions(sessionsQuery.data);
  }, [sessionsQuery.data]);

  useEffect(() => {
    if (annalesQuery.data) setAnnales(annalesQuery.data);
  }, [annalesQuery.data]);

  const loadingSessions = sessionsQuery.isLoading && sessions.length === 0;
  const loadingAnnales = annalesQuery.isLoading && annales.length === 0;

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await deleteStudySession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      queryClient.setQueryData<StudySessionListItem[]>(["sphera", "sessions"], (old) =>
        (old || []).filter((s) => s.id !== sessionId)
      );
      toast({ title: "Session supprimée" });
    } catch {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const handleDeleteAnnale = async (id: number) => {
    try {
      await deleteAnnaleSession(id);
      setAnnales((prev) => prev.filter((a) => a.id !== id));
      queryClient.setQueryData<AnnaleSessionListItem[]>(["sphera", "annales"], (old) =>
        (old || []).filter((a) => a.id !== id)
      );
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
        <title>Sphera - Assistant IA | CampusSphere</title>
        <meta name="description" content="Sphera, votre assistante IA academique sur CampusSphere." />
        <link rel="canonical" href="https://sphera.campussphere.app/" />
      </Helmet>

      <div className="min-h-screen bg-background pb-20">
        <div className="w-full max-w-6xl mx-auto py-4 md:py-5 px-0 sm:px-4">

          {/* Header — same pattern as Spheres/Resources pages */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-4 sm:px-0">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <SpheraIcon size="xl" variant="primary" />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Assistante <span className="text-primary">Sphera</span>
                </h1>
                <QuotaIndicator className="ml-1" />
              </div>
              <p className="text-muted-foreground text-sm">
                Fiches, Quiz, Flashcards, Q&A et Corrections d'annales
              </p>
            </div>

            <div className="flex flex-wrap gap-2 px-4 sm:px-0">
              <Button
                size="sm"
                onClick={() => { window.open(getSpheraStandaloneUrl(), "_blank"); }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                  <SpheraIcon size="md" variant="white" />
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
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
                onChange={handleFileSelected}
                className="hidden"
              />
            </div>
          </div>

          {/* Tabs — same SharedTabsList as Spheres/Resources */}
          <Tabs defaultValue="sessions" className="w-full">
            <div className="px-4 sm:px-0">
              <SharedTabsList>
                <SharedTabsTrigger value="sessions">
                  Sessions d'étude
                  <Badge variant="muted" size="sm" className="ml-1.5">{sessions.length}</Badge>
                </SharedTabsTrigger>
                <SharedTabsTrigger value="annales">
                  Annales
                  <Badge variant="muted" size="sm" className="ml-1.5">{annales.length}</Badge>
                </SharedTabsTrigger>
              </SharedTabsList>
            </div>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="mt-4">
              {/* Filters */}
              <div className="flex gap-2 flex-wrap mb-5 px-4 sm:px-0">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                      filter === opt.value
                        ? "bg-primary/15 border-primary/30 text-primary font-semibold"
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
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Aucune révision {filter !== "all" ? " de ce type" : ""}
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
                <div className="flex flex-col">
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
                <div className="flex flex-col items-center py-16 gap-4 text-center px-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <Exam className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Aucune annale corrigée</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Uploadez une épreuve passée et laissez Sphera la corriger.
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setAnnaleModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4" />
                    Corriger une annale
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col">
                  {annales.map((session) => (
                    <AnnaleCard
                      key={session.id}
                      annale={session}
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
            await sessionsQuery.refetch();
          }}
        />
      )}
      <AnnaleUploadModal
        open={annaleModalOpen}
        onClose={() => { setAnnaleModalOpen(false); void annalesQuery.refetch(); }}
      />
    </>
  );
};
