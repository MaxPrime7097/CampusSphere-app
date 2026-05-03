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
import { getTypeLabel, getSubjectLabel } from "@/lib/resourceMetadata";
import { formatFileSize, cn } from "@/lib/utils";

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
  notes:          { icon: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/40" },
  resumes:        { icon: "text-sky-500",    bg: "bg-sky-50 dark:bg-sky-950/40" },
  exercises:      { icon: "text-red-500",    bg: "bg-red-50 dark:bg-red-950/40" },
  exam_papers:    { icon: "text-green-500", bg: "bg-green-50 dark:bg-green-950/40" },
  annales:        { icon: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/40" },
  projects:       { icon: "text-yellow-500",  bg: "bg-yellow-50 dark:bg-yellow-950/40" },
  presentations:  { icon: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-950/40" },
  cours:          { icon: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/40" },
  default:        { icon: "text-primary",    bg: "bg-primary/5" },
};

function getTypeStyle(type: string) {
  const key = (type || "").toLowerCase().split("/")[0];
  return TYPE_STYLES[key] ?? TYPE_STYLES.default;
}

function getFileIcon(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("video"))   return <Video className="h-6 w-6" />;
  if (t.includes("image"))   return <FileImage className="h-6 w-6" />;
  if (t.includes("code") || t.includes("project")) return <FileCode className="h-6 w-6" />;
  if (t.includes("archive") || t.includes("zip"))  return <Archive className="h-6 w-6" />;
  return <FileText className="h-6 w-6" />;
}

export const ResourceCard = React.memo(({
  resource, isDownloading, isSaved,
  onDownload, onSave, onPreview, className
}: ResourceCardProps) => {
  const navigate = useNavigate();
  const style = getTypeStyle(resource.type);

  return (
    <Card
      className={cn(
        "group overflow-hidden cursor-pointer border bg-card hover:shadow-md transition-shadow duration-200",
        className
      )}
      onClick={() => navigate(`/resources/${resource.id}`)}
    >
      <CardContent className="p-0">
        {/* Header — horizontal flat */}
        <div className={cn("flex items-center gap-3 px-4 py-3", style.bg)}>
          <div className={cn("flex-shrink-0", style.icon)}>
            {getFileIcon(resource.type)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
              {resource.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <Badge
                variant="secondary"
                className="text-[9px] py-0 h-4 px-1.5 font-semibold bg-background/70 border-none"
              >
                {getSubjectLabel(resource.subject)}
              </Badge>
              {resource.type && (
                <span className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium">
                  {getTypeLabel(resource.type)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Stats row */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="truncate max-w-[90px]">Par {resource.authorName}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" /> {resource.viewCount || 0}
              </span>
              <span className="flex items-center gap-0.5">
                <Download className="h-3 w-3" /> {resource.downloadCount || 0}
              </span>
              <span className="text-[9px] text-muted-foreground/60">
                {formatFileSize(resource.fileSize)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg border-muted hover:bg-muted/60"
              onClick={onPreview}
              title="Aperçu"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "h-8 w-8 p-0 rounded-lg border-muted",
                isSaved ? "text-primary bg-primary/5 border-primary/20" : "hover:bg-muted/60"
              )}
              onClick={onSave}
              title="Sauvegarder"
            >
              <Bookmark className={cn("h-3.5 w-3.5", isSaved ? "fill-current" : "")} />
            </Button>
            <Button
              size="sm"
              className="h-8 flex-1 gap-1 campus-gradient text-white rounded-lg hover:opacity-90"
              onClick={onDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold hidden sm:inline">Télécharger</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ResourceCard.displayName = "ResourceCard";
