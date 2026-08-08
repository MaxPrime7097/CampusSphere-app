# CampusSphere API Contract

Authoritative specification for the Node/Express backend. Derived from the Django implementation
(behaviour) cross-checked against every client call site (expectations), with the defects listed in
[API_INVENTORY.md](./API_INVENTORY.md) corrected rather than reproduced.

Where the two disagreed, **the client won** — it is the live consumer and cannot be changed without
coordination. Deviations from current Django behaviour are marked **[CHANGE]** and justified inline.

- Route status (`ACTIVE` / `UNUSED` / `DEPRECATED` / `INFRA`) → [API_INVENTORY.md](./API_INVENTORY.md)
- Required client edits → [FRONTEND_CHANGES.md](./FRONTEND_CHANGES.md)

---

## 1. Conventions

### 1.1 Base URL and versioning

No version prefix. Paths are absolute from root, always with a **trailing slash**. A request without
the trailing slash must 301 to the canonical form (Django's `APPEND_SLASH` did this implicitly; it must
be explicit in Express, since clients rely on it).

### 1.2 Authentication

`Authorization: Bearer <access>` — HS256 JWT.

| Claim | Value |
|---|---|
| `sub` / `user_id` | User PK. **Both** must be emitted: `user_id` is what the Django tokens used, `sub` is standard. |
| `token_type` | `"access"` or `"refresh"` |
| `jti` | Unique token id |
| `exp` | access 7 days · refresh 90 days |

Two independent entry points produce these tokens, serving **disjoint clients**:

1. **Supabase exchange** — `POST /api/auth/supabase/exchange/`. Used by the main web app only.
   Verifies the Supabase JWT via JWKS (ES256/RS256), falling back to the shared HS256 secret.
2. **Native credentials** — `POST /api/users/auth/register/` and `/login/`. Used by the **standalone
   Sphera app only**. Passwords hashed with argon2id. **[CHANGE]** Django used PBKDF2; no accounts are
   being preserved, so the format is free to change.

Refresh rotates: `POST /api/auth/refresh/` returns a new access token. **[CHANGE]** Refresh tokens must
be genuinely revocable on logout. Django set `BLACKLIST_AFTER_ROTATION = True` but never installed
`token_blacklist`, so `LogoutView`'s blacklist call silently no-opped inside a bare `except`.

### 1.3 Response envelope

**[CHANGE]** Uniform across every endpoint. Django mixed three shapes (`{success, data}`, bare DRF
pagination, bare objects), which is why `unwrapItem` / `unwrapList` exist client-side.

```jsonc
// single object
{ "success": true, "data": { ... }, "message": "...", "timestamp": "2026-08-06T10:30:00Z" }

// collection
{ "success": true, "data": [ ... ], "pagination": {
    "page": 1, "page_size": 20, "total_items": 42, "total_pages": 3,
    "has_next": true, "has_previous": false } }
```

Verified non-breaking: `unwrapList` matches on `success !== undefined && Array.isArray(data)`, and
`Messages.tsx` unwraps via its own `unwrapApiData`. Binary responses (file download, ZIP) are exempt.

### 1.4 Errors

```jsonc
{ "success": false, "error": "human readable", "detail": "...", "code": "machine_readable",
  "field_errors": { "username": ["already taken"] } }
```

| Code | Use |
|---|---|
| 400 | Validation failure — `field_errors` populated |
| 401 | Missing/expired token |
| 403 | Authenticated but not permitted |
| 404 | Not found, **or** hidden by visibility rules (never leak existence) |
| 409 | Conflict (duplicate email/username, existing membership) |
| 413 | Upload exceeds the per-type cap |
| 429 | Throttled — include `Retry-After` |
| 503 | Upstream AI provider chain exhausted |

### 1.5 Pagination

`?page=` (1-based) and `?page_size=` (default 20, max 100). Out-of-range pages clamp to the last page
rather than erroring, matching `_paginate_queryset`.

### 1.6 Caching

Per [CACHE_POLICY.md](./CACHE_POLICY.md): messaging, notifications, unread counts and all mutating
actions must send `Cache-Control: no-store`.

---

## 2. Shared object shapes

Referenced below as `<User>`, `<Sphere>` etc. rather than repeated.

### `<User>`

```jsonc
{
  "id": 1, "first_name": "", "last_name": "", "username": "", "email": "", "full_name": "",
  "phone_number": "", "date_of_birth": "2000-01-15", "avatar": null, "cover_photo": null,
  "bio": "", "university": "", "faculty": "", "study_year": "", "student_id": "", "campus": "",
  "town": "", "language": [], "profile_visibility": "public", "post_visibility": "public",
  "data_export_requested_at": null, "impact_score": 0, "current_mood": "excited",
  "skills": [], "interests": [], "previous_education": [], "experiences": [], "portfolio_links": [],
  "joined_spheres_count": 0, "connections_count": 0, "contributions_count": 0,
  "date_joined": "...", "updated_at": "...",
  "is_staff": false, "is_superuser": false, "is_verified": false
}
```

`connections_count` counts `accepted` connections in either direction. `contributions_count` is
`posts + resources`.

> Django additionally emitted camelCase duplicates (`coverPhoto`, `studyYear`, `studentId`,
> `phoneNumber`, `dateOfBirth`, `previousEducation`, `portfolioLinks`, `isVerified`). `normalizeUser`
> reads `camel ?? snake` for every one, so snake_case alone is sufficient. **Retained as deprecated
> aliases** pending a sweep for raw `user_info.<camel>` reads that bypass `normalizeUser`; drop once
> confirmed.

**Privacy redaction.** For any viewer that is not the profile owner, these become `null`:
`email`, `phone_number`, `date_of_birth`, `student_id`, `town`, `language`,
`data_export_requested_at`. Strictly self-only — not relaxed for connections.

### `<Sphere>`

```jsonc
{
  "id": 1, "name": "", "description": "", "category": "academic", "sphere_type": "communaute",
  "color": "#10b981", "icon": "users", "banner_image": null, "banner_image_url": null,
  "is_private": false, "require_approval": false, "objective": "", "target_audience": "",
  "duration": "permanent", "expires_at": null, "auto_delete_on_expiry": false,
  "collaboration_types": [], "member_count": 0, "impact_score": 0, "progression": 0,
  "created_by": 1, "created_by_info": <User>, "is_member": false, "membership_status": null,
  "user_role": null, "is_expired": false, "created_at": "...", "updated_at": "..."
}
```

`progression` = completed tasks / total tasks × 100, 0 when there are none.
`membership_status` ∈ `active | pending | inactive | banned | null`.

### `<SphereMember>`

```jsonc
{ "id": 7, "user": 1, "user_info": <User>, "role": "member", "role_display": "Membre",
  "status": "active", "status_display": "Actif", "joined_at": "..." }
```

`id` is the **membership row** id, not the user id — member management routes take this id.

### `<Post>`

```jsonc
{
  "id": 1, "content": "", "author": 1, "author_info": <User>, "sphere": null, "sphere_info": null,
  "category": "general", "visibility": "public", "subject": "", "type": "text", "audience": "",
  "location": "", "tags": [], "files": [<File>], "allow_comments": true, "is_pinned": false,
  "likes_count": 0, "comments_count": 0, "impact_score": 0, "is_liked": false, "is_saved": false,
  "can_edit": false, "can_delete": false, "user_impact_rating": null,
  "recent_comments": [<Comment>], "created_at": "...", "updated_at": "..."
}
```

`recent_comments` = up to 3 top-level comments. `impact_score` = sum of all `PostImpactRating.value`.
`can_delete` is true for the author **or** a sphere admin/moderator.

### `<Comment>`

```jsonc
{ "id": 1, "content": "", "author": 1, "author_info": <User>, "parent": null, "likes_count": 0,
  "is_liked": false, "replies": [<Comment>], "can_edit": false, "can_delete": false,
  "created_at": "...", "updated_at": "..." }
```

`replies` is populated only on top-level comments, capped at 5, and nested replies return `[]`.

### `<Resource>`

```jsonc
{
  "id": 1, "title": "", "description": "", "author": 1, "author_info": <User>,
  "file": "...", "file_info": <File>, "file_size": 0, "file_type": "", "subject": "other",
  "type": "cours", "visibility": "public", "audience": "", "folder_id": null,
  "folder_info": null, "tags": [], "impact_score": 0,
  "stats": { "downloads": 0, "views": 0, "saves": 0 },
  "is_saved": false, "can_edit": false, "can_delete": false, "created_at": "...", "updated_at": "..."
}
```

**[CHANGE]** `sphere_id` is removed. `Resource` never had a `sphere` column; the serializer's
`get_sphere_id` swallowed the resulting error and always returned `null`, while
`ResourceCreateSerializer` accepted a `sphere` key and assigned it, producing a 500 on write.
Sphere-scoped files are `<SphereFile>`.

### `<File>`

```jsonc
{ "id": "uuid|null", "name": "", "url": "", "type": "", "size": 0 }
```

### `<SphereFile>`

```jsonc
{ "id": 1, "title": "", "file_url": "", "file_size": 0, "file_type": "",
  "uploaded_by": { "id": 1, "name": "", "avatar": null }, "created_at": "..." }
```

### `<Task>`

```jsonc
{
  "id": 1, "title": "", "description": "", "assigned_to": null, "assigned_to_info": null,
  "priority": "medium", "due_date": null, "is_completed": false, "kanban_status": "todo",
  "impact_points": 5, "sphere": 1, "sphere_info": <Sphere>, "created_by": 1,
  "created_by_info": <User>, "status": "pending", "is_overdue": false,
  "can_edit": false, "can_delete": false, "can_complete": false,
  "created_at": "...", "updated_at": "..."
}
```

`status` is derived: `completed` | `overdue` | `pending`.

### `<Conversation>` / `<Message>`

```jsonc
{ "id": 1, "type": "private", "name": "", "avatar": null, "avatar_url": null,
  "participants": [1,2], "participants_info": [<User>], "created_by": null,
  "created_by_info": null, "last_message": <Message>|null, "unread_count": 0,
  "created_at": "...", "updated_at": "..." }

{ "id": 1, "content": "", "author": 1, "author_info": <User>, "conversation": 1,
  "is_read": false, "is_read_by_user": false, "created_at": "...", "updated_at": "..." }
```

### `<Notification>`

```jsonc
{ "id": 1, "type": "post_like", "type_display": "Like sur post", "title": "", "message": "",
  "recipient": 1, "data": {}, "is_read": false, "read_at": null, "is_recent": true,
  "created_at": "..." }
```

**Canonical types (15).** **[CHANGE]** — reconciles three divergent lists:

`post_like` · `post_comment` · `comment_reply` · `mention_post` · `mention_comment` ·
`sphere_invitation` · `sphere_join_request` · `task_assigned` · `task_completed` ·
`resource_shared` · `connection_request` · `connection_accepted` · `message` · `system` ·
`verification_status`

Django emitted `message_received` (not in any enum) — now `message`. `verification_status` was emitted
but declared nowhere. `mention_post` / `mention_comment` were declared server-side but missing from the
client list (see `FE-01`). `comment_reply`, `sphere_join_request`, `resource_shared`, `task_completed`
and `system` are declared but currently emitted by nothing; retained.

### `<StudySession>` / `<AnnaleSession>`

```jsonc
{ "id": 1, "owner": 1, "owner_username": "", "resource": null, "resource_title": "",
  "resource_file_url": null, "sphere_file": null, "source_filename": "",
  "tool_types": ["fiche"], "content": {}, "qa_history": [], "has_qa": true,
  "is_shared": false, "shared_in_sphere": null, "sphere_name": null,
  "created_at": "...", "updated_at": "..." }

{ "id": 1, "owner": 1, "owner_username": "", "mode": "complete", "source_filename": "",
  "resource": null, "source_title": "", "resource_file_url": null, "cours_resource": null,
  "cours_title": null, "content": {}, "qa_history": [], "has_qa": true,
  "is_shared": false, "shared_in_sphere": null, "sphere_name": null,
  "created_at": "...", "updated_at": "..." }
```

`extracted_text` is never serialised (too large) but **must be persisted on both models** —
`GenerateAnnaleView` omitted it, which made annale Q&A permanently unreachable.

List variants drop `content` and `qa_history`, adding `content_preview` (title of the first tool) and,
for annales, `corrections_count`. **[CHANGE]** `corrections_count` must count
`sum(len(s["questions"]) for s in content["sections"])`; Django read a top-level `content["corrections"]`
key the generator never produces, so it always returned 0.

Content schemas for `fiche`, `quiz`, `flashcards` and annale corrections are unchanged from
[API.md §Structure du contenu Sphera](./API.md).

---

## 3. Endpoints

Auth column: **—** public · **U** authenticated · **S** self/owner · **M** sphere member ·
**Mod** sphere moderator/admin · **A** platform admin.

### 3.1 Authentication

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/supabase/exchange/` | — | `{access_token}` → `{tokens, user, is_new_user, needs_profile_completion}` |
| POST | `/api/auth/supabase/complete-profile/` | U | Profile completion payload → `<User>` |
| POST | `/api/auth/refresh/` | — | `{refresh}` → `{access}` |
| POST | `/api/users/auth/register/` | — | Standalone Sphera only. 201 + `{user, tokens}` |
| POST | `/api/users/auth/login/` | — | Standalone Sphera only. `{user, tokens}` |
| POST | `/api/users/auth/logout/` | U | Revokes the refresh token |
| GET | `/api/users/auth/me/` | — | `{authenticated, data}`; `authenticated:false` when anonymous |
| POST | `/api/users/auth/change-password/` | S | |
| POST | `/api/users/auth/change-email/` | S | 409 if taken |
| DELETE | `/api/users/auth/delete-account/` | S | Body `{confirmation_text: "SUPPRIMER"}`; also deletes the Supabase user |
| POST | `/api/users/check-availability/` | — | See below |

**[CHANGE] `needs_profile_completion`** = NOT (`university` AND `faculty` AND `study_year`).
Django's `REQUIRED_PROFILE_FIELDS` was `[]`, so `all([])` returned `True` and `is_profile_complete` was
force-written `True` on **every** login, permanently defeating onboarding.

**[CHANGE] `/api/users/check-availability/`** returns the nested shape the client's TypeScript already
declares. Django returned flat `{username_available}` while `Register.tsx` read
`data.username.available`, so the check silently always reported "available".

```jsonc
{ "success": true, "data": {
    "username": { "value": "john", "available": false },
    "email":    { "value": "j@x.io", "available": true },
    "username_available": false, "email_available": true   // deprecated flat aliases
}}
```

`DEPRECATED` duplicates retained per instruction: `/api/users/auth/supabase/exchange-token/`,
`/api/users/auth/supabase/complete-profile/`, `/api/users/auth/password-reset/`,
`/api/auth/supabase/debug/`. The first must be reimplemented working — it referenced an undefined
`settings.SUPABASE_ANON_KEY` and 500'd unconditionally. `debug/` must require admin auth.

### 3.2 Users and connections

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/users/<id>/` | — | Redacted unless self |
| GET | `/api/users/by-username/<username>/` | — | Same redaction |
| GET·PATCH | `/api/users/profile/` | S | |
| GET | `/api/users/search/?q=` | U | Excludes self and inactive |
| POST | `/api/users/me/verify/` | S | multipart `student_id` + `card_image`; always 200 — AI verification is best-effort and must never block the save |
| GET·PUT | `/api/users/privacy/` | S | |
| POST | `/api/users/data-export/` | S | |
| GET·POST | `/api/users/blocks/` | S | |
| DELETE | `/api/users/blocks/<id>/` | S | |
| GET·POST | `/api/users/<id>/connections/` | U | Listing governed by `CONNECTION_LIST_VISIBILITY_POLICY` |
| GET·POST·PATCH·DELETE | `/api/users/<id>/connection-relation/` | U | GET returns the relation summary; PATCH accepts (recipient only) |
| DELETE | `/api/users/<id>/connections/<cid>/` | U | |
| POST | `/api/users/contact/` | — | |
| GET | `/api/users/admin/contact-messages/` | A | |
| GET·PATCH·DELETE | `/api/users/admin/contact-messages/<id>/` | A | |

`GET connection-relation` → `{target_user_id, is_self, is_connected, can_connect, can_disconnect,
connection}`. Note `is_connected` is true for a **pending** request too, mirroring current behaviour the
client depends on.

### 3.3 Spheres

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET·POST | `/api/spheres/` | U | Excludes expired; private only if member. Supports `?search=` and **[CHANGE]** `?my_spheres=true` |
| GET·PUT·PATCH·DELETE | `/api/spheres/<id>/` | U / creator | Mutations creator-only |
| POST | `/api/spheres/<id>/join/` | U | → `{status: "active"\|"pending"}`; 409 if already member/pending |
| POST | `/api/spheres/<id>/leave/` | M | 400 if sole admin |
| DELETE | `/api/spheres/<id>/cancel-request/` | U | |
| POST | `/api/spheres/<id>/extend-duration/` | creator | |
| GET·POST | `/api/spheres/<id>/members/` | M / Mod | |
| PATCH·DELETE | `/api/spheres/<id>/members/<mid>/` | Mod | Role changes admin-only; last admin protected |
| GET | `/api/spheres/<id>/overview/` | M | Aggregate |
| POST | `/api/spheres/<id>/banner/` | creator | multipart `banner`, or `remove=true`. Max 10MB, images only |
| GET·POST | `/api/spheres/<id>/files/` | M | Max 50MB |
| DELETE | `/api/spheres/<id>/files/<fid>/` | uploader or Mod | |
| GET | `/api/spheres/<id>/features/` | U | `UNUSED`. Must stay in sync with `config/sphereFeatures.ts` |
| GET | `/api/spheres/user/spheres/` | U | |

**[CHANGE]** `my_spheres=true` is honoured. Three client call sites have always passed it; Django
ignored unknown params, so they were listing every sphere instead of the user's.

**[CHANGE]** `overview.recent_resources` must draw from `SphereFile`. Django queried
`Resource.objects.filter(sphere=…)` against a non-existent column inside a bare `except`, so the field
was always `[]`.

### 3.4 Posts and comments

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET·POST | `/api/posts/` | — / U | Visibility-filtered feed; multipart accepted (`files[]`) |
| GET·PUT·PATCH·DELETE | `/api/posts/<id>/` | — / author | Delete also allowed for sphere Mod |
| POST | `/api/posts/<id>/like/` | U | Toggle → `{liked, likesCount}` |
| POST | `/api/posts/<id>/save/` | U | Toggle → `{saved}` |
| POST | `/api/posts/<id>/report/` | U | Idempotent per reporter |
| POST | `/api/posts/<id>/impact-rate/` | U | `{value: 1..5\|null}`; null removes |
| POST | `/api/posts/<id>/pin/` | Mod | `UNUSED`. Sphere posts only |
| GET·POST | `/api/posts/<id>/comments/` | U | 400 when `allow_comments` is false |
| GET·PUT·PATCH·DELETE | `/api/posts/comments/<id>/` | author | |
| POST | `/api/posts/comments/<id>/like/` | U | Toggle |
| GET | `/api/posts/saved/` | U | Paginated |
| GET | `/api/posts/sphere/<id>/` | M | `UNUSED` |
| GET | `/api/posts/user/<id>/` | U | Visibility-filtered |

`visibility` on write ∈ `public | sphere | friends`. Posting to a sphere requires active membership.

**[CHANGE]** Post creation awards **0** impact points. Django awarded +1 via `POST_CREATED`, contradicting
[IMPACT_POLICY.md](./IMPACT_POLICY.md), which states the rule was removed deliberately so the score
rewards usefulness rather than volume. Active rules: resource upload **+5**; post rating **+1…+5** to the
author.

### 3.5 Resources and folders

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET·POST | `/api/resources/` | — / U | multipart. Max 50MB, MIME allowlist. Upload awards +5 |
| GET·PUT·PATCH·DELETE | `/api/resources/<id>/` | visibility / author | GET auto-tracks a unique view |
| POST | `/api/resources/<id>/download/` | visibility | Returns the binary |
| GET | `/api/resources/<id>/preview/` | visibility | → `{preview_url}` |
| POST | `/api/resources/<id>/save/` | U | Toggle |
| POST | `/api/resources/<id>/view/` | U | `UNUSED` |
| POST | `/api/resources/<id>/report/` | U | |
| POST | `/api/resources/<id>/share/` | — | Analytics only |
| GET | `/api/resources/saved/` | U | |
| GET | `/api/resources/user/<id>/` | U | |
| GET | `/api/resources/sphere/<id>/` | M | `UNUSED`. **[CHANGE]** Must return `<SphereFile>[]` — see §2 |
| GET·POST | `/api/resources/folders/` | S | Max **4** folders/user |
| GET·PUT·PATCH·DELETE | `/api/resources/folders/<id>/` | S | GET embeds `resources` |
| GET | `/api/resources/folders/<id>/download/` | visibility | ZIP, deduplicated filenames |

Visibility ∈ `public | university | friends`, where `university` matches on the author's university and
`friends` on an accepted connection. Legacy `private` maps to `friends` on write. Max **20** resources
per folder.

### 3.6 Tasks

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET·POST | `/api/tasks/` | M | Scoped to the user's spheres |
| GET·PUT·PATCH·DELETE | `/api/tasks/<id>/` | M / creator | |
| POST | `/api/tasks/<id>/complete/` | assignee or Mod | Awards **no** impact points — see below |
| PATCH | `/api/tasks/<id>/move/` | M | `{kanban_status}` |
| POST | `/api/tasks/<id>/assign/` | Mod | `UNUSED`. **[CHANGE]** `assigned_to_id` is an **integer** |
| GET | `/api/tasks/sphere/<id>/` | M | |
| GET | `/api/tasks/user/` · `/api/tasks/user/<id>/` | U | `UNUSED` |

**[CHANGE]** `TaskAssignSerializer.assigned_to_id` was a `UUIDField` while `User.id` is a 64-bit integer,
so the route rejected every valid id. Unnoticed because no client calls it.

**[CHANGE] Completing a task awards no impact points.** Django applied the task's own
`impact_points` dynamically, but [IMPACT_POLICY.md](./IMPACT_POLICY.md) lists task completion among the
rules removed on purpose ("à réintégrer dans une phase future"). The document wins, consistently with
post creation. `impact_points` remains stored and serialised — the Kanban board displays it, and it is
the value the rule will use if reintroduced. Active rules stay: resource upload **+5**, post rating
**+1…+5** to the author.

**Kanban status and `is_completed` are kept in step.** Moving a task to `done` sets `is_completed`, and
completing it sets `kanban_status: "done"`. The board writes one field and the task list reads the other,
so allowing them to diverge shows a task as open in one view and closed in the other.

### 3.7 Messaging

All responses `Cache-Control: no-store`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET·POST | `/api/conversations/` | U | `UNUSED` |
| GET·PATCH·DELETE | `/api/conversations/<id>/` | participant | Rename groups only; delete creator-only |
| GET·POST | `/api/conversations/<id>/messages/` | participant | GET marks read |
| PATCH·DELETE | `/api/conversations/<id>/messages/<mid>/` | author or moderator | |
| POST | `/api/conversations/<id>/read/` · `/unread/` | participant | |
| POST | `/api/conversations/<id>/leave/` | participant | Reassigns creator; deletes when empty |
| POST | `/api/conversations/<id>/avatar/` | creator | Groups only. Max 5MB |
| GET | `/api/conversations/<id>/participants/` | participant | |
| POST | `/api/conversations/<id>/participants/add/` | creator | |
| DELETE | `/api/conversations/<id>/participants/<uid>/remove/` | creator | Cannot remove the creator |
| GET | `/api/conversations/user/` | U | |
| POST | `/api/conversations/private/create/` | U | `{recipient_id}`; returns the existing conversation if present |
| POST | `/api/conversations/group/create/` | U | `{name, participant_ids}` |

WebSocket `ws/chat/<id>/` and `ws/conversations/<id>/`, JWT via `?token=`. Events: `message_created`,
`message_updated`, `message_deleted`, `conversation_read`.

### 3.8 Notifications

All responses `Cache-Control: no-store`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/notifications/` | S | Filters `read`, `type`, `ordering` |
| GET·PUT·PATCH·DELETE | `/api/notifications/<id>/` | S | |
| PUT | `/api/notifications/<id>/read/` | S | |
| PUT | `/api/notifications/read-all/` | S | → `{marked_count}` |
| GET·PUT | `/api/notifications/settings/` | S | Auto-created on first read |
| GET | `/api/notifications/stats/` | S | `UNUSED` |

A notification is never created when sender == recipient.

### 3.9 Sphera (AI)

Canonical prefix `/api/sphera/`. The `/api/study/` alias is **retained** — `api.ts` still uses it
(see `FE-06`).

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/sphera/generate/from-resource/` | U | **[CHANGE]** `resource_id` **XOR** `sphere_file_id` |
| POST | `/api/sphera/generate/from-upload/` | U | multipart; creates a backing resource |
| POST | `/api/sphera/generate/annale/` | U | `file` or `resource_id`, `mode`, optional `cours_resource_id` |
| POST | `/api/sphera/guest/generate/` | — | **5/hour/IP**; nothing persisted |
| GET | `/api/sphera/sessions/` | S | Optional `?tool_type=` |
| GET·DELETE | `/api/sphera/sessions/<id>/` | owner or shared | |
| PATCH | `/api/sphera/sessions/<id>/add-tool/` | S | Reuses stored `extracted_text` |
| GET | `/api/sphera/sessions/<id>/suggestions/` | S | Generated once, then cached |
| POST | `/api/sphera/sessions/<id>/ask/` | S | Appends to `qa_history` |
| POST·DELETE | `/api/sphera/sessions/<id>/share/` | S | Optional `sphere_id` |
| GET·DELETE | `/api/sphera/annales/<id>/` | owner or shared | |
| POST | `/api/sphera/annales/<id>/ask/` | owner or shared | |
| POST·DELETE | `/api/sphera/annales/<id>/share/` | S | |
| GET | `/api/sphera/annales/` | S | |
| GET | `/api/sphera/sphere/<id>/` · `/annales/` | M | Shared items |

**[CHANGE] `resource_id` XOR `sphere_file_id`.** `SphereSpheraTab` passes a `SphereFile` id as
`resource_id`; the two tables have independent sequences, so it 404s or silently generates from an
unrelated document (`FE-02`). Supplying both, or neither, is a 400.

**[CHANGE] Sphere membership checks.** All four sphere-scoped Sphera routes used `sphere.memberships`,
which does not exist — the reverse accessor is `sphere.members` — so each raised `AttributeError` and
500'd.

**[CHANGE] Annale prompt templating.** The annale prompts embed a JSON example with unescaped braces and
were passed through Python's `str.format()`, raising `KeyError` on every call. **Every** annale
generation has been returning 503. Node template literals remove the failure mode; the prompt text
ports verbatim.

**[CHANGE] Persist `extracted_text` on `AnnaleSession`** at generation time, otherwise
`/annales/<id>/ask/` can only ever 400.

Provider chain unchanged: Claude Haiku → Gemini Flash → Groq Llama, first success wins, 503 when all
fail. Extraction shells out to the `tesseract` / `poppler` binaries already present in the image; PDFs
yielding under 150 characters of embedded text fall through to OCR (`fra+eng`). Input truncates at
12 000 characters.

### 3.10 Uploads

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/upload/` | U | `{file, type}`; per-type size and MIME caps |
| GET·DELETE | `/api/upload/<uuid>/` | owner | `UNUSED` |
| POST | `/api/users/<id>/avatar/` | S | Max 5MB |
| POST | `/api/users/<id>/cover/` | S | Max 10MB |
| GET | `/api/uploads/` · `/api/uploads/stats/` | S | `UNUSED` |

Caps by type: avatar 5MB · cover 10MB · post 25MB · resource 50MB · other 10MB.

**[CHANGE] Object storage is mandatory.** Django defaulted to `MEDIA_ROOT` on local disk with
`USE_S3=False`, and [render.yaml](../render.yaml) runs a free plan with no persistent disk — every
uploaded avatar, banner and resource is destroyed on redeploy. The Node backend writes to S3-compatible
storage (Supabase Storage or S3) with no local-disk fallback in production.

**[CHANGE] `/api/uploads/stats/` no longer 500s.** Django's `upload_stats` called `models.Sum(...)` in a
module that imported only `UploadedFile` — `models` was undefined, so every request raised `NameError`.
It went unnoticed because `getUploadStats` has no call site.

Replacing an avatar, cover or sphere banner now deletes the object it replaced. Django overwrote the
column and left the old object in the bucket forever.

Post attachments are two steps, as the web client already does them: `POST /api/upload/` with
`type=post`, then pass the returned descriptors in the post's `files` array. Keeping the transfer out of
post creation means a failed upload never costs the author their draft, and a retry does not repost.

### 3.11 Search, admin, health

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/search/?q=&type=&limit=` | U | `type` ∈ `all\|users\|spheres\|posts\|resources` |
| GET | `/api/search/suggestions/?q=` | U | `UNUSED`. Min 2 chars |
| GET | `/api/filters/` | U | `UNUSED`. **[CHANGE]** `Sphere` groups by `sphere_type`, not `type` — this 500'd |
| GET | `/api/health/` | — | `INFRA`. Unthrottled, uncached |
| GET | `/api/info/` | — | `DEPRECATED` |
| GET | `/api/admin/moderation-queue/` · `/reported-content/` · `/user-management-summary/` · `/permissions/` | A | Legacy admin |
| GET | `/api/admin/v1/{users,spheres,posts,resources,reports,logs,stats,verification-queue}/` | A | `posts` is `UNUSED` |
| POST | `/api/admin/v1/users/verify/` · `/users/bulk-ban/` | A | |
| POST | `/api/admin/v1/{posts,resources}/bulk-delete/` · `/reports/bulk-approve/` | A | `posts/bulk-delete` is `UNUSED` |

Admin roles resolve `is_superuser` → `super_admin`, `is_staff` → `admin`. Permission matrix per
[admin_permissions.py](../legacy/django-backend/campus_sphere/admin_permissions.py), retained verbatim —
though note that Django's third branch read `getattr(user, 'role', '')` / `user_type`, **neither of which
exists on the User model**, so the `moderator` and `viewer` rows were unreachable. They are kept so that
adding a `role` column later activates them, but the lookup is not pretended to work.

**[CHANGE] Every admin mutation writes an `AdminAuditLog` row.** Django defined `log_admin_action` and
then called it only from `spheres/views.py` — not one `admin_views` mutation recorded anything, so bans,
verifications and bulk deletes left no trace, while `/api/admin/v1/logs/` faithfully rendered the
resulting empty table.

**[CHANGE] `/api/admin/reported-content/` lists reports.** Django padded it with the 50 most recent
*posts*, each labelled `"Pending moderation review"` with the **author cast as the reporter** — so the
moderation queue was mostly unreported content and every author appeared to have reported themselves.
The same conflation inflated `reportedContent` in `user-management-summary`, which counted every post in
the database.

**[CHANGE] Bulk-ban excludes the caller** as well as superusers. Banning yourself mid-request leaves
nobody able to undo it.

Search must not leak: private spheres appear only to members, posts and resources only within the
caller's visibility scope. This is enforced by reusing the *same* predicate functions the feeds use
(`src/lib/visibility.ts`) rather than a second hand-written `WHERE` — a duplicated visibility rule is how
a search box ends up surfacing private content when a visibility level is later added to one copy only.

**[CHANGE] User search no longer matches on email.** Django included `email__icontains`, which turns the
search box into an address-confirmation oracle: type an address, learn whether it has an account. Nobody
searches for a classmate by email address.

---

## 4. Background work

| Job | Trigger | Notes |
|---|---|---|
| Expired sphere cleanup | Hourly | Was Celery beat `cleanup_expired_spheres_task` |
| Revoked-token prune | Daily | **[CHANGE]** New. A revocation only needs to outlive the token it revokes; without this the table grows by one row per logout, forever |
| Notification email | On notification create | Best-effort; must never block the response |
| Password reset email | On request | |

Celery beat, the Celery worker and the broker they shared are all removed. Jobs run in-process, guarded
by a Redis key so exactly one instance executes each occurrence (§6).

**[CHANGE] Email has never worked.** `EmailNotificationService` rendered `emails/<type>.html`, falling
back to `emails/default_notification.html` — and no `templates/emails/` directory exists anywhere in the
Django tree. Every send raised `TemplateDoesNotExist`, the fallback raised it again, and the outer
`except` reduced it to a log line. `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` also defaulted to the
literal placeholders `your-email@gmail.com` / `your-app-password`, so no SMTP credentials were ever
configured either. Templates are now inline, so the rendering failure cannot recur, and **delivery stays
disabled until both credentials are set** — a backend migration should not silently start emailing users.

---

## 5. Rate limits

| Scope | Limit | Key |
|---|---|---|
| Anonymous | 60/hour | IP |
| `POST /api/sphera/guest/generate/` | 5/hour | IP |
| Login | 10 / 15 min | **(IP, email)** |
| Login | 100/hour | IP |
| Registration, password reset | 30/hour | IP |

Supabase enforces its own signup/resend limits; the client already handles 429 with a 60s cooldown.

**[CHANGE] Auth throttling now actually runs.** Django declared
`AuthScopedRateThrottle(ScopedRateThrottle)` with a class-level `scope = "auth"`, but
`ScopedRateThrottle.allow_request` reassigns `self.scope` from the *view's* `throttle_scope` attribute
and returns `True` when that attribute is absent. None of the three auth views defined it, so login,
registration and password reset were **completely unthrottled**. `DEFAULT_THROTTLE_RATES` had no `auth`
key either, so the misconfiguration could never have surfaced as an error.

**[CHANGE] Login is keyed by (IP, email), not IP alone.** CampusSphere is a campus product: a whole
university can share one NAT address, so an IP-only limit tight enough to stop credential stuffing would
lock out an entire campus. The narrow bucket stops a targeted brute force; the loose IP bucket stops mass
stuffing while leaving shared egress usable. A successful login clears the narrow bucket, so someone
else's failed attempts against an address cannot lock out its real owner.

Counters live in Redis, so a limit means the same thing regardless of instance count. `429` responses
carry `Retry-After`; all responses carry `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset`.

The anonymous bucket covers every request without a token, **including failed logins** — so a caller
grinding at one account consumes both budgets, and whichever is exhausted first produces the 429.

Because the contract suite must run with limits disabled (it fires more requests from one address in
seconds than the anonymous limit allows in an hour), it structurally cannot prove the throttles are
*connected* — which is exactly how Django's went unnoticed. That proof lives in
`backend/tests/integration/` (`npm run test:defects`), which boots a server with limits enabled and
earns a real 429.

---

## 6. Running more than one instance

The service is built to run on **N instances behind a load balancer with no sticky sessions**. Three
subsystems would otherwise hold per-process state, and all three are backed by Redis:

| Concern | Mechanism | Failure without it |
|---|---|---|
| WebSocket fan-out | `PUBLISH`/`SUBSCRIBE`, one channel per room | A message sent through instance A never reaches a participant connected to instance B |
| Rate limits | `INCR` + `EXPIRE`, one Lua script | Every published limit multiplied by the instance count |
| Scheduled jobs | `SET key NX EX <period>` | Every instance runs every job, every period |

`REDIS_URL` is **required in production** — the server refuses to boot without it, exactly as it refuses
a development `SECRET_KEY`. Degrading silently would hide the failure until users hit it.

Frames carry their originating instance id, so a publisher ignores its own loopback copy rather than
delivering twice. Local delivery happens before the publish, so a Redis outage degrades to
single-instance behaviour instead of silencing chat; a circuit breaker keeps an outage costing throughput
rather than a command timeout on every request.

WebSockets share the HTTP listener, so no additional Render service or port is needed.
