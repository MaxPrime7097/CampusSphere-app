export type UserRole = "student" | "teacher" | "impact_partner" | "admin";

export type PartnerOrganizationType = "entreprise" | "club" | "association" | "institution";

export interface PartnerProfile {
  id?: number;
  organizationName: string;
  organizationType: PartnerOrganizationType | string;
  sector?: string;
  website?: string;
  isVerified: boolean;
  verifiedAt?: string | null;
}

export interface PartnerApplication {
  id: number;
  organizationName: string;
  organizationType: PartnerOrganizationType | string;
  contactEmail: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: { id: number; username: string; firstName: string; lastName: string } | null;
}

export interface UserStats {
  posts: number;
  connections: number;
  contributions: number;
  followers?: number;
}

export type ProfileVisibility = "public" | "connections" | "private";

export interface UserEducation {
  id?: string | number;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: string | number;
  endYear?: string | number;
  current?: boolean;
}

export interface UserExperience {
  id?: string | number;
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface UserPortfolioLink {
  id?: string | number;
  label?: string;
  title?: string;
  url: string;
}

export interface UserProfile {
  id: string | number;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  coverPhoto: string | null;
  bio: string;
  university: string;
  faculty: string;
  studyYear: string;
  studentId: string;
  campus: string;
  town: string;
  language: string[];
  languages: string[];
  profileVisibility: ProfileVisibility;
  postVisibility: ProfileVisibility;
  dataExportRequestedAt?: string | null;
  impactScore: number;
  currentMood: string;
  current_mood?: string;
  skills: string[];
  interests: string[];
  previousEducation: UserEducation[];
  experiences: UserExperience[];
  portfolioLinks: UserPortfolioLink[];
  joinedSpheresCount: number;
  connectionsCount: number;
  followersCount?: number;
  isFollowing?: boolean;
  role?: UserRole;
  partnerProfile?: PartnerProfile | null;
  partner_profile?: PartnerProfile | null;
  dateJoined: string | null;
  updatedAt: string | null;
  phoneNumber?: string;
  dateOfBirth?: string;
  isVerified: boolean;
  is_profile_complete?: boolean;
  stats: UserStats;
  [key: string]: any;
}

export type User = UserProfile;

export interface BlockedUser {
  id: number;
  blocked_user: UserProfile;
  created_at: string;
}

export interface UserSearchResult {
  id: string | number;
  name: string;
  username: string;
  avatar: string | null;
  university?: string;
  faculty?: string;
  isVerified?: boolean;
  role?: UserRole;
  partnerProfile?: PartnerProfile | null;
}
