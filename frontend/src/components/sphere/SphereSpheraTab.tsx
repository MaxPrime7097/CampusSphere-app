import { useState, useEffect } from "react";
import { Sparkles, FileText, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudyToolsModal } from "@/components/study/StudyToolsModal";
import { getSphereFiles } from "@/services/api";

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
  const [loading, setLoading] = useState(true);
  const [studyModal, setStudyModal] = useState<{
    open: boolean;
    resourceId?: number;
    resourceTitle?: string;
  }>({ open: false });

  useEffect(() => {
    getSphereFiles(sphereId)
      .then((data) => setFiles(Array.isArray(data) ? data : []))
      .catch(() => setFiles([]))
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
          <Sparkles className="h-8 w-8 text-[#ff9800]" />
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
          <Sparkles className="h-5 w-5 text-[#ff9800]" />
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
              onClick={() =>
                setStudyModal({ open: true, resourceId: file.id, resourceTitle: file.title })
              }
            >
              <Sparkles className="h-3.5 w-3.5" />
              Réviser
            </Button>
          </div>
        ))}
      </div>

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
