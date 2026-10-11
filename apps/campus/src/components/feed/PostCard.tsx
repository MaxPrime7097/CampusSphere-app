import { UniversalShareModal } from "@/components/shared/UniversalShareModal";
import { Suspense, lazy, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Heart, ChatTeardrop, Share, BookmarkSimple, UsersThree as Users, DotsThreeVertical as MoreVertical, Lightning as Zap, Copy, Flag, ArrowSquareOut as ExternalLink, Plus, Minus, X, PencilSimple, Trash as Trash2, Spinner as Loader2, FileText, Download, CaretLeft as ChevronLeft, CaretRight as ChevronRight, MagnifyingGlass as Search, FacebookLogo as Facebook, InstagramLogo as Instagram, TwitterLogo as Twitter, LinkedinLogo as Linkedin, Info, SealCheck as BadgeCheck } from "@phosphor-icons/react";
import { FaFacebook, FaTwitter, FaInstagram, FaWhatsapp, FaLinkedin } from 'react-icons/fa';

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCategoryLabel } from "@/lib/resourceMetadata";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn, getPostUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { impactRatePost, likePost, savePost, reportPost, updatePost, deletePost, getUserConnections, getUserConversations, createPrivateConversation, sendMessage } from "@/services/api";
import { formatRelativeTime } from "@/lib/date";
import { renderMentionText } from "@/lib/mentions";
import { Textarea } from "@/components/ui/textarea";
import { OptimizedImage } from "@/components/ui/optimized-image";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useAuth } from "@/contexts/AuthContext";
import type { PostCardData } from "@/types";

const CommentsModal = lazy(() => import("@/components/modals/CommentsModal").then((module) => ({ default: module.CommentsModal })));

interface PostCardProps {
  post: PostCardData;
  onToggleSave?: (saved: boolean) => void;
}

export function PostCard({ post, onToggleSave }: PostCardProps) {
  const { t } = useTranslation("feed");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [likesCount, setLikesCount] = useState(post.likes);
  const [impactScore, setImpactScore] = useState(Number(post.impactScore || 0));
  const [userImpactRating, setUserImpactRating] = useState<number | null>(post.userImpactRating ?? null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportedReason, setReportedReason] = useState<string | null>(null);
  const [shareConnections, setShareConnections] = useState<any[]>([]);
  const [shareSearch, setShareSearch] = useState("");
  const [loadingShareConnections, setLoadingShareConnections] = useState(false);
  const [sendingToUserId, setSendingToUserId] = useState<string | null>(null);
  const [content, setContent] = useState(post.content);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [allowComments, setAllowComments] = useState<boolean>(
    post.allowComments !== false && (post as any).allow_comments !== false
  );
  const [editingAllowComments, setEditingAllowComments] = useState(
    post.allowComments !== false && (post as any).allow_comments !== false
  );
  const [editingContent, setEditingContent] = useState(post.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showRatingPicker, setShowRatingPicker] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Close rating picker on click outside
  useEffect(() => {
    if (!showRatingPicker) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowRatingPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showRatingPicker]);

  useEffect(() => {
    setIsLiked(Boolean(post.isLiked));
    setIsSaved(Boolean(post.isSaved));
    setLikesCount(post.likes);
    setImpactScore(Number(post.impactScore || 0));
    setUserImpactRating(post.userImpactRating ?? null);
    setContent(post.content);
    setEditingContent(post.content);
    setIsDeleted(false);
  }, [post.id, post.isLiked, post.isSaved, post.content, post.likes, post.impactScore, post.userImpactRating]);

  const handleOpenEdit = () => {
    setEditingContent(content);
    setShowEditDialog(true);
  };

  const handleConfirmEdit = async () => {
    if (isUpdating) return;
    const nextContent = editingContent.trim();
    if (!nextContent) {
      toast({ title: t("postCard.toasts.contentInvalid"), description: t("postCard.toasts.contentCannotBeEmpty"), variant: "destructive" });
      return;
    }

    // Pessimistic update: keep old UI until API confirms.
    setIsUpdating(true);
    try {
      const updated = await updatePost(post.id, { content: nextContent, allow_comments: editingAllowComments });
      setContent(updated?.content ?? nextContent);
      setAllowComments(editingAllowComments);
      setShowEditDialog(false);
      toast({ title: t("postCard.toasts.postUpdated"), description: t("postCard.toasts.postUpdatedDesc") });
    } catch (error: any) {
      toast({ title: t("postCard.toasts.updateFailed"), description: error?.message || t("postCard.toasts.updateFailed"), variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setShowDeleteDialog(false);
    // Optimistic delete + rollback.
    setIsDeleted(true);
    try {
      await deletePost(post.id);
      toast({ title: t("postCard.toasts.postDeleted"), description: t("postCard.toasts.postDeletedDesc") });
    } catch (error: any) {
      setIsDeleted(false);
      toast({ title: t("postCard.toasts.deleteFailed"), description: error?.message || t("postCard.toasts.deleteFailed"), variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const [showAuthModal, setShowAuthModal] = useState(false);
  const isAuthenticated = !!localStorage.getItem("access");

  const requireAuth = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleLike = async () => {
    requireAuth(async () => {
      try {
        const response = await likePost(post.id);
        const liked = Boolean(response?.data?.liked);
        const nextLikesCount = Number(response?.data?.likesCount ?? post.likes);

        setIsLiked(liked);
        setLikesCount(nextLikesCount);

        if (liked) {
          toast({
            title: t("postCard.toasts.postLiked"),
            description: t("postCard.toasts.postLikedDesc"),
            duration: 2000,
          });
        }
      } catch (error: any) {
        toast({
          title: t("postCard.toasts.updateFailed"),
          description: error?.message || t("postCard.toasts.updateFailed"),
          variant: "destructive",
          duration: 2000,
        });
      }
    });
  };

  const handleImpactRate = async (value: number | null) => {
    requireAuth(async () => {
      // Explication pedagogique lors du premier clic
      const hasSeenExplanation = localStorage.getItem("impact_explanation_shown");
      if (!hasSeenExplanation) {
        toast({
          title: t("postCard.toasts.whatIsImpactTitle"),
          description: t("postCard.toasts.whatIsImpactDesc"),
          duration: 6000,
        });
        localStorage.setItem("impact_explanation_shown", "true");
      }

      // Optimistic update for instant feedback
      const prevScore = impactScore;
      const prevRating = userImpactRating;
      const delta = (value ?? 0) - (prevRating ?? 0);
      setImpactScore((prev) => Math.max(0, prev + delta));
      setUserImpactRating(value);

      try {
        const response = await impactRatePost(post.id, value);
        const nextImpactScore = Number(response?.data?.impactScore ?? (prevScore + delta));
        const nextUserImpactRating = response?.data?.userImpactRating ?? value;

        setImpactScore(nextImpactScore);
        setUserImpactRating(nextUserImpactRating);
      } catch (error: any) {
        // Rollback on error
        setImpactScore(prevScore);
        setUserImpactRating(prevRating);
        toast({
          title: t("postCard.toasts.error"),
          description: error?.message || t("postCard.toasts.impactRateError"),
          variant: "destructive",
          duration: 2000,
        });
      }
    });
  };

  const handleTouchStartImpact = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      requireAuth(() => setShowRatingPicker(true));
    }, 380);
  };

  const handleTouchEndImpact = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMoveImpact = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleMouseEnterImpact = () => {
    hoverTimerRef.current = setTimeout(() => {
      setShowRatingPicker(true);
    }, 450);
  };

  const handleMouseLeaveImpact = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleSingleTapImpact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    requireAuth(() => {
      if (userImpactRating !== null) {
        handleImpactRate(null);
      } else {
        handleImpactRate(1);
      }
    });
  };

  const handleSave = async () => {
    if (isSaving) return;
    requireAuth(async () => {
      setIsSaving(true);
      const nextSavedState = !isSaved;

      try {
        const response = await savePost(post.id);
        const saved = response?.data?.saved ?? nextSavedState;

        setIsSaved(saved);
        onToggleSave?.(saved);

        toast({
          title: saved ? t("postCard.toasts.postSaved") : t("postCard.toasts.postUnsaved"),
          description: saved
            ? t("postCard.toasts.postSavedDesc")
            : t("postCard.toasts.postUnsavedDesc"),
          duration: 2000,
        });
      } catch (error: any) {
        toast({
          title: t("postCard.toasts.error"),
          description: error?.message || t("postCard.toasts.updateFailed"),
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleShare = () => {
    requireAuth(() => {
      setShowShareDialog(true);
    });
  };

  const handleSocialShare = (platform: string) => {
    const postUrl = encodeURIComponent(`${window.location.origin}${getPostUrl(post)}`);
    const postText = encodeURIComponent(post.content.length > 100 ? post.content.substring(0, 100) + "..." : post.content);

    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${postText}%20${postUrl}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${postUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${postUrl}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${postText}&url=${postUrl}`;
        break;
      case "instagram":
        handleCopyLink();
        toast({ title: t("postCard.toasts.linkCopied"), description: t("postCard.toasts.instagramNoDirectShare") });
        return;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleShareToFriend = async (contactId: string, contactName: string) => {
    if (sendingToUserId) return;
    setSendingToUserId(contactId);
    const postUrl = `${window.location.origin}${getPostUrl(post)}`;
    const messageContent = t("postCard.toasts.sharedPostContent", { name: post.author.name, url: postUrl });
    try {
      // Rechercher d'abord si une conversation existe déjà (plus robuste)
      const convs = await getUserConversations();
      const existing = (convs || []).find((c: any) => {
        const isPrivate = (c.type || c.conversation_type || "private") === "private";
        const participants = c.participants_info || c.participants || [];
        return isPrivate && participants.some((p: any) => String(p.id) === String(contactId));
      });

      let convId = existing?.id != null ? String(existing.id) : null;

      if (!convId) {
        // Si elle n'existe pas, on la crée
        const conv = await createPrivateConversation(contactId);
        convId = conv?.id != null ? String(conv.id) : null;
      }

      if (!convId) throw new Error(t("postCard.toasts.conversationNotFound"));
      await sendMessage(convId, messageContent);
      toast({ title: t("postCard.toasts.postShared"), description: t("postCard.toasts.sentTo", { name: contactName }), duration: 2000 });
    } catch (e: any) {
      toast({ title: t("postCard.toasts.error"), description: e?.message || t("postCard.toasts.errorSendingMessage"), variant: "destructive" });
    } finally {
      setSendingToUserId(null);
    }
  };

  const handleCopyLink = async () => {
    if (isCopyingLink) return;
    setIsCopyingLink(true);

    const postUrl = `${window.location.origin}${getPostUrl(post)}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      toast({
        title: t("postCard.toasts.linkCopied"),
        description: t("postCard.toasts.linkCopiedDesc"),
        duration: 2000,
      });
    } catch {
      toast({
        title: t("postCard.toasts.error"),
        description: t("postCard.toasts.copyError"),
        variant: "destructive",
      });
    } finally {
      setIsCopyingLink(false);
    }
  };

  const handleReport = () => {
    requireAuth(() => {
      setReportError(null);
      setShowReportDialog(true);
    });
  };

  const handleSubmitReport = async (reason: string) => {
    if (isReporting) return;

    setReportError(null);
    setIsReporting(true);

    // Optimistic UI: immediate close + local reported state, then reconcile if API fails.
    setReportedReason(reason);
    setShowReportDialog(false);

    try {
      await reportPost(post.id, { reason });
      toast({
        title: t("postCard.toasts.postReported"),
        description: t("postCard.toasts.postReportedDesc", { reason }),
        duration: 3000,
      });
    } catch (error: any) {
      setReportedReason(null);
      setReportError(error?.message || t("postCard.toasts.reportFailed"));
      setShowReportDialog(true);
      toast({
        title: t("postCard.toasts.reportFailed"),
        description: error?.message || t("postCard.toasts.reportFailed"),
        variant: "destructive",
      });
    } finally {
      setIsReporting(false);
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${post.author.username}`);
  };

  const handleImageDoubleClick = () => {
    if (!isLiked) {
      handleLike();
    }
  };

  const resolveAttachmentType = (file: { type?: string; name?: string }) => {
    const rawType = (file.type || "").toLowerCase();
    const extension = (file.name?.split(".").pop() || "").toLowerCase();

    if (
      rawType === "image" ||
      rawType.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif", "heic"].includes(extension)
    ) {
      return "image";
    }

    if (
      rawType === "video" ||
      rawType.startsWith("video/") ||
      ["mp4", "webm", "ogg", "mov", "m4v", "avi", "mkv"].includes(extension)
    ) {
      return "video";
    }

    return "document";
  };

  const formatFileSize = (size = 0) => {
    if (!size || Number.isNaN(size)) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const normalizedFiles = (post.files ?? [])
    .filter((file) => Boolean(file?.url))
    .map((file) => ({
      ...file,
      name: file.name || file.url.split("/").pop() || "Attachment",
      type: file.type || "",
      size: Number(file.size || 0),
    }));

  const attachments = normalizedFiles.length > 0
    ? normalizedFiles
    : post.image
      ? [{
        id: "legacy-image",
        name: "Image",
        url: post.image,
        type: "image",
        size: 0,
      }]
      : [];

  const imageAttachments = attachments.filter((file) => resolveAttachmentType(file) === "image");
  const videoAttachments = attachments.filter((file) => resolveAttachmentType(file) === "video");
  const documentAttachments = attachments.filter((file) => resolveAttachmentType(file) === "document");


  const categoryLabel = getCategoryLabel(post.category);

  if (isDeleted) {
    return null;
  }

  return (
    <>
      <article className="border-b border-border/40 py-5 transition-colors hover:bg-muted/[0.02]">
        <div className="pb-3 px-3.5 sm:px-5 md:px-6">
          <div className="flex items-start justify-between gap-3">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
              onClick={handleProfileClick}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
                  {post.author.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-semibold text-sm hover:underline truncate">{post.author.name}</h4>
                  {post.author.isVerified && (
                    <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" weight="fill" />
                  )}
                  <span className="text-xs text-muted-foreground/50">·</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {post.createdAt ? formatRelativeTime(post.createdAt) : post.timestamp || t("postCard.dateUnknown")}
                  </span>
                  {categoryLabel && categoryLabel.toLowerCase() !== "général" && categoryLabel.toLowerCase() !== "general" && (
                    <>
                      <span className="text-xs text-muted-foreground/50">·</span>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0">
                        {categoryLabel}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSave} disabled={isSaving}>
                  <BookmarkSimple className="h-4 w-4 mr-2" weight={isSaved ? "fill" : "regular"} />
                  {isSaving
                    ? t("postCard.saving")
                    : isSaved
                      ? t("postCard.saved")
                      : t("postCard.save")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="h-4 w-4 mr-2" />
                  {t("postCard.share")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink} disabled={isCopyingLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  {isCopyingLink ? t("postCard.copying") : t("postCard.copyLink")}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={handleReport}>
                  <Flag className="h-4 w-4 mr-2" />
                  {t("postCard.report")}
                </DropdownMenuItem>
                {post.canEdit && (
                  <DropdownMenuItem onClick={handleOpenEdit}>
                    <PencilSimple className="h-4 w-4 mr-2" />
                    {t("postCard.edit")}
                  </DropdownMenuItem>
                )}
                {post.canDelete && (
                  <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    {t("postCard.delete")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="pt-0.5">
          <div className="space-y-3">
            <div>
              <div className="px-3.5 sm:px-5 md:px-6">
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">{renderMentionText(content)}</p>
              </div>

              {attachments.length > 0 && (
                <div className="mt-3 w-full">
                  {imageAttachments.length > 0 && (() => {
                    const visible = imageAttachments.slice(0, 4);
                    const extra = imageAttachments.length - 4;
                    const count = visible.length;
                    const gridClass =
                      count === 1 ? "grid-cols-1" :
                        count === 2 ? "grid-cols-2" :
                          count === 3 ? "grid-cols-2" :
                            "grid-cols-2";
                    return (
                      <div className="px-0 sm:px-5 md:px-6">
                        <div className={cn("grid gap-0.5 w-full overflow-hidden rounded-none sm:rounded-2xl", gridClass)}>
                        {visible.map((file, i) => {
                          const isLast = i === 3 && extra > 0;
                          const spanFull = count === 3 && i === 0;
                          return (
                            <div
                              key={file.id ?? file.url}
                              className={cn(
                                "relative overflow-hidden cursor-pointer w-full",
                                spanFull && "col-span-2",
                                count === 1 ? "w-full" : (spanFull ? "aspect-video" : "aspect-square")
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(i);
                              }}
                            >
                              <img
                                src={file.url}
                                alt={file.name || "media"}
                                className={cn(
                                  "w-full block rounded-none sm:rounded-2xl transition-all duration-300",
                                  count === 1
                                    ? "w-full h-auto max-h-[650px] object-cover hover:opacity-95"
                                    : "w-full h-full object-cover hover:scale-105"
                                )}
                              />
                              {isLast && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white text-2xl font-bold">+{extra + 1}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      </div>
                    );
                  })()}

                  {videoAttachments.length > 0 && (
                    <div className="space-y-2 mt-2 w-full px-0 sm:px-5 md:px-6">
                      {videoAttachments.map((file) => (
                        <div key={file.id ?? file.url} className="overflow-hidden bg-black w-full rounded-none sm:rounded-2xl">
                          <video src={file.url} controls preload="metadata" className="w-full block" onClick={(e) => e.stopPropagation()} />
                        </div>
                      ))}
                    </div>
                  )}

                  {documentAttachments.length > 0 && (
                    <div className="space-y-2 mt-3 px-3.5 sm:px-5 md:px-6">
                      {documentAttachments.map((file) => (
                        <div key={file.id ?? file.url} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/40 px-3.5 py-2.5">
                          <div className="min-w-0 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{file.name}</p>
                              {file.size > 0 && <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={file.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" />{t("postCard.open")}</a>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={file.url} download={file.name}><Download className="h-4 w-4 mr-1" />{t("postCard.download")}</a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Impact Score, Comment, Share (3 equal-sized full-width pills with light gray background) */}
            <div className={cn("grid gap-2 pt-2 mt-1 border-t border-border/30 px-2 sm:px-4", allowComments ? "grid-cols-3" : "grid-cols-2")}>
              {/* Left: Impact Score with Option A (1-Tap quick vote + Long-press / Hover 1-5 picker) */}
              <div
                className="relative w-full"
                onMouseEnter={handleMouseEnterImpact}
                onMouseLeave={handleMouseLeaveImpact}
              >
                {/* Floating Reaction / Rating Bar (1 to 5) */}
                {showRatingPicker && (
                  <div
                    ref={pickerRef}
                    className="absolute bottom-full left-0 mb-2 z-30 flex items-center gap-1 p-1 bg-background/95 backdrop-blur-md border border-border/80 shadow-lg rounded-full animate-in fade-in-0 zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
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
                        title={t("postCard.rateScoreTooltip", { value })}
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
                        title={t("postCard.removeVote")}
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
                  onMouseDown={() => {
                    isLongPressRef.current = false;
                    longPressTimerRef.current = setTimeout(() => {
                      isLongPressRef.current = true;
                      requireAuth(() => setShowRatingPicker(true));
                    }, 380);
                  }}
                  onMouseUp={() => {
                    if (longPressTimerRef.current) {
                      clearTimeout(longPressTimerRef.current);
                      longPressTimerRef.current = null;
                    }
                  }}
                  onClick={handleSingleTapImpact}
                  className={cn(
                    "w-full h-9 sm:h-9.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full text-xs sm:text-sm font-medium border transition-all active:scale-95 select-none",
                    userImpactRating
                      ? "bg-primary/15 border-primary/35 text-primary font-semibold hover:bg-primary/20"
                      : "bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/30"
                  )}
                  title={userImpactRating ? t("postCard.impactAssignedTitle", { score: userImpactRating }) : t("postCard.impactClickTitle")}
                >
                  <Zap className={cn("h-5 w-5 shrink-0 transition-transform", userImpactRating ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary")} weight={userImpactRating ? "fill" : "regular"} />
                  <span>{impactScore}</span>
                  <span className="hidden sm:inline">{t("postCard.impact")}</span>
                </Button>
              </div>

              {/* Middle: Comments */}
              {allowComments && (
                <Button
                  variant="ghost"
                  className="w-full h-9 sm:h-9.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full text-xs sm:text-sm font-medium bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/30 transition-all active:scale-95"
                  onClick={() => requireAuth(() => setCommentsOpen(true))}
                >
                  <ChatTeardrop className="h-5 w-5 shrink-0" />
                  <span>{post.comments}</span>
                  <span className="hidden sm:inline">{post.comments > 1 ? t("postCard.comments") : t("postCard.comment")}</span>
                </Button>
              )}

              {/* Right: Share */}
              <Button
                variant="ghost"
                className="w-full h-9 sm:h-9.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full text-xs sm:text-sm font-medium bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/30 transition-all active:scale-95"
                onClick={handleShare}
                title={t("postCard.sharePostTooltip")}
              >
                <Share className="h-5 w-5 shrink-0" />
                <span>{t("postCard.share")}</span>
              </Button>
            </div>
          </div>
        </div>
      </article>

      {commentsOpen && allowComments && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <CommentsModal
            open={commentsOpen && allowComments}
            onOpenChange={setCommentsOpen}
            postId={post.id}
            allowComments={allowComments}
          />
        </Suspense>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Dialog open onOpenChange={() => setLightboxIndex(null)}>
          <DialogContent className="max-w-screen-lg w-full p-0 bg-black border-0">
            <div className="relative flex items-center justify-center min-h-[60vh]">
              <img
                src={imageAttachments[lightboxIndex]?.url}
                alt={imageAttachments[lightboxIndex]?.name || "media"}
                className="max-h-[85vh] max-w-full object-contain"
              />
              {imageAttachments.length > 1 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + imageAttachments.length) % imageAttachments.length); }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % imageAttachments.length); }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {imageAttachments.map((_, i) => (
                      <button key={i} onClick={() => setLightboxIndex(i)} className={cn("w-2 h-2 rounded-full", i === lightboxIndex ? "bg-white" : "bg-white/40")} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showShareDialog && (
        <UniversalShareModal
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          type="post"
          url={getPostUrl(post)}
          title={post.content ? (post.content.length > 60 ? post.content.substring(0, 60) + "..." : post.content) : "Post"}
          preview={{
            title: post.content ? (post.content.length > 70 ? post.content.substring(0, 70) + "..." : post.content) : t("postCard.discussionPost"),
            description: post.content ? (post.content.length > 140 ? post.content.substring(0, 140) + "..." : post.content) : undefined,
            subtitle: post.author?.name ? t("postCard.byAuthor", { name: post.author.name }) : t("postCard.studentDiscussion"),
            badge: "Post",
            imageUrl: imageAttachments[0]?.url || null,
          }}
          allowDirectShare={true}
        />
      )}

      {/* Modal de signalement */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("postCard.reportModal.title")}</DialogTitle>
            <DialogDescription>
              {t("postCard.reportModal.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reportedReason && (
              <p className="text-sm rounded-md border border-primary/30 bg-primary/5 p-2">
                {t("postCard.reportModal.alreadyReported", { reason: reportedReason })}
              </p>
            )}
            {reportError && (
              <p className="text-sm rounded-md border border-destructive/30 bg-destructive/5 p-2 text-destructive">
                {reportError}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {t("postCard.reportModal.whyReport")}
            </p>
            <div className="space-y-2">
              {[
                { key: "inappropriate", label: t("postCard.reportModal.reasons.inappropriate") },
                { key: "spam", label: t("postCard.reportModal.reasons.spam") },
                { key: "harassment", label: t("postCard.reportModal.reasons.harassment") },
                { key: "misinformation", label: t("postCard.reportModal.reasons.misinformation") },
                { key: "violence", label: t("postCard.reportModal.reasons.violence") },
                { key: "other", label: t("postCard.reportModal.reasons.other") }
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSubmitReport(label)}
                  disabled={isReporting}
                >
                  {isReporting ? t("postCard.reportModal.sending") : label}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("postCard.editModal.title")}</DialogTitle>
            <DialogDescription>{t("postCard.editModal.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className="min-h-[120px]" maxLength={2000} />
            <div className="flex items-center justify-between py-1 px-1">
              <label htmlFor="edit-allow-comments" className="text-sm font-medium cursor-pointer">
                {t("postCard.editModal.allowComments")}
              </label>
              <Switch
                id="edit-allow-comments"
                checked={editingAllowComments}
                onCheckedChange={setEditingAllowComments}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isUpdating}>{t("postCard.editModal.cancel")}</Button>
              <Button onClick={handleConfirmEdit} disabled={isUpdating}>
                {isUpdating ? t("postCard.editModal.saving") : t("postCard.editModal.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("postCard.deleteModal.title")}</DialogTitle>
            <DialogDescription>
              {t("postCard.deleteModal.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>{t("postCard.deleteModal.cancel")}</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? t("postCard.deleteModal.deleting") : t("postCard.deleteModal.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-foreground" weight="fill" />
              {t("postCard.authModal.title")}
            </DialogTitle>
            <DialogDescription>
              {t("postCard.authModal.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={() => navigate("/register")} className="bg-secondary hover:bg-muted text-secondary-foreground border border-border/60 w-full">
              {t("postCard.authModal.createAccount")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/login")} className="w-full">
              {t("postCard.authModal.login")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}




