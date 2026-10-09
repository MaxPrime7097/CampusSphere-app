import { FileText } from "@phosphor-icons/react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { normalizeResourceType, normalizeSubject } from "@/lib/resourceMetadata";
import { NOT_AVAILABLE_TEXT } from "@/constants/profileConstants";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("profile");

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {t("contributions.title")} <span className="text-muted-foreground font-normal">({sharedFiles.length})</span>
        </h3>
      </div>
      {loading ? (
        <div className="flex flex-col">
          {Array.from({ length: 4 }).map((_, i) => (
            <ResourceSkeleton key={i} />
          ))}
        </div>
      ) : sharedFiles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            resourcesAvailable
              ? t("contributions.emptyTitle")
              : t("contributions.unavailableTitle")
          }
          description={
            resourcesAvailable
              ? t("contributions.emptyDesc")
              : NOT_AVAILABLE_TEXT
          }
        />
      ) : (
        <div className="flex flex-col">
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
    </section>
  );
}
