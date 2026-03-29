import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getCurrentUser, getPostComments, createComment, likeComment } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, Reply, Flag, MoreHorizontal, Smile, AtSign, Loader2, CheckCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatRelativeTime } from "@/lib/date";

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

export function CommentsModal({ open, onOpenChange, postId }: CommentsModalProps) {
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  // Load comments from API
  useEffect(() => {
    if (!open || !postId) return;
    
    let isMounted = true;
    (async () => {
      try {
        const data = await getPostComments(postId);
        if (isMounted && Array.isArray(data)) {
          const mapped = data.map((comment: any) => ({
            id: String(comment.id),
            author: {
              name: comment.author_info?.name || comment.author?.name || comment.author_name || "Utilisateur",
              avatar: comment.author_info?.avatar || comment.author?.avatar || "/placeholder-avatar.jpg",
              username: comment.author_info?.username || comment.author?.username || "user",
              isVerified: Boolean(comment.author_info?.isVerified || comment.author?.isVerified),
              impactScore: Number(comment.author_info?.impactScore || comment.author?.impactScore || 0),
            },
            content: comment.content || "",
            timestamp: comment.created_at || new Date().toISOString(),
            likes: Number(comment.likes_count || comment.likes || 0),
            isLiked: Boolean(comment.is_liked),
            replies: comment.replies?.map((reply: any) => ({
              id: String(reply.id),
              author: {
                name: reply.author_info?.name || reply.author?.name || reply.author_name || "Utilisateur",
                avatar: reply.author_info?.avatar || reply.author?.avatar || "/placeholder-avatar.jpg",
                username: reply.author_info?.username || reply.author?.username || "user",
                isVerified: Boolean(reply.author_info?.isVerified || reply.author?.isVerified),
                impactScore: Number(reply.author_info?.impactScore || reply.author?.impactScore || 0),
              },
              content: reply.content || "",
              timestamp: reply.created_at || new Date().toISOString(),
              likes: Number(reply.likes_count || reply.likes || 0),
              isLiked: Boolean(reply.is_liked),
              isReply: true,
              parentId: String(comment.id),
            })) || [],
          }));
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

    setIsSubmitting(true);
    
    try {
      // Create comment via API
      const result = await createComment(postId, { content: newComment });
      const currentUser = await getCurrentUser().catch(() => null);
      
      const newCommentObj: Comment = {
        id: String(result.id || Date.now()),
        author: {
          name: currentUser?.data?.name || currentUser?.name || "Utilisateur",
          avatar: currentUser?.data?.avatar || currentUser?.avatar || "/placeholder-avatar.jpg",
          username: currentUser?.data?.username || currentUser?.username || "user",
          isVerified: Boolean(currentUser?.data?.isVerified || currentUser?.isVerified),
          impactScore: Number(currentUser?.data?.impactScore || currentUser?.impactScore || 0)
        },
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

  const handleLikeComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    try {
      await likeComment(commentId);
      
      setComments(prev => prev.map(comment => {
        if (isReply && parentId) {
          // Gérer les likes des réponses
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies?.map(reply => 
                reply.id === commentId 
                  ? { 
                      ...reply, 
                      likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                      isLiked: !reply.isLiked
                    }
                  : reply
              )
            };
          }
          return comment;
        } else {
          // Gérer les likes des commentaires principaux
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              isLiked: !comment.isLiked
            };
          }
          return comment;
        }
      }));

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

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Create reply comment via API with parent linkage
      const result = await createComment(postId, { content: replyContent, parent: parentId });
      const currentUser = await getCurrentUser().catch(() => null);
      
      const newReply: Comment = {
        id: String(result.id || `${parentId}-${Date.now()}`),
        author: {
          name: currentUser?.data?.name || currentUser?.name || "Utilisateur",
          avatar: currentUser?.data?.avatar || currentUser?.avatar || "/placeholder-avatar.jpg",
          username: currentUser?.data?.username || currentUser?.username || "user",
          isVerified: Boolean(currentUser?.data?.isVerified || currentUser?.isVerified),
          impactScore: Number(currentUser?.data?.impactScore || currentUser?.impactScore || 0)
        },
        content: replyContent,
        timestamp: result.created_at || new Date().toISOString(),
        likes: 0,
        isLiked: false,
        isReply: true,
        parentId
      };

      setComments(prev => prev.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...(comment.replies || []), newReply] }
          : comment
      ));
      
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


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 bg-popover">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{t('modals.comments.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* Commentaire principal */}
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={comment.author.avatar} />
                  <AvatarFallback>{comment.author.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{comment.author.name}</span>
                      {comment.author.isVerified && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          ✓
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
                      {comment.author.impactScore && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {comment.author.impactScore}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{comment.content}</p>
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
                    <button 
                      className="hover:text-primary flex items-center gap-1"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    >
                      <Reply className="h-3 w-3" />
                      Répondre
                    </button>
                    <button className="hover:text-primary" aria-label="More options" title="Plus d'options">
                      <MoreHorizontal className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Zone de réponse */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 ml-4">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Répondre au commentaire..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
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
                </div>
              </div>

              {/* Réponses */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={reply.author.avatar} />
                        <AvatarFallback>{reply.author.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{reply.author.name}</span>
                            {reply.author.isVerified && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                ✓
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">@{reply.author.username}</span>
                          </div>
                          <p className="text-sm">{reply.content}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{formatRelativeTime(reply.timestamp)}</span>
                          <button 
                            className={`flex items-center gap-1 hover:text-primary ${reply.isLiked ? 'text-red-500' : ''}`}
                            onClick={() => handleLikeComment(reply.id, true, comment.id)}
                          >
                            <Heart className={`h-3 w-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                            {reply.likes}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
                  {['alex_dubois', 'sophie_m', 'lucas_dev', 'emma_b'].map((username) => (
                    <Button
                      key={username}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => insertMention(username)}
                    >
                      @{username}
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
                  onChange={(e) => setNewComment(e.target.value)}
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
