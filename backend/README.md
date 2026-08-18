# CampusSphere API — Node/Express

The backend, rewritten from Django 5.2 + DRF to Node 22 + Express 5 + TypeScript + Prisma.
The Django tree is preserved at [`../legacy/django-backend/`](../legacy/django-backend/) as a
behavioural reference and rollback path — see [that README](../legacy/README.md).

| | |
|---|---|
| Runtime | Node 22, Express 5, TypeScript (ESM) |
| Database | PostgreSQL via Prisma |
| Coordination | Redis — realtime fan-out, rate limits, job leadership |
| Realtime | `ws`, sharing the HTTP listener |
| Storage | S3-compatible (Supabase Storage or AWS); local disk in dev only |
| Deploy | Render, Docker runtime ([`Dockerfile`](./Dockerfile), [`../render.yaml`](../render.yaml)) |

Specifications live in [`documentation/`](../documentation/):
[API_CONTRACT.md](../documentation/API_CONTRACT.md) is authoritative for request and response shapes,
[API_INVENTORY.md](../documentation/API_INVENTORY.md) for which of the 143 routes exist and who calls them.

---

## Running locally

```bash
cp .env.example .env          # then fill in DATABASE_URL at minimum
npm install
npx prisma generate
npx prisma migrate deploy     # never `migrate dev` — see below
npm run dev
```

Optional but recommended: `redis-server` on `127.0.0.1:6379`, and `REDIS_URL` set to match. Without it
the server boots, logs a warning, and runs every cross-instance subsystem process-locally.

> **Never run `prisma migrate dev` against a database that also holds the Django tables.** It offers to
> *reset* the database when it finds tables it does not recognise, which would drop them and destroy the
> rollback path. `migrate deploy` and `db push` are safe.

### Running the contract suite

The suite is black-box HTTP: it needs a server running.

```bash
npm run dev:test              # terminal 1 — starts with rate limits disabled
npm run test:contract         # terminal 2
```

`dev:test` sets `DISABLE_RATE_LIMITS=1`, because the suite fires far more requests from one address in
a few seconds than the anonymous limit allows in an hour. That flag is refused in production.

See [tests/contract/README.md](./tests/contract/README.md) for layout and for how to tell a real failure
from a Neon cold start.

### Running the defect regression suite

```bash
npm run test:defects            # needs no server — it boots its own
```

One test per Django defect this migration exists to fix, each naming the defect it prevents from
returning. It lives apart from the contract suite because proving these needs conditions a black-box
suite cannot have: rate limiting switched **on**, a captured SMTP inbox, and direct database access to
promote a user to staff. It boots its own server on `:3100` with that environment and tears it down
afterwards.

If one of these starts failing, the backend has regressed to a bug the Django version shipped with.

| Test group | Django defect |
|---|---|
| auth throttling actually runs | `ScopedRateThrottle` reassigns `self.scope` from the view and returns early when absent — no auth view defined it, so **login and registration were unthrottled** |
| notification email is delivered | No `templates/emails/` directory exists; every send raised `TemplateDoesNotExist` into a bare `except` — **no mail was ever delivered** |
| admin actions are audited | `log_admin_action` was called only from `spheres/views.py`; bans and verifications recorded nothing |
| …lists only genuinely reported content | The queue was padded with all recent posts, each with **the author cast as the reporter** |
| routes that used to 500 or 404 | `uploads/stats/` (`NameError`), `filters/` (`FieldError`), `PUT profile/` (unrouted), email-as-search-key, anonymous `supabase/debug/` |

---

## Scaling out

The service is designed to run on **more than one instance behind a load balancer, with no sticky
sessions**. Three things would otherwise be per-process, and all three are backed by Redis:

| Concern | Mechanism | What breaks without it |
|---|---|---|
| WebSocket fan-out | `PUBLISH`/`SUBSCRIBE` per channel, [`src/realtime/hub.ts`](./src/realtime/hub.ts) | A message sent through instance A is invisible to a participant connected to instance B. Symptom: "chat only works sometimes." |
| Rate limits | `INCR` + `EXPIRE` in one Lua script, [`src/lib/rateLimit.ts`](./src/lib/rateLimit.ts) | Every published limit is silently multiplied by the instance count. |
| Scheduled jobs | `SET key NX EX <period>`, [`src/jobs/lock.ts`](./src/jobs/lock.ts) | Every instance runs every job, every period. |

`assertProductionConfig()` **refuses to boot in production without `REDIS_URL`**, for the same reason it
refuses a development `SECRET_KEY`: silently degrading would hide the failure until users hit it.

### How fan-out works

Sockets are held in a process-local room map. `publishFrame()` delivers to this instance's sockets
first, then publishes an envelope to a Redis channel; every other instance holding sockets on that
channel delivers its own copy. The envelope carries the originating instance's id so the publisher
ignores its own loopback rather than delivering twice.

Redis `SUBSCRIBE` is per channel (`cs:conv:<id>`, `cs:user:<id>`), not one firehose, so an instance only
receives traffic for rooms it actually holds sockets for. The first socket on a channel subscribes; the
last to leave unsubscribes.

A Redis outage degrades to single-instance behaviour — local delivery still happens — rather than
silencing chat. A circuit breaker ([`src/lib/redis.ts`](./src/lib/redis.ts)) opens for 30 seconds after
a failure so an outage costs throughput, not a command timeout on every request.

### Verifying it

Start two instances against one Redis and one Postgres, then confirm an event produced on one is
received on the other:

```bash
npm run dev                        # :3000
PORT=3001 npm run dev              # :3001
```

Attach a WebSocket client to `:3000`, `POST` a message through `:3001`, and the frame must arrive. If it
does not, fan-out has fallen back to process-local — check that `REDIS_URL` is set in both.

---

## Layout

```
src/
  config/env.ts        Environment. Names mirror Django's, so Render config carries over
  lib/                 Cross-cutting: prisma, jwt, errors, envelope, redis, rateLimit, visibility
  middleware/          auth, upload, error handling, trailing slash, rate limiting
  routes/              One router per domain, mounted in routes/index.ts
  serializers/         Wire shapes — the API_CONTRACT §2 objects
  services/            storage, notifications, email, impact, verification, extraction, ai/
  realtime/            hub (pub/sub) + websocket (endpoints)
  jobs/                Scheduled work; replaces Celery beat
prisma/schema.prisma   31 models, 22 enums
tests/contract/        Black-box HTTP suite — the acceptance gate
```

Every route handler carries a `@status` annotation (`ACTIVE` / `UNUSED` / `DEPRECATED` / `INFRA`)
matching API_INVENTORY.md, so a route with no live caller is obvious at the point of implementation
rather than only in the docs. **Nothing was dropped in the migration** — unused routes are implemented
and labelled, not deleted.

---

## Background jobs

Replaces Celery beat and the worker + broker services it needed. Each job is checked hourly on every
instance; `claimPeriod()` decides whether this occurrence is due, so exactly one instance runs it.

| Job | Period | Notes |
|---|---|---|
| `cleanup-expired-spheres` | 1h | Ported from `cleanup_expired_spheres_task` |
| `prune-revoked-tokens` | 24h | New — the revocation table would otherwise grow forever |

Jobs must stay short and idempotent. Anything long-running belongs in a real queue, not a `setInterval`.

---

## Email

**Off unless `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` are set.** Django's defaults were the literal
placeholders `your-email@gmail.com` / `your-app-password`, and no `templates/emails/` directory ever
existed — every send raised `TemplateDoesNotExist` into a bare `except`. No mail has ever been delivered
by this application. Templates are now inline ([`src/services/email.ts`](./src/services/email.ts)), so
that failure mode cannot return, but delivery stays disabled until someone deliberately configures SMTP.

---

## Sphera (AI)

Provider chain Claude Haiku → Gemini Flash → Groq Llama, called over plain HTTP rather than through
three vendor SDKs. Text extraction shells out to `pdftotext`, `pdftoppm` and `tesseract` — all installed
in the Docker image. PDFs yielding under 150 characters of embedded text fall through to OCR (`fra+eng`).

Without any `*_API_KEY` set, generation endpoints return **503** with the provider errors in `detail`.
That is the correct behaviour, not a misconfiguration: every other endpoint works without AI keys.
