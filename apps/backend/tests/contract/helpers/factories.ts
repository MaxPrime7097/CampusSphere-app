/**
 * Test fixtures, built exclusively through the public API.
 *
 * Native register/login is used rather than the Supabase exchange because it needs
 * no external identity provider — and it exists on both backends, so the suite can
 * bootstrap itself against either. Note that in production this path is used only
 * by the standalone Sphera app; the main web app is Supabase-only.
 */

import { request, expectSuccessEnvelope } from "./client.js";

let counter = 0;
const runId = Date.now().toString(36);

/** Collision-free identifier for a parallel test run. */
export function unique(prefix = "t"): string {
  counter += 1;
  return `${prefix}${runId}${counter}`;
}

export interface TestUser {
  id: number;
  username: string;
  email: string;
  password: string;
  token: string;
  refresh: string;
}

export async function createUser(overrides: Record<string, unknown> = {}): Promise<TestUser> {
  const username = unique("user");
  const email = `${username}@contract.test`;
  const password = "ContractTest!2026";

  const res = await request("api/users/auth/register/", {
    method: "POST",
    body: {
      username,
      email,
      password,
      confirm_password: password,
      first_name: "Contract",
      last_name: "Test",
      ...overrides,
    },
  });

  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`createUser failed (${res.status}): ${res.raw.slice(0, 300)}`);
  }

  const data = res.body?.data ?? res.body;
  const tokens = data?.tokens ?? {};
  return {
    id: data?.user?.id,
    username,
    email,
    password,
    token: tokens.accessToken ?? tokens.access,
    refresh: tokens.refreshToken ?? tokens.refresh,
  };
}

/** A user whose profile satisfies the completion rule (university + faculty + study_year). */
export async function createCompleteUser(): Promise<TestUser> {
  const user = await createUser();
  await request("api/users/profile/", {
    method: "PATCH",
    token: user.token,
    body: { university: "universite_yaounde_1", faculty: "developpement_web", study_year: "l3" },
  });
  return user;
}

export async function login(email: string, password: string) {
  const res = await request("api/users/auth/login/", { method: "POST", body: { email, password } });
  expectSuccessEnvelope(res);
  const tokens = res.body.data.tokens;
  return { token: tokens.accessToken ?? tokens.access, refresh: tokens.refreshToken ?? tokens.refresh };
}

export async function createSphere(owner: TestUser, overrides: Record<string, unknown> = {}) {
  const res = await request("api/spheres/", {
    method: "POST",
    token: owner.token,
    body: {
      name: unique("Sphere "),
      description: "Created by the contract suite.",
      category: "academic",
      sphere_type: "projet",
      ...overrides,
    },
  });
  if (res.status !== 201) throw new Error(`createSphere failed (${res.status}): ${res.raw.slice(0, 300)}`);
  return res.body?.data ?? res.body;
}

export async function joinSphere(user: TestUser, sphereId: number) {
  return request(`api/spheres/${sphereId}/join/`, { method: "POST", token: user.token, body: {} });
}

export async function createPost(author: TestUser, overrides: Record<string, unknown> = {}) {
  const res = await request("api/posts/", {
    method: "POST",
    token: author.token,
    body: { content: `Contract suite post ${unique()}`, visibility: "public", ...overrides },
  });
  if (res.status !== 201) throw new Error(`createPost failed (${res.status}): ${res.raw.slice(0, 300)}`);
  return res.body?.data ?? res.body;
}

/** Small in-memory text file, adequate for upload and extraction paths. */
export function textFile(name = "contract.txt", content?: string): File {
  const body =
    content ??
    "Chapitre 1. Les hooks React permettent de gerer l'etat dans les composants " +
      "fonctionnels. useState retourne une valeur et un setter. useEffect declenche " +
      "un effet de bord apres le rendu. Ce texte depasse le seuil minimal d'extraction.";
  return new File([body], name, { type: "text/plain" });
}

export async function createResource(author: TestUser, overrides: Record<string, string> = {}) {
  const form = new FormData();
  form.append("file", textFile());
  form.append("title", unique("Resource "));
  form.append("type", "cours");
  form.append("visibility", "public");
  for (const [k, v] of Object.entries(overrides)) form.append(k, v);

  const res = await request("api/resources/", { method: "POST", token: author.token, body: form });
  if (res.status !== 201) throw new Error(`createResource failed (${res.status}): ${res.raw.slice(0, 300)}`);
  return res.body?.data ?? res.body;
}

export async function getMe(token: string) {
  const res = await request("api/users/auth/me/", { token });
  return res.body?.data ?? res.body;
}

/** Impact score for a user, read back through the public profile endpoint. */
export async function impactScore(user: TestUser): Promise<number> {
  const me = await getMe(user.token);
  return Number(me?.impact_score ?? me?.impactScore ?? 0);
}
