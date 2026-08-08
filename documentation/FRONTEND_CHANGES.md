# Frontend Changes Required by the Node Backend Migration

Companion to [API_INVENTORY.md](./API_INVENTORY.md).

The backend is being rewritten from Django to Node/Express on `migration/backend-node`. The frontend is
owned on a separate branch and **no behavioural change has been made to it here** — the only edits are
one-line comment markers placed at the exact spots that need attention, so a merge lands the markers
next to the code they describe instead of producing conflicting rewrites.

## Finding the markers

```bash
grep -rn "BE-MIGRATION" frontend/src frontend/sphera-app/src
```

Every marker is a single `//` comment carrying an ID (`FE-01` … `FE-09`) that matches a row below.
Deleting a marker after acting on it is the intended workflow. No import, type, signature or runtime
behaviour was touched, so any merge conflict on these files is a comment-only conflict — take either
side and re-grep.

## Priority

| Level | Meaning |
|---|---|
| **Required** | The Node backend's behaviour differs here. Not acting leaves a bug. |
| **Recommended** | Pre-existing defect the backend cannot fix alone. |
| **Informational** | Behaviour changes in your favour; no edit needed. |

## Changes

| ID | File | Line | Priority | Change |
|---|---|---|---|---|
| `FE-01` | `src/constants/notificationTypes.ts` | 1 | **Required** | Add `mention_post`, `mention_comment`, `verification_status` to `CANONICAL_NOTIFICATION_TYPES`. |
| `FE-02` | `src/components/sphere/SphereSpheraTab.tsx`<br>`src/sphera/components/study/StudyToolsModal.tsx`<br>`src/services/api.ts` | 123<br>45<br>2278 | **Required** | Stop passing a `SphereFile` id as `resourceId`. Add a `sphereFileId` prop and send `sphere_file_id`. |
| `FE-07` | `sphera-app/src/pages/CreateSession.tsx` | 103 | **Required** | Pass `'annale'` as `askQuestion`'s third arg when `generationMode === 'annale'`. |
| `FE-10` | `src/services/api.ts` | 169 | **Required** | Set `VITE_API_URL` in every deploy. The fallbacks are stale — see below. |
| `FE-04` | `src/components/sphere/SphereSpheraTab.tsx` | 34 | Recommended | `Promise.all` → `Promise.allSettled`. |
| `FE-05` | `src/contexts/AuthContext.tsx` | 50 | Recommended | Call `supabaseSignOut()` in `logout`. |
| `FE-08a` | `src/admin/pages/AdminLogsPage.tsx` | 8 | Recommended | Remove the `apiFetch` import — it is not an export. |
| `FE-08b` | `src/admin/pages/AdminLogsPage.tsx` | 20 | Recommended | Move `getAdminLogs` into `api.ts`; drop the hardcoded API base. |
| `FE-09` | `src/pages/public/AuthCallback.tsx` | 9 | Recommended | Align the local required-fields list with the backend's. |
| `FE-03` | `src/services/api.ts` | 934 | Informational | `my_spheres` is now honoured; three call sites start working as intended. |
| `FE-06` | `src/services/api.ts` | 2274 | Informational | `api/study/` alias is retained; migrate to `api/sphera/` when convenient. |

---

### FE-01 — Notification types

The backend emits three types this list omits, so they currently fall through as unknown.
`message_received` was also being emitted where both sides declare `message`; the backend now emits
`message`, so no client change is needed for that one.

Canonical set is the existing 12 plus `mention_post`, `mention_comment`, `verification_status` = **15**.
`comment_reply`, `sphere_join_request`, `resource_shared`, `task_completed` and `system` are declared on
both sides but emitted by nothing — left in place.

`verification_status` is now genuinely emitted — `POST /api/users/me/verify/` fires it on automatic
approval, and `POST /api/admin/v1/users/verify/` fires it when an admin approves manually (Django's admin
path changed the flag and told the student nothing). Without this change those notifications render as
unknown.

### FE-02 — Sphere file vs resource ID space

`SphereFile` and `Resource` are separate tables with independent ID sequences.
`SphereSpheraTab` passes a `SphereFile.id` into `StudyToolsModal`'s `resourceId`, which reaches
`POST /api/sphera/generate/from-resource/` as `resource_id` and is resolved against `Resource`. The
result is a 404, or silently generating study tools from an unrelated document that happens to share
the id.

The Node backend accepts **`resource_id` OR `sphere_file_id`, exactly one**. Three coordinated edits:

1. `generateStudyTools(resourceId, toolTypes)` gains an optional source discriminator.
2. `StudyToolsModalProps` gains `sphereFileId?: string | number | null`.
3. `SphereSpheraTab` passes `sphereFileId: file.id` instead of `resourceId: file.id`.

### FE-07 — Annale Q&A posts to the session endpoint

`askQuestion(id, question, type = 'session')`. In `CreateSession`, `sessionId` holds an `AnnaleSession`
id when `generationMode === 'annale'`, but the default sends it to `/sphera/sessions/<id>/ask/`.

Note this path was masked: `POST /api/sphera/generate/annale/` has always failed with a 503 because of
a prompt-formatting defect, so annale chat was never reachable. Both are fixed in the new backend, which
makes the wrong-endpoint call newly visible.

### FE-04 — Sphera tab blanks on one failed call

`Promise.all([getSphereFiles, getSphereStudySessions])` — the sessions call currently always 500s
(`sphere.memberships` does not exist server-side), so the rejection clears `files` too and the tab shows
its empty state even when the sphere has files. The backend fix removes the trigger; `allSettled` removes
the fragility.

### FE-05 — Logout leaves the Supabase session intact

`logout` clears Django tokens but never calls `supabaseSignOut`, so the Supabase session persists in
`localStorage`. With `autoRefreshToken` and `detectSessionInUrl` enabled, a signed-out user can be
silently re-authenticated.

### FE-10 — Backend URL resolution

`getDetectedApiUrl()` falls back through three guesses when `VITE_API_URL` is unset, and all three are
now wrong or unverified:

| Case | Returns | Verdict |
|---|---|---|
| `campussphere.app` | `https://api.campussphere.app` | **Correct.** Verified live: CNAMEd through Cloudflare to the Render service, `GET /api/health/` returns 200. |
| `*.onrender.com` | `https://campus-sphere-backend-dyfu.onrender.com` | **Correct.** Verified live, same service as above. The `-dyfu` suffix is real, not a guess. |
| anything else | `http://127.0.0.1:8000` | **Wrong — Django's port.** The Node backend runs on `:3000` in development, so local dev silently talks to nothing. |

Only the third row is a defect. Note that `campus-sphere-backend.onrender.com` — the name in `render.yaml` — is **not** a routable hostname; Render appends a suffix, so the service answers on `campus-sphere-backend-dyfu.onrender.com`. Probing the un-suffixed name returns no server at all.

None of this is a backend change — the API answers on whatever origin it is deployed to. But the
localhost fallback is the single most likely reason a correct backend appears broken in development,
so: **set `VITE_API_URL` explicitly in Vercel and in local `.env`** rather than relying on hostname
sniffing. Use `https://api.campussphere.app` — it is stable across Render service renames, whereas the
`-dyfu` hostname is not.

CORS is already correct for `campussphere.app`, `www.campussphere.app`, `sphera.campussphere.app` and
the localhost dev ports, verified against a running server. If you serve the frontend from any other
origin, add it to `CORS_ALLOWED_ORIGINS` on the backend or the browser will block every request.

### FE-08 — AdminLogsPage

`import { apiFetch } from "@/services/api"` — only `http.apiFetch` is exported. TypeScript reports
`error 2459`. It is unused, so it is inert. Separately, `getAdminLogs` builds its own base URL from
`import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'`, bypassing `getDetectedApiUrl()`; in any deploy
without `VITE_API_URL` set this calls localhost, and it also skips token-refresh handling.

### FE-09 — Profile-completion field lists diverge

`AuthCallback` treats `username` and `student_id` as required; the backend treats a profile as complete
on `university` + `faculty` + `study_year`. The fallback branch can therefore disagree with
`needs_profile_completion`.

Related backend fix: `REQUIRED_PROFILE_FIELDS` was `[]` server-side, making `all([])` true, so
`is_profile_complete` was being forced to `true` on every login. The Node backend computes it properly.

---

## No change needed

- **`checkUserAvailability`** — the declared TS type already expects `{ username: { value, available } }`.
  Django returned flat `{ username_available }`, so the check silently always reported "available". The
  Node backend emits the nested shape the client already expects; consumers work unmodified.
- **Response envelopes** — standardised on `{ success, data, message?, timestamp }`, lists as
  `{ success, data: [...], pagination }`. Verified safe: `unwrapList` matches on
  `success !== undefined && Array.isArray(data)`, and `Messages.tsx` uses its own `unwrapApiData`.
- **`getConversationParticipants`** — returns a raw envelope, but every call site already unwraps it.
- **`/ws/notifications/`** — `AppLayout.tsx` already connects to this socket and toasts what arrives.
  It is implemented and now carries real traffic, and the frame shape is unchanged from Django's
  consumer (a bare notification object with `title`, `message`, `type`, `data`, `created_at`,
  `is_read`), so the existing handler works untouched. Fan-out is cross-instance, so it keeps working
  when the backend is scaled out.
- **Chat sockets** — `/ws/chat/<id>/` and `/ws/conversations/<id>/` both still exist and still accept
  `?token=`. Authorisation now happens during the upgrade, so a non-participant is refused with a 401
  handshake instead of being connected; `MiniChat` and `Messages.tsx` already reconnect on close.

## Dead exports in `src/services/api.ts`

Not backend work — listed for triage, since these are why most `UNUSED` routes in
[API_INVENTORY.md](./API_INVENTORY.md) have no caller. All 23 backend routes behind them are being
ported regardless, so wiring any of them up later needs no backend change.

`apiInfo`, `assignTask`, `createConversation`, `getConnectionRecommendations`, `getConversation`,
`getFilterOptions`, `getNotification`, `getNotificationStats`, `getSpherePosts`, `getSphereResources`,
`getTask`, `getUploadStats`, `getUserTasks`, `getUserUploads`, `healthCheck`, `listConversations`,
`listNotificationsPaginated`, `listTasks`, `pinPost`, `removeSphereBanner`, `searchSuggestions`,
`supabaseSignOut`, `updateTask`

`mapAdminKpiStats` is also declared and never read. `API_BASE_URL` and `getFullUrl` appear unreferenced
externally but are used inside `api.ts` — leave them.

**One of these is not like the others.** `getConnectionRecommendations` calls
`api/users/connections/recommendations/`, which **has never existed on any backend** — it is absent from
the Django URL conf, absent from the inventory, and therefore absent here. The other 22 point at real
routes that are implemented and simply unwired, so calling them starts working immediately. Wiring this
one up needs the endpoint to be built first. Verified by sweeping all 132 frontend call sites against
the running backend: it is the only one with nothing behind it.
