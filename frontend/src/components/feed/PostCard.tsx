import { Suspense, lazy, useEffect, useState } from "react";
import { Heart, MessageCircle, Share, Bookmark, MoreVertical, Zap, Copy, Flag, ExternalLink, Users, Plus, Minus, X, Pencil, Trash2, Loader2, FileText, Download, ChevronLeft, ChevronRight, Search, Facebook, Instagram, Twitter, Linkedin, Info, BadgeCheck } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaWhatsapp, FaLinkedin } from 'react-icons/fa';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
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
      // Explication pédagogique lors du premier clic
      const hasSeenExplanation = localStorage.getItem("impact_explanation_shown");
      if (!hasSeenExplanation) {
        toast({
          title: "Qu'est-ce que l'Impact Score ? ⚡",
          description: "C'est une mesure de l'utilité du post. Plus un post aide la communauté, plus son Impact Score grimpe. Vous pouvez voter pour augmenter (+) ou réduire (-) cette note.",
          duration: 6000,
        });
        localStorage.setItem("impact_explanation_shown", "true");
      }

      try {
        const response = await impactRatePost(post.id, value);
        const nextImpactScore = Number(response?.data?.impactScore ?? impactScore);
        const nextUserImpactRating = response?.data?.userImpactRating ?? null;

        setImpactScore(nextImpactScore);
        setUserImpactRating(nextUserImpactRating);
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error?.message || "Impossible de noter l'impact du post",
          variant: "destructive",
          duration: 2000,
        });
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

  const handleShare = async () => {
    requireAuth(async () => {
      const postUrl = `${window.location.origin}/posts/${post.id}`;

      // On utilise directement notre modal pour plus de contrôle et éviter les échecs du partage natif
      setShowShareDialog(true);
      setShareSearch("");
      if (shareConnections.length === 0) {
        setLoadingShareConnections(true);
        if (!currentUser?.id) {
          setLoadingShareConnections(false);
          return;
        }
        getUserConnections(currentUser.id).then((conns) => {
          const mapped = (conns || []).map((conn: any) => {
            const isRequester = String(conn.requester) === String(currentUser.id);
            const counterpart = isRequester ? conn.recipient_info : conn.requester_info;
            const counterpartId = isRequester ? conn.recipient : conn.requester;
            return {
              id: String(counterpart?.id || counterpartId),
              name: counterpart?.full_name || counterpart?.name || counterpart?.username || "Utilisateur",
              username: counterpart?.username || "",
              avatar: counterpart?.avatar || "/placeholder-avatar.jpg",
            };
          }).filter((c: any) => c.id);
          setShareConnections(mapped);
        }).catch((): void => {}).finally(() => setLoadingShareConnections(false));
      }
    });
  };

  const handleSocialShare = (platform: string) => {
    const postUrl = encodeURIComponent(`${window.location.origin}/posts/${post.id}`);
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
    const postUrl = `${window.location.origin}/posts/${post.id}`;
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

    const postUrl = `${window.location.origin}/posts/${post.id}`;
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

  const handleOpenPost = () => {
    navigate(`/posts/${post.id}`);
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
  const cardClasses = cn(
    "transition-all duration-200",
    isMobile
      ? "rounded-none border-x-0 border-t-0 shadow-none bg-card"
      : "cs-card hover:shadow-[var(--shadow-sm)]"
  );

  if (isDeleted) {
    return null;
  }

  return (
    <>
      <Card className={cardClasses}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProfileClick}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback className="bg-input text-muted-foreground font-semibold">
                  {post.author.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm hover:underline">{post.author.name}</h4>
                  {post.author.isVerified && (
                    <BadgeCheck className="h-4 w-4 text-primary fill-primary/10" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">@{post.author.username}</p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">
                    {post.createdAt ? formatRelativeTime(post.createdAt) : post.timestamp || "Date inconnue"}
                  </p>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
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
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            <div onClick={handleOpenPost} className="cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="text-xs">
                  {categoryLabel}
                </Badge>
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderMentionText(content)}</p>

              {attachments.length > 0 && (
                <div className="space-y-0">
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
                      <div className={cn(isMobile ? "-mx-4" : "", "grid gap-0.5", gridClass)}>
                        {visible.map((file, i) => {
                          const isLast = i === 3 && extra > 0;
                          const spanFull = count === 3 && i === 0;
                          return (
                            <div
                              key={file.id ?? file.url}
                              className={cn(
                                "relative overflow-hidden cursor-pointer",
                                !isMobile && i === 0 && "rounded-tl-lg",
                                !isMobile && i === 1 && count <= 2 && "rounded-tr-lg",
                                !isMobile && i === count - 1 && count <= 2 && "rounded-br-lg",
                                !isMobile && i === count - 2 && count <= 2 && "rounded-bl-lg",
                                spanFull && "col-span-2",
                                count === 1 ? "max-h-[500px]" : (spanFull ? "aspect-video" : "aspect-square")
                              )}
                              onClick={() => setLightboxIndex(i)}
                            >
                              <OptimizedImage
                                src={file.url}
                                alt={file.name || "media"}
                                className={cn(
                                  "w-full h-full hover:scale-105 transition-transform duration-300",
                                  count === 1 ? "object-contain bg-muted" : "object-cover"
                                )}
                                containerClassName="w-full h-full"
                                onDoubleClick={handleImageDoubleClick}
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
                    <div className="space-y-2">
                      {videoAttachments.map((file) => (
                        <div key={file.id ?? file.url} className={cn("overflow-hidden bg-muted", isMobile ? "-mx-4" : "rounded-lg")}>
                          <video src={file.url} controls preload="metadata" className="w-full" onClick={(e) => e.stopPropagation()} />
                        </div>
                      ))}
                    </div>
                  )}

                  {documentAttachments.length > 0 && (
                    <div className="space-y-2">
                      {documentAttachments.map((file) => (
                        <div key={file.id ?? file.url} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
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

            {/* Impact Score Rating */}


                        <div className="flex flex-row items-center justify-between gap-1 sm:gap-4 pt-2 border-t overflow-x-auto">
              <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`gap-1.5 sm:gap-2 h-9 px-2 sm:px-3 transition-all active:scale-95 ${isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'}`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{likesCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 sm:gap-2 h-9 px-2 sm:px-3 hover:text-foreground transition-all active:scale-95"
                  onClick={() => requireAuth(() => setCommentsOpen(true))}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{post.comments}</span>
                </Button>

                <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-3 hover:text-foreground transition-all active:scale-95" onClick={handleShare}>
                  <Share className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-2 rounded-lg bg-muted/50 p-0.5 sm:p-1 shrink-0">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-background/80"
                    onClick={() => handleImpactRate(Math.max((userImpactRating ?? 0) - 1, 1))}
                    disabled={userImpactRating === null}
                  >
                    <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-background/80"
                    onClick={() => handleImpactRate(Math.min((userImpactRating ?? 0) + 1, 5))}
                  >
                    <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-background/80"
                    onClick={() => handleImpactRate(null)}
                    disabled={userImpactRating === null}
                  >
                    <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-0.5 sm:py-1 bg-background rounded-md shadow-sm border">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-bold text-foreground">{impactScore}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 sm:h-5 sm:w-5 p-0 rounded-full hover:bg-muted transition-colors ml-0.5 sm:ml-1 hidden sm:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast({
                        title: "Score d'impact",
                        description: "Le Score d'Impact mesure l'utilité et la pertinence de ce contenu pour la communauté CampusSphere. Il est calculé en fonction des interactions et des retours des étudiants.",
                      });
                    }}
                  >
                    <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
        </div></CardContent>
      </Card>

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

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Partager ce post</DialogTitle>
            <DialogDescription>
              Choisissez comment vous souhaitez partager ce contenu avec votre réseau.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 py-2">
            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 hover:bg-accent"
              onClick={() => handleSocialShare("whatsapp")}
            >
              <div className="h-7 w-7 rounded-full bg-green-500 flex items-center justify-center text-white">
                <FaWhatsapp className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider">WhatsApp</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 hover:bg-accent"
              onClick={() => handleSocialShare("twitter")}
            >
              <div className="h-7 w-7 rounded-full bg-sky-500 flex items-center justify-center text-white">
                <FaTwitter className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider">Twitter / X</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 hover:bg-accent"
              onClick={() => handleSocialShare("facebook")}
            >
              <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <FaFacebook className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider">Facebook</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 hover:bg-accent"
              onClick={() => handleSocialShare("linkedin")}
            >
              <div className="h-7 w-7 rounded-full bg-blue-700 flex items-center justify-center text-white">
                <FaLinkedin className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider">LinkedIn</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 hover:bg-accent"
              onClick={() => handleSocialShare("instagram")}
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white">
                <FaInstagram className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider">Instagram</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 hover:bg-accent"
              onClick={handleCopyLink}
              disabled={isCopyingLink}
            >
              <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                <Copy className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider">{isCopyingLink ? "Copié !" : "Lien"}</span>
            </Button>
          </div>

          <Separator />

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" /> Envoyer à un ami sur CampusSphere
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un contact..."
                className="pl-9 bg-muted/30 border-none"
                value={shareSearch}
                onChange={(e) => setShareSearch(e.target.value)}
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {loadingShareConnections ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 w-full bg-muted animate-pulse rounded-md" />)}
                </div>
              ) : shareConnections.filter((c) => {
                const q = shareSearch.toLowerCase();
                return !q || c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q);
              }).length === 0 ? (
                <div className="text-center py-6 text-muted-foreground italic text-sm">
                  Aucun ami trouvé.
                </div>
              ) : (
                shareConnections
                  .filter((c) => {
                    const q = shareSearch.toLowerCase();
                    return !q || c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q);
                  })
                  .map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-accent transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 flex-shrink-0 border">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback className="bg-muted text-muted-foreground">{(contact.name || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:text-foreground transition-colors">{contact.name}</p>
                          {contact.username && <p className="text-[10px] text-muted-foreground">@{contact.username}</p>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-full px-4 h-8 active:scale-95 border-none"
                        onClick={() => handleShareToFriend(contact.id, contact.name)}
                        disabled={sendingToUserId === contact.id}
                      >
                        {sendingToUserId === contact.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Envoyer"}
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <Zap className="h-5 w-5 text-primary fill-current" />
              Rejoignez CampusSphere
            </DialogTitle>
            <DialogDescription>
              Vous devez être connecté pour liker, commenter ou enregistrer des publications.
              Créez un compte gratuitement pour rejoindre la discussion !
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={() => navigate("/register")} className="campus-gradient text-white w-full">
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




