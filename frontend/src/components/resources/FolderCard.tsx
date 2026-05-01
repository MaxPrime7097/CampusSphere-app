import { useState } from "react";
import { Folder, FolderOpen, Download, Loader2, MoreVertical, Pencil, Trash2, Users, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type ResourceFolder } from "@/services/api";

interface FolderCardProps {
  folder: ResourceFolder;
  isSelected?: boolean;
  onOpen: (folder: ResourceFolder) => void;
  onDownloadZip: (folder: ResourceFolder) => Promise<void>;
  onEdit?: (folder: ResourceFolder) => void;
  onDelete?: (folder: ResourceFolder) => void;
}

const VISIBILITY_ICONS = {
  public: <Globe className="h-3 w-3" />,
  university: <Users className="h-3 w-3" />,
  friends: <Lock className="h-3 w-3" />,
};

const VISIBILITY_LABELS = {
  public: "Public",
  university: "Université",
  friends: "Amis",
};

const FOLDER_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-amber-500 to-orange-600",
];

export function FolderCard({
  folder,
  isSelected,
  onOpen,
  onDownloadZip,
  onEdit,
  onDelete,
}: FolderCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Deterministic color based on folder id
  const colorClass = FOLDER_COLORS[folder.id % FOLDER_COLORS.length];

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
        "group relative bg-card border rounded-xl overflow-hidden cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]",
        isSelected && "ring-2 ring-primary shadow-md"
      )}
      onClick={() => onOpen(folder)}
    >
      {/* Header gradient */}
      <div className={cn("h-20 flex items-center justify-center bg-gradient-to-br", colorClass)}>
        {isSelected
          ? <FolderOpen className="h-10 w-10 text-white drop-shadow-md" />
          : <Folder className="h-10 w-10 text-white drop-shadow-md" />
        }
      </div>

      <div className="p-3 space-y-2">
        {/* Name + visibility */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate">{folder.name}</h3>
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
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(folder); }}>
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Renommer
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 font-medium"
                  onClick={(e) => { e.stopPropagation(); onDelete?.(folder); }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 flex items-center gap-1">
              {VISIBILITY_ICONS[folder.visibility]}
              {VISIBILITY_LABELS[folder.visibility]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {folder.resource_count} fichier{folder.resource_count !== 1 ? "s" : ""}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[10px] gap-1 hover:bg-primary hover:text-primary-foreground border-muted"
            onClick={handleDownload}
            disabled={isDownloading || folder.resource_count === 0}
            title={folder.resource_count === 0 ? "Dossier vide" : "Télécharger en ZIP"}
          >
            {isDownloading
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Download className="h-3 w-3" />
            }
            ZIP
          </Button>
        </div>
      </div>
    </div>
  );
}
