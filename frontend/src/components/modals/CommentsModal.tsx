import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getCurrentUser, getPostComments, createComment, likeComment, normalizeUser, searchUsers } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, Reply, MoreHorizontal, Smile, AtSign, Loader2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/date";
import { findInvalidMentions, getActiveMentionQuery, renderMentionText } from "@/lib/mentions";

const MAX_COMMENT_THREAD_DEPTH = 4;

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
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
  const normalizedUser = normalizeUser(rawAuthor);

  return {
    name: normalizedUser?.name || fallbackName || "Utilisateur",
    avatar: normalizedUser?.avatar || "/placeholder-avatar.jpg",
    username: normalizedUser?.username || "user",
    isVerified: Boolean(rawAuthor?.is_verified ?? rawAuthor?.isVerified ?? false),
    impactScore: Number(rawAuthor?.impact_score ?? rawAuthor?.impactScore ?? 0),
  };
}

export function CommentsModal({ open, onOpenChange, postId }: CommentsModalProps) {
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; username: string; name: string; avatar?: string }[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");

  const mapApiComment = (apiComment: any, parentId?: string): Comment => ({
    id: String(apiComment.id),
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

  // Load comments from API
  useEffect(() => {
    if (!open || !postId) return;
    
    let isMounted = true;
    (async () => {
      try {
        const data = await getPostComments(postId);
        if (isMounted && Array.isArray(data)) {
          const mapped = data.map((comment: any) => mapApiComment(comment));
          setComments(mapped);
        }
      } catch (error) {
        // Error loading comments - show empty state
        console.error("Error loading comments:", error);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [open, postId]);
  const { toast } = useToast();

  useEffect(() => {
    if (!showMentions) return;
    const handle = window.setTimeout(async () => {
      try {
        const users = await searchUsers(mentionQuery);
        const mapped = (users || []).map((user: any) => ({
          id: String(user.id),
          username: user.username,
          name: user.name || "Utilisateur",
          avatar: user.avatar || undefined,
        }));
        setAvailableUsers(mapped);
      } catch {
        setAvailableUsers([]);
      }
    }, 180);

    return () => window.clearTimeout(handle);
  }, [mentionQuery, showMentions]);
  
  const commentSchema = z.object({
    content: z.string()
      .trim()
      .min(1, { message: t('modals.comments.validation.tooShort') })
      .max(500, { message: t('modals.comments.validation.tooLong') })
  });
  

  const handleSubmit = async () => {
    const validation = commentSchema.safeParse({ content: newComment });
    
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: t('modals.comments.invalidTitle', { defaultValue: "Commentaire invalide" }),
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
      // Create comment via API
      const result = await createComment(postId, { content: newComment });
      const currentUser = await getCurrentUser().catch(() => null);
      const normalizedCurrentUser = normalizeCommentAuthor(currentUser?.data ?? currentUser);
      
      const newCommentObj: Comment = {
        id: String(result.id || Date.now()),
        author: normalizedCurrentUser,
        content: newComment,
        timestamp: result.created_at || new Date().toISOString(),
        likes: 0,
        isLiked: false
      };

      setComments(prev => [newCommentObj, ...prev]);
      setNewComment("");
      
      toast({
        title: t('modals.comments.validation.posted'),
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

      setComments(prev => toggleLikeInTree(prev, commentId));

      toast({
        title: "Like ajouté",
        description: "Votre réaction a été enregistrée",
        duration: 1500,
      });
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
      return;
    }

    const mentionPrefix = `@${comment.author.username} `;
    setReplyingTo(comment.id);
    setReplyContent((prev) => (prev.includes(mentionPrefix) ? prev : `${mentionPrefix}${prev}`));
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
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
      // Create reply comment via API with parent linkage
      const result = await createComment(postId, { content: replyContent, parent: parentId });
      const currentUser = await getCurrentUser().catch(() => null);
      const normalizedCurrentUser = normalizeCommentAuthor(currentUser?.data ?? currentUser);
      
      const newReply: Comment = {
        id: String(result.id || `${parentId}-${Date.now()}`),
        author: normalizedCurrentUser,
        content: replyContent,
        timestamp: result.created_at || new Date().toISOString(),
        likes: 0,
        isLiked: false,
        isReply: true,
        parentId
      };

      setComments(prev => addReplyToTree(prev, parentId, newReply));
      
      setReplyContent("");
      setReplyingTo(null);
      
      toast({
        title: "Réponse ajoutée",
        description: "Votre réponse a été publiée avec succès",
      });
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

  const insertEmoji = (emoji: string) => {
    if (replyingTo) {
      setReplyContent(prev => prev + emoji);
    } else {
      setNewComment(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const insertMention = (username: string) => {
    const mention = `@${username} `;
    if (replyingTo) {
      setReplyContent(prev => prev + mention);
    } else {
      setNewComment(prev => prev + mention);
    }
    setShowMentions(false);
  };


  const renderComment = (comment: Comment, depth = 0) => {
    const visualDepth = Math.min(depth, MAX_COMMENT_THREAD_DEPTH - 1);
    const depthOffset = visualDepth === 0 ? 0 : 16 + (visualDepth - 1) * 20;
    const canReply = depth < MAX_COMMENT_THREAD_DEPTH;

    return (
      <div key={comment.id} className="space-y-3" style={{ marginLeft: `${depthOffset}px` }}>
        <div className="flex gap-3">
          <Avatar className={`${depth === 0 ? "h-10 w-10" : "h-8 w-8"} flex-shrink-0`}>
            <AvatarImage src={comment.author.avatar} />
            <AvatarFallback>{comment.author.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className={`${depth === 0 ? "bg-muted" : "bg-muted/50"} rounded-lg p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{comment.author.name}</span>
                {comment.author.isVerified && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    ✓
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
                {depth === 0 && comment.author.impactScore && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {comment.author.impactScore}
                  </Badge>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{renderMentionText(comment.content)}</p>
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{formatRelativeTime(comment.timestamp)}</span>
              <button
                className={`flex items-center gap-1 hover:text-primary ${comment.isLiked ? 'text-red-500' : ''}`}
                aria-label="Like comment"
                onClick={() => handleLikeComment(comment.id)}
              >
                <Heart className={`h-3 w-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                {comment.likes}
              </button>
              {canReply && (
                <button
                  className="hover:text-primary flex items-center gap-1"
                  onClick={() => startReply(comment)}
                >
                  <Reply className="h-3 w-3" />
                  Répondre
                </button>
              )}
              <button className="hover:text-primary" aria-label="More options" title="Plus d'options">
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </div>

            {replyingTo === comment.id && (
              <div className="mt-3 ml-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Répondre au commentaire..."
                    value={replyContent}
                    onChange={(e) => {
                      const value = e.target.value;
                      setReplyContent(value);
                      const activeQuery = getActiveMentionQuery(value, e.target.selectionStart ?? value.length);
                      if (activeQuery !== null) {
                        setMentionQuery(activeQuery);
                        setShowMentions(true);
                      } else {
                        setShowMentions(false);
                        setMentionQuery("");
                      }
                    }}
                    className="min-h-[60px] resize-none"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleReply(comment.id)}
                    disabled={!replyContent.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="space-y-3">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 bg-popover">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{t('modals.comments.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>

        <div className="border-t p-4">
          <div className="space-y-3">          

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <Card className="p-3">
                <div className="grid grid-cols-8 gap-2">
                  {['😀', '😂', '🥰', '😎', '🤔', '👍', '🎉', '🔥', '💯', '✨', '🚀', '❤️', '👏', '🙌', '💪', '🎯'].map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      className="text-2xl p-2 h-auto"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            {/* Mentions */}
            {showMentions && (
              <Card className="p-3">
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => insertMention(user.username)}
                    >
                      @{user.username}
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            {/* Zone de saisie */}
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder={t('modals.comments.placeholder')}
                  value={newComment}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewComment(value);
                    const activeQuery = getActiveMentionQuery(value, e.target.selectionStart ?? value.length);
                    if (activeQuery !== null) {
                      setMentionQuery(activeQuery);
                      setShowMentions(true);
                    } else {
                      setShowMentions(false);
                      setMentionQuery("");
                    }
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                  className="min-h-[80px] resize-none"
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="gap-2"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMentions(!showMentions)}
                      className="gap-2"
                    >
                      <AtSign className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {newComment.length}/500 caractères
                  </span>
                  <Button
                    onClick={handleSubmit}
                    disabled={!newComment.trim() || isSubmitting}
                    className="campus-gradient text-white hover:opacity-90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Publier
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
