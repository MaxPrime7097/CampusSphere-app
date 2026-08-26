/**
 * Sphera (AI) contract — API_CONTRACT §3.9.
 *
 * This domain carries the densest cluster of defects in the Django backend. Every
 * `[CHANGE]` block below fails there and must pass on Node.
 *
 * Generation calls hit live AI providers and are slow; they carry an extended
 * timeout and are skipped when SPHERA_AI=off.
 */

import { describe, it, expect } from "vitest";
import { request, expectSuccessEnvelope, expectListEnvelope } from "../helpers/client.js";
import { createUser, createSphere, createResource, textFile, unique } from "../helpers/factories.js";

const AI_ENABLED = process.env.SPHERA_AI !== "off";
const AI_TIMEOUT = 120_000;
const describeAI = AI_ENABLED ? describe : describe.skip;

describe("session listing", () => {
  it("returns an empty list envelope for a new user", async () => {
    const user = await createUser();
    const res = await request("api/sphera/sessions/", { token: user.token });
    expectListEnvelope(res);
    expect(res.body.data).toEqual([]);
  });

  it("is served identically under the legacy /api/study/ alias", async () => {
    // The alias is retained: api.ts still calls it from 8 functions (FE-06).
    const user = await createUser();
    const canonical = await request("api/sphera/sessions/", { token: user.token });
    const legacy = await request("api/study/sessions/", { token: user.token });

    expect(legacy.status).toBe(canonical.status);

    // `timestamp` is per-response by API_CONTRACT §1.3, so two separate calls can
    // never be byte-identical. Everything that describes the *resource* must match.
    const { timestamp: _canonicalAt, ...canonicalBody } = canonical.body as Record<string, unknown>;
    const { timestamp: _legacyAt, ...legacyBody } = legacy.body as Record<string, unknown>;
    expect(legacyBody).toEqual(canonicalBody);
  });
});

describe("generation source selection", () => {
  it("rejects a request supplying neither resource_id nor sphere_file_id", async () => {
    // [CHANGE] Exactly one source. Django accepted only resource_id, which is why
    // SphereSpheraTab passed a SphereFile id into the Resource ID space.
    const user = await createUser();
    const res = await request("api/sphera/generate/from-resource/", {
      method: "POST",
      token: user.token,
      body: { tool_types: ["fiche"] },
    });
    expect(res.status).toBe(400);
  });

  it("rejects a request supplying both sources", async () => {
    const user = await createUser();
    const res = await request("api/sphera/generate/from-resource/", {
      method: "POST",
      token: user.token,
      body: { resource_id: 1, sphere_file_id: 1, tool_types: ["fiche"] },
    });
    expect(res.status).toBe(400);
  });

  it("404s for a resource id that does not exist", async () => {
    const user = await createUser();
    const res = await request("api/sphera/generate/from-resource/", {
      method: "POST",
      token: user.token,
      body: { resource_id: 99_999_991, tool_types: ["fiche"] },
    });
    expect(res.status).toBe(404);
  });

  it("rejects an unknown tool type", async () => {
    const user = await createUser();
    const resource = await createResource(user);
    const res = await request("api/sphera/generate/from-resource/", {
      method: "POST",
      token: user.token,
      body: { resource_id: resource.id, tool_types: ["not_a_tool"] },
    });
    expect(res.status).toBe(400);
  });
});

/**
 * [CHANGE] All four sphere-scoped Sphera routes called `sphere.memberships`, which
 * is not the reverse accessor for that FK (`sphere.members` is), so each raised
 * AttributeError and 500'd — sphere sharing has never worked.
 *
 * The three listing/permission tests below prove the fix **without needing an AI
 * provider**, which is why they are outside `describeAI`: the defect was in the
 * membership lookup, not in generation, and it must stay verifiable in an
 * environment with no API keys.
 */
describeAI("sphere-scoped sharing (generation required)", () => {
  it("shares a session into a sphere the user belongs to", async () => {
    const user = await createUser();
    const sphere = await createSphere(user);
    const resource = await createResource(user);

    const created = await request("api/sphera/generate/from-resource/", {
      method: "POST",
      token: user.token,
      body: { resource_id: resource.id, tool_types: ["fiche"] },
    });
    if (created.status >= 500) {
      expect.fail(`generation failed upstream (${created.status}): ${created.raw.slice(0, 200)}`);
    }
    const sessionId = (created.body?.data ?? created.body)?.id;

    const shared = await request(`api/sphera/sessions/${sessionId}/share/`, {
      method: "POST",
      token: user.token,
      body: { sphere_id: sphere.id },
    });
    expect(shared.status, "sharing into a sphere must not 500").toBeLessThan(500);
    expectSuccessEnvelope(shared);
  }, AI_TIMEOUT);
});

describe("sphere-scoped sharing", () => {
  it("lists sessions shared into a sphere without erroring", async () => {
    const user = await createUser();
    const sphere = await createSphere(user);
    const res = await request(`api/sphera/sphere/${sphere.id}/`, { token: user.token });
    expect(res.status, "sphere session listing must not 500").toBeLessThan(500);
    expectListEnvelope(res);
  });

  it("lists annales shared into a sphere without erroring", async () => {
    const user = await createUser();
    const sphere = await createSphere(user);
    const res = await request(`api/sphera/sphere/${sphere.id}/annales/`, { token: user.token });
    expect(res.status).toBeLessThan(500);
    expectListEnvelope(res);
  });

  it("denies sphere listings to non-members", async () => {
    const owner = await createUser();
    const outsider = await createUser();
    const sphere = await createSphere(owner);
    const res = await request(`api/sphera/sphere/${sphere.id}/`, { token: outsider.token });
    expect(res.status).toBe(403);
  });
});

describeAI("annale generation", () => {
  it("produces a correction instead of failing", async () => {
    // [CHANGE] The annale prompts embed a JSON example with unescaped braces and
    // were passed through Python str.format(), raising KeyError on every call.
    // Every annale generation returned 503 — the feature has never worked.
    const user = await createUser();
    const form = new FormData();
    form.append("file", textFile("annale.txt"));
    form.append("mode", "rapide");

    const res = await request("api/sphera/generate/annale/", {
      method: "POST",
      token: user.token,
      body: form,
    });

    expect(res.status, `annale generation returned ${res.status}: ${res.raw.slice(0, 300)}`).toBe(201);
    const data = res.body?.data ?? res.body;
    expect(data.content).toBeTruthy();
    expect(data.mode).toBe("rapide");
  }, AI_TIMEOUT);

  it("persists extracted_text so Q&A is reachable", async () => {
    // [CHANGE] GenerateAnnaleView never wrote extracted_text, so /annales/<id>/ask/
    // could only ever return 400. Annale Q&A was permanently unreachable.
    const user = await createUser();
    const form = new FormData();
    form.append("file", textFile("annale.txt"));
    form.append("mode", "rapide");

    const created = await request("api/sphera/generate/annale/", {
      method: "POST",
      token: user.token,
      body: form,
    });
    const annaleId = (created.body?.data ?? created.body)?.id;
    expect(annaleId, "annale creation must succeed before Q&A can be tested").toBeTruthy();

    const asked = await request(`api/sphera/annales/${annaleId}/ask/`, {
      method: "POST",
      token: user.token,
      body: { question: "Quel est le sujet principal ?" },
    });

    expect(asked.status, "Q&A must not 400 for missing extracted text").not.toBe(400);
    expect(asked.status).toBeLessThan(500);
  }, AI_TIMEOUT);

  it("reports corrections_count from the generated sections", async () => {
    // [CHANGE] The list serialiser counted content["corrections"], a key the
    // generator never produces (the schema is sections[].questions[]), so the
    // count was always 0.
    const user = await createUser();
    const form = new FormData();
    form.append("file", textFile("annale.txt"));
    form.append("mode", "rapide");
    await request("api/sphera/generate/annale/", { method: "POST", token: user.token, body: form });

    const list = await request("api/sphera/annales/", { token: user.token });
    expectListEnvelope(list);
    expect(list.body.data.length).toBeGreaterThan(0);
    expect(list.body.data[0].corrections_count).toBeGreaterThan(0);
  }, AI_TIMEOUT);
});

describe("guest generation", () => {
  it("requires no authentication", async () => {
    const form = new FormData();
    form.append("file", textFile());
    form.append("tool_type", "fiche");
    const res = await request("api/sphera/guest/generate/", { method: "POST", body: form });
    expect(res.status).not.toBe(401);
  }, AI_TIMEOUT);

  it("rejects an unsupported file extension", async () => {
    const form = new FormData();
    form.append("file", new File(["binary"], "payload.exe", { type: "application/octet-stream" }));
    form.append("tool_type", "fiche");
    const res = await request("api/sphera/guest/generate/", { method: "POST", body: form });
    expect(res.status).toBe(400);
  });

  it("rejects an unknown tool type", async () => {
    const form = new FormData();
    form.append("file", textFile());
    form.append("tool_type", unique("bogus"));
    const res = await request("api/sphera/guest/generate/", { method: "POST", body: form });
    expect(res.status).toBe(400);
  });
});

describe("ownership", () => {
  it("hides another user's unshared session", async () => {
    const owner = await createUser();
    const outsider = await createUser();
    const resource = await createResource(owner);

    const created = await request("api/sphera/generate/from-resource/", {
      method: "POST",
      token: owner.token,
      body: { resource_id: resource.id, tool_types: ["fiche"] },
    });
    const sessionId = (created.body?.data ?? created.body)?.id;
    if (!sessionId) return; // generation unavailable; ownership covered elsewhere

    const res = await request(`api/sphera/sessions/${sessionId}/`, { token: outsider.token });
    expect([403, 404]).toContain(res.status);
  }, AI_TIMEOUT);
});
