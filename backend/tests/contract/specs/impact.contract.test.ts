/**
 * Impact score contract — API_CONTRACT §3.4, documentation/IMPACT_POLICY.md.
 *
 * The policy document and the Django implementation disagreed: the doc states that
 * scoring on post creation was deliberately removed so the score rewards usefulness
 * rather than volume, but the code still awarded +1 per post. The document wins.
 */

import { describe, it, expect } from "vitest";
import { request } from "../helpers/client.js";
import { createUser, createPost, createResource, impactScore } from "../helpers/factories.js";

describe("resource upload", () => {
  it("awards exactly +5 to the author", async () => {
    const user = await createUser();
    const before = await impactScore(user);
    await createResource(user);
    const after = await impactScore(user);
    expect(after - before).toBe(5);
  });
});

describe("post creation", () => {
  it("awards nothing", async () => {
    // [CHANGE] Django awarded +1 via POST_CREATED, contradicting IMPACT_POLICY.md.
    const user = await createUser();
    const before = await impactScore(user);
    await createPost(user);
    const after = await impactScore(user);
    expect(after - before, "post creation must not award impact points").toBe(0);
  });
});

describe("comment creation", () => {
  it("awards nothing", async () => {
    const author = await createUser();
    const commenter = await createUser();
    const post = await createPost(author);

    const before = await impactScore(commenter);
    await request(`api/posts/${post.id}/comments/`, {
      method: "POST",
      token: commenter.token,
      body: { content: "Contract suite comment." },
    });
    const after = await impactScore(commenter);
    expect(after - before).toBe(0);
  });
});

describe("post impact rating", () => {
  it("adds the rating value to the post author's score", async () => {
    const author = await createUser();
    const rater = await createUser();
    const post = await createPost(author);

    const before = await impactScore(author);
    const res = await request(`api/posts/${post.id}/impact-rate/`, {
      method: "POST",
      token: rater.token,
      body: { value: 4 },
    });
    expect(res.status).toBe(200);

    const after = await impactScore(author);
    expect(after - before).toBe(4);
  });

  it("rejects a value outside 1..5", async () => {
    const author = await createUser();
    const rater = await createUser();
    const post = await createPost(author);

    for (const value of [0, 6, -1]) {
      const res = await request(`api/posts/${post.id}/impact-rate/`, {
        method: "POST",
        token: rater.token,
        body: { value },
      });
      expect(res.status, `value ${value} must be rejected`).toBe(400);
    }
  });

  it("replaces rather than stacks when a user re-rates", async () => {
    const author = await createUser();
    const rater = await createUser();
    const post = await createPost(author);

    await request(`api/posts/${post.id}/impact-rate/`, {
      method: "POST",
      token: rater.token,
      body: { value: 5 },
    });
    const afterFirst = await impactScore(author);

    await request(`api/posts/${post.id}/impact-rate/`, {
      method: "POST",
      token: rater.token,
      body: { value: 2 },
    });
    const afterSecond = await impactScore(author);

    expect(afterSecond - afterFirst, "re-rating must replace the previous value").toBe(-3);
  });

  it("removes the rating when value is null", async () => {
    const author = await createUser();
    const rater = await createUser();
    const post = await createPost(author);

    const before = await impactScore(author);
    await request(`api/posts/${post.id}/impact-rate/`, {
      method: "POST",
      token: rater.token,
      body: { value: 3 },
    });
    await request(`api/posts/${post.id}/impact-rate/`, {
      method: "POST",
      token: rater.token,
      body: { value: null },
    });
    const after = await impactScore(author);
    expect(after).toBe(before);
  });

  it("reflects the sum of all ratings in the post's impact_score", async () => {
    const author = await createUser();
    const post = await createPost(author);

    for (const value of [3, 5]) {
      const rater = await createUser();
      await request(`api/posts/${post.id}/impact-rate/`, {
        method: "POST",
        token: rater.token,
        body: { value },
      });
    }

    const res = await request(`api/posts/${post.id}/`, { token: author.token });
    const data = res.body?.data ?? res.body;
    expect(data.impact_score).toBe(8);
  });
});
