/**
 * User serialisation — API_CONTRACT §2 `<User>`.
 *
 * Two behaviours worth reading before changing anything here:
 *
 * 1. `is_profile_complete` is DERIVED, never stored. Django kept it as a column and
 *    recomputed it from an empty required-field list, so `all([]) == True` rewrote
 *    it to true on every login and permanently defeated onboarding.
 *
 * 2. Sensitive fields follow a strict self-only policy — not relaxed for accepted
 *    connections. Redaction nulls the field rather than omitting it, so the client's
 *    `normalizeUser` still sees a stable key set.
 */

import type { Prisma } from "@prisma/client";

/** Everything the serialiser needs; keeps `select` honest at call sites. */
export const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
  phoneNumber: true,
  dateOfBirth: true,
  avatar: true,
  coverPhoto: true,
  bio: true,
  university: true,
  faculty: true,
  studyYear: true,
  studentId: true,
  campus: true,
  town: true,
  language: true,
  profileVisibility: true,
  postVisibility: true,
  dataExportRequestedAt: true,
  impactScore: true,
  currentMood: true,
  skills: true,
  interests: true,
  previousEducation: true,
  experiences: true,
  portfolioLinks: true,
  dateJoined: true,
  updatedAt: true,
  isStaff: true,
  isSuperuser: true,
  isVerified: true,
} satisfies Prisma.UserSelect;

export type SerializableUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export interface UserCounts {
  joinedSpheres?: number;
  connections?: number;
  contributions?: number;
}

/** The single source of truth for profile completeness. */
export function isProfileComplete(user: Pick<SerializableUser, "university" | "faculty" | "studyYear">): boolean {
  return Boolean(user.university?.trim() && user.faculty?.trim() && user.studyYear?.trim());
}

const SENSITIVE_FIELDS = [
  "email",
  "phone_number",
  "phoneNumber",
  "date_of_birth",
  "dateOfBirth",
  "student_id",
  "studentId",
  "town",
  "language",
  "data_export_requested_at",
] as const;

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function serializeUser(
  user: SerializableUser,
  options: { viewerId?: number | null; counts?: UserCounts } = {},
): Record<string, unknown> {
  const { viewerId = null, counts = {} } = options;

  const payload: Record<string, unknown> = {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    username: user.username,
    email: user.email,
    full_name: `${user.firstName} ${user.lastName}`.trim(),
    phone_number: user.phoneNumber,
    date_of_birth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
    avatar: user.avatar,
    cover_photo: user.coverPhoto,
    bio: user.bio,
    university: user.university,
    faculty: user.faculty,
    study_year: user.studyYear,
    student_id: user.studentId,
    campus: user.campus,
    town: user.town,
    language: user.language,
    profile_visibility: user.profileVisibility.toLowerCase(),
    post_visibility: user.postVisibility.toLowerCase(),
    data_export_requested_at: iso(user.dataExportRequestedAt),
    impact_score: user.impactScore,
    current_mood: user.currentMood,
    skills: user.skills,
    interests: user.interests,
    previous_education: user.previousEducation,
    experiences: user.experiences,
    portfolio_links: user.portfolioLinks,
    joined_spheres_count: counts.joinedSpheres ?? 0,
    connections_count: counts.connections ?? 0,
    contributions_count: counts.contributions ?? 0,
    date_joined: iso(user.dateJoined),
    updated_at: iso(user.updatedAt),
    is_staff: user.isStaff,
    is_superuser: user.isSuperuser,
    is_verified: user.isVerified,
    is_profile_complete: isProfileComplete(user),

    // Deprecated camelCase aliases. `normalizeUser` reads `camel ?? snake` for each,
    // so these are redundant for that path — retained until a sweep confirms nothing
    // reads `user_info.<camel>` directly. See documentation/API_CONTRACT.md §2.
    coverPhoto: user.coverPhoto,
    studyYear: user.studyYear,
    studentId: user.studentId,
    phoneNumber: user.phoneNumber,
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
    previousEducation: user.previousEducation,
    portfolioLinks: user.portfolioLinks,
    isVerified: user.isVerified,
  };

  if (viewerId !== user.id) {
    for (const field of SENSITIVE_FIELDS) payload[field] = null;
  }

  return payload;
}

/** Compact shape for search results — API_CONTRACT §3.2. */
export function serializeUserSummary(
  user: Pick<
    SerializableUser,
    "id" | "firstName" | "lastName" | "username" | "avatar" | "bio" | "university" | "faculty" | "studyYear" | "impactScore" | "isVerified"
  >,
): Record<string, unknown> {
  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    username: user.username,
    full_name: `${user.firstName} ${user.lastName}`.trim(),
    avatar: user.avatar,
    bio: user.bio,
    university: user.university,
    faculty: user.faculty,
    study_year: user.studyYear,
    impact_score: user.impactScore,
    is_verified: user.isVerified,
  };
}
