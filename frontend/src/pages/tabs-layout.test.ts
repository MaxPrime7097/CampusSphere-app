import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const pageFiles = [
  "frontend/src/pages/Spheres.tsx",
  "frontend/src/pages/Connections.tsx",
  "frontend/src/pages/SearchResults.tsx",
] as const;

describe("tabs pages layout conventions", () => {
  it.each(pageFiles)("keeps unified search/filters before shared tabs in %s", (filePath) => {
    const source = readFileSync(resolve(process.cwd(), filePath), "utf8");

    expect(source.includes("PageSearchFiltersBar")).toBe(false);
    expect(source.includes("UnifiedSearchFiltersBar")).toBe(true);

    const searchBarIndex = source.indexOf("<UnifiedSearchFiltersBar");
    const tabsListIndex = source.indexOf("<SharedTabsList");
    const firstTabsContentIndex = source.indexOf("<TabsContent");

    expect(searchBarIndex).toBeGreaterThan(-1);
    expect(tabsListIndex).toBeGreaterThan(searchBarIndex);
    expect(firstTabsContentIndex).toBeGreaterThan(tabsListIndex);
  });
});
