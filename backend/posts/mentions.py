import re
from typing import Iterable

from users.models import User

MENTION_PATTERN = re.compile(r'(?<!\w)@([A-Za-z0-9_]{2,50})')


def extract_mentioned_usernames(text: str) -> list[str]:
    """Extract unique mentioned usernames from text while preserving order."""
    if not text:
        return []

    seen = set()
    usernames: list[str] = []
    for username in MENTION_PATTERN.findall(text):
        normalized = username.strip()
        if not normalized:
            continue
        key = normalized.lower()
        if key in seen:
            continue
        seen.add(key)
        usernames.append(normalized)
    return usernames


def resolve_mentioned_users(text: str, exclude_user_id: int | None = None) -> Iterable[User]:
    """Resolve valid mentions to existing users and ignore unknown usernames."""
    usernames = extract_mentioned_usernames(text)
    if not usernames:
        return User.objects.none()

    queryset = User.objects.filter(username__in=usernames)
    if exclude_user_id is not None:
        queryset = queryset.exclude(id=exclude_user_id)
    return queryset
