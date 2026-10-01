import { Suspense, lazy, useState, useMemo } from "react";
import { Plus, Search, FileText, ExternalLink, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptimizedImage } from "@/components/ui/optimized-image";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";

const SphereUploadResourceModal = lazy(() =>
  import("@/components/modals/SphereUploadResourceModal").then((module) => ({
    default: module.SphereUploadResourceModal,
  }))
);

interface SphereFilesTabProps {
  sphereId: string;
  resources: any[];
  canModerateMembers: boolean;
  currentUserId: string | null;
  onDeleteFile: (fileId: string | number) => Promise<void>;
  onFileUploaded: () => void;
}

export function SphereFilesTab({
  sphereId,
  resources,
  canModerateMembers,
  currentUserId,
  onDeleteFile,
  onFileUploaded,
}: SphereFilesTabProps) {
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [isUploadResourceOpen, setIsUploadResourceOpen] = useState(false);

  const filteredResources = useMemo(() => {
    if (!fileSearchQuery.trim()) return resources;
    const query = fileSearchQuery.toLowerCase();
    return resources.filter((res) =>
      (res.title || "Fichier").toLowerCase().includes(query)
    );
  }, [resources, fileSearchQuery]);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center bg-card p-3 md:p-4 rounded-lg border">
        <h3 className="font-bold">Fichiers partagés ({resources.length})</h3>
        <>
          <Button
            size="sm"
            className="bg-secondary text-secondary-foreground hover:bg-muted border border-border/60 gap-1"
            onClick={() => setIsUploadResourceOpen(true)}
          >
            <Plus className="h-4 w-4" /> Partager
          </Button>
          {isUploadResourceOpen && (
            <Suspense fallback={<ModalLoadingFallback />}>
              <SphereUploadResourceModal
                open={isUploadResourceOpen}
                onOpenChange={setIsUploadResourceOpen}
                sphereId={sphereId}
                onUploaded={onFileUploaded}
              />
            </Suspense>
          )}
        </>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un fichier..."
          className="pl-9"
          value={fileSearchQuery}
          onChange={(e) => setFileSearchQuery(e.target.value)}
        />
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {fileSearchQuery
              ? "Aucun fichier ne correspond à votre recherche."
              : "Aucun fichier partagé pour le moment."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredResources.map((res: any) => {
            const fileUrl = res.file_url || res.fileUrl || "";
            const fileName = res.title || "Fichier";
            const fileType = res.file_type || res.fileType || "";
            const fileSize = res.file_size || res.fileSize || 0;
            const isImage = fileType.startsWith("image/");
            const isPdf =
              fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
            const uploaderName = res.uploaded_by?.name || res.uploadedBy?.name || "";
            const createdAt = res.created_at || res.createdAt;
            const canDelete =
              canModerateMembers || String(res.uploaded_by?.id) === String(currentUserId);

            return (
              <div key={res.id} className="border rounded-xl bg-card overflow-hidden">
                {isImage && fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative w-full h-48"
                  >
                    <OptimizedImage
                      src={fileUrl}
                      alt={fileName}
                      className="w-full h-full object-contain"
                      containerClassName="w-full h-full max-h-48 bg-muted"
                    />
                  </a>
                )}
                {isPdf && fileUrl && (
                  <div className="bg-muted/30 p-2">
                    <iframe
                      src={`${fileUrl}#toolbar=0&view=FitH`}
                      className="w-full h-48 rounded border"
                      title={fileName}
                    />
                  </div>
                )}
                <div className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {uploaderName && <span>{uploaderName} · </span>}
                        {fileSize > 0 && (
                          <span>{(fileSize / 1024 / 1024).toFixed(1)} MB · </span>
                        )}
                        {createdAt && (
                          <span>
                            {new Date(createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {fileUrl && (
                      <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ouvrir"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {fileUrl && (
                      <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0">
                        <a href={fileUrl} download={fileName} title="Télécharger">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteFile(res.id)}
                        title="Supprimer"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
