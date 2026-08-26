/**
 * @username mention resolution.
 *
 * Matches the Django behaviour: usernames are drawn from the body text, the author
 * is never notified of their own mention, and unknown handles are ignored rather
 * than erroring.
 */

import { prisma } from "./prisma.js";

const MENTION_RE = /@([A-Za-z0-9][A-Za-z0-9_.-]{2,49})/g;

export function extractMentionHandles(text: string): string[] {
  const handles = new Set<string>();
  for (const match of text.matchAll(MENTION_RE)) handles.add(match[1].toLowerCase());
  return [...handles];
}

export interface MentionedUser {
  id: number;
  username: string;
}

/** Resolve @handles to real users, excluding the author. Capped to bound the query. */
export async function resolveMentionedUsers(text: string, excludeUserId: number): Promise<MentionedUser[]> {
  const handles = extractMentionHandles(text).slice(0, 20);
  if (handles.length === 0) return [];

  return prisma.user.findMany({
    where: { username: { in: handles, mode: "insensitive" }, id: { not: excludeUserId } },
    select: { id: true, username: true },
  });
}
