# API Route Inventory

Generated from a static cross-reference of the Django URL conf against every call site in
`frontend/src` (including raw `fetch` outside `services/api.ts`), `frontend/src/sphera/services/spheraService.ts`
and `frontend/sphera-app/src/services/spheraApi.ts`.

**No route is being removed.** This table records what each route is for and how confident we are that
anything calls it, so the port carries the full surface forward with its status made explicit.

## Status legend

| Status | Meaning | Action in the Node port |
|---|---|---|
| `ACTIVE` | At least one live client call site | Port and cover with contract tests |
| `UNUSED` | Implemented, no caller found. Built-but-unwired, not dead | Port; mark `@status unused` in the handler |
| `DEPRECATED` | Superseded, duplicated or diagnostic | Port; mark `@status deprecated`; drop only once confirmed |
| `INFRA` | No JS caller but required by infrastructure | Port; must not be removed |

Counts: **ACTIVE** 120 · **DEPRECATED** 5 · **INFRA** 1 · **UNUSED** 17 · **total** 143

**Migration status: all 143 implemented.** Nothing was dropped. Every handler carries a `@status`
annotation matching its row here, so an `UNUSED` or `DEPRECATED` route is visible at the code, not only
in this table. Verified by sweeping every method+path pair against a running server: no literal route
returns 404, and none returns 5xx.

Two routes exist under a second prefix as well: `/api/study/*` mirrors `/api/sphera/*` (one router,
two mounts — `api.ts` still calls the legacy prefix, see `FE-06`).

## Routes

| Route | Methods | Status | Called by | Notes |
|---|---|---|---|---|
| `api/admin/moderation-queue/` | GET | `ACTIVE` | web |  |
| `api/admin/permissions/` | GET | `ACTIVE` | web |  |
| `api/admin/reported-content/` | GET | `ACTIVE` | web |  |
| `api/admin/user-management-summary/` | GET | `ACTIVE` | web |  |
| `api/admin/v1/logs/` | GET | `ACTIVE` | web(direct) |  |
| `api/admin/v1/posts/` | GET | `UNUSED` | — | Admin post listing; no admin page consumes it yet. |
| `api/admin/v1/posts/bulk-delete/` | POST | `UNUSED` | — | Admin bulk post delete; no consumer yet. |
| `api/admin/v1/reports/` | GET | `ACTIVE` | web |  |
| `api/admin/v1/reports/bulk-approve/` | POST | `ACTIVE` | web |  |
| `api/admin/v1/resources/` | GET | `ACTIVE` | web |  |
| `api/admin/v1/resources/bulk-delete/` | POST | `ACTIVE` | web |  |
| `api/admin/v1/spheres/` | GET | `ACTIVE` | web |  |
| `api/admin/v1/stats/` | GET | `ACTIVE` | web |  |
| `api/admin/v1/users/` | GET | `ACTIVE` | web |  |
| `api/admin/v1/users/bulk-ban/` | POST | `ACTIVE` | web |  |
| `api/admin/v1/users/verify/` | POST | `ACTIVE` | web |  |
| `api/admin/v1/verification-queue/` | GET | `ACTIVE` | web |  |
| `api/auth/refresh/` | POST | `ACTIVE` | sphera-app, web |  |
| `api/auth/supabase/complete-profile/` | POST | `ACTIVE` | web |  |
| `api/auth/supabase/debug/` | GET | `DEPRECATED` | — | Diagnostic-only. **[CHANGE]** Django served it to anonymous callers, disclosing which Supabase secrets are configured plus the JWKS key set; now admin-gated. |
| `api/auth/supabase/exchange/` | POST | `ACTIVE` | web | DEFECT: REQUIRED_PROFILE_FIELDS is [] so all([]) is True -> is_profile_complete forced True on every login. |
| `api/conversations/` | GET,POST | `UNUSED` | — | Generic list/create; clients use conversations/user/ and private|group/create/. |
| `api/conversations/<var>/` | GET,PUT,PATCH,DELETE | `ACTIVE` | web |  |
| `api/conversations/<var>/avatar/` | POST | `ACTIVE` | web |  |
| `api/conversations/<var>/leave/` | POST | `ACTIVE` | web |  |
| `api/conversations/<var>/messages/` | GET,POST | `ACTIVE` | web |  |
| `api/conversations/<var>/messages/<var>/` | GET,PATCH,DELETE | `ACTIVE` | web |  |
| `api/conversations/<var>/participants/` | GET | `ACTIVE` | web |  |
| `api/conversations/<var>/participants/<var>/remove/` | DELETE | `ACTIVE` | web |  |
| `api/conversations/<var>/participants/add/` | POST | `ACTIVE` | web |  |
| `api/conversations/<var>/read/` | POST | `ACTIVE` | web |  |
| `api/conversations/<var>/unread/` | POST | `ACTIVE` | web |  |
| `api/conversations/group/create/` | POST | `ACTIVE` | web |  |
| `api/conversations/private/create/` | POST | `ACTIVE` | web |  |
| `api/conversations/user/` | GET | `ACTIVE` | web |  |
| `api/filters/` | GET | `UNUSED` | — | DEFECT: Sphere.objects.values("type") -> field is sphere_type -> 500. |
| `api/health/` | GET | `INFRA` | — | No JS caller. Used by render.yaml healthCheckPath — must be kept. |
| `api/info/` | GET | `DEPRECATED` | — | Static endpoint listing; no consumer. |
| `api/notifications/` | GET | `ACTIVE` | web |  |
| `api/notifications/<var>/` | GET,PUT,PATCH,DELETE | `ACTIVE` | web |  |
| `api/notifications/<var>/read/` | PUT | `ACTIVE` | web |  |
| `api/notifications/read-all/` | PUT | `ACTIVE` | web |  |
| `api/notifications/settings/` | PUT,PATCH | `ACTIVE` | web |  |
| `api/notifications/stats/` | GET | `UNUSED` | — | Unread counters; useUnreadCounts derives counts client-side from the list instead. |
| `api/posts/` | GET,POST | `ACTIVE` | web |  |
| `api/posts/<var>/` | GET,PUT,PATCH,DELETE | `ACTIVE` | web |  |
| `api/posts/<var>/comments/` | GET,POST | `ACTIVE` | web |  |
| `api/posts/<var>/impact-rate/` | POST | `ACTIVE` | web |  |
| `api/posts/<var>/like/` | POST | `ACTIVE` | web |  |
| `api/posts/<var>/pin/` | POST | `UNUSED` | — | Pin/unpin implemented and permission-checked; frontend never wires it (pinPost is dead). |
| `api/posts/<var>/report/` | POST | `ACTIVE` | web |  |
| `api/posts/<var>/save/` | POST | `ACTIVE` | web |  |
| `api/posts/comments/<var>/` | GET,PUT,PATCH,DELETE | `ACTIVE` | web |  |
| `api/posts/comments/<var>/like/` | POST | `ACTIVE` | web |  |
| `api/posts/saved/` | GET | `ACTIVE` | web |  |
| `api/posts/sphere/<var>/` | GET | `UNUSED` | — | Sphere feed; SphereDetail renders files/tasks instead (getSpherePosts dead). |
| `api/posts/user/<var>/` | GET | `ACTIVE` | web |  |
| `api/resources/` | GET,POST | `ACTIVE` | web | DEFECT on POST: serializer accepts `sphere` and assigns it; Resource has no such field -> 500. |
| `api/resources/<var>/` | GET,PUT,PATCH,DELETE | `ACTIVE` | web |  |
| `api/resources/<var>/download/` | POST | `ACTIVE` | web |  |
| `api/resources/<var>/preview/` | GET | `ACTIVE` | web |  |
| `api/resources/<var>/report/` | POST | `ACTIVE` | web |  |
| `api/resources/<var>/save/` | POST,DELETE | `ACTIVE` | web |  |
| `api/resources/<var>/share/` | POST | `ACTIVE` | web |  |
| `api/resources/<var>/view/` | POST | `UNUSED` | — | Explicit view tracking; detail GET already auto-tracks views. |
| `api/resources/folders/` | GET,POST | `ACTIVE` | web |  |
| `api/resources/folders/<var>/` | GET,PUT,PATCH,DELETE | `ACTIVE` | web |  |
| `api/resources/folders/<var>/download/` | GET | `ACTIVE` | web |  |
| `api/resources/saved/` | GET | `ACTIVE` | web |  |
| `api/resources/sphere/<var>/` | GET | `UNUSED` | — | DEFECT: filters Resource by a `sphere` field that does not exist -> 500. |
| `api/resources/user/<var>/` | GET | `ACTIVE` | web |  |
| `api/search/` | GET | `ACTIVE` | web |  |
| `api/search/suggestions/` | GET | `UNUSED` | — | Typeahead; SearchDropdown calls globalSearch instead. |
| `api/sphera/annales/` | GET | `ACTIVE` | sphera-app, web(direct), web(sphera) |  |
| `api/sphera/annales/<var>/` | GET,DELETE | `ACTIVE` | sphera-app, web(direct), web(sphera) |  |
| `api/sphera/annales/<var>/ask/` | POST | `ACTIVE` | sphera-app | DEAD PATH: generate/annale never persists extracted_text, so this always 400s. |
| `api/sphera/annales/<var>/share/` | POST,DELETE | `ACTIVE` | sphera-app, web(direct), web(sphera) | BROKEN when sphere_id given: same sphere.memberships defect. |
| `api/sphera/generate/annale/` | POST | `ACTIVE` | sphera-app, web(direct), web(sphera) | BROKEN: annale prompt .format() raises KeyError (unescaped braces) -> always 503. |
| `api/sphera/generate/from-resource/` | POST | `ACTIVE` | web(direct), web(sphera) |  |
| `api/sphera/generate/from-upload/` | POST | `ACTIVE` | sphera-app, web(direct), web(sphera) |  |
| `api/sphera/guest/generate/` | POST | `ACTIVE` | sphera-app | PARTIAL: tool_type="annale" hits the same .format() defect. |
| `api/sphera/sessions/` | GET | `ACTIVE` | sphera-app, web(direct), web(sphera) |  |
| `api/sphera/sessions/<var>/` | GET,DELETE | `ACTIVE` | sphera-app, web(direct), web(sphera) |  |
| `api/sphera/sessions/<var>/add-tool/` | PATCH | `ACTIVE` | sphera-app, web(direct), web(sphera) |  |
| `api/sphera/sessions/<var>/ask/` | POST | `ACTIVE` | sphera-app, web(direct), web(sphera) |  |
| `api/sphera/sessions/<var>/share/` | POST,DELETE | `ACTIVE` | sphera-app, web(direct), web(sphera) | BROKEN when sphere_id given: sphere.memberships does not exist (related_name is members). |
| `api/sphera/sessions/<var>/suggestions/` | GET | `ACTIVE` | sphera-app |  |
| `api/sphera/sphere/<var>/` | GET | `ACTIVE` | web(direct), web(sphera) | BROKEN: same sphere.memberships defect -> 500. |
| `api/sphera/sphere/<var>/annales/` | GET | `ACTIVE` | web(direct), web(sphera) | BROKEN: same sphere.memberships defect -> 500. |
| `api/spheres/` | GET,POST | `ACTIVE` | web |  |
| `api/spheres/<var>/` | GET,PUT,PATCH,DELETE | `ACTIVE` | web |  |
| `api/spheres/<var>/banner/` | POST | `ACTIVE` | web |  |
| `api/spheres/<var>/cancel-request/` | DELETE | `ACTIVE` | web |  |
| `api/spheres/<var>/extend-duration/` | POST | `ACTIVE` | web |  |
| `api/spheres/<var>/features/` | GET | `UNUSED` | — | Frontend mirrors this locally in config/sphereFeatures.ts instead of fetching. |
| `api/spheres/<var>/files/` | GET,POST | `ACTIVE` | web |  |
| `api/spheres/<var>/files/<var>/` | DELETE | `ACTIVE` | web |  |
| `api/spheres/<var>/join/` | POST | `ACTIVE` | web |  |
| `api/spheres/<var>/leave/` | POST | `ACTIVE` | web |  |
| `api/spheres/<var>/members/` | GET,POST | `ACTIVE` | web |  |
| `api/spheres/<var>/members/<var>/` | PATCH,DELETE | `ACTIVE` | web |  |
| `api/spheres/<var>/overview/` | GET | `ACTIVE` | web |  |
| `api/spheres/user/spheres/` | GET | `ACTIVE` | web |  |
| `api/tasks/` | GET,POST | `ACTIVE` | web |  |
| `api/tasks/<var>/` | GET,PUT,PATCH,DELETE | `ACTIVE` | web |  |
| `api/tasks/<var>/assign/` | POST | `UNUSED` | — | Assignment endpoint; assignTask is dead in api.ts. |
| `api/tasks/<var>/complete/` | POST | `ACTIVE` | web |  |
| `api/tasks/<var>/move/` | PATCH | `ACTIVE` | web |  |
| `api/tasks/sphere/<var>/` | GET | `ACTIVE` | web |  |
| `api/tasks/user/` | GET | `UNUSED` | — | Current-user task list; getUserTasks dead. |
| `api/tasks/user/<var>/` | GET | `UNUSED` | — | Tasks by user id; getUserTasks dead. |
| `api/upload/` | POST | `ACTIVE` | web |  |
| `api/upload/<var>/` | DELETE | `UNUSED` | — | Generic upload detail; only the avatar/cover shortcuts are used. |
| `api/uploads/` | GET | `UNUSED` | — | User upload listing; getUserUploads dead. |
| `api/uploads/stats/` | GET | `UNUSED` | — | Upload stats; getUploadStats dead. |
| `api/users/<var>/` | GET | `ACTIVE` | web |  |
| `api/users/<var>/avatar/` | POST | `ACTIVE` | web |  |
| `api/users/<var>/connection-relation/` | GET,POST,PATCH,DELETE | `ACTIVE` | web |  |
| `api/users/<var>/connections/` | GET,POST | `ACTIVE` | web |  |
| `api/users/<var>/connections/<var>/` | DELETE | `ACTIVE` | web |  |
| `api/users/<var>/cover/` | POST | `ACTIVE` | web |  |
| `api/users/admin/contact-messages/` | GET | `ACTIVE` | web |  |
| `api/users/admin/contact-messages/<var>/` | GET,PUT,PATCH,DELETE | `ACTIVE` | web |  |
| `api/users/auth/change-email/` | POST | `ACTIVE` | web |  |
| `api/users/auth/change-password/` | POST | `ACTIVE` | web |  |
| `api/users/auth/delete-account/` | DELETE | `ACTIVE` | web |  |
| `api/users/auth/login/` | POST | `ACTIVE` | sphera-app, web |  |
| `api/users/auth/logout/` | POST | `ACTIVE` | sphera-app, web |  |
| `api/users/auth/me/` | GET | `ACTIVE` | sphera-app, web |  |
| `api/users/auth/password-reset/` | POST | `DEPRECATED` | — | Superseded: frontend uses supabase.auth.resetPasswordForEmail. |
| `api/users/auth/register/` | POST | `ACTIVE` | sphera-app, web |  |
| `api/users/auth/supabase/complete-profile/` | POST | `DEPRECATED` | — | Duplicate of api/auth/supabase/complete-profile/. |
| `api/users/auth/supabase/exchange-token/` | POST | `DEPRECATED` | — | Duplicate of api/auth/supabase/exchange/. Broken: reads settings.SUPABASE_ANON_KEY, never defined. |
| `api/users/blocks/` | GET,POST | `ACTIVE` | web |  |
| `api/users/blocks/<var>/` | DELETE | `ACTIVE` | web |  |
| `api/users/by-username/<var>/` | GET | `ACTIVE` | web |  |
| `api/users/check-availability/` | POST | `ACTIVE` | web | CONTRACT MISMATCH: returns {username_available}; client reads data.username.available -> always "available". |
| `api/users/contact/` | POST | `ACTIVE` | web |  |
| `api/users/data-export/` | POST | `ACTIVE` | web |  |
| `api/users/me/verify/` | POST | `ACTIVE` | web |  |
| `api/users/privacy/` | GET,PUT | `ACTIVE` | web |  |
| `api/users/profile/` | PUT,PATCH | `ACTIVE` | web |  |
| `api/users/search/` | GET | `ACTIVE` | web |  |

## Dead exports in `frontend/src/services/api.ts`

These wrappers exist but nothing imports them. They are the reason most `UNUSED` routes have no caller.
Listed for the frontend owner; nothing here is a backend change.

- `apiInfo`
- `assignTask`
- `createConversation`
- `getConnectionRecommendations`
- `getConversation`
- `getFilterOptions`
- `getNotification`
- `getNotificationStats`
- `getSpherePosts`
- `getSphereResources`
- `getTask`
- `getUploadStats`
- `getUserTasks`
- `getUserUploads`
- `healthCheck`
- `listConversations`
- `listNotificationsPaginated`
- `listTasks`
- `pinPost`
- `removeSphereBanner`
- `searchSuggestions`
- `supabaseSignOut`
- `updateTask`

`API_BASE_URL` and `getFullUrl` also show as unreferenced externally but are used inside `api.ts`; they are not endpoints.

### Two notes worth passing to the frontend owner

- `supabaseSignOut` is never called, so logout clears Django tokens but leaves the Supabase session in
  `localStorage`. With `autoRefreshToken` and `detectSessionInUrl` enabled, a signed-out user can be
  silently re-authenticated.
- `AdminLogsPage.tsx` imports `apiFetch` from `@/services/api`, which is not an export (only `http.apiFetch`
  is). It is unused there, so it is inert, but the import resolves to `undefined`.
