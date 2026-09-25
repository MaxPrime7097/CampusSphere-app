/**
 * Authentication contract — API_CONTRACT §3.1.
 *
 * Several assertions here fail against the Django backend by design; each one
 * encodes a defect the migration is required to fix.
 */

import { describe, it, expect } from "vitest";
import { request, expectSuccessEnvelope, expectErrorEnvelope } from "../helpers/client.js";
import { createUser, createCompleteUser, login, unique, getMe } from "../helpers/factories.js";

describe("native registration and login", () => {
  it("registers and returns a usable token pair", async () => {
    const user = await createUser();
    expect(user.id).toBeTypeOf("number");
    expect(user.token).toBeTruthy();
    expect(user.refresh).toBeTruthy();

    const me = await getMe(user.token);
    expect(me.username).toBe(user.username);
  });

  it("rejects a duplicate email with 409", async () => {
    const user = await createUser();
    const res = await request("api/users/auth/register/", {
      method: "POST",
      body: {
        username: unique("other"),
        email: user.email,
        password: "ContractTest!2026",
        confirm_password: "ContractTest!2026",
        first_name: "Dup",
        last_name: "Licate",
      },
    });
    expect(res.status).toBe(409);
    expectErrorEnvelope(res);
  });

  it("logs in with the registered credentials", async () => {
    const user = await createUser();
    const { token } = await login(user.email, user.password);
    const me = await getMe(token);
    expect(me.id).toBe(user.id);
  });

  it("rejects a wrong password with 401", async () => {
    const user = await createUser();
    const res = await request("api/users/auth/login/", {
      method: "POST",
      body: { email: user.email, password: "wrong-password" },
    });
    expect(res.status).toBe(401);
  });
});

describe("current user", () => {
  it("reports authenticated:false for an anonymous caller rather than 401", async () => {
    const res = await request("api/users/auth/me/");
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });

  it("redacts sensitive fields from other users' profiles", async () => {
    const owner = await createUser();
    const viewer = await createUser();

    const res = await request(`api/users/${owner.id}/`, { token: viewer.token });
    expectSuccessEnvelope(res);

    // Strictly self-only, not relaxed for connections — API_CONTRACT §2.
    for (const field of ["email", "phone_number", "date_of_birth", "student_id", "town"]) {
      expect(res.body.data[field], `${field} leaked to a non-owner`).toBeNull();
    }
  });

  it("does not redact the caller's own profile", async () => {
    const user = await createUser();
    const res = await request(`api/users/${user.id}/`, { token: user.token });
    expectSuccessEnvelope(res);
    expect(res.body.data.email).toBe(user.email);
  });
});

describe("token refresh and revocation", () => {
  it("exchanges a refresh token for a new access token", async () => {
    const user = await createUser();
    const res = await request("api/auth/refresh/", { method: "POST", body: { refresh: user.refresh } });
    expect(res.status).toBe(200);
    expect(res.body.access ?? res.body.data?.access).toBeTruthy();
  });

  it("revokes the refresh token on logout", async () => {
    // [CHANGE] Django set BLACKLIST_AFTER_ROTATION but never installed the
    // token_blacklist app, so the blacklist call silently no-opped inside a bare
    // `except` and refresh tokens stayed valid forever after logout.
    const user = await createUser();
    await request("api/users/auth/logout/", {
      method: "POST",
      token: user.token,
      body: { refresh: user.refresh },
    });

    const res = await request("api/auth/refresh/", { method: "POST", body: { refresh: user.refresh } });
    expect(res.status, "a revoked refresh token must not mint new access tokens").toBe(401);
  });
});

describe("availability check", () => {
  it("returns the nested shape the client reads", async () => {
    // [CHANGE] Django returned flat `{username_available}` while Register.tsx reads
    // `data.username.available`, so the check silently always reported "available"
    // and duplicate usernames were only caught at submit time.
    const user = await createUser();
    const res = await request("api/users/check-availability/", {
      method: "POST",
      body: { username: user.username, email: user.email },
    });

    expectSuccessEnvelope(res);
    expect(res.body.data.username.available).toBe(false);
    expect(res.body.data.email.available).toBe(false);
  });

  it("reports a free username as available", async () => {
    const res = await request("api/users/check-availability/", {
      method: "POST",
      body: { username: unique("free") },
    });
    expectSuccessEnvelope(res);
    expect(res.body.data.username.available).toBe(true);
  });

  it("still emits the deprecated flat aliases", async () => {
    const user = await createUser();
    const res = await request("api/users/check-availability/", {
      method: "POST",
      body: { username: user.username },
    });
    expect(res.body.data.username_available).toBe(false);
  });
});

describe("profile completion", () => {
  it("treats a profile with no academic fields as incomplete", async () => {
    // [CHANGE] REQUIRED_PROFILE_FIELDS was [], so `all([])` returned True and
    // is_profile_complete was force-written True on every login, permanently
    // defeating onboarding.
    const user = await createUser();
    const me = await getMe(user.token);
    expect(me.is_profile_complete ?? me.needs_profile_completion === false).toBeFalsy();
  });

  it("treats university + faculty + study_year as complete", async () => {
    const user = await createCompleteUser();
    const me = await getMe(user.token);
    expect(me.is_profile_complete).toBe(true);
  });
});
