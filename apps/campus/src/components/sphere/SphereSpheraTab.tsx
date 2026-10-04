import { useState, useEffect } from "react";
import { FileText, BookOpen, Spinner as Loader2, Kanban, Sparkle, Presentation, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudyToolsModal } from "@/sphera/components/study/StudyToolsModal";
import { getSphereFiles, getSphereStudySessions } from "@/services/api";
import { useNavigate } from "react-router-dom";

interface SphereSpheraTabProps {
  sphereId: string;
  sphereType?: string;
  onTabChange?: (tab: string) => void;
}

interface SphereFile {
  id: number;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export function SphereSpheraTab({ sphereId, sphereType = "cours", onTabChange }: SphereSpheraTabProps) {
  const [files, setFiles] = useState<SphereFile[]>([]);
  const [sharedSessions, setSharedSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [studyModal, setStudyModal] = useState<{
    open: boolean;
    sphereFileId?: number;
    resourceTitle?: string;
  }>({ open: false });

  const isProject = sphereType === "projet";

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getSphereFiles(sphereId),
      getSphereStudySessions(sphereId)
    ])
      .then(([filesResult, sessionsResult]) => {
        if (filesResult.status === "fulfilled" && Array.isArray(filesResult.value)) {
          setFiles(filesResult.value);
        } else {
          setFiles([]);
        }

        if (sessionsResult.status === "fulfilled" && sessionsResult.value?.success) {
          setSharedSessions(sessionsResult.value.data || []);
        } else {
          setSharedSessions([]);
        }
      })
      .finally(() => setLoading(false));
  }, [sphereId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getFileIcon = (fileType: string, fileName: string) => {
    if (fileType.startsWith("image/")) return <FileText className="h-4 w-4 text-blue-500" />;
    if (fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf"))
      return <BookOpen className="h-4 w-4 text-red-500" />;
    return <FileText className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="space-y-4">
      {/* En-tête Contextualisé : Cours vs Projet */}
      {isProject ? (
        <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-primary/5 border border-violet-500/20 rounded-2xl p-4 md:p-5 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0 text-violet-600 dark:text-violet-400">
              <SpheraIcon size="lg" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-base">Sphera · Copilote de Projet</p>
                <Badge variant="outline" className="border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/10 text-[10px]">
                  Mode Équipe
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Sphera vous assiste pour structurer votre projet : décomposez votre cahier des charges en tâches Kanban, auditez vos rapports de livrables et simulez vos questions de soutenance.
              </p>
            </div>
          </div>

          {/* Cartes d'actions rapides projet */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div
              className="bg-card/80 border rounded-xl p-3 space-y-1.5 hover:border-violet-500/40 transition-colors cursor-pointer"
              onClick={() => onTabChange?.("tasks")}
            >
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                <Kanban className="h-4 w-4" />
                <span className="text-xs font-bold">1. Planifier les tâches</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Définissez les livrables et assignez les rôles directement sur le Kanban.
              </p>
            </div>

            <div
              className="bg-card/80 border rounded-xl p-3 space-y-1.5 hover:border-violet-500/40 transition-colors cursor-pointer"
              onClick={() => {
                if (files.length > 0) {
                  setStudyModal({ open: true, sphereFileId: files[0].id, resourceTitle: files[0].title });
                }
              }}
            >
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Sparkle className="h-4 w-4" weight="fill" />
                <span className="text-xs font-bold">2. Relecture & Synthèse</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Générez un résumé critique ou une fiche de contrôle qualité sur vos livrables.
              </p>
            </div>

            <div
              className="bg-card/80 border rounded-xl p-3 space-y-1.5 hover:border-violet-500/40 transition-colors cursor-pointer"
              onClick={() => {
                if (files.length > 0) {
                  setStudyModal({ open: true, sphereFileId: files[0].id, resourceTitle: files[0].title });
                }
              }}
            >
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Presentation className="h-4 w-4" />
                <span className="text-xs font-bold">3. Préparer la soutenance</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Générez des questions de simulation pour anticiper les remarques du jury.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#ff9800]/10 to-amber-500/5 border border-[#ff9800]/20 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#ff9800]/15 flex items-center justify-center flex-shrink-0">
            <SpheraIcon size="lg" />
          </div>
          <div>
            <p className="font-semibold text-sm">Réviser avec Sphera</p>
            <p className="text-xs text-muted-foreground">
              Sélectionnez un fichier pour générer fiches, quiz ou flashcards avec l'IA.
            </p>
          </div>
        </div>
      )}

      {/* Fichiers disponibles pour l'IA */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-4 bg-card border rounded-2xl">
          <div className="h-14 w-14 rounded-2xl bg-[#ff9800]/10 flex items-center justify-center">
            <SpheraIcon size="xl" className="opacity-40" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">
              {isProject ? "Aucun livrable ou cahier des charges déposé" : "Aucune ressource disponible"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
              Déposez vos documents (PDF, rapport, sujet de projet) dans l'onglet <strong>Fichiers</strong> pour les analyser avec Sphera.
            </p>
          </div>
          {onTabChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTabChange("files")}
              className="text-xs gap-1.5 mt-2"
            >
              Aller aux fichiers <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isProject ? "Documents & Livrables analysables" : "Supports de cours disponibles"} ({files.length})
            </p>
          </div>
          {files.map((file) => (
            <div
              key={file.id}
              className="border rounded-xl bg-card p-3 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file.file_type, file.title)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.file_size > 0 && `${(file.file_size / 1024 / 1024).toFixed(1)} MB · `}
                    {new Date(file.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                className={
                  isProject
                    ? "bg-violet-600 hover:bg-violet-700 text-white gap-1.5 flex-shrink-0 text-xs px-3"
                    : "bg-[#ff9800] hover:bg-[#e68900] text-white gap-1.5 flex-shrink-0 text-xs px-3"
                }
                onClick={() =>
                  setStudyModal({ open: true, sphereFileId: file.id, resourceTitle: file.title })
                }
              >
                <SpheraIcon size="sm" />
                {isProject ? "Analyser" : "Réviser"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Sessions Partagées */}
      {sharedSessions.length > 0 && (
        <div className="pt-6 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <SpheraIcon size="md" />
            <h3 className="font-bold text-sm">Sessions partagées par les membres</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sharedSessions.map((session) => (
              <div
                key={session.id}
                className="group border rounded-xl bg-card p-4 hover:border-[#ff9800]/40 transition-all cursor-pointer shadow-sm hover:shadow-md"
                onClick={() => navigate(`/sphera/sessions/${session.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-[#ff9800]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="h-5 w-5 text-[#ff9800]" />
                  </div>
                  <div className="flex gap-1">
                    {(session.tool_types || []).map((t: string) => (
                      <span key={t} className="px-1.5 py-0.5 rounded-md bg-muted text-[9px] font-bold uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                
                <h4 className="font-semibold text-sm line-clamp-1 mb-1">
                  {session.resource_title || session.source_filename || "Session d'étude"}
                </h4>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-muted overflow-hidden flex items-center justify-center text-[10px]">
                      {session.owner_info?.avatar ? (
                        <img src={session.owner_info.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{session.owner_info?.name?.[0] || "?"}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                      {session.owner_info?.name || "Membre"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Sphera */}
      <StudyToolsModal
        isOpen={studyModal.open}
        onClose={() => setStudyModal({ open: false })}
        sphereFileId={studyModal.sphereFileId}
        resourceTitle={studyModal.resourceTitle}
      />
    </div>
  );
}
