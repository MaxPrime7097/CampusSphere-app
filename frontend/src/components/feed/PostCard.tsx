import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share, Bookmark, MoreVertical, Zap, Copy, Flag, ExternalLink, Users, Plus, Minus, X, Pencil, Trash2, Loader2, FileText, Download, ChevronLeft, ChevronRight, Search } from "lucide-react";
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
import { CommentsModal } from "@/components/modals/CommentsModal";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { impactRatePost, likePost, savePost, reportPost, updatePost, deletePost, getCurrentUser, getUserConnections, createPrivateConversation, sendMessage } from "@/services/api";
import { formatRelativeTime } from "@/lib/date";
import { renderMentionText } from "@/lib/mentions";
import { Textarea } from "@/components/ui/textarea";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface PostCardProps {
  post: {
    files?: {
      id: string | number | null;
      name: string;
      url: string;
      type: string;
      size: number;
    }[];
    id: string;
    author: {
      name: string;
      avatar?: string;
      username: string;
      isVerified?: boolean;
      impactScore?: number;
    };
    content: string;
    image?: string;
    createdAt?: string | null;
    timestamp?: string;
    likes: number;
    comments: number;
    category?: string;
    impactScore?: number;
    userImpactRating?: number | null;
    isLiked?: boolean;
    isSaved?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    files?: Array<Record<string, unknown>>;
  };
  onToggleSave?: (saved: boolean) => void;
}

export function PostCard({ post, onToggleSave }: PostCardProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
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

  const handleLike = async () => {
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
  };

  const handleImpactRate = async (value: number | null) => {
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
  };

  const handleSave = async () => {
    if (isSaving) return;
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
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    
    // Tentative de partage natif (mobile/OS)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post de ${post.author.name} sur CampusSphere`,
          text: post.content.length > 100 ? post.content.substring(0, 100) + "..." : post.content,
          url: postUrl,
        });
        return; // Succès du partage natif
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Erreur de partage natif:", err);
        } else {
          return; // L'utilisateur a annulé le partage natif
        }
      }
    }

    setShowShareDialog(true);
    setShareSearch("");
    if (shareConnections.length === 0) {
      setLoadingShareConnections(true);
      getCurrentUser().then((user) => {
        if (!user?.id) { setLoadingShareConnections(false); return; }
        return getUserConnections(user.id).then((conns) => {
          const mapped = (conns || []).map((conn: any) => {
            const isRequester = String(conn.requester) === String(user.id);
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
        });
      }).catch(() => null).finally(() => setLoadingShareConnections(false));
    }
  };

  const handleShareToFriend = async (contactId: string, contactName: string) => {
    if (sendingToUserId) return;
    setSendingToUserId(contactId);
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    const messageContent = `📌 Post partagé par ${post.author.name} :\n${postUrl}`;
    try {
      const conv = await createPrivateConversation(contactId);
      // conv est déjà unwrappé par createPrivateConversation (unwrapItem)
      // id peut être int ou string selon le serializer
      const convId = conv?.id != null ? String(conv.id) : null;
      if (!convId) throw new Error("Conversation introuvable");
      await sendMessage(convId, messageContent);
      toast({ title: "Post partagé !", description: `Envoyé à ${contactName}`, duration: 2000 });
    } catch (e: any) {
      // Fallback : chercher la conv existante dans la liste locale
      const { getUserConversations: getConvs } = await import("@/services/api");
      try {
        const convs = await getConvs();
        const existing = (convs || []).find((c: any) =>
          (c.type === "private" || !c.type) &&
          (c.participants_info || c.participants || []).some(
            (p: any) => String(p.id) === String(contactId)
          )
        );
        if (existing) {
          const convId = String(existing.id);
          await sendMessage(convId, messageContent);
          toast({ title: "Post partagé !", description: `Envoyé à ${contactName}`, duration: 2000 });
          return;
        }
      } catch { /* ignore */ }
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
    setReportError(null);
    setShowReportDialog(true);
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
    "transition-all duration-300",
    isMobile 
      ? "rounded-none border-x-0 border-t-0 shadow-none bg-card" 
      : "campus-card hover:campus-glow"
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
                    <div className="w-4 h-4 campus-gradient rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
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
          <div  onClick={handleOpenPost} className="cursor-pointer">
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
                          {isLiked && i === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <Heart className="h-16 w-16 text-red-500 fill-current animate-ping" />
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
          

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`gap-2 transition-all active:scale-95 ${isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'}`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">{likesCount}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 hover:text-primary transition-all active:scale-95"
                onClick={() => setCommentsOpen(true)}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{post.comments}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="gap-2 hover:text-primary transition-all active:scale-95" onClick={handleShare}>
                <Share className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 rounded-md border px-2 py-1 text-primary">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1"
                onClick={() => handleImpactRate(Math.max((userImpactRating ?? 0) - 1, 1))}
                disabled={userImpactRating === null}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1"
                onClick={() => handleImpactRate(Math.min((userImpactRating ?? 0) + 1, 5))}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1"
                onClick={() => handleImpactRate(null)}
                disabled={userImpactRating === null}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">{impactScore}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    
    <CommentsModal 
      open={commentsOpen} 
      onOpenChange={setCommentsOpen}
      postId={post.id}
    />

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

    {/* Modal de partage */}
    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partager ce post</DialogTitle>
          <DialogDescription>
            Copiez le lien ou envoyez directement à un ami.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button variant="outline" className="w-full" onClick={handleCopyLink} disabled={isCopyingLink}>
            <Copy className="h-4 w-4 mr-2" />
            {isCopyingLink ? "Copie..." : "Copier le lien"}
          </Button>
          <div className="border-t pt-3 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" /> Envoyer à un ami
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-9"
                value={shareSearch}
                onChange={(e) => setShareSearch(e.target.value)}
              />
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1">
              {loadingShareConnections ? (
                <p className="text-sm text-muted-foreground py-2">Chargement...</p>
              ) : shareConnections.filter((c) => {
                const q = shareSearch.toLowerCase();
                return !q || c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q);
              }).length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Aucune connexion trouvée.</p>
              ) : (
                shareConnections
                  .filter((c) => {
                    const q = shareSearch.toLowerCase();
                    return !q || c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q);
                  })
                  .map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-accent">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback>{(contact.name || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{contact.name}</p>
                          {contact.username && <p className="text-xs text-muted-foreground">@{contact.username}</p>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
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
    </>
  );
}
