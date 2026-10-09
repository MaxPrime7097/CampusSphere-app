import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  BookmarkSimple,
  Spinner as Loader2,
  BookOpen,
  GraduationCap,
  FolderSimple as FolderGit2,
  BookBookmark,
  Notepad,
  Question as QuestionMark,
} from "@phosphor-icons/react";
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
  course_notes: {
    icon: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    label: "Note de cours",
  },
  td_tp: {
    icon: "text-orange-500",
    bg: "bg-orange-500/10 border-orange-500/20",
    label: "TD / TP",
  },
  exams: {
    icon: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    label: "Annale",
  },
  project: {
    icon: "text-violet-500",
    bg: "bg-violet-500/10 border-violet-500/20",
    label: "Projet",
  },
  book: {
    icon: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    label: "Livre",
  },
  other: {
    icon: "text-muted-foreground",
    bg: "bg-muted/30 border-border/40",
    label: "Autre",
  },
};

function getTypeStyle(type?: string) {
  if (!type) return TYPE_STYLES.other;
  return TYPE_STYLES[type.toLowerCase()] || TYPE_STYLES.other;
}

function getFileIcon(type?: string, className = "h-3.5 w-3.5") {
  switch ((type || "").toLowerCase()) {
    case "course_notes":
      return <BookOpen className={className} />;
    case "td_tp":
      return <Notepad className={className} />;
    case "exams":
      return <GraduationCap className={className} />;
    case "project":
      return <FolderGit2 className={className} />;
    case "book":
      return <BookBookmark className={className} />;
    default:
      return <QuestionMark className={className} />;
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
    const { t } = useTranslation("resources");
    const style = getTypeStyle(resource.type);
    const [studyOpen, setStudyOpen] = React.useState(false);

    const typeLabel = t(`page.chips.${resource.type}` as any, { defaultValue: style.label });

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
                  {typeLabel}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {(resource as any).subject && !["general", "général", "autre", "other"].includes(String((resource as any).subject).toLowerCase()) && (
                  <>
                    <span className="truncate max-w-[120px]">{(resource as any).subject}</span>
                    <span>·</span>
                  </>
                )}
                <span className="truncate max-w-[100px]">{(resource as any).authorName || (resource as any).author?.name || t("card.student")}</span>
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
              title={t("card.save")}
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
              title={t("card.reviseAi")}
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
              <span className="hidden sm:inline">{t("card.download")}</span>
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
