import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UnifiedSearchFiltersBar } from "@/components/ui/unified-search-filters-bar";

describe("UnifiedSearchFiltersBar", () => {
  it("applies shared spacing tokens for the filters container", () => {
    const { container } = render(
      <UnifiedSearchFiltersBar className="campus-card">
        <div className="grid grid-cols-1 gap-3">
          <input aria-label="search" />
        </div>
      </UnifiedSearchFiltersBar>,
    );

    expect(container.querySelector(".campus-card")).toBeInTheDocument();
    expect(container.querySelector(".p-3.md\\:p-4")).toBeInTheDocument();
  });
});
