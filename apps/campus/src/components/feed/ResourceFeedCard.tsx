import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Lightning as Zap,
  Download,
  FileText,
  BookOpen,
  GraduationCap,
  Sparkle as Sparkles,
  Archive,
  ArrowRight,
  DotsThreeVertical as MoreVertical,
  Share,
  BookmarkSimple,
  SealCheck as BadgeCheck,
  X,
  FolderSimple as FolderGit2,
  BookBookmark,
  Notepad,
  Question as QuestionMark,
  FolderPlus,
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { StudyToolsModal } from "@/sphera/components/study/StudyToolsModal";
import { AddToFolderModal } from "@/components/modals/AddToFolderModal";
import { cn, getResourceUrl, formatFileSize } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/date";
import { downloadResource, saveResource, impactRateResource } from "@/services/api";
import { getStoredResourceRating, getStoredResourceImpactScore, setStoredResourceRating } from "@/lib/resourceImpact";
import { getAccessToken } from "@/services/api/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeResourceType } from "@/constants/resourceTypes";
import type { Resource } from "@/types";

// ─── Type configuration ─────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { labelKey: string; iconColor: string; bg: string }> = {
  course_notes: { labelKey: "feedCard.types.course_notes", iconColor: "text-blue-500", bg: "bg-blue-500/10" },
  td_tp:        { labelKey: "feedCard.types.td_tp",       iconColor: "text-orange-500", bg: "bg-orange-500/10" },
  exams:        { labelKey: "feedCard.types.exams",        iconColor: "text-emerald-500", bg: "bg-emerald-500/10" },
  project:      { labelKey: "feedCard.types.project",      iconColor: "text-violet-500", bg: "bg-violet-500/10" },
  book:         { labelKey: "feedCard.types.book",         iconColor: "text-amber-500", bg: "bg-amber-500/10" },
  other:        { labelKey: "feedCard.types.other",        iconColor: "text-muted-foreground", bg: "bg-muted/40" },
};

function getTypeConfig(type?: string) {
  if (!type) return TYPE_CONFIG.other;
  const canonical = normalizeResourceType(type);
  return TYPE_CONFIG[canonical] ?? TYPE_CONFIG.other;
}

function getFileIcon(type?: string, className = "h-6 w-6") {
  const canonical = normalizeResourceType(type);
  switch (canonical) {
    case "course_notes": return <BookOpen className={className} />;
    case "td_tp":        return <Notepad className={className} />;
    case "exams":        return <GraduationCap className={className} />;
    case "project":      return <FolderGit2 className={className} />;
    case "book":         return <BookBookmark className={className} />;
    default:             return <QuestionMark className={className} />;
  }
}

interface ResourceFeedCardProps {
  resource: Resource;
}

export function ResourceFeedCard({ resource }: ResourceFeedCardProps) {
  const { t } = useTranslation("resources");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(resource.isSaved));
  const [impactScore, setImpactScore] = useState(Number(resource.impactScore || 0));
  const [userImpactRating, setUserImpactRating] = useState<number | null>(null);
  const [studyOpen, setStudyOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);

  // Option A Rating picker state & refs
  const [showRatingPicker, setShowRatingPicker] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const config = getTypeConfig(resource.type);
  const resourceUrl = getResourceUrl({ id: resource.id, title: resource.title });
  const canonicalId = String(resource.id);

  // Sync stored user rating & impact score
  useEffect(() => {
    const storedRating = getStoredResourceRating(canonicalId);
    const storedScore = getStoredResourceImpactScore(canonicalId);
    if (storedRating !== null) {
      setUserImpactRating(storedRating);
    }
    if (storedScore !== null) {
      setImpactScore(storedScore);
    } else if (storedRating !== null) {
      setImpactScore((prev) => Math.max(prev, storedRating));
    }

    const handler = (e: any) => {
      if (e.detail?.resourceId === canonicalId) {
        setUserImpactRating(e.detail.value ?? null);
        if (typeof e.detail.impactScore === "number") {
          setImpactScore(e.detail.impactScore);
        }
      }
    };
    window.addEventListener("resource-impact-changed", handler);
    return () => window.removeEventListener("resource-impact-changed", handler);
  }, [canonicalId]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  // Close picker on click outside
  useEffect(() => {
    if (!showRatingPicker) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowRatingPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showRatingPicker]);

  const handleCardClick = () => navigate(resourceUrl);

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const username = resource.author?.username || resource.authorId;
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadResource(resource.id);
      toast({
        title: t("feedCard.toasts.downloadStarted"),
        description: resource.title,
        duration: 2000,
      });
    } catch {
      toast({
        title: t("feedCard.toasts.error"),
        description: t("feedCard.toasts.downloadError"),
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: t("feedCard.toasts.loginRequired"), description: t("feedCard.toasts.loginToSave"), duration: 2000 });
      return;
    }
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      await saveResource(resource.id);
      toast({
        title: nextSaved ? t("feedCard.toasts.saved") : t("feedCard.toasts.unsaved"),
        duration: 2000,
      });
    } catch {
      setIsSaved(!nextSaved);
      toast({
        title: t("feedCard.toasts.error"),
        description: t("feedCard.toasts.actionFailed"),
        variant: "destructive",
      });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullUrl = window.location.origin + resourceUrl;
    if (navigator.share) {
      try {
        await navigator.share({
          title: resource.title,
          url: fullUrl,
        });
      } catch {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: t("feedCard.toasts.linkCopied"),
        description: t("feedCard.toasts.linkCopiedDesc"),
        duration: 2000,
      });
    }
  };

  const handleImpactRate = async (value: number | null) => {
    if (!user && !getAccessToken()) {
      toast({ title: t("feedCard.toasts.loginRequired"), description: t("feedCard.toasts.loginToVote"), duration: 2000 });
      return;
    }

    const prevScore = impactScore;
    const prevRating = userImpactRating;
    const previous = prevRating ?? 0;
    const current = value ?? 0;
    const delta = current - previous;
    const optimisticScore = Math.max(0, prevScore + delta);

    setImpactScore(optimisticScore);
    setUserImpactRating(value);
    setStoredResourceRating(canonicalId, value, optimisticScore);

    toast({
      title: value === null ? t("feedCard.toasts.voteRemoved") : t("feedCard.toasts.impactVoted", { value }),
      duration: 1500,
    });

    try {
      const response = await impactRateResource(canonicalId, value, prevRating);
      const nextScore = response?.impactScore ?? optimisticScore;
      const nextRating = response?.userImpactRating ?? value;

      setImpactScore(nextScore);
      setUserImpactRating(nextRating);
      setStoredResourceRating(canonicalId, nextRating, nextScore);
    } catch (error: any) {
      setImpactScore(prevScore);
      setUserImpactRating(prevRating);
      setStoredResourceRating(canonicalId, prevRating, prevScore);
      toast({
        title: t("feedCard.toasts.error"),
        description: error?.message || t("feedCard.toasts.voteFailed"),
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleTouchStartImpact = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (!user && !getAccessToken()) {
        toast({ title: t("feedCard.toasts.loginRequired"), description: t("feedCard.toasts.loginToVote"), duration: 2000 });
        return;
      }
      setShowRatingPicker(true);
    }, 380);
  };

  const handleTouchEndImpact = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressRef.current) {
      setTimeout(() => {
        isLongPressRef.current = false;
      }, 100);
    }
  };

  const handleTouchMoveImpact = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleMouseEnterImpact = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    hoverTimerRef.current = setTimeout(() => {
      if (user || getAccessToken()) setShowRatingPicker(true);
    }, 350);
  };

  const handleMouseLeaveImpact = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    leaveTimerRef.current = setTimeout(() => {
      setShowRatingPicker(false);
    }, 400);
  };

  const handleSingleTapImpact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    if (!user && !getAccessToken()) {
      toast({ title: t("feedCard.toasts.loginRequired"), description: t("feedCard.toasts.loginToVote"), duration: 2000 });
      return;
    }
    setShowRatingPicker(false);
    if (userImpactRating !== null) {
      handleImpactRate(null);
    } else {
      handleImpactRate(1);
    }
  };

  const handleSpheraStudy = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStudyOpen(true);
  };

  const isAuthorVerified = Boolean(
    resource.author?.isVerified ||
    (resource.author as any)?.is_verified ||
    (resource as any).isVerified ||
    (resource as any).is_verified
  );
  const authorName = resource.author?.name || resource.authorName || t("feedCard.defaultAuthor");
  const authorAvatar = resource.author?.avatar;
  const authorInitial = authorName.charAt(0).toUpperCase();
  const relativeTime = resource.createdAt ? formatRelativeTime(resource.createdAt) : null;
  const rawSize = resource.fileSize || (resource as any).file_size || (resource as any).size;
  const formattedSize = rawSize ? formatFileSize(rawSize) : null;

  return (
    <>
      <article className="border-b border-border/40 py-5 transition-colors hover:bg-muted/[0.02]">
        <div className="px-3.5 sm:px-5 md:px-6">
          {/* ─── Header: Identical to PostCard ─────────────────────────────── */}
          <div className="flex items-start justify-between gap-3 pb-3">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
              onClick={handleAuthorClick}
            >
              <Avatar className="h-10 w-10 shrink-0 border border-border/50">
                <AvatarImage src={authorAvatar ?? undefined} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                  {authorInitial}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-semibold text-sm hover:underline truncate text-foreground">
                    {authorName}
                  </h4>
                  {isAuthorVerified && (
                    <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" weight="fill" />
                  )}
                  <span className="text-xs text-muted-foreground/50">·</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {relativeTime || t("feedCard.recent")}
                  </span>
                  <span className="text-xs text-muted-foreground/50">·</span>
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0 border border-border/40">
                    {t("feedCard.resourceBadge")}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSave}>
                  <BookmarkSimple className="h-4 w-4 mr-2" weight={isSaved ? "fill" : "regular"} />
                  {isSaved ? t("feedCard.unsave") : t("feedCard.save")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!user) {
                      toast({
                        title: "Connexion requise",
                        description: "Connectez-vous pour ajouter cette ressource à vos dossiers.",
                      });
                      return;
                    }
                    setFolderModalOpen(true);
                  }}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  {t("feedCard.addToFolder", { defaultValue: "Ajouter à un dossier" })}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="h-4 w-4 mr-2" />
                  {t("feedCard.share")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ─── Embedded Resource Card (placed where image usually goes) ──── */}
          <div
            onClick={handleCardClick}
            className="group rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/30 hover:border-border/90 transition-all p-3.5 sm:p-4 cursor-pointer"
          >
            <div className="flex items-start gap-3 sm:gap-3.5">
              {/* Left file icon */}
              <div
                className={cn(
                  "h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center shrink-0 border border-border/30",
                  config.bg
                )}
              >
                {getFileIcon(resource.type, cn("h-6 w-6 sm:h-7 sm:w-7", config.iconColor))}
              </div>

              {/* Center info */}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
                  {resource.title}
                </h3>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-2 py-0.5 h-4.5 rounded-full font-medium"
                  >
                    {t(config.labelKey)}
                  </Badge>

                  {formattedSize ? (
                    <span className="text-[11px] font-mono font-medium text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/30">
                      {formattedSize}
                    </span>
                  ) : null}

                  {impactScore > 0 ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary">
                      <Zap className="h-3 w-3 text-primary" weight="fill" />
                      {impactScore}
                    </span>
                  ) : null}
                </div>

                {resource.description ? (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {resource.description}
                  </p>
                ) : null}
              </div>
            </div>

            {/* View resource CTA - displays downloads instead of subject */}
            <div className="mt-3 pt-2.5 border-t border-border/30 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {resource.downloadCount != null && resource.downloadCount > 0
                    ? (resource.downloadCount > 1
                      ? t("feedCard.downloadCount_plural", { count: resource.downloadCount })
                      : t("feedCard.downloadCount", { count: resource.downloadCount }))
                    : t("feedCard.zeroDownloads")}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-foreground/80 font-medium group-hover:text-foreground group-hover:translate-x-0.5 transition-all">
                {t("feedCard.viewResource")}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {/* ─── Bottom Action Bar (Identical 3 Pills to PostCard) ──────────── */}
          <div className="grid grid-cols-3 gap-2 pt-3">
            {/* Pill 1: Impact with Option A floating picker */}
            <div
              className="relative w-full"
              onMouseEnter={handleMouseEnterImpact}
              onMouseLeave={handleMouseLeaveImpact}
            >
              {showRatingPicker && (
                <div
                  ref={pickerRef}
                  className="absolute bottom-full left-0 mb-2 z-30 flex items-center gap-1 p-1 bg-background/95 backdrop-blur-md border border-border/80 shadow-lg rounded-full animate-in fade-in-0 zoom-in-95 duration-150 before:absolute before:-bottom-3 before:left-0 before:right-0 before:h-4"
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => {
                    if (leaveTimerRef.current) {
                      clearTimeout(leaveTimerRef.current);
                      leaveTimerRef.current = null;
                    }
                  }}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRatingPicker(false);
                        handleImpactRate(value);
                      }}
                      className={cn(
                        "h-7 w-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer",
                        userImpactRating === value
                          ? "bg-primary text-primary-foreground shadow-sm scale-110"
                          : "hover:bg-primary/20 hover:text-primary text-foreground"
                      )}
                      title={t("feedCard.rateScoreTooltip", { value })}
                    >
                      {value}
                    </button>
                  ))}
                  {userImpactRating !== null && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRatingPicker(false);
                        handleImpactRate(null);
                      }}
                      className="h-7 w-7 rounded-full text-xs flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title={t("feedCard.removeVote")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              <Button
                variant="ghost"
                type="button"
                onTouchStart={handleTouchStartImpact}
                onTouchEnd={handleTouchEndImpact}
                onTouchMove={handleTouchMoveImpact}
                onClick={handleSingleTapImpact}
                className={cn(
                  "w-full h-9 sm:h-9.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full text-xs sm:text-sm font-medium border transition-all active:scale-95 select-none",
                  userImpactRating
                    ? "bg-primary/15 border-primary/35 text-primary font-semibold hover:bg-primary/20"
                    : "bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/30"
                )}
                title={userImpactRating ? t("feedCard.impactAssignedTitle", { score: userImpactRating }) : t("feedCard.impactClickTitle")}
              >
                <Zap className={cn("h-5 w-5 shrink-0 transition-transform", userImpactRating ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary")} weight={userImpactRating ? "fill" : "regular"} />
                <span>{impactScore}</span>
                <span className="hidden sm:inline">{t("feedCard.impact")}</span>
              </Button>
            </div>

            {/* Pill 2: Sphera Study */}
            <Button
              variant="ghost"
              className="w-full h-9 sm:h-9.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full text-xs sm:text-sm font-medium bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/30 transition-all active:scale-95"
              onClick={handleSpheraStudy}
            >
              <SpheraIcon size="sm" />
              <span>Sphera</span>
            </Button>

            {/* Pill 3: Download */}
            <Button
              variant="ghost"
              disabled={isDownloading}
              className="w-full h-9 sm:h-9.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full text-xs sm:text-sm font-medium bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/30 transition-all active:scale-95 disabled:opacity-60"
              onClick={handleDownload}
            >
              <Download className={cn("h-5 w-5 shrink-0", isDownloading && "animate-bounce")} />
              <span>{isDownloading ? "..." : t("feedCard.download")}</span>
            </Button>
          </div>
        </div>
      </article>

      {/* ─── Sphera Study Modal ──────────────────────────────────────────── */}
      <StudyToolsModal
        isOpen={studyOpen}
        onClose={() => setStudyOpen(false)}
        resourceId={resource.id}
        resourceTitle={resource.title}
      />

      {/* ─── Add to Folder Modal ────────────────────────────────────────── */}
      <AddToFolderModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        resourceId={resource.id}
        resourceTitle={resource.title}
      />
    </>
  );
}
