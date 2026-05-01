import { Link } from "react-router-dom";
import type { ReactNode } from "react";

const MENTION_REGEX = /(^|[^\w])@([A-Za-z0-9_]{2,50})/g;
const MENTION_SYNTAX_REGEX = /^[A-Za-z0-9_]{2,50}$/;

export function getMentionedUsernames(text: string): string[] {
  if (!text) return [];

  const seen = new Set<string>();
  const mentions: string[] = [];
  for (const match of text.matchAll(/(^|[^\w])@([A-Za-z0-9_]{2,50})/g)) {
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

const URL_REGEX = /(https?:\/\/[^\s!@#$%^&*()_+={}[\]|\\:;"'<>,?~`]+)/g;

export function renderMentionText(content: string, onMentionClick?: () => void) {
  if (!content) return null;

  const result: ReactNode[] = [];
  let lastIndex = 0;

  // We combine mentions and URLs into a single search
  const combinedRegex = new RegExp(`${MENTION_REGEX.source}|${URL_REGEX.source}`, "g");
  let match: RegExpExecArray | null = null;

  while ((match = combinedRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const start = match.index;

    // Add text before the match
    if (start > lastIndex) {
      result.push(content.slice(lastIndex, start));
    }

    // Identify if it's a mention or a URL
    // Group 2 is the username from MENTION_REGEX
    // Group 4 is the URL from URL_REGEX
    const prefix = match[1];
    const username = match[2];
    const url = match[3];

    if (username) {
      if (prefix) result.push(prefix);
      result.push(
        <Link
          key={`mention-${start}-${username}`}
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
    } else if (url) {
      result.push(
        <a
          key={`url-${start}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>
      );
    }

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
