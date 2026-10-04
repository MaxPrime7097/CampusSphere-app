import { describe, it, expect } from "vitest";
import { getNamespaceVersion, invalidateCache, autoInvalidate } from "../../src/lib/cache.js";
import { ok, list } from "../../src/lib/envelope.js";
import { noStore } from "../../src/middleware/trailingSlash.js";

describe("Deterministic Envelopes (Option C)", () => {
  it("generates byte-identical JSON payloads for repeated calls with same data", () => {
    let output1 = "";
    let output2 = "";

    const mockRes1: any = {
      status(code: number) {
        expect(code).toBe(200);
        return this;
      },
      json(data: any) {
        output1 = JSON.stringify(data);
        return this;
      },
    };

    const mockRes2: any = {
      status(code: number) {
        expect(code).toBe(200);
        return this;
      },
      json(data: any) {
        output2 = JSON.stringify(data);
        return this;
      },
    };

    const payload = [{ id: 1, name: "Math Sphere" }, { id: 2, name: "CS Club" }];

    list(mockRes1, payload);
    list(mockRes2, payload);

    expect(output1).toBe(output2);
    expect(JSON.parse(output1)).toEqual({
      success: true,
      data: payload,
    });
  });

  it("produces deterministic ok responses without dynamic timestamps", () => {
    let result: any = null;
    const mockRes: any = {
      status: () => mockRes,
      json(data: any) {
        result = data;
        return mockRes;
      },
    };

    ok(mockRes, { user: "alice" });
    expect(result).toEqual({ success: true, data: { user: "alice" } });
    expect(result.timestamp).toBeUndefined();
  });
});

describe("Cache-Control Policy (Option C)", () => {
  it("sets Cache-Control: no-cache for revalidatable GET requests", () => {
    const headers: Record<string, string> = {};
    const req: any = { method: "GET", path: "/api/spheres/", originalUrl: "/api/spheres/" };
    const res: any = {
      setHeader(name: string, val: string) {
        headers[name] = val;
      },
    };
    let calledNext = false;
    const next = () => {
      calledNext = true;
    };

    noStore(req, res, next);
    expect(calledNext).toBe(true);
    expect(headers["Cache-Control"]).toBe("no-cache");
  });

  it("sets Cache-Control: no-store for mutating requests", () => {
    const headers: Record<string, string> = {};
    const req: any = { method: "POST", path: "/api/spheres/", originalUrl: "/api/spheres/" };
    const res: any = {
      setHeader(name: string, val: string) {
        headers[name] = val;
      },
    };
    let calledNext = false;

    noStore(req, res, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
    expect(headers["Cache-Control"]).toBe("no-store");
  });

  it("sets Cache-Control: no-cache for GET conversations & notifications to allow ETag 304 revalidation", () => {
    const headers: Record<string, string> = {};
    const req: any = { method: "GET", path: "/api/conversations/", originalUrl: "/api/conversations/" };
    const res: any = {
      setHeader(name: string, val: string) {
        headers[name] = val;
      },
    };

    noStore(req, res, () => {});
    expect(headers["Cache-Control"]).toBe("no-cache");
  });
});

describe("Atomic Cache Versioning & Invalidation (Option C)", () => {
  it("increments namespace version on invalidation", async () => {
    const v1 = await getNamespaceVersion("test-ns");
    await invalidateCache("test-ns");
    const v2 = await getNamespaceVersion("test-ns");
    expect(v2).toBe(v1 + 1);
  });

  it("autoInvalidate hooks into response finish for mutations", async () => {
    let finishHandler: (() => void) | null = null;
    const req: any = { method: "POST" };
    const res: any = {
      statusCode: 201,
      on(event: string, handler: () => void) {
        if (event === "finish") finishHandler = handler;
      },
    };

    const v1 = await getNamespaceVersion("mutation-ns");
    const mw = autoInvalidate("mutation-ns");
    mw(req, res, () => {});

    expect(finishHandler).toBeDefined();
    // Simulate HTTP response completing with 201 Created
    finishHandler!();

    const v2 = await getNamespaceVersion("mutation-ns");
    expect(v2).toBe(v1 + 1);
  });
});
