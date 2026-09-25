/**
 * Spheres contract — API_CONTRACT §3.3.
 */

import { describe, it, expect } from "vitest";
import { request, expectListEnvelope } from "../helpers/client.js";
import { createUser, createSphere, joinSphere, unique } from "../helpers/factories.js";

describe("creation", () => {
  it("makes the creator an active admin member", async () => {
    const user = await createUser();
    const sphere = await createSphere(user);

    const members = await request(`api/spheres/${sphere.id}/members/`, { token: user.token });
    expectListEnvelope(members);

    const creator = members.body.data.find((m: any) => (m.user_info?.id ?? m.user) === user.id);
    expect(creator).toBeTruthy();
    expect(creator.role).toBe("admin");
    expect(creator.status).toBe("active");
  });

  it("reports member_count of 1 immediately after creation", async () => {
    const user = await createUser();
    const sphere = await createSphere(user);
    const res = await request(`api/spheres/${sphere.id}/`, { token: user.token });
    const data = res.body?.data ?? res.body;
    expect(data.member_count).toBe(1);
  });
});

describe("my_spheres filter", () => {
  it("returns only spheres the caller belongs to", async () => {
    // [CHANGE] Django ignored unknown query params, so the three client call sites
    // passing my_spheres=true were listing every sphere on the platform.
    const owner = await createUser();
    const outsider = await createUser();
    const mine = await createSphere(outsider);
    const theirs = await createSphere(owner);

    const res = await request("api/spheres/?my_spheres=true", { token: outsider.token });
    expectListEnvelope(res);

    const ids = res.body.data.map((s: any) => s.id);
    expect(ids).toContain(mine.id);
    expect(ids, "my_spheres=true must exclude spheres the caller is not a member of").not.toContain(
      theirs.id,
    );
  });

  it("returns the full visible set without the filter", async () => {
    const owner = await createUser();
    const outsider = await createUser();
    const theirs = await createSphere(owner);

    const res = await request("api/spheres/", { token: outsider.token });
    expectListEnvelope(res);
    expect(res.body.data.map((s: any) => s.id)).toContain(theirs.id);
  });
});

describe("membership", () => {
  it("joins an open sphere immediately", async () => {
    const owner = await createUser();
    const joiner = await createUser();
    const sphere = await createSphere(owner, { require_approval: false });

    const res = await joinSphere(joiner, sphere.id);
    expect(res.status).toBe(200);
    const data = res.body?.data ?? res.body;
    expect(data.status).toBe("active");
  });

  it("queues a join request when approval is required", async () => {
    const owner = await createUser();
    const joiner = await createUser();
    const sphere = await createSphere(owner, { require_approval: true });

    const res = await joinSphere(joiner, sphere.id);
    const data = res.body?.data ?? res.body;
    expect(data.status).toBe("pending");
  });

  it("rejects a duplicate join with 409", async () => {
    const owner = await createUser();
    const joiner = await createUser();
    const sphere = await createSphere(owner);

    await joinSphere(joiner, sphere.id);
    const second = await joinSphere(joiner, sphere.id);
    expect(second.status).toBe(409);
  });

  it("refuses to let the sole admin leave", async () => {
    const owner = await createUser();
    const sphere = await createSphere(owner);
    const res = await request(`api/spheres/${sphere.id}/leave/`, { method: "POST", token: owner.token });
    expect(res.status).toBe(400);
  });

  it("cancels a pending request", async () => {
    const owner = await createUser();
    const joiner = await createUser();
    const sphere = await createSphere(owner, { require_approval: true });

    await joinSphere(joiner, sphere.id);
    const res = await request(`api/spheres/${sphere.id}/cancel-request/`, {
      method: "DELETE",
      token: joiner.token,
    });
    expect(res.status).toBeLessThan(300);
  });
});

describe("visibility", () => {
  it("hides a private sphere from non-members", async () => {
    const owner = await createUser();
    const outsider = await createUser();
    const sphere = await createSphere(owner, { is_private: true });

    const list = await request("api/spheres/", { token: outsider.token });
    expectListEnvelope(list);
    expect(list.body.data.map((s: any) => s.id)).not.toContain(sphere.id);

    const detail = await request(`api/spheres/${sphere.id}/`, { token: outsider.token });
    expect([403, 404]).toContain(detail.status);
  });

  it("shows a private sphere to its creator", async () => {
    const owner = await createUser();
    const sphere = await createSphere(owner, { is_private: true });
    const res = await request(`api/spheres/${sphere.id}/`, { token: owner.token });
    expect(res.status).toBe(200);
  });
});

describe("mutation permissions", () => {
  it("allows only the creator to update", async () => {
    const owner = await createUser();
    const member = await createUser();
    const sphere = await createSphere(owner);
    await joinSphere(member, sphere.id);

    const res = await request(`api/spheres/${sphere.id}/`, {
      method: "PATCH",
      token: member.token,
      body: { name: unique("Hijacked ") },
    });
    expect(res.status).toBe(403);
  });

  it("allows only the creator to delete", async () => {
    const owner = await createUser();
    const member = await createUser();
    const sphere = await createSphere(owner);
    await joinSphere(member, sphere.id);

    expect((await request(`api/spheres/${sphere.id}/`, { method: "DELETE", token: member.token })).status).toBe(403);
    expect((await request(`api/spheres/${sphere.id}/`, { method: "DELETE", token: owner.token })).status).toBeLessThan(300);
  });
});

describe("features endpoint", () => {
  it("mirrors the client-side feature matrix for each sphere type", async () => {
    // UNUSED route, but it must stay in sync with config/sphereFeatures.ts —
    // the frontend currently duplicates this table locally.
    const user = await createUser();
    const expected: Record<string, Record<string, boolean>> = {
      projet: { has_kanban: true, has_tasks: true, has_sphera: false },
      cours: { has_kanban: false, has_sphera: true, has_announcements: true },
      communaute: { has_feed: true, has_kanban: false },
    };

    for (const [type, flags] of Object.entries(expected)) {
      const sphere = await createSphere(user, { sphere_type: type });
      const res = await request(`api/spheres/${sphere.id}/features/`, { token: user.token });
      expect(res.status).toBe(200);
      const data = res.body?.data ?? res.body;
      for (const [flag, value] of Object.entries(flags)) {
        expect(data[flag], `${type}.${flag}`).toBe(value);
      }
    }
  });
});
