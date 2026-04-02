import { Link } from "react-router-dom";
import type { ReactNode } from "react";

const MENTION_REGEX = /(^|[\s(])@([A-Za-z0-9_]{2,50})/g;
const MENTION_SYNTAX_REGEX = /^[A-Za-z0-9_]{2,50}$/;

export function getMentionedUsernames(text: string): string[] {
  if (!text) return [];

  const seen = new Set<string>();
  const mentions: string[] = [];
  for (const match of text.matchAll(/(^|[\s(])@([^\s@]+)/g)) {
    const username = (match[2] || "").trim();
    if (!username) continue;
    const normalized = username.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    mentions.push(username);
  }
  return mentions;
}

export function findInvalidMentions(text: string): string[] {
  return getMentionedUsernames(text).filter((username) => !MENTION_SYNTAX_REGEX.test(username));
}

export function renderMentionText(content: string, onMentionClick?: () => void) {
  if (!content) return null;

  const result: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = MENTION_REGEX.exec(content)) !== null) {
    const [fullMatch, prefix, username] = match;
    const start = match.index;
    const prefixLength = prefix.length;
    const mentionStart = start + prefixLength;

    if (start > lastIndex) {
      result.push(content.slice(lastIndex, start));
    }
    if (prefix) {
      result.push(prefix);
    }

    result.push(
      <Link
        key={`${mentionStart}-${username}`}
        to={`/profile/${username}`}
        className="font-medium text-primary hover:underline"
        onClick={(event) => {
          event.stopPropagation();
          onMentionClick?.();
        }}
      >
        @{username}
      </Link>
    );

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < content.length) {
    result.push(content.slice(lastIndex));
  }

  return result;
}

export function getActiveMentionQuery(text: string, cursorPosition: number): string | null {
  const safeCursor = Math.max(0, Math.min(cursorPosition, text.length));
  const textBeforeCursor = text.slice(0, safeCursor);
  const mentionMatch = textBeforeCursor.match(/(?:^|\s)@([A-Za-z0-9_]*)$/);
  if (!mentionMatch) return null;
  return mentionMatch[1] ?? "";
}
