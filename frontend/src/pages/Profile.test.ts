import { describe, expect, it } from "vitest";

import { getConnectionCounterpart } from "./Profile";

describe("getConnectionCounterpart", () => {
  it("returns the current viewer as counterpart when viewing another user profile", () => {
    const targetUserId = "42";

    const connection = {
      id: 500,
      requester: 42,
      recipient: 7,
      requester_info: {
        id: 42,
        username: "target-user",
      },
      recipient_info: {
        id: 7,
        full_name: "Current Viewer",
        username: "viewer-user",
        avatar: "viewer-avatar.png",
      },
    };

    const counterpart = getConnectionCounterpart(connection, targetUserId);

    expect(counterpart).toEqual({
      id: "7",
      name: "Current Viewer",
      username: "viewer-user",
      avatar: "viewer-avatar.png",
      mutual: 0,
    });
  });

  it("ignores connections that do not involve the viewed profile", () => {
    const counterpart = getConnectionCounterpart(
      {
        requester: 1,
        recipient: 2,
      },
      "42",
    );

    expect(counterpart).toBeNull();
  });
});
