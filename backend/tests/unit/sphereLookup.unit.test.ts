import { describe, it, expect } from "vitest";
import { resolveSphereId } from "../../src/lib/sphereLookup.js";

describe("resolveSphereId", () => {
  it("extracts ID from slug with leading number", async () => {
    expect(await resolveSphereId("1-b-eng-cse-2")).toBe(1);
    expect(await resolveSphereId("5-max-prime")).toBe(5);
    expect(await resolveSphereId("123-some-long-slug-name")).toBe(123);
  });

  it("extracts ID from pure number string", async () => {
    expect(await resolveSphereId("42")).toBe(42);
    expect(await resolveSphereId("1")).toBe(1);
  });

  it("handles numeric input directly", async () => {
    expect(await resolveSphereId(10)).toBe(10);
  });

  it("throws notFound on empty or invalid inputs", async () => {
    await expect(resolveSphereId("")).rejects.toThrow();
    await expect(resolveSphereId(null)).rejects.toThrow();
    await expect(resolveSphereId(undefined)).rejects.toThrow();
  });
});
