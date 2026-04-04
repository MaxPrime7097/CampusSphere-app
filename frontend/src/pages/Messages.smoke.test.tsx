import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { Messages } from "@/pages/Messages";

const mockApi = vi.hoisted(() => ({
  createGroupConversation: vi.fn(),
  createPrivateConversation: vi.fn(),
  getCurrentUser: vi.fn(),
  getConversationMessages: vi.fn(),
  getUserConnections: vi.fn(),
  getUserConversations: vi.fn(),
  markConversationRead: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock("@/services/api", () => mockApi);
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, options?: any) => options?.defaultValue || key }),
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock("@/components/modals/CreateGroupConversationModal", () => ({
  CreateGroupConversationModal: ({ children, onGroupCreated }: any) => (
    <div>
      {children}
      <button
        type="button"
        onClick={() =>
          onGroupCreated?.({
            id: "new-group-1",
            type: "group",
            name: "Nouveau Groupe",
            participants_info: [{ id: "u2", username: "bob", name: "Bob" }],
          })
        }
      >
        trigger-group
      </button>
    </div>
  ),
}));

function RouteEcho() {
  const location = useLocation();
  return <div data-testid="route-echo">{location.pathname}</div>;
}

describe("Messages page smoke", () => {
  beforeEach(() => {
    mockApi.getCurrentUser.mockResolvedValue({ id: "u1", username: "alice", name: "Alice" });
    mockApi.getConversationMessages.mockResolvedValue([]);
    mockApi.getUserConnections.mockResolvedValue([]);
    mockApi.markConversationRead.mockResolvedValue({ success: true });
    mockApi.sendMessage.mockResolvedValue({ id: "m-created", content: "Salut", author_info: { id: "u1", username: "alice", name: "Alice" }, created_at: "2026-04-04T10:00:00Z" });
    mockApi.getUserConversations.mockResolvedValue([
      {
        id: "dm-1",
        type: "private",
        participants_info: [
          { id: "u1", username: "alice", name: "Alice" },
          { id: "u2", username: "bob", name: "Bob" },
        ],
        last_message: { content: "Salut Bob", created_at: "2026-04-04T09:59:00Z" },
      },
    ]);
  });

  it("crée un groupe et ouvre la conversation nouvellement créée", async () => {
    render(
      <MemoryRouter initialEntries={["/messages"]}>
        <Routes>
          <Route path="/messages" element={<><Messages /><RouteEcho /></>} />
          <Route path="/messages/:conversationId" element={<><Messages /><RouteEcho /></>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("trigger-group"));

    await waitFor(() => {
      expect(screen.getByTestId("route-echo").textContent).toBe("/messages/new-group-1");
    });
    expect(screen.getByText("Nouveau Groupe")).toBeInTheDocument();
  });

  it("affiche une DM existante et permet de l'ouvrir", async () => {
    render(
      <MemoryRouter initialEntries={["/messages"]}>
        <Routes>
          <Route path="/messages" element={<><Messages /><RouteEcho /></>} />
          <Route path="/messages/:conversationId" element={<><Messages /><RouteEcho /></>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Bob")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Bob"));

    await waitFor(() => {
      expect(screen.getByTestId("route-echo").textContent).toBe("/messages/dm-1");
    });
  });

  it("affiche le nom de l'interlocuteur pour une DM, pas l'utilisateur courant", async () => {
    mockApi.getCurrentUser.mockResolvedValue({ id: "u1", username: "alice", name: "Alice" });
    mockApi.getUserConversations.mockResolvedValue([
      {
        id: "dm-2",
        type: "private",
        participants_info: [
          { id: "u1", username: "alice", name: "Alice" },
          { id: "u2", username: "bob_only_username" },
        ],
        last_message: { content: "Hey", created_at: "2026-04-04T11:00:00Z" },
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/messages"]}>
        <Routes>
          <Route path="/messages" element={<Messages />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("bob_only_username")).toBeInTheDocument());
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("envoie un message dans une conversation", async () => {
    render(
      <MemoryRouter initialEntries={["/messages/dm-1"]}>
        <Routes>
          <Route path="/messages/:conversationId" element={<Messages />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getAllByRole("textbox").length).toBeGreaterThan(1));
    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[textboxes.length - 1], { target: { value: "Salut" } });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockApi.sendMessage).toHaveBeenCalledWith("dm-1", "Salut");
    });
    expect(screen.getByText("Salut")).toBeInTheDocument();
  });
});
