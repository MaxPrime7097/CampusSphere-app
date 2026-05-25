import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Download, Eye, Bookmark,
  Video, FileCode, Archive, FileImage,
  Loader2, Sparkles,
} from "lucide-react";
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
  notes:          { icon: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/40" },
  resumes:        { icon: "text-sky-500",    bg: "bg-sky-50 dark:bg-sky-950/40" },
  exercises:      { icon: "text-red-500",    bg: "bg-red-50 dark:bg-red-950/40" },
  exam_papers:    { icon: "text-green-500", bg: "bg-green-50 dark:bg-green-950/40" },
  annales:        { icon: "text-[#ff9800]", bg: "bg-orange-50 dark:bg-orange-950/40" },
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
  if (t.includes("video"))   return <Video className="h-4 w-4 sm:h-6 sm:w-6" />;
  if (t.includes("image"))   return <FileImage className="h-4 w-4 sm:h-6 sm:w-6" />;
  if (t.includes("code") || t.includes("project")) return <FileCode className="h-4 w-4 sm:h-6 sm:w-6" />;
  if (t.includes("archive") || t.includes("zip"))  return <Archive className="h-4 w-4 sm:h-6 sm:w-6" />;
  return <FileText className="h-4 w-4 sm:h-6 sm:w-6" />;
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
          "group overflow-hidden cursor-pointer border bg-card hover:shadow-md transition-shadow duration-200",
          className
        )}
        onClick={() => navigate(`/resources/${resource.id}`)}
      >
        <CardContent className="p-0 max-w-[320px] mx-auto sm:max-w-none">
          {/* Header — horizontal flat */}
          <div className={cn("flex items-center gap-1.5 sm:gap-2.5 px-2 py-1.5 sm:px-3 sm:py-2.5", style.bg)}>
            <div className={cn("flex-shrink-0", style.icon)}>
              {getFileIcon(resource.type)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-[13px] sm:text-sm line-clamp-1 text-foreground">
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

          <div className="px-2 py-2 sm:px-3 sm:py-2.5 space-y-2 sm:space-y-2.5">
            {/* Stats row */}
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
              <span className="truncate max-w-[80px] sm:max-w-[90px]">Par {resource.authorName}</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="flex items-center gap-0.5">
                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {resource.viewCount || 0}
                </span>
                <span className="flex items-center gap-0.5">
                  <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {resource.downloadCount || 0}
                </span>
                <span className="text-[8px] sm:text-[9px] text-muted-foreground/60">
                  {formatFileSize(resource.fileSize)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg border-muted hover:bg-muted/60"
                onClick={onPreview}
                title="Aperçu"
              >
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg border-muted",
                  isSaved ? "text-primary bg-primary/5 border-primary/20" : "hover:bg-muted/60"
                )}
                onClick={onSave}
                title="Sauvegarder"
              >
                <Bookmark className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", isSaved ? "fill-current" : "")} />
              </Button>
              {/* Bouton Réviser avec l'IA */}
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg border-[#ff9800]/30 text-[#ff9800] hover:bg-[#ff9800]/10 hover:border-[#ff9800]"
                onClick={(e) => { e.stopPropagation(); setStudyOpen(true); }}
                title="Réviser avec l'IA"
              >
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
              <Button
                size="sm"
                className="h-7 sm:h-8 flex-1 gap-1 campus-gradient text-white rounded-lg hover:opacity-90"
                onClick={onDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                ) : (
                  <>
                    <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="text-[10px] sm:text-xs font-semibold hidden sm:inline">Télécharger</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* StudyToolsModal */}
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
