// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { ADMIN_NAVIGATION } from "./adminNavigation";


const ADMIN_BASE_PATH = "/admin/";

describe("admin navigation routes smoke test", () => {
  it("keeps ADMIN_NAVIGATION entries aligned with App routes", () => {
    const appPath = resolve(__dirname, "../../App.tsx");
    const appSource = readFileSync(appPath, "utf8");

    expect(appSource).toContain('path="/admin/*"');

    ADMIN_NAVIGATION.forEach((item) => {
      expect(item.to.startsWith(ADMIN_BASE_PATH)).toBe(true);

      const nestedPath = item.to.replace(ADMIN_BASE_PATH, "");
      expect(nestedPath.length).toBeGreaterThan(0);

      expect(appSource).toContain(`path="${nestedPath}"`);
    });
  });
});

