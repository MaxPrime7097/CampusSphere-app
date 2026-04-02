export type PostCardFile = {
  id: string | number | null;
  name: string;
  url: string;
  type: string;
  size: number;
};

function mapPostFile(file: any): PostCardFile {
  if (typeof file === "string") {
    return {
      id: null,
      name: file.split("/").pop() || "",
      url: file,
      type: "",
      size: 0,
    };
  }

  return {
    id: file?.id ?? null,
    name: file?.name ?? file?.original_name ?? "",
    url: file?.url ?? file?.file_url ?? file?.file ?? "",
    type: file?.type ?? file?.file_type ?? "",
    size: Number(file?.size ?? file?.file_size ?? 0),
  };
}

export function mapPostToCard(post: any) {
  return {
    id: String(post?.id),
    author: {
      name: post?.author?.name || "Utilisateur",
      avatar: post?.author?.avatar || "/placeholder-avatar.jpg",
      username: post?.author?.username || "user",
      isVerified: Boolean(post?.author?.isVerified),
      impactScore: Number(post?.author?.impactScore || 0),
    },
    content: post?.content || "",
    createdAt: post?.createdAt || post?.created_at || null,
    likes: Number(post?.likesCount ?? post?.likes_count ?? post?.likes ?? 0),
    comments: Number(post?.commentsCount ?? post?.comments_count ?? post?.comments ?? 0),
    category: post?.category || "Général",
    impactScore: Number(post?.impactScore ?? post?.impact_score ?? 0),
    userImpactRating: post?.userImpactRating ?? post?.user_impact_rating ?? null,
    isLiked: Boolean(post?.isLiked ?? post?.is_liked),
    isSaved: Boolean(post?.isSaved ?? post?.is_saved),
    canEdit: Boolean(post?.canEdit ?? post?.can_edit),
    canDelete: Boolean(post?.canDelete ?? post?.can_delete),
    files: Array.isArray(post?.files) ? post.files.map(mapPostFile) : [],
  };
}
