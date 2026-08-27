import { useState, useEffect } from "react";
import { FileText, BookOpen, Loader2 } from "lucide-react";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { Button } from "@/components/ui/button";
import { StudyToolsModal } from "@/sphera/components/study/StudyToolsModal";
import { getSphereFiles, getSphereStudySessions } from "@/services/api";
import { useNavigate } from "react-router-dom";

interface SphereSpheraTabProps {
  sphereId: string;
}

interface SphereFile {
  id: number;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export function SphereSpheraTab({ sphereId }: SphereSpheraTabProps) {
  const [files, setFiles] = useState<SphereFile[]>([]);
  const [sharedSessions, setSharedSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [studyModal, setStudyModal] = useState<{
    open: boolean;
    resourceId?: number;
    resourceTitle?: string;
  }>({ open: false });

  useEffect(() => {
    setLoading(true);
    // [BE-MIGRATION FE-04] Promise.all makes one failing call blank the whole tab; the sessions
    // call currently always 500s, so files never render. Use allSettled. — documentation/FRONTEND_CHANGES.md
    Promise.all([
      getSphereFiles(sphereId),
      getSphereStudySessions(sphereId)
    ])
      .then(([filesData, sessionsData]) => {
        setFiles(Array.isArray(filesData) ? filesData : []);
        setSharedSessions(sessionsData?.success ? sessionsData.data : []);
      })
      .catch(() => {
        setFiles([]);
        setSharedSessions([]);
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

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-[#ff9800]/10 flex items-center justify-center">
          <SpheraIcon size="xl" className="opacity-40" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Aucune ressource disponible</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Partagez des fichiers dans l'onglet <strong>Fichiers</strong> pour pouvoir les réviser avec Sphera.
          </p>
        </div>
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
    <div className="space-y-3">
      {/* En-tête */}
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

      {/* Liste des fichiers */}
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="border rounded-xl bg-card p-3 flex items-center justify-between gap-3 hover:border-[#ff9800]/40 transition-colors"
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
              className="bg-[#ff9800] hover:bg-[#e68900] text-white gap-1.5 flex-shrink-0 text-xs px-3"
              // [BE-MIGRATION FE-02] file.id is a SphereFile id but is passed as resourceId, which the
              // API resolves against the Resource table — different ID space. Switch to the new
              // sphereFileId prop. — documentation/FRONTEND_CHANGES.md
              onClick={() =>
                setStudyModal({ open: true, resourceId: file.id, resourceTitle: file.title })
              }
            >
              <SpheraIcon size="sm" />
              Réviser
            </Button>
          </div>
        ))}
      </div>

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
        resourceId={studyModal.resourceId}
        resourceTitle={studyModal.resourceTitle}
      />
    </div>
  );
}
