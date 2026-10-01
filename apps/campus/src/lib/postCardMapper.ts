import { getCategoryLabel } from "@/lib/resourceMetadata";
import type { Post, PostCardData } from "@/types";

export function mapPostToCard(post: Post | any): PostCardData {
  return {
    id: String(post.id),
    author: {
      name: post.author?.name || "Utilisateur",
      avatar: post.author?.avatar || "/placeholder-avatar.jpg",
      username: post.author?.username || "user",
      isVerified: Boolean(post.author?.isVerified),
      impactScore: Number(post.author?.impactScore || 0),
    },
    content: post.content || "",
    image: post.image,
    createdAt: post.createdAt || post.created_at || null,
    likes: post.likes ?? post.likesCount ?? 0,
    comments: post.comments ?? post.commentsCount ?? 0,
    category: getCategoryLabel(post.category),
    impactScore: Number(post.impactScore ?? post.impact_score ?? 0),
    userImpactRating: post.userImpactRating ?? post.user_impact_rating ?? null,
    isLiked: Boolean(post.isLiked ?? post.is_liked),
    isSaved: Boolean(post.isSaved ?? post.is_saved),
    canEdit: Boolean(post.canEdit ?? post.can_edit),
    canDelete: Boolean(post.canDelete ?? post.can_delete),
    allowComments: post.allowComments !== false && (post as any).allow_comments !== false,
    files: post.files ?? [],
  };
}
