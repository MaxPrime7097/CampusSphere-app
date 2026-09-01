import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Bookmark,
  Video,
  FileCode,
  Archive,
  FileImage,
  Loader2,
  BookOpen,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
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

const TYPE_STYLES: Record<string, { icon: string; bg: string; label: string }> = {
  notes: {
    icon: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    label: "Notes de cours",
  },
  resumes: {
    icon: "text-sky-500",
    bg: "bg-sky-500/10 border-sky-500/20",
    label: "Fiche & Résumé",
  },
  exercises: {
    icon: "text-red-500",
    bg: "bg-red-500/10 border-red-500/20",
    label: "Exercices / TD",
  },
  exam_papers: {
    icon: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    label: "Épreuve d'examen",
  },
  annales: {
    icon: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    label: "Annale corrigée",
  },
  projects: {
    icon: "text-yellow-500",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    label: "Projet / Rapport",
  },
  presentations: {
    icon: "text-violet-500",
    bg: "bg-violet-500/10 border-violet-500/20",
    label: "Présentation",
  },
  cours: {
    icon: "text-indigo-500",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    label: "Support de cours",
  },
  default: {
    icon: "text-muted-foreground",
    bg: "bg-muted/60 border-border/40",
    label: "Document",
  },
};

function getTypeStyle(type: string) {
  const key = (type || "").toLowerCase().split("/")[0];
  return TYPE_STYLES[key] ?? TYPE_STYLES.default;
}

function getFileIcon(type: string, className?: string) {
  const t = (type || "").toLowerCase();
  const cls = className || "h-4 w-4";
  if (t.includes("video")) return <Video className={cls} />;
  if (t.includes("image")) return <FileImage className={cls} />;
  if (t.includes("code") || t.includes("project")) return <FileCode className={cls} />;
  if (t.includes("archive") || t.includes("zip")) return <Archive className={cls} />;
  if (t.includes("exam") || t.includes("annale")) return <GraduationCap className={cls} />;
  if (t.includes("exercise") || t.includes("td")) return <FileSpreadsheet className={cls} />;
  if (t.includes("notes") || t.includes("cours")) return <BookOpen className={cls} />;
  return <FileText className={cls} />;
}

export const ResourceCard = React.memo(
  ({
    resource,
    isDownloading,
    isSaved,
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
              navigate(`/resources/${resource.id}`);
            }
          }}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg cursor-pointer",
            className
          )}
        >
          {/* TOP: Compact Thumbnail Area (Hauteur réduite et sobre) */}
          <div
            className={cn(
              "relative h-24 w-full flex items-center justify-center transition-colors duration-300 border-b",
              style.bg
            )}
          >
            {/* Category / Type Badge (Top Left) */}
            <div className="absolute left-2.5 top-2.5">
              <Badge
                variant="secondary"
                className="flex items-center gap-1 backdrop-blur-md bg-background/90 text-foreground font-semibold px-2 py-0.5 text-[10px] shadow-xs border border-border/40"
              >
                {getFileIcon(resource.type, cn("h-3 w-3", style.icon))}
                <span>{style.label}</span>
              </Badge>
            </div>

            {/* Central Soft Icon */}
            <div className={cn("transition-transform duration-500 group-hover:scale-110", style.icon)}>
              {getFileIcon(resource.type, "w-10 h-10 opacity-70")}
            </div>

            {/* Floating Action Buttons (Top Right) */}
            <div
              className="absolute top-2 right-2 flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="icon"
                variant="secondary"
                className={cn(
                  "h-7 w-7 rounded-full shadow-xs bg-background/90 backdrop-blur-md hover:bg-background border border-border/40",
                  isSaved ? "text-primary fill-primary" : "text-muted-foreground"
                )}
                onClick={onSave}
                title="Sauvegarder"
              >
                <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
              </Button>

              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-full shadow-xs bg-background/90 backdrop-blur-md hover:bg-background text-primary border border-border/40"
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

          {/* BOTTOM: Compact Details */}
          <div className="p-3.5 flex flex-col flex-1 justify-between bg-card">
            <div>
              <h3 className="font-bold text-sm line-clamp-1 text-foreground leading-tight group-hover:text-primary transition-colors">
                {resource.title}
              </h3>
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">
                {resource.authorName}
              </p>
            </div>

            {/* Footer Row */}
            <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2 font-medium">
                {resource.fileSize && <span>{formatFileSize(resource.fileSize)}</span>}
                {resource.downloadCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3 text-primary" /> {resource.downloadCount}
                  </span>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] font-semibold text-primary hover:bg-primary/10 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDownload) onDownload(e);
                }}
                disabled={isDownloading}
              >
                {isDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Télécharger"}
              </Button>
            </div>
          </div>
        </div>

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
