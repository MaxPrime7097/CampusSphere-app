// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  getStoredResourceRating,
  getStoredResourceImpactScore,
  setStoredResourceRating,
} from "./resourceImpact";

describe("resourceImpact", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no rating is stored", () => {
    expect(getStoredResourceRating(15)).toBeNull();
    expect(getStoredResourceImpactScore(15)).toBeNull();
  });

  it("handles backwards-compatible numeric stored values", () => {
    localStorage.setItem("cs_resource_impact_ratings", JSON.stringify({ "15": 4 }));
    expect(getStoredResourceRating(15)).toBe(4);
    expect(getStoredResourceRating("15")).toBe(4);
    expect(getStoredResourceImpactScore(15)).toBeNull();
  });

  it("stores and retrieves rating and impactScore together", () => {
    const listener = vi.fn();
    window.addEventListener("resource-impact-changed", listener);

    setStoredResourceRating(42, 5, 12);

    expect(getStoredResourceRating(42)).toBe(5);
    expect(getStoredResourceImpactScore(42)).toBe(12);

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({
      resourceId: "42",
      value: 5,
      impactScore: 12,
    });

    window.removeEventListener("resource-impact-changed", listener);
  });

  it("removes rating when set to null", () => {
    setStoredResourceRating(42, 3, 10);
    expect(getStoredResourceRating(42)).toBe(3);

    setStoredResourceRating(42, null, 7);
    expect(getStoredResourceRating(42)).toBeNull();
    expect(getStoredResourceImpactScore(42)).toBe(7);
  });
});
