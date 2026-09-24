import type { UserProfile } from "./user.types";

export interface ResourceFolder {
  id: number | string;
  name: string;
  description?: string;
  category?: string;
  subject?: string;
  item_count?: number;
  total_size_formatted?: string;
  visibility?: "public" | "university" | "friends" | string;
  resource_count?: number;
  can_edit?: boolean;
  created_at?: string;
  updated_at?: string;
  resources?: any[];
  [key: string]: any;
}

export interface Resource {
  id: string | number;
  title: string;
  description: string;
  subject: string;
  type: string;
  category: string;
  tags: string[];
  visibility: string;
  fileUrl: string;
  fileSize: string | number;
  isSaved: boolean;
  canEdit: boolean;
  canDelete: boolean;
  downloadCount: number;
  viewCount: number;
  impactScore: number;
  author: UserProfile | null;
  authorId: string | number | null;
  authorName: string;
  createdAt: string | null;
  updatedAt: string | null;
  [key: string]: any;
}

export interface SavedResourceItem {
  id: string | number;
  resource: Resource;
  savedAt: string;
}

export interface ResourceCardData {
  id: string;
  title: string;
  description?: string;
  type: string;
  subject?: string;
  authorId?: string | number | null;
  authorName: string;
  author?: { name?: string; avatar?: string };
  visibility?: string;
  fileUrl?: string;
  fileSize?: string | number;
  file_size?: string | number;
  tags?: string[];
  impactScore?: number;
  createdAt?: string | null;
  downloadCount?: number;
  viewCount?: number;
  isSaved?: boolean;
}
