import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, BookmarkSimple, FileCode, Archive, Spinner as Loader2, BookOpen, GraduationCap, Sparkle as Sparkles } from "@phosphor-icons/react";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { formatFileSize, cn, getResourceUrl } from "@/lib/utils";
import { StudyToolsModal } from "@/sphera/components/study/StudyToolsModal";
import type { ResourceCardData, Resource } from "@/types";

interface ResourceCardProps {
  resource: ResourceCardData | Resource;
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
            "group flex items-center justify-between gap-3 py-3.5 px-3 sm:px-4 rounded-xl border-b border-border/30 hover:bg-muted/40 transition-colors cursor-pointer",
            className
          )}
        >
          {/* Left: Document Icon & Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border", style.bg, style.icon)}>
              {getFileIcon(resource.type, "w-4 h-4")}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm text-foreground truncate group-hover:underline">
                  {resource.title}
                </h3>
                <Badge variant="muted" size="sm" className="hidden sm:inline-flex text-[10px] shrink-0 font-normal">
                  {style.label}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {(resource as any).subject && !["general", "général", "autre", "other"].includes(String((resource as any).subject).toLowerCase()) && (
                  <>
                    <span className="truncate max-w-[120px]">{(resource as any).subject}</span>
                    <span>·</span>
                  </>
                )}
                <span className="truncate max-w-[100px]">{(resource as any).authorName || (resource as any).author?.name || "Étudiant"}</span>
                {((resource as any).fileSize || (resource as any).file_size) && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-[10px]">{formatFileSize((resource as any).fileSize || (resource as any).file_size)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground",
                isSaved && "text-foreground fill-foreground"
              )}
              onClick={onSave}
              title="Sauvegarder"
            >
              <BookmarkSimple className="h-4 w-4" weight={isSaved ? "fill" : "regular"} />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setStudyOpen(true);
              }}
              title="Réviser avec l'IA"
            >
              <SpheraIcon size="sm" />
            </Button>

            <Button
              size="sm"
              variant="secondary"
              className="h-8 text-xs px-2.5 gap-1.5 rounded-lg border border-border/60 hover:bg-muted font-normal text-secondary-foreground"
              onClick={onDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">Télécharger</span>
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
