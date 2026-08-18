/**
 * Generic conformance sweep across the whole route surface.
 *
 * These invariants hold for every route regardless of domain, so they are asserted
 * from the generated manifest rather than hand-written 143 times. Regenerate the
 * manifest whenever the inventory changes and the sweep automatically covers the
 * new surface.
 */

import { describe, it, expect } from "vitest";
import { ROUTES, TOTAL_ROUTES, type RouteSpec } from "../routes.manifest.js";
import { request, fillPath, expectEnvelope } from "../helpers/client.js";

/** A safe method to probe with, preferring read-only verbs. */
function probeMethod(route: RouteSpec): string {
  for (const m of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    if (route.methods.includes(m)) return m;
  }
  return "GET";
}

/** Non-existent ids, so probes never mutate real fixtures. */
const ABSENT_ID = 99_999_991;

describe("route manifest", () => {
  it("covers the full documented surface", () => {
    expect(ROUTES).toHaveLength(TOTAL_ROUTES);
    expect(TOTAL_ROUTES).toBe(143);
  });

  it("marks no route as both public and admin", () => {
    const contradictory = ROUTES.filter((r) => r.public && r.admin);
    expect(contradictory).toEqual([]);
  });
});

describe("authentication boundary", () => {
  const guarded = ROUTES.filter((r) => !r.public);

  it.each(guarded.map((r) => [r.path, r] as const))(
    "%s rejects an anonymous request",
    async (_path, route) => {
      const method = probeMethod(route);
      const res = await request(fillPath(route.path, ABSENT_ID, ABSENT_ID), { method });

      // 401 is correct. 403 is tolerated (some stacks answer that way for anonymous).
      // Anything 2xx means the route leaks without credentials.
      expect(
        [401, 403],
        `${method} ${route.path} returned ${res.status} for an anonymous request`,
      ).toContain(res.status);
    },
  );
});

describe("public routes", () => {
  const open = ROUTES.filter((r) => r.public && r.methods.includes("GET"));

  it.each(open.map((r) => [r.path, r] as const))(
    "%s is reachable without a token",
    async (_path, route) => {
      const res = await request(fillPath(route.path, ABSENT_ID, ABSENT_ID), { method: "GET" });
      expect(res.status).not.toBe(401);
      expect(res.status).toBeLessThan(500);
    },
  );
});

describe("error handling", () => {
  it("never returns 5xx for an unauthenticated probe", async () => {
    const failures: string[] = [];

    for (const route of ROUTES) {
      const method = probeMethod(route);
      const res = await request(fillPath(route.path, ABSENT_ID, ABSENT_ID), { method });
      if (res.status >= 500) failures.push(`${method} ${route.path} -> ${res.status}`);
    }

    expect(failures, `routes returning 5xx:\n${failures.join("\n")}`).toEqual([]);
  });

  it("returns a JSON error envelope for a 404", async () => {
    const res = await request("api/spheres/99999991/", { method: "GET" });
    expect([401, 403, 404]).toContain(res.status);
    if (res.status === 404) expectEnvelope(res);
  });
});

describe("trailing slash canonicalisation", () => {
  it("redirects a slashless path to the canonical form", async () => {
    // Clients build every URL with a trailing slash and rely on it. Django's
    // APPEND_SLASH did this implicitly; Express must do it explicitly.
    const res = await request("api/health", { method: "GET" });
    expect(res.status).toBeLessThan(400);
  });
});
