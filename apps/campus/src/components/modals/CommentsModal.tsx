import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getPostComments, createComment, updateComment, deleteComment, likeComment, normalizeUser, searchUsers } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, Reply, MoreHorizontal, Smile, AtSign, Loader2, Zap, Pencil, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/date";
import { findInvalidMentions, getActiveMentionQuery, renderMentionText } from "@/lib/mentions";
import { CommentSkeleton } from "@/components/ui/skeletons";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const MAX_COMMENT_THREAD_DEPTH = 4;

interface Comment {
  id: string;
  authorId?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  author: {
    name: string;
    avatar?: string | null;
    username: string;
    isVerified?: boolean;
    impactScore?: number;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
  isReply?: boolean;
  parentId?: string;
}

interface CommentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

function normalizeCommentAuthor(rawAuthor: any, fallbackName?: string) {
  const authorPayload = rawAuthor?.author_info ?? rawAuthor?.author ?? rawAuthor;
  const normalizedUser = normalizeUser(authorPayload);

  return {
    name: normalizedUser?.name || fallbackName || "Utilisateur",
    avatar: normalizedUser?.avatar ?? null,
    username: normalizedUser?.username || "user",
    isVerified: Boolean(
      authorPayload?.is_verified ??
      authorPayload?.isVerified ??
      rawAuthor?.is_verified ??
      rawAuthor?.isVerified ??
      false
    ),
    impactScore: Number(
      authorPayload?.impact_score ??
      authorPayload?.impactScore ??
      rawAuthor?.impact_score ??
      rawAuthor?.impactScore ??
      0
    ),
  };
}

export function CommentsModal({ open, onOpenChange, postId }: CommentsModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<Comment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; username: string; name: string; avatar?: string }[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const normalizedMentionQuery = useMemo(() => mentionQuery.trim().toLowerCase(), [mentionQuery]);
  const commentsQuery = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getPostComments(postId),
    enabled: open && Boolean(postId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const mentionUsersQuery = useQuery({
    queryKey: ["user-search", "comments-modal", postId, normalizedMentionQuery],
    queryFn: () => searchUsers(mentionQuery),
    enabled: open && showMentions && normalizedMentionQuery.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    setCurrentUserId(currentUser?.id ? String(currentUser.id) : null);
  }, [currentUser?.id]);

  const mapApiComment = (apiComment: any, parentId?: string): Comment => ({
    id: String(apiComment.id),
    authorId: apiComment.author_id ? String(apiComment.author_id) : apiComment.author?.id ? String(apiComment.author.id) : undefined,
    canEdit: typeof apiComment.can_edit === "boolean" ? apiComment.can_edit : undefined,
    canDelete: typeof apiComment.can_delete === "boolean" ? apiComment.can_delete : undefined,
    author: normalizeCommentAuthor(apiComment.author_info ?? apiComment.author, apiComment.author_name),
    content: apiComment.content || "",
    timestamp: apiComment.created_at || new Date().toISOString(),
    likes: Number(apiComment.likes_count || apiComment.likes || 0),
    isLiked: Boolean(apiComment.is_liked),
    isReply: Boolean(parentId),
    parentId,
    replies: (apiComment.replies || []).map((reply: any) => mapApiComment(reply, String(apiComment.id))),
  });

  const findCommentDepth = (items: Comment[], targetId: string, depth = 0): number | null => {
    for (const item of items) {
      if (item.id === targetId) return depth;
      if (item.replies?.length) {
        const found = findCommentDepth(item.replies, targetId, depth + 1);
        if (found !== null) return found;
      }
    }
    return null;
  };

  const addReplyToTree = (items: Comment[], parentId: string, reply: Comment): Comment[] =>
    items.map((item) => {
      if (item.id === parentId) {
        return { ...item, replies: [...(item.replies || []), reply] };
      }
      if (!item.replies?.length) return item;
      return { ...item, replies: addReplyToTree(item.replies, parentId, reply) };
    });

  const toggleLikeInTree = (items: Comment[], commentId: string): Comment[] =>
    items.map((item) => {
      if (item.id === commentId) {
        return {
          ...item,
          likes: item.isLiked ? item.likes - 1 : item.likes + 1,
          isLiked: !item.isLiked,
        };
      }
      if (!item.replies?.length) return item;
      return { ...item, replies: toggleLikeInTree(item.replies, commentId) };
    });

  const updateCommentInTree = (items: Comment[], commentId: string, nextContent: string): Comment[] =>
    items.map((item) => {
      if (item.id === commentId) {
        return { ...item, content: nextContent };
      }
      if (!item.replies?.length) return item;
      return { ...item, replies: updateCommentInTree(item.replies, commentId, nextContent) };
    });

  const removeCommentFromTree = (items: Comment[], commentId: string): Comment[] =>
    items
      .filter((item) => item.id !== commentId)
      .map((item) => ({
        ...item,
        replies: item.replies?.length ? removeCommentFromTree(item.replies, commentId) : item.replies,
      }));

  useEffect(() => {
    if (!open || !postId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(commentsQuery.isLoading);
    if (commentsQuery.data && Array.isArray(commentsQuery.data)) {
      const mapped = commentsQuery.data.map((comment: any) => mapApiComment(comment));
      setComments(mapped);
      return;
    }

    if (commentsQuery.error) {
      console.error("Error loading comments:", commentsQuery.error);
    }
  }, [commentsQuery.data, commentsQuery.error, commentsQuery.isLoading, open, postId]);

  useEffect(() => {
    if (!open || !showMentions || !normalizedMentionQuery) {
      setAvailableUsers([]);
      return;
    }

    if (mentionUsersQuery.data) {
      const mapped = (mentionUsersQuery.data || []).map((user: any) => ({
        id: String(user.id),
        username: user.username,
        name: user.name || "Utilisateur",
        avatar: user.avatar || undefined,
      }));
      setAvailableUsers(mapped);
      return;
    }

    if (mentionUsersQuery.error) {
      setAvailableUsers([]);
    }
  }, [mentionUsersQuery.data, mentionUsersQuery.error, normalizedMentionQuery, open, showMentions]);

  const commentSchema = z.object({
    content: z.string().trim().min(1, { message: t("modals.comments.validation.tooShort") }).max(500, { message: t("modals.comments.validation.tooLong") }),
  });

  const handleSubmit = async () => {
    const validation = commentSchema.safeParse({ content: newComment });

    if (!validation.success) {
      toast({
        variant: "destructive",
        title: t("modals.comments.invalidTitle", { defaultValue: "Commentaire invalide" }),
        description: validation.error.errors[0].message,
      });
      return;
    }

    const invalidMentions = findInvalidMentions(newComment);
    if (invalidMentions.length > 0) {
      toast({
        variant: "destructive",
        title: "Mentions invalides",
        description: `Format invalide: ${invalidMentions.map((item) => `@${item}`).join(", ")}`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createComment(postId, { content: newComment });
      const normalizedCurrentUser = normalizeCommentAuthor(currentUser);

      const newCommentObj: Comment = {
        id: String(result.id || Date.now()),
        authorId: currentUser?.id ? String(currentUser.id) : currentUserId || undefined,
        canEdit: true,
        canDelete: true,
        author: normalizedCurrentUser,
        content: newComment,
        timestamp: result.created_at || new Date().toISOString(),
        likes: 0,
        isLiked: false,
      };

      setComments((prev) => [newCommentObj, ...prev]);
      setNewComment("");

      toast({
        title: t("modals.comments.validation.posted"),
        description: "Votre commentaire a été publié avec succès",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de l'ajout du commentaire",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await likeComment(commentId);
      setComments((prev) => toggleLikeInTree(prev, commentId));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Impossible d'aimer ce commentaire",
        duration: 2000,
      });
    }
  };

  const startReply = (comment: Comment) => {
    if (replyingTo === comment.id) {
      setReplyingTo(null);
      setReplyingToComment(null);
      return;
    }

    setReplyingTo(comment.id);
    setReplyingToComment(comment);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyingToComment(null);
    setReplyContent("");
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const current = prev[commentId] || 0;
      if (current === 0) {
        return { ...prev, [commentId]: 10 };
      } else {
        const next = { ...prev };
        delete next[commentId];
        return next;
      }
    });
  };

  const loadMoreReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 10) + 10,
    }));
  };

  const hideReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
  };

  const handleReply = async (parentId: string) => {
    const content = replyContent.trim() || newComment.trim();
    if (!content) return;
    const parentDepth = findCommentDepth(comments, parentId);
    if (parentDepth !== null && parentDepth >= MAX_COMMENT_THREAD_DEPTH) {
      toast({
        variant: "destructive",
        title: "Profondeur maximale atteinte",
        description: "Cette discussion a atteint la profondeur maximale autorisée.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createComment(postId, { content, parent: parentId });
      const normalizedCurrentUser = normalizeCommentAuthor(currentUser);

      const newReply: Comment = {
        id: String(result.id || `${parentId}-${Date.now()}`),
        authorId: currentUser?.id ? String(currentUser.id) : currentUserId || undefined,
        canEdit: true,
        canDelete: true,
        author: normalizedCurrentUser,
        content,
        timestamp: result.created_at || new Date().toISOString(),
        likes: 0,
        isLiked: false,
        isReply: true,
        parentId,
      };

      setComments((prev) => addReplyToTree(prev, parentId, newReply));
      setReplyContent("");
      setNewComment("");
      setReplyingTo(null);
      setReplyingToComment(null);
      setExpandedReplies((prev) => ({
        ...prev,
        [parentId]: Math.max(prev[parentId] || 0, 10),
      }));
      toast({ title: "Réponse ajoutée", description: "Votre réponse a été publiée avec succès" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de l'ajout de la réponse",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canManageComment = (comment: Comment) =>
    Boolean(comment.canEdit || comment.canDelete || (comment.authorId && currentUserId && comment.authorId === currentUserId));

  const openEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId || isUpdatingComment) return;
    const nextContent = editingCommentContent.trim();
    if (!nextContent) {
      toast({ title: "Commentaire vide", description: "Le commentaire ne peut pas être vide.", variant: "destructive" });
      return;
    }

    // Pessimistic update.
    setIsUpdatingComment(true);
    try {
      await updateComment(editingCommentId, { content: nextContent });
      setComments((prev) => updateCommentInTree(prev, editingCommentId, nextContent));
      setEditingCommentId(null);
      setEditingCommentContent("");
      toast({ title: "Commentaire modifié", description: "Votre modification a bien été enregistrée." });
    } catch (error: any) {
      toast({ title: "Échec de modification", description: error?.message || "Impossible de modifier ce commentaire.", variant: "destructive" });
    } finally {
      setIsUpdatingComment(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || isDeletingComment) return;
    const targetId = commentToDelete.id;
    const previous = comments;

    setCommentToDelete(null);
    setIsDeletingComment(true);
    // Optimistic remove + rollback on failure.
    setComments((prev) => removeCommentFromTree(prev, targetId));

    try {
      await deleteComment(targetId);
      toast({ title: "Commentaire supprimé", description: "Le commentaire a été supprimé." });
    } catch (error: any) {
      setComments(previous);
      toast({ title: "Échec de suppression", description: error?.message || "Impossible de supprimer ce commentaire.", variant: "destructive" });
    } finally {
      setIsDeletingComment(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    if (replyingTo) {
      setReplyContent((prev) => prev + emoji);
    } else {
      setNewComment((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const insertMention = (username: string) => {
    const mention = `@${username} `;
    if (replyingTo) {
      setReplyContent((prev) => prev + mention);
    } else {
      setNewComment((prev) => prev + mention);
    }
    setShowMentions(false);
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const visualDepth = Math.min(depth, MAX_COMMENT_THREAD_DEPTH - 1);
    const depthOffset = visualDepth === 0 ? 0 : 16 + (visualDepth - 1) * 16;
    const canReply = depth < MAX_COMMENT_THREAD_DEPTH;

    const totalReplies = comment.replies?.length || 0;
    const shownRepliesCount = expandedReplies[comment.id] || 0;
    const isRepliesExpanded = shownRepliesCount > 0;

    return (
      <div key={comment.id} className="space-y-2.5" style={{ marginLeft: `${depthOffset}px` }}>
        <div className="flex gap-2.5 items-start group">
          <Avatar className={`${depth === 0 ? "h-8 w-8" : "h-7 w-7"} flex-shrink-0 mt-0.5`}>
            <AvatarImage src={comment.author.avatar || undefined} />
            <AvatarFallback className="text-[11px] font-semibold bg-muted">
              {comment.author.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Comment bubble */}
            <div className="bg-muted/40 rounded-2xl px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold text-foreground truncate">
                  {comment.author.name}
                </span>
                <span className="text-[11px] text-muted-foreground/70">
                  @{comment.author.username}
                </span>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                {renderMentionText(comment.content)}
              </p>
            </div>

            {/* Actions bar under comment */}
            <div className="flex items-center gap-3.5 mt-1.5 px-1 text-xs text-muted-foreground">
              <span className="text-[11px] text-muted-foreground/70">
                {formatRelativeTime(comment.timestamp)}
              </span>

              <button
                type="button"
                className={`flex items-center gap-1 hover:text-primary transition-colors ${comment.isLiked ? "text-red-500 font-medium" : ""}`}
                aria-label="Aimer"
                onClick={() => handleLikeComment(comment.id)}
              >
                <Heart className={`h-3 w-3 ${comment.isLiked ? "fill-current" : ""}`} />
                <span>{comment.likes}</span>
              </button>

              {canReply && (
                <button
                  type="button"
                  className="hover:text-foreground font-medium transition-colors"
                  onClick={() => startReply(comment)}
                >
                  Répondre
                </button>
              )}

              {canManageComment(comment) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground p-0.5 ml-auto"
                      aria-label="Plus d'options"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => openEditComment(comment)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setCommentToDelete(comment)}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Replies section (Instagram style: hidden by default, 10 max per batch) */}
            {totalReplies > 0 && (
              <div className="mt-2 pl-2">
                {!isRepliesExpanded ? (
                  <button
                    type="button"
                    onClick={() => toggleReplies(comment.id)}
                    className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <span className="w-6 h-[1.5px] bg-border group-hover:bg-foreground/40 transition-colors" />
                    <span>
                      Voir les {totalReplies} {totalReplies > 1 ? "réponses" : "réponse"}
                    </span>
                  </button>
                ) : (
                  <div className="space-y-2.5 pt-1 border-l-1.5 border-border/40 pl-3">
                    {/* Render up to shownRepliesCount replies */}
                    {comment.replies!.slice(0, shownRepliesCount).map((reply) => renderComment(reply, depth + 1))}

                    {/* Pagination or hide */}
                    <div className="flex items-center gap-3 pt-1">
                      {shownRepliesCount < totalReplies ? (
                        <button
                          type="button"
                          onClick={() => loadMoreReplies(comment.id)}
                          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
                        >
                          <span className="w-5 h-[1.5px] bg-border group-hover:bg-foreground/40 transition-colors" />
                          <span>
                            Voir plus de réponses ({totalReplies - shownRepliesCount} restantes)
                          </span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => hideReplies(comment.id)}
                        className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
                      >
                        Masquer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-border/40 gap-0 overflow-hidden flex flex-col sm:max-w-xl sm:h-[650px] sm:max-h-[82vh] sm:rounded-2xl bg-background">
        {/* Modal Header */}
        <DialogHeader className="px-5 py-3.5 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                {t('modals.comments.title') || "Commentaires"}
              </DialogTitle>
              {comments.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({comments.length})
                </span>
              )}
            </div>
          </div>
        </DialogHeader>
        
        {/* Scrollable comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 space-y-4">
          {isLoading ? (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 space-y-1">
              <p className="text-sm font-medium text-foreground">Aucun commentaire</p>
              <p className="text-xs text-muted-foreground">Soyez le premier à commenter !</p>
            </div>
          ) : (
            comments.map((comment) => renderComment(comment))
          )}
        </div>

        {/* Compact bottom input bar with safe area */}
        <div className="border-t border-border/40 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:p-4 bg-background shrink-0">
          {/* Mention autocomplete dropdown */}
          {showMentions && availableUsers.length > 0 && (
            <div className="mb-2 p-1.5 rounded-xl border border-border/50 bg-popover shadow-md max-h-36 overflow-y-auto space-y-1">
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-left transition-colors"
                  onClick={() => insertMention(user.username)}
                >
                  <span className="font-semibold text-foreground">@{user.username}</span>
                  {user.name && <span className="text-muted-foreground truncate">({user.name})</span>}
                </button>
              ))}
            </div>
          )}

          {/* Replying-to chip */}
          {replyingToComment && (
            <div className="flex items-center justify-between px-3 py-1.5 mb-2.5 bg-muted/40 rounded-xl text-xs text-muted-foreground border border-border/30">
              <div className="flex items-center gap-1.5 truncate">
                <Reply className="h-3 w-3 shrink-0 text-primary" />
                <span className="truncate">
                  Répondre à <strong className="text-foreground font-semibold">@{replyingToComment.author.username}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={cancelReply}
                className="p-1 hover:text-foreground text-muted-foreground/70 rounded-full hover:bg-muted transition-colors shrink-0"
                title="Annuler"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Minimalist single-line rounded bar */}
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={currentUser?.avatar || "/placeholder-avatar.jpg"} />
              <AvatarFallback className="text-xs bg-muted font-semibold">
                {currentUser?.name?.slice(0, 1).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 flex items-center bg-muted/30 border border-border/50 rounded-full px-3.5 py-1.5 focus-within:border-border focus-within:bg-background transition-all">
              <input
                ref={inputRef}
                type="text"
                placeholder={replyingToComment ? `Répondre à @${replyingToComment.author.username}...` : "Ajouter un commentaire..."}
                value={replyingToComment ? replyContent : newComment}
                onChange={(e) => {
                  const val = e.target.value;
                  if (replyingToComment) {
                    setReplyContent(val);
                  } else {
                    setNewComment(val);
                  }
                  const activeQuery = getActiveMentionQuery(val, e.target.selectionStart ?? val.length);
                  if (activeQuery !== null) {
                    setMentionQuery(activeQuery);
                    setShowMentions(true);
                  } else {
                    setShowMentions(false);
                    setMentionQuery("");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (replyingToComment) {
                      handleReply(replyingToComment.id);
                    } else {
                      handleSubmit();
                    }
                  }
                }}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none min-w-0"
                maxLength={500}
              />

              <button
                type="button"
                onClick={() => setShowMentions(!showMentions)}
                className={`p-1 transition-colors shrink-0 ${showMentions ? "text-primary" : "text-muted-foreground/70 hover:text-foreground"}`}
                title="Mentionner"
              >
                <AtSign className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (replyingToComment) {
                    handleReply(replyingToComment.id);
                  } else {
                    handleSubmit();
                  }
                }}
                disabled={(!replyingToComment ? !newComment.trim() : !replyContent.trim()) || isSubmitting}
                className={cn(
                  "p-1.5 rounded-full shrink-0 transition-all",
                  (!replyingToComment ? newComment.trim() : replyContent.trim())
                    ? "text-primary hover:bg-primary/10 active:scale-95"
                    : "text-muted-foreground/30 cursor-not-allowed"
                )}
                title="Publier"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

            {/* Edit Comment Dialog */}
      <Dialog 
        open={Boolean(editingCommentId)} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingCommentId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le commentaire</DialogTitle>
            <DialogDescription>Les changements seront visibles immédiatement après validation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea 
              value={editingCommentContent} 
              onChange={(e) => setEditingCommentContent(e.target.value)} 
              className="min-h-[120px]" 
              maxLength={500} 
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingCommentId(null)} 
                disabled={isUpdatingComment}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleUpdateComment} 
                disabled={isUpdatingComment}
              >
                {isUpdatingComment ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</>
                ) : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Dialog */}
      <Dialog 
        open={Boolean(commentToDelete)} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setCommentToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce commentaire ?</DialogTitle>
            <DialogDescription>Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCommentToDelete(null)} 
              disabled={isDeletingComment}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteComment} 
              disabled={isDeletingComment}
            >
              {isDeletingComment ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Suppression...</>
              ) : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
