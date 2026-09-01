import { useState } from "react";
import { Folder, FolderOpen, Download, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
  onDelete?: (folder: string) => void;
}

export function FolderCard({
  folder,
  isSelected,
  onOpen,
  onDownloadZip,
  onEdit,
  onDelete,
}: FolderCardProps) {
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
        "group relative bg-card border border-border/70 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-xs hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        isSelected && "ring-2 ring-primary shadow-md border-primary/50"
      )}
      onClick={() => onOpen(folder)}
    >
      {/* Header — compact with subtle primary tint */}
      <div className="h-14 flex items-center justify-center bg-muted/40 border-b border-border/40">
        {isSelected ? (
          <FolderOpen className="h-6 w-6 text-primary" />
        ) : (
          <Folder className="h-6 w-6 text-primary/80 group-hover:text-primary transition-colors duration-200" />
        )}
      </div>

      <div className="p-3 space-y-2">
        {/* Name + options */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-xs truncate text-foreground group-hover:text-primary transition-colors">
              {folder.name}
            </h3>
            {folder.description && (
              <p className="text-[10px] text-muted-foreground truncate">{folder.description}</p>
            )}
          </div>
          {folder.can_edit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mr-1"
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
                  <Pencil className="h-3 w-3 mr-2" /> Renommer
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs text-destructive font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(folder.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-2" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <span className="text-[10px] font-medium text-muted-foreground">
            {folder.resource_count} {folder.resource_count > 1 ? "fichiers" : "fichier"}
          </span>

          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] font-semibold gap-1 text-primary hover:bg-primary/10"
            onClick={handleDownload}
            disabled={isDownloading || folder.resource_count === 0}
            title={folder.resource_count === 0 ? "Dossier vide" : "Télécharger en ZIP"}
          >
            {isDownloading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            <span>ZIP</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
