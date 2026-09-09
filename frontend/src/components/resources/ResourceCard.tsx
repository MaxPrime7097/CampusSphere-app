import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Bookmark,
  FileCode,
  Archive,
  Loader2,
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { formatFileSize, cn, getResourceUrl } from "@/lib/utils";
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

const TYPE_STYLES: Record<string, { icon: string; bg: string; label: string }> = {
  notes: {
    icon: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    label: "Notes",
  },
  resumes: {
    icon: "text-sky-500",
    bg: "bg-sky-500/10 border-sky-500/20",
    label: "Fiche & Résumé",
  },
  exercises: {
    icon: "text-red-500",
    bg: "bg-red-500/10 border-red-500/20",
    label: "Exercices",
  },
  exam_papers: {
    icon: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    label: "Anciennes Épreuves",
  },
  annales: {
    icon: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
    label: "Annale",
  },
  projects: {
    icon: "text-pink-500",
    bg: "bg-pink-500/10 border-pink-500/20",
    label: "Projet",
  },
  presentations: {
    icon: "text-indigo-500",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    label: "Slides",
  },
  other: {
    icon: "text-muted-foreground",
    bg: "bg-muted/30 border-border/40",
    label: "Document",
  },
};

function getTypeStyle(type?: string) {
  if (!type) return TYPE_STYLES.other;
  const key = type.toLowerCase();
  return TYPE_STYLES[key] || TYPE_STYLES.other;
}

function getFileIcon(type?: string, className = "h-3.5 w-3.5") {
  const key = (type || "").toLowerCase();
  switch (key) {
    case "notes":
      return <BookOpen className={className} />;
    case "resumes":
      return <FileText className={className} />;
    case "exercises":
      return <FileCode className={className} />;
    case "exam_papers":
      return <GraduationCap className={className} />;
    case "annales":
      return <Sparkles className={className} />;
    case "projects":
      return <Archive className={className} />;
    default:
      return <FileText className={className} />;
  }
}

export const ResourceCard = React.memo(
  ({
    resource,
    isDownloading = false,
    isSaved = false,
    onDownload,
    onSave,
    onPreview,
    className,
  }: ResourceCardProps) => {
    const navigate = useNavigate();
    const style = getTypeStyle(resource.type);
    const [studyOpen, setStudyOpen] = React.useState(false);

    return (
      <>
        <div
          onClick={(e) => {
            if (onPreview) {
              onPreview(e);
            } else {
              navigate(getResourceUrl(resource));
            }
          }}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md cursor-pointer",
            className
          )}
        >
          {/* TOP: Compact Thumbnail Area */}
          <div
            className={cn(
              "relative h-20 w-full flex items-center justify-center transition-colors duration-300 border-b",
              style.bg
            )}
          >
            {/* Category / Type Badge (Top Left) */}
            <div className="absolute left-2 top-2">
              <Badge
                variant="secondary"
                className="flex items-center gap-1 backdrop-blur-md bg-background/90 text-foreground font-semibold px-2 py-0.5 text-[9px] shadow-xs border border-border/40"
              >
                {getFileIcon(resource.type, cn("h-2.5 w-2.5", style.icon))}
                <span>{style.label}</span>
              </Badge>
            </div>

            {/* Central Soft Icon */}
            <div className={cn("transition-transform duration-500 group-hover:scale-110", style.icon)}>
              {getFileIcon(resource.type, "w-8 h-8 opacity-70")}
            </div>

            {/* Floating Action Buttons (Top Right) */}
            <div
              className="absolute top-1.5 right-1.5 flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="icon"
                variant="secondary"
                className={cn(
                  "h-6 w-6 rounded-full shadow-xs bg-background/90 backdrop-blur-md hover:bg-background border border-border/40",
                  isSaved ? "text-primary fill-primary" : "text-muted-foreground"
                )}
                onClick={onSave}
                title="Sauvegarder"
              >
                <Bookmark className={cn("h-3 w-3", isSaved && "fill-current")} />
              </Button>

              <Button
                size="icon"
                variant="secondary"
                className="h-6 w-6 rounded-full shadow-xs bg-background/90 backdrop-blur-md hover:bg-background text-primary border border-border/40"
                onClick={(e) => {
                  e.stopPropagation();
                  setStudyOpen(true);
                }}
                title="Réviser avec l'IA"
              >
                <SpheraIcon size="sm" />
              </Button>
            </div>
          </div>

          {/* MIDDLE: Information Content */}
          <div className="p-2.5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-xs leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                {resource.title}
              </h3>
              {resource.description && (
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                  {resource.description}
                </p>
              )}
            </div>

            {/* Micro details: Subject + File details */}
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground pt-2 mt-2 border-t border-border/40">
              <span className="font-medium text-foreground/80 truncate max-w-[90px]">
                {resource.subject || "Général"}
              </span>
              <span className="font-mono text-[9px]">{formatFileSize(resource.fileSize || resource.file_size)}</span>
            </div>
          </div>

          {/* BOTTOM: Action Bar */}
          <div
            className="px-2.5 py-1.5 bg-muted/20 border-t border-border/40 flex items-center justify-between gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate max-w-[80px]">
              {resource.authorName || resource.author?.name || "Étudiant"}
            </span>

            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2 gap-1 rounded-md border-border/80 hover:border-primary/50"
              onClick={onDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Download className="h-2.5 w-2.5" />
              )}
              <span>Télécharger</span>
            </Button>
          </div>
        </div>

        {/* Modal Réviser avec l'IA */}
        <StudyToolsModal
          isOpen={studyOpen}
          onClose={() => setStudyOpen(false)}
          resourceId={resource.id}
          resourceTitle={resource.title}
        />
      </>
    );
  }
);

ResourceCard.displayName = "ResourceCard";
