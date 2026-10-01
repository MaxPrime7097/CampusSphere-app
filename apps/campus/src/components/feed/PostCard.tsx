import { UniversalShareModal } from "@/components/shared/UniversalShareModal";
import { Suspense, lazy, useEffect, useState, useRef } from "react";
import { Heart, MessageCircle, Share, Bookmark, MoreVertical, Zap, Copy, Flag, ExternalLink, Users, Plus, Minus, X, Pencil, Trash2, Loader2, FileText, Download, ChevronLeft, ChevronRight, Search, Facebook, Instagram, Twitter, Linkedin, Info, BadgeCheck } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaWhatsapp, FaLinkedin } from 'react-icons/fa';

import { Button } from "@/components/ui/button";
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
      toast({ title: "Contenu invalide", description: "Le contenu ne peut pas être vide.", variant: "destructive" });
      return;
    }

    // Pessimistic update: keep old UI until API confirms.
    setIsUpdating(true);
    try {
      const updated = await updatePost(post.id, { content: nextContent });
      setContent(updated?.content ?? nextContent);
      setShowEditDialog(false);
      toast({ title: "Post modifié", description: "Votre post a été mis à jour avec succès." });
    } catch (error: any) {
      toast({ title: "Échec de modification", description: error?.message || "Impossible de modifier ce post.", variant: "destructive" });
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
      toast({ title: "Post supprimé", description: "Le post a été supprimé définitivement." });
    } catch (error: any) {
      setIsDeleted(false);
      toast({ title: "Échec de suppression", description: error?.message || "Impossible de supprimer ce post.", variant: "destructive" });
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
            title: "Post aimé !",
            description: "Vous avez aimé ce post",
            duration: 2000,
          });
        }
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error?.message || "Impossible d'aimer ce post",
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
          title: "Qu'est-ce que l'Impact Score ?",
          description: "C'est une mesure de l'utilite du post. Plus un post aide la communaute, plus son Impact Score grimpe. Un appui long permet d'evaluer de 1 a 5.",
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
          title: "Erreur",
          description: error?.message || "Impossible de noter l'impact du post",
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
          title: saved ? "Post sauvegardé !" : "Post retiré des sauvegardes",
          description: saved
            ? "Le post a été ajouté à vos sauvegardes"
            : "Le post a été retiré de vos sauvegardes",
          duration: 2000,
        });
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error?.message || "Impossible de mettre à jour l'état de sauvegarde du post",
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
        toast({ title: "Lien copié !", description: "Instagram ne permet pas le partage direct. Collez le lien dans votre application." });
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
    const messageContent = `Post partagé par ${post.author.name} :\n${postUrl}`;
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

      if (!convId) throw new Error("Conversation introuvable");
      await sendMessage(convId, messageContent);
      toast({ title: "Post partagé !", description: `Envoyé à ${contactName}`, duration: 2000 });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Impossible d'envoyer le message", variant: "destructive" });
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
        title: "Lien copié !",
        description: "Le lien du post a été copié dans le presse-papiers",
        duration: 2000,
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien pour le moment.",
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
        title: "Post signalé",
        description: `Le post a été signalé pour : ${reason}`,
        duration: 3000,
      });
    } catch (error: any) {
      setReportedReason(null);
      setReportError(error?.message || "Impossible d'envoyer le signalement.");
      setShowReportDialog(true);
      toast({
        title: "Échec du signalement",
        description: error?.message || "Veuillez réessayer dans un instant.",
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
                    <BadgeCheck className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                  )}
                  <span className="text-xs text-muted-foreground/50">·</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {post.createdAt ? formatRelativeTime(post.createdAt) : post.timestamp || "Date inconnue"}
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
                  <Bookmark className="h-4 w-4 mr-2" />
                  {isSaving
                    ? "Mise à jour..."
                    : isSaved
                      ? "Retirer des sauvegardes"
                      : "Enregistrer"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="h-4 w-4 mr-2" />
                  Partager
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink} disabled={isCopyingLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  {isCopyingLink ? "Copie..." : "Copier le lien"}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={handleReport}>
                  <Flag className="h-4 w-4 mr-2" />
                  Signaler
                </DropdownMenuItem>
                {post.canEdit && (
                  <DropdownMenuItem onClick={handleOpenEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {post.canDelete && (
                  <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Supprimer
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
                    );
                  })()}

                  {videoAttachments.length > 0 && (
                    <div className="space-y-2 mt-2 w-full">
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
                              <a href={file.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Ouvrir</a>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={file.url} download={file.name}><Download className="h-4 w-4 mr-1" />Télécharger</a>
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
            <div className="grid grid-cols-3 gap-2 pt-2 mt-1 border-t border-border/30 px-2 sm:px-4">
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
                        title={`Noter ${value}/5`}
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
                        title="Retirer mon vote"
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
                  title={userImpactRating ? `Impact attribue (${userImpactRating}/5) — Cliquer pour retirer` : "Cliquer pour +1 Impact ou maintenir pour evaluer de 1 a 5"}
                >
                  <Zap className={cn("h-5 w-5 shrink-0 transition-transform", userImpactRating ? "text-primary fill-primary" : "")} />
                  <span>{impactScore}</span>
                  <span className="hidden sm:inline">Impact</span>
                </Button>
              </div>

              {/* Middle: Comments */}
              <Button
                variant="ghost"
                className="w-full h-9 sm:h-9.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full text-xs sm:text-sm font-medium bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/30 transition-all active:scale-95"
                onClick={() => requireAuth(() => setCommentsOpen(true))}
              >
                <MessageCircle className="h-5 w-5 shrink-0" />
                <span>{post.comments}</span>
                <span className="hidden sm:inline">{post.comments > 1 ? "Commentaires" : "Commentaire"}</span>
              </Button>

              {/* Right: Share */}
              <Button
                variant="ghost"
                className="w-full h-9 sm:h-9.5 px-2 flex items-center justify-center gap-1.5 sm:gap-2 rounded-full text-xs sm:text-sm font-medium bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/30 transition-all active:scale-95"
                onClick={handleShare}
                title="Partager ce post"
              >
                <Share className="h-5 w-5 shrink-0" />
                <span>Partager</span>
              </Button>
            </div>
          </div>
        </div>
      </article>

      {commentsOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <CommentsModal
            open={commentsOpen}
            onOpenChange={setCommentsOpen}
            postId={post.id}
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
            title: post.content ? (post.content.length > 70 ? post.content.substring(0, 70) + "..." : post.content) : "Post de discussion",
            description: post.content ? (post.content.length > 140 ? post.content.substring(0, 140) + "..." : post.content) : undefined,
            subtitle: post.author?.name ? `Par ${post.author.name}` : "Discussion étudiante",
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
            <DialogTitle>Signaler ce post</DialogTitle>
            <DialogDescription>
              Aidez-nous à maintenir une communauté respectueuse en signalant ce contenu.
              Les signalements sont persistés côté serveur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reportedReason && (
              <p className="text-sm rounded-md border border-primary/30 bg-primary/5 p-2">
                Signalement déjà envoyé pour : <strong>{reportedReason}</strong>
              </p>
            )}
            {reportError && (
              <p className="text-sm rounded-md border border-destructive/30 bg-destructive/5 p-2 text-destructive">
                {reportError}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Pourquoi signalez-vous ce post ?
            </p>
            <div className="space-y-2">
              {[
                "Contenu inapproprié",
                "Spam ou publicité",
                "Harcèlement",
                "Fausses informations",
                "Violence",
                "Autre"
              ].map((reason) => (
                <Button
                  key={reason}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSubmitReport(reason)}
                  disabled={isReporting}
                >
                  {isReporting ? "Envoi..." : reason}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le post</DialogTitle>
            <DialogDescription>Mettez à jour votre contenu puis validez.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className="min-h-[120px]" maxLength={2000} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isUpdating}>Annuler</Button>
              <Button onClick={handleConfirmEdit} disabled={isUpdating}>
                {isUpdating ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce post ?</DialogTitle>
            <DialogDescription>
              Cette action est destructive et irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>Annuler</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-foreground fill-current" />
              Rejoignez CampusSphere
            </DialogTitle>
            <DialogDescription>
              Vous devez être connecté pour liker, commenter ou enregistrer des publications.
              Créez un compte gratuitement pour rejoindre la discussion !
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={() => navigate("/register")} className="bg-secondary hover:bg-muted text-secondary-foreground border border-border/60 w-full">
              Créer un compte gratuitement
            </Button>
            <Button variant="outline" onClick={() => navigate("/login")} className="w-full">
              Se connecter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}




