import { describe, it, expect } from "vitest";
import { cn } from "./index";

describe("@cs/ui cn utility", () => {
  it("should merge basic class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("should resolve Tailwind conflicts correctly", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("should filter out falsy values", () => {
    expect(cn("font-bold", false && "hidden", null, undefined, "text-sm")).toBe("font-bold text-sm");
  });

  it("should handle conditional object syntax", () => {
    expect(cn({ "bg-primary": true, "bg-secondary": false })).toBe("bg-primary");
  });
});
