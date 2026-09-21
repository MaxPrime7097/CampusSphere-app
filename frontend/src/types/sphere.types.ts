import type { UserProfile } from "./user.types";

export type SphereRole = "admin" | "moderator" | "member";

export interface SphereMember {
  id: string | number;
  user_id?: string | number;
  role: SphereRole;
  status?: string;
  user?: UserProfile;
  joinedAt?: string;
  joined_at?: string;
}

export interface SphereFile {
  id: string | number;
  sphere_id?: string | number;
  title: string;
  name?: string;
  url?: string;
  file_url?: string;
  file_size?: number;
  size?: number;
  created_at?: string;
  uploader?: UserProfile;
}

export interface Sphere {
  id: string | number;
  name: string;
  description: string;
  category: string;
  type: string;
  color: string;
  icon: string;
  objective: string;
  targetAudience: string;
  duration: string;
  expiresAt: string | null;
  autoDeleteOnExpiry: boolean;
  collaborationTypes: string[];
  isPrivate: boolean;
  requireApproval: boolean;
  memberCount: number;
  progression: number;
  createdBy: string | number | null;
  createdByInfo: UserProfile | null;
  isMember: boolean;
  membershipStatus: string | null;
  userRole: SphereRole | null;
  banner?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  [key: string]: unknown;
}
