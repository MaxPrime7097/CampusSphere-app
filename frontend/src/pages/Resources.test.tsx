import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Resources } from "./Resources";

const listResourcesMock = vi.fn();
const getCurrentUserMock = vi.fn();
const getSavedResourcesMock = vi.fn();

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/services/api", () => ({
  listResources: (...args: unknown[]) => listResourcesMock(...args),
  getCurrentUser: (...args: unknown[]) => getCurrentUserMock(...args),
  downloadResource: vi.fn(),
  saveResource: vi.fn(),
  getSavedResources: (...args: unknown[]) => getSavedResourcesMock(...args),
}));

vi.mock("@/components/modals/UploadResourceModal", () => ({
  UploadResourceModal: ({ onResourceUploaded, children }: { onResourceUploaded?: (r?: unknown) => void; children: React.ReactNode }) => (
    <div>
      {children}
      <button
        onClick={() =>
          onResourceUploaded?.({
            id: "created-1",
            title: "Ressource créée",
            type: "resumes",
            subject: "cs",
            description: "Description",
            tags: [],
            author_name: "Auteur",
            visibility: "public",
          })
        }
      >
        fake-upload
      </button>
    </div>
  ),
}));

describe("Resources type cycle", () => {
  beforeEach(() => {
    listResourcesMock.mockReset();
    getCurrentUserMock.mockReset();
    getSavedResourcesMock.mockReset();

    getCurrentUserMock.mockResolvedValue({ id: "u1" });
    getSavedResourcesMock.mockResolvedValue([]);
  });

  it("keeps canonical type labels after create and list refresh", async () => {
    listResourcesMock
      .mockResolvedValueOnce([
        {
          id: "seed-1",
          title: "Slides legacy",
          type: "presentations",
          subject: "cs",
          description: "Initial",
          tags: [],
          author_name: "Auteur",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "seed-1",
          title: "Slides legacy",
          type: "presentations",
          subject: "cs",
          description: "Initial",
          tags: [],
          author_name: "Auteur",
        },
        {
          id: "created-1",
          title: "Ressource créée",
          type: "resumes",
          subject: "cs",
          description: "Description",
          tags: [],
          author_name: "Auteur",
        },
      ]);

    render(
      <MemoryRouter>
        <Resources />
      </MemoryRouter>
    );

    expect(await screen.findByText("Slides legacy")).toBeInTheDocument();
    expect(screen.getByText("Présentations")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "fake-upload" }));
    expect(await screen.findByText("Ressource créée")).toBeInTheDocument();
    expect(screen.getByText("Résumés")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Actualiser/i }));
    await waitFor(() => expect(listResourcesMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Ressource créée")).toBeInTheDocument();
    expect(screen.getByText("Résumés")).toBeInTheDocument();
  });
});
