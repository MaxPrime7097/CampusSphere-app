import type { UserProfile } from "./user.types";
import type { Sphere } from "./sphere.types";

export interface PostFile {
  id: string | number | null;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface PostComment {
  id: string | number;
  postId?: string | number;
  author: UserProfile | null;
  content: string;
  parent?: string | number | null;
  likesCount: number;
  likes?: number;
  isLiked?: boolean;
  createdAt: string | null;
  updatedAt?: string | null;
  replies?: PostComment[];
  canEdit?: boolean;
  canDelete?: boolean;
  [key: string]: unknown;
}

export interface Post {
  id: string | number;
  content: string;
  image?: string | null;
  category?: string;
  visibility: string;
  subject?: string;
  type?: string;
  audience?: string;
  location?: string;
  tags: string[];
  files: PostFile[];
  allowComments: boolean;
  isPinned: boolean;
  likesCount: number;
  commentsCount: number;
  impactScore: number;
  userImpactRating: number | null;
  isLiked: boolean;
  isSaved: boolean;
  canEdit: boolean;
  canDelete: boolean;
  recentComments?: PostComment[];
  author: UserProfile | null;
  authorId: string | number | null;
  sphere: Sphere | null;
  sphereId: string | number | null;
  createdAt: string | null;
  updatedAt: string | null;
  [key: string]: unknown;
}

export interface PostCardData {
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
  files?: PostFile[];
}
