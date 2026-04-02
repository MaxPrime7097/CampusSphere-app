import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share, Bookmark, MoreVertical, Zap, Copy, Flag, ExternalLink, Users, Plus, Minus, X, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { CommentsModal } from "@/components/modals/CommentsModal";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { impactRatePost, likePost, savePost, reportPost, updatePost, deletePost } from "@/services/api";
import { formatRelativeTime } from "@/lib/date";
import { renderMentionText } from "@/lib/mentions";
import { Textarea } from "@/components/ui/textarea";

interface PostCardProps {
  post: {
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
  const [content, setContent] = useState(post.content);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingContent, setEditingContent] = useState(post.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleShare = () => {
    setShowShareDialog(true);
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
          
          {post.image && (
            <div className="rounded-lg overflow-hidden md:overflow-hidden w-full relative">
              <img 
                src={post.image} 
                alt="Post content" 
                className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                onDoubleClick={handleImageDoubleClick}
              />
              {/* Animation de like sur double-clic */}
              {isLiked && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart className="h-16 w-16 text-red-500 fill-current animate-ping" />
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
                className={`gap-2 ${isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'}`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">{likesCount}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 hover:text-primary"
                onClick={() => setCommentsOpen(true)}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{post.comments}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="gap-2 hover:text-primary" onClick={handleShare}>
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

    {/* Modal de partage */}
    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partager ce post</DialogTitle>
          <DialogDescription>
            Choisissez comment vous souhaitez partager ce post avec d'autres personnes.
            Les options de partage direct sont actuellement en mode mock (UI uniquement).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <MessageCircle className="h-6 w-6" />
              <span>Message privé</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <ExternalLink className="h-6 w-6" />
              <span>Réseaux sociaux</span>
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCopyLink} disabled={isCopyingLink}>
              <Copy className="h-4 w-4 mr-2" />
              {isCopyingLink ? "Copie..." : "Copier le lien"}
            </Button>
            <Button variant="outline" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Partager avec des amis
            </Button>
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
