import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { Folder, FolderOpen, Plus, Download } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FolderCard } from "@/components/resources/FolderCard";
import { ResourceCard } from "@/components/resources/ResourceCard";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { cn, formatFileSize } from "@/lib/utils";
import type { ResourceFolder, ResourceCardData } from "@/types";

const CreateFolderModal = lazy(() =>
  import("@/components/modals/CreateFolderModal").then((module) => ({
    default: module.CreateFolderModal,
  }))
);

interface ResourcesFolderSectionProps {
  folders: any[];
  foldersLoading: boolean;
  selectedFolder: ResourceFolder | null;
  folderResources: ResourceCardData[];
  downloadingIds: Set<string>;
  savedResources: Set<string>;
  showCreateFolder: boolean;
  editingFolder: ResourceFolder | null;
  onOpenFolder: (folder: any) => void;
  onCloseFolder: () => void;
  onDownloadZip: (folder: any) => Promise<void>;
  onEditFolder: (folder: any) => void;
  onDeleteFolder: (folderId: string) => void;
  onOpenCreateFolder: () => void;
  onCloseCreateFolder: (open: boolean) => void;
  onFolderCreated: (folder: any) => void;
  onDownloadResource: (e: React.MouseEvent, id: string) => void;
  onSaveResource: (e: React.MouseEvent, id: string) => void;
  onPreviewResource: (e: React.MouseEvent, id: string) => void;
  onRemoveResourceFromFolder?: (folderId: string | number, resourceId: string) => Promise<void>;
}

export function ResourcesFolderSection({
  folders,
  foldersLoading,
  selectedFolder,
  folderResources,
  downloadingIds,
  savedResources,
  showCreateFolder,
  editingFolder,
  onOpenFolder,
  onCloseFolder,
  onDownloadZip,
  onEditFolder,
  onDeleteFolder,
  onOpenCreateFolder,
  onCloseCreateFolder,
  onFolderCreated,
  onDownloadResource,
  onSaveResource,
  onPreviewResource,
  onRemoveResourceFromFolder,
}: ResourcesFolderSectionProps) {
  const { t } = useTranslation("resources");

  const totalFolderBytes =
    (selectedFolder as any)?.total_size ||
    folderResources.reduce((acc, r) => acc + (Number(r.fileSize) || Number(r.file_size) || 0), 0);

  return (
    <section className="flex flex-col w-full max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-3 px-1">
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          {t("folders.myFolders", { count: folders.length })}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-xs text-muted-foreground hover:text-foreground font-semibold",
            folders.length >= 10 && "opacity-50 cursor-not-allowed"
          )}
          onClick={onOpenCreateFolder}
          disabled={folders.length >= 10}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t("folders.newFolder")}
        </Button>
      </div>

      {foldersLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-muted/40 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <div
          className="border border-dashed border-border/70 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/30 hover:border-border cursor-pointer transition-colors min-h-[120px]"
          onClick={onOpenCreateFolder}
        >
          <Folder className="h-6 w-6 text-muted-foreground/70" />
          <span className="text-xs font-medium">{t("folders.createFirst")}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              isSelected={selectedFolder?.id === folder.id}
              onOpen={onOpenFolder}
              onDownloadZip={onDownloadZip}
              onEdit={onEditFolder}
              onDelete={onDeleteFolder}
            />
          ))}
        </div>
      )}

      {/* Expanded Selected Folder */}
      {selectedFolder && (
        <div className="mt-3 py-3 border-t border-b border-border/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FolderOpen className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">{selectedFolder.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {folderResources.length} {folderResources.length > 1 ? "ressources" : "ressource"}
                  </span>
                  <span>·</span>
                  <span className="font-mono text-[11px]">
                    {formatFileSize(totalFolderBytes)} / 1 Go max
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-xs px-2.5 gap-1.5 font-normal"
                onClick={() => onDownloadZip(selectedFolder)}
                disabled={folderResources.length === 0}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Télécharger tout (ZIP)</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                onClick={onCloseFolder}
              >
                {t("folders.close")}
              </Button>
            </div>
          </div>

          {folderResources.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-xs">
              {t("folders.empty")}
            </div>
          ) : (
            <div className="flex flex-col">
              {folderResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isDownloading={downloadingIds.has(String(resource.id))}
                  isSaved={savedResources.has(String(resource.id))}
                  onDownload={(e) => onDownloadResource(e, String(resource.id))}
                  onSave={(e) => onSaveResource(e, String(resource.id))}
                  onPreview={(e) => onPreviewResource(e, String(resource.id))}
                  onRemoveFromFolder={
                    selectedFolder.can_edit && onRemoveResourceFromFolder
                      ? (e) => {
                          e.stopPropagation();
                          onRemoveResourceFromFolder(selectedFolder.id, String(resource.id));
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showCreateFolder && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <CreateFolderModal
            open={showCreateFolder}
            onOpenChange={onCloseCreateFolder}
            existingCount={folders.length}
            folder={editingFolder}
            onSuccess={onFolderCreated}
          />
        </Suspense>
      )}
    </section>
  );
}
