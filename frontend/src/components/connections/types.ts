export type ConnectionFilter = "all" | "university" | "faculty" | "mutual" | "impact";

export interface ConnectionUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  university?: string;
  faculty?: string;
  field?: string;
  normalizedUniversity?: string | null;
  normalizedFaculty?: string | null;
  isVerified?: boolean;
  impactScore?: number;
  mutualFriends?: number;
  status?: string;
  isIncomingRequest?: boolean;
  reason?: string;
}
