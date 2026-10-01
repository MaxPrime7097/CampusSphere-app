import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Eye,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { formatFileSize, cn, getResourceUrl } from "@/lib/utils";
import { StudyToolsModal } from "@/sphera/components/study/StudyToolsModal";
import type { ResourceCardData, Resource } from "@/types";

interface ResourceTileProps {
  resource: ResourceCardData | Resource;
  isDownloading?: boolean;
  isSaved?: boolean;
  onDownload?: (e: React.MouseEvent) => void;
  onSave?: (e: React.MouseEvent) => void;
  onPreview?: (e: React.MouseEvent) => void;
  className?: string;
}

const TYPE_CONFIG: Record<string, { label: string; gradient: string; iconColor: string }> = {
  notes: {
    label: "Notes",
    gradient: "from-blue-500/10 via-blue-500/5 to-muted/40",
    iconColor: "text-blue-500",
  },
  resumes: {
    label: "Résumé",
    gradient: "from-sky-500/10 via-sky-500/5 to-muted/40",
    iconColor: "text-sky-500",
  },
  exercises: {
    label: "Exercices",
    gradient: "from-red-500/10 via-red-500/5 to-muted/40",
    iconColor: "text-red-500",
  },
  exam_papers: {
    label: "Épreuve",
    gradient: "from-emerald-500/10 via-emerald-500/5 to-muted/40",
    iconColor: "text-emerald-500",
  },
  annales: {
    label: "Annale",
    gradient: "from-purple-500/10 via-purple-500/5 to-muted/40",
    iconColor: "text-purple-500",
  },
  projects: {
    label: "Projet",
    gradient: "from-pink-500/10 via-pink-500/5 to-muted/40",
    iconColor: "text-pink-500",
  },
  presentations: {
    label: "Slides",
    gradient: "from-indigo-500/10 via-indigo-500/5 to-muted/40",
    iconColor: "text-indigo-500",
  },
  other: {
    label: "Document",
    gradient: "from-muted/40 via-muted/20 to-muted/40",
    iconColor: "text-muted-foreground",
  },
};

function getTypeConfig(type?: string) {
  if (!type) return TYPE_CONFIG.other;
  const key = type.toLowerCase();
  return TYPE_CONFIG[key] || TYPE_CONFIG.other;
}

function getFileIcon(type?: string, className = "h-8 w-8") {
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

export const ResourceTile = React.memo(
  ({
    resource,
    isDownloading = false,
    isSaved = false,
    onDownload,
    onSave,
    onPreview,
    className,
  }: ResourceTileProps) => {
    const navigate = useNavigate();
    const config = getTypeConfig(resource.type);
    const [studyOpen, setStudyOpen] = useState(false);

    const ext = resource.fileUrl?.split(".").pop()?.toUpperCase() || "DOC";
    const size = (resource as any).fileSize || (resource as any).file_size;

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
          className={cn("group flex flex-col cursor-pointer transition-all", className)}
        >
          {/* ─── Spotify-Style Visual Tile (No outer card border) ─── */}
          <div
            className={cn(
              "relative aspect-[16/10] sm:aspect-[4/3] min-h-[148px] w-full rounded-2xl bg-gradient-to-br border border-border/30 overflow-hidden p-3 flex flex-col justify-between transition-all duration-300 group-hover:border-border/60 group-hover:shadow-xs",
              config.gradient
            )}
          >
            {/* Top Row: Type Pill & Bookmark */}
            <div className="flex items-center justify-between z-10">
              <span className="rounded-lg bg-background/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border/40 shadow-2xs">
                {config.label}
              </span>

              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-7 w-7 rounded-full bg-background/70 backdrop-blur-md hover:bg-background text-muted-foreground border border-border/30",
                  isSaved && "text-foreground fill-foreground"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onSave?.(e);
                }}
                title="Sauvegarder"
              >
                <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
              </Button>
            </div>

            {/* Center: File Type Icon Artwork */}
            <div className="flex items-center justify-center my-1 sm:my-auto transition-transform duration-300 group-hover:scale-110">
              <div className={cn("p-2 sm:p-2.5 rounded-2xl bg-background/60 backdrop-blur-xs border border-border/20 shadow-2xs", config.iconColor)}>
                {getFileIcon(resource.type, "h-7 w-7 sm:h-8 sm:w-8")}
              </div>
            </div>

            {/* Bottom Row: Format/Size & Hover Actions */}
            <div className="flex items-center justify-between z-10 pt-1 gap-1">
              <span className="text-[10px] font-mono text-muted-foreground bg-background/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-border/30 truncate max-w-[85px] sm:max-w-none">
                {ext} {size ? `· ${formatFileSize(size)}` : ""}
              </span>

              {/* Action Buttons (Smooth hover reveal on desktop, always visible on mobile) */}
              <div
                className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-md hover:bg-background border border-border/40 shadow-xs text-muted-foreground hover:text-foreground shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStudyOpen(true);
                  }}
                  title="Réviser avec l'IA"
                >
                  <SpheraIcon size="sm" />
                </Button>

                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7 rounded-full bg-secondary hover:bg-muted border border-border/40 shadow-xs text-secondary-foreground shrink-0"
                  onClick={onDownload}
                  disabled={isDownloading}
                  title="Télécharger"
                >
                  {isDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Spotify-Style Typography (Pure whitespace below, no card container) ─── */}
          <div className="pt-2.5 space-y-1 min-w-0">
            <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:underline">
              {resource.title}
            </h3>

            <p className="text-xs text-muted-foreground truncate">
              {(resource as any).subject && !["general", "général", "autre", "other"].includes(String((resource as any).subject).toLowerCase()) && (
                <>
                  <span>{(resource as any).subject}</span>
                  <span> · </span>
                </>
              )}
              <span>{(resource as any).authorName || (resource as any).author?.name || "Étudiant"}</span>
            </p>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
              <span>{resource.downloadCount || 0} téléchargements</span>
              {resource.impactScore ? (
                <>
                  <span>·</span>
                  <span className="text-primary font-medium inline-flex items-center gap-0.5">
                    <Zap className="h-3 w-3 text-primary fill-primary" />
                    {resource.impactScore}
                  </span>
                </>
              ) : null}
            </div>
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

ResourceTile.displayName = "ResourceTile";
