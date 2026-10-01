import { describe, it, expect } from "vitest";
import { encodeHashId, decodeHashId, parseSlugId, isHashId } from "./hashids";
import { getEventUrl, getResourceUrl, getSphereUrl, getPostUrl } from "./utils";

describe("8-character Hashids Engine (Campus Frontend)", () => {
  it("encodes integer IDs into exactly 8 characters", () => {
    const testIds = [1, 2, 42, 100, 9999, 123456];
    for (const id of testIds) {
      const hash = encodeHashId(id);
      expect(hash).toHaveLength(8);
      expect(isHashId(hash)).toBe(true);
    }
  });

  it("decodes 8-character hashes reversibly back to the original integer ID", () => {
    const testIds = [1, 5, 42, 389, 45892, 1000000];
    for (const id of testIds) {
      const hash = encodeHashId(id);
      const decoded = decodeHashId(hash);
      expect(decoded).toBe(id);
    }
  });

  it("safely handles malformed and invalid inputs", () => {
    expect(decodeHashId("")).toBeNull();
    expect(decodeHashId("short")).toBeNull();
    expect(decodeHashId("not-a-valid-hash!")).toBeNull();
  });

  it("parses backward-compatible numeric IDs and hashes in slugs", () => {
    expect(parseSlugId(42)).toBe(42);
    expect(parseSlugId("42")).toBe(42);
    expect(parseSlugId("105")).toBe(105);

    const hash = encodeHashId(88);
    expect(parseSlugId(`cours-algebre-lineaire-${hash}`)).toBe(88);
    expect(parseSlugId(hash)).toBe(88);
  });

  describe("Canonical URL Helpers", () => {
    it("generates canonical resource URL with slug and 8-char hash", () => {
      const url = getResourceUrl({ id: 15, title: "Cours de Microéconomie L2" });
      const hash = encodeHashId(15);
      expect(url).toBe(`/resources/cours-de-microeconomie-l2-${hash}`);
    });

    it("generates canonical event URL with slug and 8-char hash", () => {
      const url = getEventUrl({ id: 24, title: "Hackathon Campus 2026" });
      const hash = encodeHashId(24);
      expect(url).toBe(`/events/hackathon-campus-2026-${hash}`);
    });

    it("generates canonical sphere URL with slug and 8-char hash", () => {
      const url = getSphereUrl({ id: 7, name: "Club Informatique" });
      const hash = encodeHashId(7);
      expect(url).toBe(`/spheres/club-informatique-${hash}`);
    });

    it("generates canonical post URL with slug and 8-char hash", () => {
      const url = getPostUrl({ id: 99, content: "Bienvenue à tous les nouveaux étudiants !" });
      const hash = encodeHashId(99);
      expect(url).toBe(`/posts/bienvenue-a-tous-les-nouveaux-${hash}`);
    });
  });
});
