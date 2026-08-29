import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText, Download, Bookmark,
  Video, FileCode, Archive, FileImage,
  Loader2,
} from "lucide-react";
import { SpheraIcon } from "@/components/ui/sphera-icon";
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

function getFileIcon(type: string, className?: string) {
  const t = (type || "").toLowerCase();
  const cls = className || "h-5 w-5";
  if (t.includes("video"))   return <Video className={cls} />;
  if (t.includes("image"))   return <FileImage className={cls} />;
  if (t.includes("code") || t.includes("project")) return <FileCode className={cls} />;
  if (t.includes("archive") || t.includes("zip"))  return <Archive className={cls} />;
  return <FileText className={cls} />;
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
          "group flex flex-col overflow-hidden cursor-pointer border-border/40 hover:border-border/80 hover:shadow-md transition-all duration-300",
          className
        )}
        onClick={(e) => {
          if (onPreview) {
            onPreview(e);
          } else {
            navigate(`/resources/${resource.id}`);
          }
        }}
      >
        {/* TOP: Large Thumbnail Area */}
        <div className={cn("relative aspect-[4/3] w-full flex flex-col items-center justify-center transition-colors duration-300", style.bg, "group-hover:bg-opacity-80")}>
          <div className={cn("transition-transform duration-500 group-hover:scale-110", style.icon)}>
            {getFileIcon(resource.type, "w-16 h-16 opacity-80")}
          </div>
          
          {/* Floating Action Buttons (Top Right) */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="secondary"
              className={cn("h-8 w-8 rounded-full shadow-sm bg-background/80 backdrop-blur-sm hover:bg-background", isSaved && "text-primary")}
              onClick={onSave}
              title="Sauvegarder"
            >
              <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full shadow-sm bg-background/80 backdrop-blur-sm hover:bg-background text-primary"
              onClick={(e) => { e.stopPropagation(); setStudyOpen(true); }}
              title="Réviser avec l'IA"
            >
              <SpheraIcon size="sm" />
            </Button>
          </div>
        </div>

        {/* BOTTOM: Details */}
        <div className="p-3 flex flex-col flex-1 justify-between bg-card">
          <div className="mb-3 flex flex-col">
            <h3 className="font-semibold text-sm line-clamp-2 text-foreground leading-tight group-hover:text-primary transition-colors min-h-[2.25rem]">
              {resource.title}
            </h3>
            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
              Par {resource.authorName}
            </p>
          </div>

          {/* Footer Row */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-auto h-6">
            <div className="flex items-center gap-3">
              {resource.fileSize > 0 && <span>{formatFileSize(resource.fileSize)}</span>}
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" /> {resource.downloadCount || 0}
              </span>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px] bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); if (onDownload) onDownload(e); }}
              disabled={isDownloading}
            >
              {isDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Télécharger"}
            </Button>
          </div>
        </div>
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
