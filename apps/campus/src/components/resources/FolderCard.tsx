import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Folder, FolderOpen, Download, Spinner as Loader2, DotsThreeVertical as MoreVertical, PencilSimple, Trash as Trash2 } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type ResourceFolder } from "@/services/api";

interface FolderCardProps {
  folder: ResourceFolder;
  isSelected?: boolean;
  onOpen: (folder: ResourceFolder) => void;
  onDownloadZip: (folder: ResourceFolder) => Promise<void>;
  onEdit?: (folder: ResourceFolder) => void;
  onDelete?: (folderId: string | number) => void;
}

export function FolderCard({
  folder,
  isSelected,
  onOpen,
  onDownloadZip,
  onEdit,
  onDelete,
}: FolderCardProps) {
  const { t } = useTranslation("resources");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading || folder.resource_count === 0) return;
    setIsDownloading(true);
    try {
      await onDownloadZip(folder);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-muted/40 hover:border-border transition-all cursor-pointer text-left min-h-[120px]",
        isSelected && "bg-muted/80 border-primary/50 ring-1 ring-primary/40"
      )}
      onClick={() => onOpen(folder)}
    >
      {/* Top Header: Folder Icon & Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          {isSelected ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px] font-medium gap-1 text-muted-foreground hover:text-foreground"
            onClick={handleDownload}
            disabled={isDownloading || folder.resource_count === 0}
            title={folder.resource_count === 0 ? t("folders.emptyTooltip") : t("folders.downloadZip")}
          >
            {isDownloading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            <span>ZIP</span>
          </Button>

          {folder.can_edit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(folder);
                  }}
                  className="text-xs"
                >
                  <PencilSimple className="h-3.5 w-3.5 mr-2" /> {t("folders.rename")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs text-destructive font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(folder.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> {t("folders.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Bottom Content: Name & Item count */}
      <div className="mt-3">
        <h3 className="font-semibold text-sm truncate text-foreground group-hover:underline">
          {folder.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {folder.resource_count > 1
            ? t("folders.files_other", { count: folder.resource_count })
            : t("folders.files_one", { count: folder.resource_count })}
        </p>
      </div>
    </div>
  );
}
