# Contract test suite

Black-box HTTP tests for the CampusSphere API. Nothing here imports application
code — the suite talks only to `API_BASE_URL`, so the **same tests run against both
backends**:

```bash
# against the legacy Django backend (documents current behaviour; fails on every known defect)
API_BASE_URL=http://127.0.0.1:8000 npm run test:contract

# against the Node backend (the acceptance gate)
API_BASE_URL=http://127.0.0.1:3000 npm run test:contract
```

## Why it is written red

These tests were written from [API_CONTRACT.md](../../../documentation/API_CONTRACT.md)
**before** the Node implementation exists, so they fail on day one. That is the point:
they are the specification, not a description of what the code happens to do.

Assertions carrying a `[CHANGE]` comment fail against Django deliberately — each one
encodes a defect the migration must fix. A green run against Django would mean the
suite is not testing what it claims to.

## Sibling suites

| Command | What it covers |
|---|---|
| `npm run test:contract` | This suite, plus `tests/unit/` — pure functions whose behaviour is otherwise only observable through a live AI provider |
| `npm run test:defects` | `tests/integration/` — one test per Django defect, run against a server this suite cannot configure (rate limits **on**, SMTP captured, database access for admin promotion) |

The split exists to protect this suite's defining property: it imports no application code, so the same
files run against either backend. Anything needing a Prisma import or a bespoke server environment goes
next door.

## Layout

| Path | Purpose |
|---|---|
| `helpers/client.ts` | HTTP wrapper and envelope assertions. Never throws on non-2xx — status is part of the contract |
| `helpers/factories.ts` | Fixtures built through the public API only |
| `routes.manifest.ts` | **Generated.** Machine-readable route list driving the conformance sweep |
| `specs/conformance.contract.test.ts` | Generic invariants across all 143 routes |
| `specs/auth.contract.test.ts` | Registration, login, refresh, revocation, redaction, availability |
| `specs/spheres.contract.test.ts` | Creation, membership, visibility, `my_spheres`, feature matrix |
| `specs/impact.contract.test.ts` | Impact scoring rules |
| `specs/sphera.contract.test.ts` | AI generation, source selection, sphere sharing, annales |

## The conformance sweep

`conformance.contract.test.ts` is driven by the generated manifest rather than
hand-written per route, so invariants that must hold everywhere — the auth boundary,
absence of 5xx, envelope shape — are asserted across the entire surface at once.

Regenerate the manifest whenever the inventory changes:

```bash
python3 backend/scripts/gen-route-manifest.py
```

The sweep then covers the new surface automatically. The inventory stays the single
source of truth for what exists; the manifest is never edited by hand.

## Fixtures

Users are created through native `POST /api/users/auth/register/` rather than the
Supabase exchange, which would need a live identity provider. Both backends expose
that route, so the suite bootstraps itself either way.

Every fixture is uniquely named per run, so repeated runs against a persistent
database do not collide.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `API_BASE_URL` | `http://127.0.0.1:3000` | Target server |
| `SPHERA_AI` | unset | Set to `off` to skip tests that call live AI providers |

AI-backed tests are slow and cost money on every run. Skip them with `SPHERA_AI=off`
for fast iteration; run them in full before declaring the migration complete.

## Intermittent failures on the first run after an idle period

Serverless Postgres (Neon free tier, Supabase free tier) suspends compute when idle.
The first query after suspension can fail to connect, which surfaces as unrelated
tests failing and `Can't reach database server` in the API log.

**This is infrastructure, not a regression.** Re-run once the database is warm: the
suite has been observed going from 4 failures to three consecutive fully-green runs
with no code change in between.

Before concluding a failure is real, check the API server's output:

- `Can't reach database server` — cold start. Re-run.
- `P2028 Transaction already closed` — a real bug. Prisma's interactive-transaction
  timeout is 5s by default, and a transaction making several sequential round trips
  to a remote database will exceed it. The fix is fewer statements in the
  transaction, not a longer timeout.

Timings are dominated by round-trip latency, so a test that registers two users and
exercises a flow routinely takes 20-30s. That is expected.
