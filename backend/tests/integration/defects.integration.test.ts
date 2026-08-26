/**
 * Regression cover for the Django defects this migration exists to fix.
 *
 * Each test names the defect it prevents from returning. They live here rather than
 * in the contract suite because proving them needs things a black-box HTTP suite
 * cannot have: rate limiting switched **on**, a captured SMTP inbox, and a
 * database-level promotion to admin.
 *
 * Every one of these failed in Django. If any starts failing here, the migration
 * has regressed to it.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type net from "node:net";
import { PrismaClient } from "@prisma/client";
import {
  api,
  BASE_URL,
  createUser,
  flushAnonymousLimit,
  flushRateLimits,
  startFakeSmtp,
  startServer,
  stopServer,
  unique,
  type CapturedMail,
  type TestUser,
} from "./helpers/harness.js";

const prisma = new PrismaClient();
const inbox: CapturedMail[] = [];
let smtp: net.Server;

/** Neon suspends idle compute; this client has no retry extension of its own. */
async function db<T>(fn: () => Promise<T>, attempts = 6): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((r) => setTimeout(r, 400 * 2 ** (attempt - 1)));
    }
  }
}

beforeAll(async () => {
  // Counters persist in Redis, so a previous run would otherwise have spent the
  // budget this one needs. See flushRateLimits() for why this does not weaken the
  // throttle assertions.
  await flushRateLimits();
  smtp = await startFakeSmtp(inbox);
  await startServer();
}, 120_000);

beforeEach(async () => {
  await flushAnonymousLimit();
});

afterAll(async () => {
  await stopServer();
  // `smtp` is undefined when beforeAll failed; teardown must not mask that error.
  if (smtp) await new Promise((resolve) => smtp.close(() => resolve(null)));
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────────────────────────────────────

describe("auth throttling actually runs", () => {
  /**
   * Django: `AuthScopedRateThrottle` set a class-level `scope = "auth"`, but
   * `ScopedRateThrottle.allow_request` reassigns `self.scope` from the *view's*
   * `throttle_scope` attribute and returns True when it is missing. None of the
   * three auth views defined it, so login, registration and password reset were
   * completely unthrottled — and `DEFAULT_THROTTLE_RATES` had no `auth` key, so the
   * misconfiguration could never surface as an error either.
   */
  it("locks out repeated failed logins against one account", async () => {
    const user = await createUser();

    let throttled: number | null = null;
    // The per-account bucket is 10 per 15 minutes.
    for (let attempt = 1; attempt <= 14; attempt += 1) {
      const res = await api("api/users/auth/login/", {
        method: "POST",
        body: { email: user.email, password: "definitely-the-wrong-password" },
      });
      if (res.status === 429) {
        throttled = attempt;
        break;
      }
      expect(res.status, "a wrong password must be 401 until the limit bites").toBe(401);
    }

    expect(throttled, "brute force against one account was never throttled").not.toBeNull();
    expect(throttled).toBeLessThanOrEqual(12);
  }, 120_000);

  it("sends Retry-After and RateLimit headers with a 429", async () => {
    const email = `${unique("throttled")}@integration.test`;

    let throttledResponse: Awaited<ReturnType<typeof api>> | null = null;
    for (let attempt = 1; attempt <= 14; attempt += 1) {
      const res = await api("api/users/auth/login/", {
        method: "POST",
        body: { email, password: "wrong" },
      });
      if (res.status === 429) {
        throttledResponse = res;
        break;
      }
    }

    expect(throttledResponse, "unknown accounts must be throttled too").not.toBeNull();
    const retryAfter = Number(throttledResponse!.headers.get("retry-after"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(throttledResponse!.headers.get("ratelimit-limit")).toBe("10");
    expect(throttledResponse!.headers.get("ratelimit-remaining")).toBe("0");
  }, 120_000);

  it("does not lock out an account because someone else guessed at it", async () => {
    // The narrow bucket is keyed by (IP, email) and is cleared on success, so a
    // stranger hammering an address cannot deny its real owner access. Without
    // that, an IP-only limit tight enough to stop brute force would lock out a
    // whole campus behind one NAT address.
    const user = await createUser();

    for (let attempt = 1; attempt <= 6; attempt += 1) {
      await api("api/users/auth/login/", {
        method: "POST",
        body: { email: user.email, password: "wrong" },
      });
    }

    const success = await api("api/users/auth/login/", {
      method: "POST",
      body: { email: user.email, password: user.password },
    });
    expect(success.status, "the real owner must still be able to log in").toBe(200);

    // And the counter is forgiven, so the next mistake does not immediately 429.
    const afterSuccess = await api("api/users/auth/login/", {
      method: "POST",
      body: { email: user.email, password: "wrong" },
    });
    expect(afterSuccess.status).toBe(401);
  }, 120_000);
});

// ─────────────────────────────────────────────────────────────────────────────

describe("notification email is delivered", () => {
  /**
   * Django: `EmailNotificationService` rendered `emails/<type>.html` with a
   * fallback to `emails/default_notification.html`, and no `templates/emails/`
   * directory exists anywhere in the tree. Every send raised TemplateDoesNotExist,
   * the fallback raised it again, and the outer `except` reduced it to a log line.
   * Not one notification email has ever been delivered.
   */
  it("composes and sends a real message when SMTP is configured", async () => {
    const author = await createUser();
    const liker = await createUser();

    const post = await api("api/posts/", {
      method: "POST",
      token: author.token,
      body: { content: `Integration post ${unique()}`, visibility: "public" },
    });
    expect(post.status).toBe(201);

    const before = inbox.length;
    const liked = await api(`api/posts/${post.body.data.id}/like/`, { method: "POST", token: liker.token });
    expect(liked.status).toBeLessThan(300);

    // Sending is deliberately not awaited by the request, so poll briefly.
    for (let attempt = 0; attempt < 40 && inbox.length === before; attempt += 1) {
      await new Promise((r) => setTimeout(r, 250));
    }

    expect(inbox.length, "no email reached the inbox").toBeGreaterThan(before);
    const mail = inbox[inbox.length - 1];
    expect(mail.to.join(" ")).toContain(author.email);
    expect(mail.data).toContain("CampusSphere");
    // Subject is MIME-encoded because it carries an emoji, so assert on structure.
    expect(mail.data).toMatch(/Subject:/i);
    expect(mail.data).toMatch(/Content-Type: text\/plain/i);
    expect(mail.data).toMatch(/Content-Type: text\/html/i);
  }, 120_000);

  it("respects the recipient's opt-out", async () => {
    const author = await createUser();
    const liker = await createUser();

    const off = await api("api/notifications/settings/", {
      method: "PUT",
      token: author.token,
      body: { email_post_likes: false },
    });
    expect(off.status).toBe(200);
    expect(off.body.data.email_post_likes).toBe(false);

    const post = await api("api/posts/", {
      method: "POST",
      token: author.token,
      body: { content: `Opted out ${unique()}`, visibility: "public" },
    });

    const before = inbox.length;
    await api(`api/posts/${post.body.data.id}/like/`, { method: "POST", token: liker.token });
    await new Promise((r) => setTimeout(r, 2500));

    const newMail = inbox.slice(before).filter((m) => m.to.join(" ").includes(author.email));
    expect(newMail, "a user who opted out was emailed anyway").toHaveLength(0);
  }, 120_000);
});

// ─────────────────────────────────────────────────────────────────────────────

describe("admin actions are audited", () => {
  let admin: TestUser;
  let target: TestUser;

  beforeAll(async () => {
    admin = await createUser();
    target = await createUser();
    // There is no self-service path to staff, by design.
    await db(() => prisma.user.update({ where: { id: admin.id }, data: { isStaff: true } }));
  }, 120_000);

  /**
   * Django: `log_admin_action` was defined and then called only from
   * `spheres/views.py`. Not one admin_views mutation recorded anything, so bans,
   * verifications and bulk deletes left no trace — while `/api/admin/v1/logs/`
   * faithfully rendered the resulting empty table.
   */
  it("writes an audit row for a verification", async () => {
    const before = await db(() => prisma.adminAuditLog.count());

    const res = await api("api/admin/v1/users/verify/", {
      method: "POST",
      token: admin.token,
      body: { userId: target.id, isVerified: true },
    });
    expect(res.status).toBe(200);

    const after = await db(() => prisma.adminAuditLog.count());
    expect(after, "the verification left no audit trail").toBe(before + 1);

    const row = await db(() =>
      prisma.adminAuditLog.findFirst({ where: { action: "users.verify" }, orderBy: { createdAt: "desc" } }),
    );
    expect(row?.actorId).toBe(admin.id);
    expect(row?.targetId).toBe(String(target.id));
    expect(row?.payloadDiff).toMatchObject({ to: true });
  }, 120_000);

  it("writes an audit row for a bulk ban, and refuses self-ban", async () => {
    const victim = await createUser();
    const before = await db(() => prisma.adminAuditLog.count());

    const banned = await api("api/admin/v1/users/bulk-ban/", {
      method: "POST",
      token: admin.token,
      body: { ids: [victim.id] },
    });
    expect(banned.status).toBe(200);
    expect(banned.body.data.updated).toBe(1);

    const selfBan = await api("api/admin/v1/users/bulk-ban/", {
      method: "POST",
      token: admin.token,
      body: { ids: [admin.id] },
    });
    expect(selfBan.body.data.updated, "an admin must not be able to ban themselves").toBe(0);

    // Both attempts are recorded: an attempted administrative action is worth
    // logging even when it changes nothing.
    const after = await db(() => prisma.adminAuditLog.count());
    expect(after).toBe(before + 2);

    const stillActive = await db(() =>
      prisma.user.findUnique({ where: { id: admin.id }, select: { isActive: true } }),
    );
    expect(stillActive?.isActive).toBe(true);
  }, 120_000);

  it("surfaces the rows through /api/admin/v1/logs/", async () => {
    const res = await api("api/admin/v1/logs/?page_size=10", { token: admin.token });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.pagination.total_items).toBeGreaterThan(0);
    expect(res.body.data.map((r: { action: string }) => r.action)).toContain("users.verify");
  }, 120_000);

  /**
   * Django: `/api/admin/reported-content/` padded its list with the 50 most recent
   * *posts*, each labelled "Pending moderation review" with the **author cast as
   * the reporter** — so the moderation queue was mostly unreported content and
   * every author appeared to have reported themselves.
   */
  it("lists only genuinely reported content", async () => {
    const author = await createUser();
    const reporter = await createUser();

    // Created and never reported: it is the control that must NOT appear.
    await api("api/posts/", {
      method: "POST",
      token: author.token,
      body: { content: `Never reported ${unique()}`, visibility: "public" },
    });
    const flagged = await api("api/posts/", {
      method: "POST",
      token: author.token,
      body: { content: `Will be reported ${unique()}`, visibility: "public" },
    });

    const reported = await api(`api/posts/${flagged.body.data.id}/report/`, {
      method: "POST",
      token: reporter.token,
      body: { reason: "spam" },
    });
    expect(reported.status).toBeLessThan(300);

    const queue = await api("api/admin/reported-content/", { token: admin.token });
    expect(queue.status).toBe(200);

    const contents = queue.body.data.map((item: { content: string }) => item.content);
    expect(contents.some((c: string) => c.startsWith("Will be reported"))).toBe(true);
    expect(
      contents.some((c: string) => c.startsWith("Never reported")),
      "an unreported post appeared in the moderation queue",
    ).toBe(false);

    // And the reporter is the person who reported, not the author.
    const entry = queue.body.data.find((item: { content: string }) => item.content.startsWith("Will be reported"));
    expect(entry.reason).not.toBe("Pending moderation review");
  }, 120_000);
});

// ─────────────────────────────────────────────────────────────────────────────

describe("routes that used to 500 or 404", () => {
  /** Django: `upload_stats` called `models.Sum(...)` with `models` never imported. */
  it("GET /api/uploads/stats/ returns aggregates instead of NameError", async () => {
    const user = await createUser();
    const res = await api("api/uploads/stats/", { token: user.token });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ total_uploads: 0, total_size_bytes: 0, by_type: {} });
  }, 60_000);

  /** Django: `Sphere.objects.values("type")` — the column is `sphere_type`. */
  it("GET /api/filters/ groups spheres by sphere_type instead of FieldError", async () => {
    const user = await createUser();
    const res = await api("api/filters/", { token: user.token });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.sphere_types)).toBe(true);
    expect(Array.isArray(res.body.data.sphere_categories)).toBe(true);
  }, 60_000);

  /** Mine, not Django's: the inventory records PUT as live and it was not routed. */
  it("PUT /api/users/profile/ updates, matching PATCH", async () => {
    const user = await createUser();

    const put = await api("api/users/profile/", {
      method: "PUT",
      token: user.token,
      body: { bio: "set via PUT" },
    });
    expect(put.status, "PUT must not 404").toBe(200);
    expect(put.body.data.bio).toBe("set via PUT");

    const patch = await api("api/users/profile/", {
      method: "PATCH",
      token: user.token,
      body: { bio: "set via PATCH" },
    });
    expect(patch.status).toBe(200);
    expect(patch.body.data.bio).toBe("set via PATCH");
  }, 60_000);

  /**
   * Django matched `email__icontains` in user search, turning the search box into
   * an address-confirmation oracle: type an address, learn whether it has an
   * account here.
   */
  it("user search does not match on email address", async () => {
    const searcher = await createUser();
    const subject = await createUser();

    const byEmail = await api(`api/search/?q=${encodeURIComponent(subject.email)}&type=users`, {
      token: searcher.token,
    });
    expect(byEmail.status).toBe(200);
    expect(byEmail.body.data.users, "email address leaked account existence").toHaveLength(0);

    // The account is genuinely findable by username, so this is not a broken index.
    const username = subject.email.split("@")[0];
    const byUsername = await api(`api/search/?q=${username}&type=users`, { token: searcher.token });
    expect(byUsername.body.data.users.length).toBeGreaterThan(0);
  }, 60_000);

  /**
   * Django served this to anonymous callers, disclosing which Supabase secrets are
   * configured plus the JWKS key set — free reconnaissance.
   */
  it("GET /api/auth/supabase/debug/ is not anonymous", async () => {
    const anonymous = await fetch(`${BASE_URL}/api/auth/supabase/debug/`);
    expect(anonymous.status).toBe(401);

    const user = await createUser();
    const asUser = await api("api/auth/supabase/debug/", { token: user.token });
    expect(asUser.status, "a non-admin must not read configuration state either").toBe(403);
  }, 60_000);
});
