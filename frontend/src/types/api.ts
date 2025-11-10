// Types pour l'API
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  is_verified: boolean;
  impact_score: number;
  created_at: string;
  updated_at: string;
}

export interface Sphere {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  creator: User;
  member_count: number;
  impact_score: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  content: string;
  author: User;
  sphere?: Sphere;
  category: string;
  created_at: string;
  updated_at: string;
  stats: {
    likes_count: number;
    comments_count: number;
    shares_count: number;
  };
  attachments: Array<{
    id: string;
    url: string;
    type: string;
    name: string;
  }>;
  tags: string[];
}

// Types pour les composants
export interface PostCardProps {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified: boolean;
    impactScore: number;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  category: string;
  sphere?: {
    id: string;
    name: string;
    color: string;
  };
  attachments: Array<{
    id: string;
    url: string;
    type: string;
    name: string;
  }>;
  tags: string[];
}

export type ApiError = {
  message: string;
  code?: string;
  details?: unknown;
};