import { describe, it, expect } from "vitest";
import { encodeHashId, decodeHashId, parseSlugId, isHashId } from "../../src/lib/hashids.js";
import { resolveSphereId } from "../../src/lib/sphereLookup.js";

describe("8-character Hashids Engine (Backend)", () => {
  it("encodes integer IDs into exactly 8 characters", () => {
    const testIds = [1, 2, 42, 100, 9999, 123456];
    for (const id of testIds) {
      const hash = encodeHashId(id);
      expect(hash).toHaveLength(8);
      expect(isHashId(hash)).toBe(true);
    }
  });

  it("decodes 8-character hashes back to the original integer ID", () => {
    const testIds = [1, 5, 42, 389, 45892, 1000000];
    for (const id of testIds) {
      const hash = encodeHashId(id);
      const decoded = decodeHashId(hash);
      expect(decoded).toBe(id);
    }
  });

  it("safely rejects invalid or corrupted hashes", () => {
    expect(decodeHashId("")).toBeNull();
    expect(decodeHashId("abc")).toBeNull();
    expect(decodeHashId("12345678")).toBeNull(); // digits 0, 1, 8 not in unambiguous alphabet
    expect(decodeHashId("zzzzzzzz")).toBeNull(); // checksum mismatch
  });

  it("parses pure numeric IDs correctly for backward compatibility", () => {
    expect(parseSlugId(42)).toBe(42);
    expect(parseSlugId("42")).toBe(42);
    expect(parseSlugId("1")).toBe(1);
    expect(parseSlugId(["99"])).toBe(99);
  });

  it("parses slug with 8-character hash correctly", () => {
    const id = 123;
    const hash = encodeHashId(id);
    const slugWithHash = `algorithmique-avancee-et-structures-${hash}`;
    expect(parseSlugId(slugWithHash)).toBe(id);
  });

  it("resolves sphere IDs from slug with 8-character hash", async () => {
    const id = 77;
    const hash = encodeHashId(id);
    const slug = `genie-logiciel-${hash}`;
    const resolved = await resolveSphereId(slug);
    expect(resolved).toBe(id);
  });

  it("handles conversation hashids and slugs seamlessly", () => {
    const convId = 42;
    const hash = encodeHashId(convId);
    expect(hash).toHaveLength(8);
    expect(parseSlugId(hash)).toBe(convId);
    expect(parseSlugId(`conversation-${hash}`)).toBe(convId);
    expect(parseSlugId(convId)).toBe(convId);
    expect(parseSlugId(String(convId))).toBe(convId);
  });
});
