import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Download, Eye, Bookmark,
  Video, FileCode, Archive, FileImage,
  Loader2,
} from "lucide-react";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { getTypeLabel, getSubjectLabel } from "@/lib/resourceMetadata";
import { formatFileSize, cn } from "@/lib/utils";
import { StudyToolsModal } from "@/sphera/components/study/StudyToolsModal";

interface ResourceCardProps {
  resource: any;
  isDownloading?: boolean;
  isSaved?: boolean;
  onDownload?: (e: React.MouseEvent) => void;
  onSave?: (e: React.MouseEvent) => void;
  onPreview?: (e: React.MouseEvent) => void;
  className?: string;
}

const TYPE_STYLES: Record<string, { icon: string; bg: string }> = {
  notes:          { icon: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/30" },
  resumes:        { icon: "text-sky-500",    bg: "bg-sky-50 dark:bg-sky-950/30" },
  exercises:      { icon: "text-red-500",    bg: "bg-red-50 dark:bg-red-950/30" },
  exam_papers:    { icon: "text-green-500",  bg: "bg-green-50 dark:bg-green-950/30" },
  annales:        { icon: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/30" },
  projects:       { icon: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  presentations:  { icon: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-950/30" },
  cours:          { icon: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
  default:        { icon: "text-muted-foreground", bg: "bg-muted/50" },
};

function getTypeStyle(type: string) {
  const key = (type || "").toLowerCase().split("/")[0];
  return TYPE_STYLES[key] ?? TYPE_STYLES.default;
}

function getFileIcon(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("video"))   return <Video className="h-5 w-5" />;
  if (t.includes("image"))   return <FileImage className="h-5 w-5" />;
  if (t.includes("code") || t.includes("project")) return <FileCode className="h-5 w-5" />;
  if (t.includes("archive") || t.includes("zip"))  return <Archive className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
}

export const ResourceCard = React.memo(({
  resource, isDownloading, isSaved,
  onDownload, onSave, onPreview, className
}: ResourceCardProps) => {
  const navigate = useNavigate();
  const style = getTypeStyle(resource.type);
  const [studyOpen, setStudyOpen] = React.useState(false);

  return (
    <>
      <Card
        className={cn(
          "group overflow-hidden cursor-pointer cs-card-raised border-border/40",
          className
        )}
        onClick={() => navigate(`/resources/${resource.id}`)}
      >
        <CardContent className="p-0">
          {/* Color bar top — type indicator */}
          <div className={cn("flex items-center gap-2.5 px-3 py-2.5", style.bg)}>
            <div className={cn("flex-shrink-0", style.icon)}>
              {getFileIcon(resource.type)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm line-clamp-1 text-foreground leading-tight">
                {resource.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="muted" size="sm">
                  {getSubjectLabel(resource.subject)}
                </Badge>
                {resource.type && (
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
                    {getTypeLabel(resource.type)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="px-3 py-2.5 space-y-2.5">
            {/* Stats row */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="truncate max-w-[100px]">Par {resource.authorName}</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" /> {resource.viewCount || 0}
                </span>
                <span className="flex items-center gap-0.5">
                  <Download className="h-3 w-3" /> {resource.downloadCount || 0}
                </span>
                {resource.fileSize > 0 && (
                  <span className="text-[9px] text-muted-foreground/50">
                    {formatFileSize(resource.fileSize)}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 rounded-[var(--radius-sm)] hover:bg-accent"
                onClick={onPreview}
                title="Apercu"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "h-7 w-7 p-0 rounded-[var(--radius-sm)]",
                  isSaved ? "text-primary bg-primary/8" : "hover:bg-accent"
                )}
                onClick={onSave}
                title="Sauvegarder"
              >
                <Bookmark className={cn("h-3.5 w-3.5", isSaved ? "fill-current" : "")} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 rounded-[var(--radius-sm)] hover:bg-accent text-primary"
                onClick={(e) => { e.stopPropagation(); setStudyOpen(true); }}
                title="Reviser avec l'IA"
              >
                <SpheraIcon size="sm" />
              </Button>
              <Button
                size="sm"
                className="h-7 flex-1 gap-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-[var(--radius-sm)] shadow-none"
                onClick={onDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold hidden sm:inline">Telecharger</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <StudyToolsModal
        isOpen={studyOpen}
        onClose={() => setStudyOpen(false)}
        resourceId={resource.id}
        resourceTitle={resource.title}
      />
    </>
  );
});

ResourceCard.displayName = "ResourceCard";
