# Feed interaction status (PostCard)

_Last updated: 2026-03-29._

This file clarifies what is currently backed by production APIs versus what is still mock/UI-only in `PostCard.tsx`.

## Production-ready

- **Like / unlike post**
  - Frontend calls `POST /api/posts/{id}/like/`.
  - Persists and returns authoritative `liked` + `likesCount`.
- **Report post**
  - Frontend calls `POST /api/posts/{id}/report/`.
  - Persists one report per user per post (subsequent reports update reason/details).

## Mock / UI-only (not persisted yet)

- **Save/unsave post**
  - Currently local state + toast only.
  - No backend API call yet.
- **Share dialog actions** (except copy-link)
  - Message privé / Réseaux sociaux / Partager avec des amis are UI placeholders.
  - No backend analytics persistence yet.

## Partial

- **Copy link**
  - Uses browser clipboard API and error handling.
  - No backend share analytics persistence yet.

## Product note

When presenting roadmap or QA results, treat only _Like_ and _Report_ as production-backed feed interactions in PostCard for now.
