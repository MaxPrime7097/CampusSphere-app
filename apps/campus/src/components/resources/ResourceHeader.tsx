import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Eye,
  Bookmark,
  Zap,
  Info,
  BadgeCheck,
  Pencil,
  FolderInput,
  Trash2,
  Share2,
  Flag,
  Loader2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { renderMentionText } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  getTypeLabel,
  getSubjectLabel,
  getCategoryLabel,
} from "@/lib/resourceMetadata";
import type { ResourceFolder } from "@/services/api";

interface ResourceHeaderProps {
  resource: {
    id: string;
    title: string;
    description: string;
    subject: string;
    category: string;
    type: string | null;
    format: string;
    uploader: {
      name: string;
      username?: string;
      avatar: string;
      verified: boolean;
      contributions: number;
    };
    stats: {
      downloads: number;
      saves: number;
      views: number;
    };
    impactScore: number;
    canEdit?: boolean;
    canDelete?: boolean;
  };
  isSaved: boolean;
  isSaving: boolean;
  isSharing: boolean;
  isReporting: boolean;
  isDeleting: boolean;
  folders: ResourceFolder[];
  currentFolderId: string;
  onSave: () => void;
  onOpenEdit: () => void;
  onOpenDelete: () => void;
  onShare: () => void;
  onReport: () => void;
  onMoveToFolder: (folderId: string) => Promise<void>;
}

export function ResourceHeader({
  resource,
  isSaved,
  isSaving,
  isSharing,
  isReporting,
  isDeleting,
  folders,
  currentFolderId,
  onSave,
  onOpenEdit,
  onOpenDelete,
  onShare,
  onReport,
  onMoveToFolder,
}: ResourceHeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showFolderSelect, setShowFolderSelect] = useState(false);
  const [isMovingToFolder, setIsMovingToFolder] = useState(false);

  const handleFolderChange = async (val: string) => {
    setIsMovingToFolder(true);
    try {
      await onMoveToFolder(val);
      setShowFolderSelect(false);
    } finally {
      setIsMovingToFolder(false);
    }
  };

  return (
    <Card className="campus-card mb-4">
      <CardContent className="p-4 md:p-6">
        {/* Title & Badges */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="campus-gradient text-white">
              {getTypeLabel(resource.type)}
            </Badge>
            <Badge variant="secondary">{getSubjectLabel(resource.subject)}</Badge>
            {resource.category && (
              <Badge variant="outline">{getCategoryLabel(resource.category)}</Badge>
            )}
            <Badge variant="outline">
              {resource.format ? resource.format.toUpperCase() : "Non défini"}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 break-words break-all sm:break-normal">
            {resource.title}
          </h1>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {renderMentionText(resource.description)}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            {resource.stats.downloads}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {resource.stats.views}
          </span>
          <span className="flex items-center gap-1">
            <Bookmark className="h-4 w-4" />
            {resource.stats.saves}
          </span>
          <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 text-primary rounded-full ml-auto group relative">
            <Zap className="h-3 w-3 fill-current" />
            <span className="text-xs font-bold">{resource.impactScore || 0}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 rounded-full hover:bg-primary/20 transition-colors"
              onClick={() =>
                toast({
                  title: "Score d'impact",
                  description:
                    "Le Score d'Impact mesure l'utilité et la pertinence de ce contenu pour la communauté CampusSphere. Il est calculé en fonction des interactions et des retours des étudiants.",
                })
              }
            >
              <Info className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Uploader Info & Actions */}
        <div className="flex flex-col gap-3 p-3 bg-accent/50 rounded-lg mb-4 md:flex-row md:items-center md:justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() =>
              resource.uploader.username &&
              navigate(`/profile/${resource.uploader.username}`)
            }
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={resource.uploader.avatar} />
              <AvatarFallback>{resource.uploader.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{resource.uploader.name}</p>
                {resource.uploader.verified && (
                  <BadgeCheck className="h-4 w-4 text-primary fill-primary/10" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {resource.uploader.contributions} contributions
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Button
              variant={isSaved ? "secondary" : "outline"}
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="gap-2"
              aria-label={isSaved ? "Retirer des enregistrements" : "Enregistrer la ressource"}
            >
              <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
              <span className="hidden md:inline">
                {isSaved ? "Enregistré" : "Enregistrer"}
              </span>
            </Button>

            {resource.canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenEdit}
                className="gap-2"
                aria-label="Modifier la ressource"
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden md:inline">Modifier</span>
              </Button>
            )}

            {resource.canEdit && folders.length > 0 && !showFolderSelect && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFolderSelect(true)}
                className="gap-2"
                aria-label="Déplacer vers un dossier"
              >
                <FolderInput className="h-4 w-4" />
                <span className="hidden md:inline">Dossier</span>
              </Button>
            )}

            {resource.canEdit && folders.length > 0 && showFolderSelect && (
              <div className="flex items-center gap-1">
                <Select
                  value={currentFolderId}
                  onValueChange={handleFolderChange}
                >
                  <SelectTrigger className="h-8 text-xs w-36">
                    {isMovingToFolder ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <SelectValue placeholder="Choisir dossier" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun dossier</SelectItem>
                    {folders.map((f) => (
                      <SelectItem
                        key={f.id}
                        value={String(f.id)}
                        disabled={
                          f.resource_count >= 20 && currentFolderId !== String(f.id)
                        }
                      >
                        {f.name} ({f.resource_count}/20)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowFolderSelect(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {resource.canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onOpenDelete}
                disabled={isDeleting}
                className="gap-2"
                aria-label="Supprimer la ressource"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="hidden md:inline">Supprimer</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              disabled={isSharing}
              className="gap-2"
              aria-label="Partager la ressource"
            >
              {isSharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              <span className="hidden md:inline">Partager</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onReport}
              disabled={isReporting}
              className="gap-2"
              aria-label="Signaler la ressource"
            >
              {isReporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Flag className="h-4 w-4" />
              )}
              <span className="hidden md:inline">Signaler</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
