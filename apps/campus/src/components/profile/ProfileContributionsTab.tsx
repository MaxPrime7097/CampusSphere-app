import { FileText } from "lucide-react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { normalizeResourceType, normalizeSubject } from "@/lib/resourceMetadata";
import { NOT_AVAILABLE_TEXT } from "@/constants/profileConstants";

export interface SharedFileItem {
  id: string | number;
  resourceId?: string | number;
  name: string;
  filename?: string;
  type?: string;
  subject?: string;
  size?: string;
  viewCount?: number;
  downloadCount?: number;
}

interface ProfileContributionsTabProps {
  sharedFiles: SharedFileItem[];
  userName: string;
  loading: boolean;
  resourcesAvailable: boolean;
  onDownloadFile: (resourceId?: string | number, fileName?: string) => void;
}

export function ProfileContributionsTab({
  sharedFiles,
  userName,
  loading,
  resourcesAvailable,
  onDownloadFile,
}: ProfileContributionsTabProps) {
  return (
    <section className="mt-6">
      <div className="rounded-lg border bg-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <FileText className="h-5 w-5" />
          Fichiers Partagés
        </h3>
        {loading ? (
          <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ResourceSkeleton key={i} />
            ))}
          </div>
        ) : sharedFiles.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={
              resourcesAvailable
                ? "Aucune contribution pour le moment"
                : "Contributions non disponibles"
            }
            description={
              resourcesAvailable
                ? "Cet utilisateur n'a pas encore partagé de ressources."
                : NOT_AVAILABLE_TEXT
            }
          />
        ) : (
          <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {sharedFiles.map((file) => (
              <ResourceCard
                key={file.id}
                resource={{
                  id: String(file.resourceId || file.id),
                  title: file.name,
                  subject: normalizeSubject(file.subject || ""),
                  type: normalizeResourceType(file.type || ""),
                  authorName: userName,
                  fileSize: file.size,
                  viewCount: file.viewCount || 0,
                  downloadCount: file.downloadCount || 0,
                }}
                isDownloading={false}
                onDownload={(e) => {
                  e.stopPropagation();
                  onDownloadFile(file.resourceId, file.filename || file.name);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
