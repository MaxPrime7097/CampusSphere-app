import { Suspense, lazy } from "react";
import { Folder, FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NetflixCarousel } from "@/components/ui/netflix-carousel";
import { FolderCard } from "@/components/resources/FolderCard";
import { ResourceCard } from "@/components/resources/ResourceCard";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { cn } from "@/lib/utils";
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
}: ResourcesFolderSectionProps) {
  return (
    <section className="flex flex-col w-full max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-3 px-1">
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          Mes Dossiers ({folders.length}/4)
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-xs text-muted-foreground hover:text-foreground font-semibold",
            folders.length >= 4 && "opacity-50 cursor-not-allowed"
          )}
          onClick={onOpenCreateFolder}
          disabled={folders.length >= 4}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nouveau dossier
        </Button>
      </div>

      <NetflixCarousel className="gap-4 pb-1">
        {foldersLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="cs-scroll-item w-[220px] sm:w-[260px] h-32 bg-muted/40 rounded-2xl animate-pulse"
            />
          ))
        ) : folders.length === 0 ? (
          <div
            className="cs-scroll-item w-[220px] sm:w-[260px] h-32 border border-border/70 rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-all bg-card/50"
            onClick={onOpenCreateFolder}
          >
            <Folder className="h-6 w-6 mb-2 text-primary/70" />
            <span className="text-xs font-semibold">Créer un dossier</span>
          </div>
        ) : (
          folders.map((folder) => (
            <div key={folder.id} className="cs-scroll-item w-[220px] sm:w-[260px]">
              <FolderCard
                folder={folder}
                isSelected={selectedFolder?.id === folder.id}
                onOpen={onOpenFolder}
                onDownloadZip={onDownloadZip}
                onEdit={onEditFolder}
                onDelete={onDeleteFolder}
              />
            </div>
          ))
        )}
      </NetflixCarousel>

      {/* Expanded Selected Folder */}
      {selectedFolder && (
        <div className="mt-4 bg-muted/30 p-4 rounded-2xl border border-border/60 space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">{selectedFolder.name}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={onCloseFolder}
            >
              Fermer
            </Button>
          </div>
          {folderResources.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-xs">
              Ce dossier est actuellement vide.
            </div>
          ) : (
            <NetflixCarousel className="gap-3 pb-1">
              {folderResources.map((resource) => (
                <div key={resource.id} className="cs-scroll-item w-[160px] sm:w-[185px] md:w-[200px]">
                  <ResourceCard
                    resource={resource}
                    isDownloading={downloadingIds.has(String(resource.id))}
                    isSaved={savedResources.has(String(resource.id))}
                    onDownload={(e) => onDownloadResource(e, String(resource.id))}
                    onSave={(e) => onSaveResource(e, String(resource.id))}
                    onPreview={(e) => onPreviewResource(e, String(resource.id))}
                  />
                </div>
              ))}
            </NetflixCarousel>
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
