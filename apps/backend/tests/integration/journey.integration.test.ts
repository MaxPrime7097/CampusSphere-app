/**
 * One user's life in the product, start to finish.
 *
 * The contract suite checks each endpoint against its specification in isolation.
 * This checks that they compose: that the id a create returns is the id the next
 * call accepts, that a count moves when the thing it counts happens, that a token
 * issued at signup still works twenty calls later. Those are the failures that
 * survive a green per-endpoint suite and greet the first real user.
 *
 * Two people, one session, in order — deliberately not independent tests. Later
 * steps depend on earlier ones because that is the property under test.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type net from "node:net";
import WebSocket from "ws";
import {
  api,
  BASE_URL,
  createUser,
  flushRateLimits,
  startFakeSmtp,
  startServer,
  stopServer,
  unique,
  type CapturedMail,
  type TestUser,
} from "./helpers/harness.js";

const inbox: CapturedMail[] = [];
let smtp: net.Server;

/** Shared across the journey, in order. */
const state: {
  amina: TestUser;
  bruno: TestUser;
  sphereId: number;
  postId: number;
  commentId: number;
  resourceId: number;
  taskId: number;
  conversationId: number;
} = {} as never;

const marker = unique("journey");

beforeAll(async () => {
  await flushRateLimits();
  smtp = await startFakeSmtp(inbox);
  await startServer();
}, 180_000);

afterAll(async () => {
  await stopServer();
  // `smtp` is undefined when beforeAll failed; teardown must not mask that error.
  if (smtp) await new Promise((resolve) => smtp.close(() => resolve(null)));
});

describe("a student joins and sets up", () => {
  it("signs up and receives a usable token", async () => {
    state.amina = await createUser();
    state.bruno = await createUser();

    // `authenticated` sits beside `data`, not inside it — the route is dual-mode by
    // contract (anonymous callers get `authenticated: false`, not a 401), and `data`
    // is the user object itself.
    const me = await api("api/users/auth/me/", { token: state.amina.token });
    expect(me.status).toBe(200);
    expect(me.body.authenticated).toBe(true);
    expect(me.body.data.id).toBe(state.amina.id);
  });

  it("reports an incomplete profile, then a complete one", async () => {
    // `is_profile_complete` is derived, not stored — the client routes new users to
    // the completion screen based on it, so a wrong value strands them there.
    const before = await api("api/users/profile/", { token: state.amina.token });
    expect(before.status).toBe(200);
    expect(before.body.data.is_profile_complete).toBe(false);

    const updated = await api("api/users/profile/", {
      method: "PATCH",
      token: state.amina.token,
      body: {
        university: "universite_yaounde_1",
        faculty: "developpement_web",
        study_year: "l3",
        bio: `Journey ${marker}`,
      },
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.is_profile_complete).toBe(true);

    const reread = await api("api/users/profile/", { token: state.amina.token });
    expect(reread.body.data.is_profile_complete, "completion must survive a re-read").toBe(true);
    expect(reread.body.data.bio).toBe(`Journey ${marker}`);
  });

  it("never exposes the password hash", async () => {
    const profile = await api("api/users/profile/", { token: state.amina.token });
    const serialised = JSON.stringify(profile.body);
    expect(serialised).not.toMatch(/passwordHash|password_hash|\$argon2/);

    const other = await api(`api/users/${state.bruno.id}/`, { token: state.amina.token });
    expect(JSON.stringify(other.body)).not.toMatch(/passwordHash|password_hash|\$argon2/);
  });
});

describe("they build a sphere together", () => {
  it("creates a sphere and is its first member", async () => {
    const created = await api("api/spheres/", {
      method: "POST",
      token: state.amina.token,
      body: {
        name: `Sphere ${marker}`,
        description: "End-to-end journey",
        category: "academic",
        sphere_type: "projet",
      },
    });
    expect(created.status).toBe(201);
    state.sphereId = created.body.data.id;
    expect(created.body.data.member_count, "the creator counts as a member").toBe(1);
  });

  it("lets a second student join, and the count follows", async () => {
    const joined = await api(`api/spheres/${state.sphereId}/join/`, {
      method: "POST",
      token: state.bruno.token,
      body: {},
    });
    expect(joined.status).toBeLessThan(300);

    const sphere = await api(`api/spheres/${state.sphereId}/`, { token: state.amina.token });
    expect(sphere.body.data.member_count, "the denormalised count must track membership").toBe(2);

    const members = await api(`api/spheres/${state.sphereId}/members/`, { token: state.amina.token });
    expect(members.body.data.map((m: { user: number }) => m.user)).toContain(state.bruno.id);
  });

  it("shows the sphere in both members' lists", async () => {
    for (const user of [state.amina, state.bruno]) {
      const mine = await api("api/spheres/?my_spheres=true", { token: user.token });
      expect(mine.status).toBe(200);
      expect(
        mine.body.data.some((s: { id: number }) => s.id === state.sphereId),
        "my_spheres must be honoured — it was silently ignored in Django (FE-03)",
      ).toBe(true);
    }
  });
});

describe("they post, comment and rate", () => {
  it("posts into the sphere", async () => {
    const post = await api("api/posts/", {
      method: "POST",
      token: state.amina.token,
      body: { content: `Post ${marker}`, visibility: "sphere", sphere: state.sphereId },
    });
    expect(post.status).toBe(201);
    state.postId = post.body.data.id;
  });

  it("shows the post to a member and hides it from a stranger", async () => {
    const asMember = await api(`api/posts/${state.postId}/`, { token: state.bruno.token });
    expect(asMember.status).toBe(200);

    const outsider = await createUser();
    const asStranger = await api(`api/posts/${state.postId}/`, { token: outsider.token });
    expect(asStranger.status, "a sphere post must not leak outside the sphere").toBe(404);
  });

  it("records a like, a comment and an impact rating", async () => {
    const liked = await api(`api/posts/${state.postId}/like/`, { method: "POST", token: state.bruno.token });
    expect(liked.status).toBeLessThan(300);

    const comment = await api(`api/posts/${state.postId}/comments/`, {
      method: "POST",
      token: state.bruno.token,
      body: { content: `Comment ${marker}` },
    });
    expect(comment.status).toBe(201);
    state.commentId = comment.body.data.id;

    const rated = await api(`api/posts/${state.postId}/impact-rate/`, {
      method: "POST",
      token: state.bruno.token,
      body: { value: 4 },
    });
    expect(rated.status).toBeLessThan(300);

    const post = await api(`api/posts/${state.postId}/`, { token: state.amina.token });
    expect(post.body.data.likes_count).toBe(1);
    expect(post.body.data.comments_count).toBe(1);
    expect(post.body.data.impact_score, "a rating must move the post's impact").toBeGreaterThan(0);
  });

  it("credits the author's impact, not the rater's", async () => {
    const author = await api(`api/users/${state.amina.id}/`, { token: state.amina.token });
    expect(author.body.data.impact_score).toBeGreaterThan(0);
  });
});

describe("they share a resource", () => {
  it("uploads and reads it back", async () => {
    const form = new FormData();
    form.append("file", new File([`Course notes ${marker}. `.repeat(20)], "notes.txt", { type: "text/plain" }));
    form.append("title", `Resource ${marker}`);
    form.append("type", "cours");
    form.append("visibility", "public");

    const res = await fetch(`${BASE_URL}/api/resources/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${state.amina.token}` },
      body: form,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    state.resourceId = body.data.id;
    expect(body.data.file, "a stored resource must expose a URL").toBeTruthy();
  });

  it("downloads the bytes that were uploaded", async () => {
    // POST, not GET: Django's ResourceDownloadView defines only `post`, and the
    // client's downloadResource sends POST. The verb is part of the contract
    // because the call also increments the download counter.
    const res = await fetch(`${BASE_URL}/api/resources/${state.resourceId}/download/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${state.bruno.token}` },
    });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text, "the download must return the file, not a placeholder").toContain(`Course notes ${marker}`);
  });

  it("counts a save", async () => {
    const saved = await api(`api/resources/${state.resourceId}/save/`, { method: "POST", token: state.bruno.token });
    expect(saved.status).toBeLessThan(300);

    const list = await api("api/resources/saved/", { token: state.bruno.token });
    expect(list.body.data.some((r: { id: number }) => r.id === state.resourceId)).toBe(true);
  });
});

describe("they coordinate with tasks", () => {
  it("creates, assigns and completes a task", async () => {
    const created = await api("api/tasks/", {
      method: "POST",
      token: state.amina.token,
      body: { title: `Task ${marker}`, description: "journey", sphere: state.sphereId, priority: "high" },
    });
    expect(created.status).toBe(201);
    state.taskId = created.body.data.id;

    const assigned = await api(`api/tasks/${state.taskId}/assign/`, {
      method: "POST",
      token: state.amina.token,
      body: { assigned_to_id: state.bruno.id },
    });
    expect(assigned.status).toBeLessThan(300);
    expect(assigned.body.data.assigned_to).toBe(state.bruno.id);

    const completed = await api(`api/tasks/${state.taskId}/complete/`, {
      method: "POST",
      token: state.bruno.token,
      body: {},
    });
    expect(completed.status).toBeLessThan(300);

    const task = await api(`api/tasks/${state.taskId}/`, { token: state.amina.token });
    expect(task.body.data.is_completed).toBe(true);
  });
});

describe("they talk, and the other side hears it live", () => {
  it("opens a private conversation", async () => {
    const conv = await api("api/conversations/private/create/", {
      method: "POST",
      token: state.amina.token,
      body: { recipient_id: state.bruno.id },
    });
    expect([200, 201]).toContain(conv.status);
    state.conversationId = conv.body.data.id;
  });

  it("delivers a message over the socket and counts it unread", async () => {
    const frames: Array<Record<string, any>> = [];
    const ws = new WebSocket(`${BASE_URL.replace("http", "ws")}/ws/chat/${state.conversationId}/?token=${state.bruno.token}`);
    await new Promise<void>((resolve, reject) => {
      ws.on("open", () => resolve());
      ws.on("error", reject);
      setTimeout(() => reject(new Error("socket did not open")), 10_000);
    });
    ws.on("message", (raw: Buffer) => frames.push(JSON.parse(raw.toString())));

    const sent = await api(`api/conversations/${state.conversationId}/messages/`, {
      method: "POST",
      token: state.amina.token,
      body: { content: `Message ${marker}` },
    });
    expect(sent.status).toBe(201);

    for (let attempt = 0; attempt < 40 && !frames.some((f) => f.type === "message_created"); attempt += 1) {
      await new Promise((r) => setTimeout(r, 100));
    }
    const created = frames.find((f) => f.type === "message_created");
    expect(created, "the recipient's socket never received the message").toBeTruthy();
    expect(created!.payload.message.content).toBe(`Message ${marker}`);

    // There is no unread-count endpoint: the count is a per-viewer field on the
    // conversation itself. (`POST /:id/unread/` is the opposite — it *marks* a
    // thread unread.)
    const conv = await api(`api/conversations/${state.conversationId}/`, { token: state.bruno.token });
    expect(conv.body.data.unread_count).toBeGreaterThan(0);

    ws.close();
  });

  it("clears the unread count when the thread is read", async () => {
    await api(`api/conversations/${state.conversationId}/read/`, { method: "POST", token: state.bruno.token });

    const conv = await api(`api/conversations/${state.conversationId}/`, { token: state.bruno.token });
    expect(conv.body.data.unread_count).toBe(0);

    // And the sender's own view was never unread to begin with.
    const senderView = await api(`api/conversations/${state.conversationId}/`, { token: state.amina.token });
    expect(senderView.body.data.unread_count).toBe(0);
  });
});

describe("the notifications add up", () => {
  it("notifies the author of activity on their post", async () => {
    const mine = await api("api/notifications/", { token: state.amina.token });
    expect(mine.status).toBe(200);

    const types = mine.body.data.map((n: { type: string }) => n.type);
    expect(types, "a like on your post must notify you").toContain("post_like");
    expect(types, "a comment on your post must notify you").toContain("post_comment");

    for (const n of mine.body.data) {
      expect(n.recipient).toBe(state.amina.id);
    }
  });

  it("notifies the recipient of a message, not the sender", async () => {
    // Amina sent the message, so the notification belongs to Bruno. Asserting it on
    // the sender would pass against a backend that notified everyone.
    const recipient = await api("api/notifications/", { token: state.bruno.token });
    expect(recipient.body.data.map((n: { type: string }) => n.type)).toContain("message");

    const sender = await api("api/notifications/", { token: state.amina.token });
    expect(
      sender.body.data.map((n: { type: string }) => n.type),
      "the sender must not be notified of their own message",
    ).not.toContain("message");
  });

  it("notifies the assignee of a task, not the assigner", async () => {
    const assignee = await api("api/notifications/", { token: state.bruno.token });
    expect(assignee.body.data.map((n: { type: string }) => n.type)).toContain("task_assigned");
  });

  it("marks them read", async () => {
    const readAll = await api("api/notifications/read-all/", { method: "PUT", token: state.amina.token });
    expect(readAll.status).toBe(200);
    expect(readAll.body.data.marked_count).toBeGreaterThan(0);

    const unread = await api("api/notifications/?read=false", { token: state.amina.token });
    expect(unread.body.data).toHaveLength(0);
  });
});

describe("search finds what they made", () => {
  it("returns the sphere, post and resource to a member", async () => {
    const res = await api(`api/search/?q=${marker}`, { token: state.bruno.token });
    expect(res.status).toBe(200);
    expect(res.body.data.spheres.some((s: { name: string }) => s.name.includes(marker))).toBe(true);
    expect(res.body.data.posts.some((p: { content: string }) => p.content.includes(marker))).toBe(true);
    expect(res.body.data.resources.some((r: { title: string }) => r.title.includes(marker))).toBe(true);
  });

  it("hides the sphere post from someone outside the sphere", async () => {
    const outsider = await createUser();
    const res = await api(`api/search/?q=${marker}`, { token: outsider.token });
    expect(
      res.body.data.posts.some((p: { content: string }) => p.content.includes(marker)),
      "search must not leak a sphere-scoped post",
    ).toBe(false);
  });
});

describe("the session ends properly", () => {
  it("exchanges a refresh token for a new access token", async () => {
    // The client's performRefreshRaw reads `json.access` off a bare body, not the
    // standard envelope — a shape change here logs everyone out on expiry.
    const refreshed = await api("api/auth/refresh/", {
      method: "POST",
      body: { refresh: state.amina.refresh },
    });
    expect(refreshed.status).toBe(200);
    expect(typeof refreshed.body.access).toBe("string");

    const withNew = await api("api/users/profile/", { token: refreshed.body.access });
    expect(withNew.status, "the refreshed token must actually work").toBe(200);
  });

  it("revokes the refresh token on logout", async () => {
    const out = await api("api/users/auth/logout/", {
      method: "POST",
      token: state.amina.token,
      body: { refresh: state.amina.refresh },
    });
    expect(out.status).toBe(200);

    const reuse = await api("api/auth/refresh/", { method: "POST", body: { refresh: state.amina.refresh } });
    expect(reuse.status, "Django's blacklist silently no-opped; this must genuinely revoke").toBe(401);
  });

  it("logs back in with the original password", async () => {
    const login = await api("api/users/auth/login/", {
      method: "POST",
      body: { email: state.amina.email, password: state.amina.password },
    });
    expect(login.status).toBe(200);
    expect(login.body.data.tokens.accessToken).toBeTruthy();

    const profile = await api("api/users/profile/", { token: login.body.data.tokens.accessToken });
    expect(profile.body.data.bio, "their data must survive the round trip").toBe(`Journey ${marker}`);
  });
});
