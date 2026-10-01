import { describe, expect, it } from "vitest";

import { normalizeResourceType } from "./resourceTypes";

describe("normalizeResourceType", () => {
  it("maps legacy aliases to canonical values", () => {
    expect(normalizeResourceType("summary")).toBe("resumes");
    expect(normalizeResourceType("slides")).toBe("presentations");
  });

  it("preserves canonical values", () => {
    expect(normalizeResourceType("notes")).toBe("notes");
    expect(normalizeResourceType("resumes")).toBe("resumes");
  });
});
