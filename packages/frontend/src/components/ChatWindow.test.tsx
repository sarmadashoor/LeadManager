import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import ChatWindow from "./ChatWindow";

// ---- Mock API modules used by ChatWindow ----
jest.mock("../api/chat", () => ({
  fetchLeadContext: jest.fn(),
  fetchChatHistory: jest.fn(),
}));

jest.mock("../api/client", () => ({
  apiPost: jest.fn(),
}));

import { fetchLeadContext, fetchChatHistory } from "../api/chat";
import { apiPost } from "../api/client";

// Cast to jest.Mock-ish types; we'll still cast as any at call sites to avoid TS "never" noise
const mockFetchLeadContext = fetchLeadContext as unknown as jest.Mock;
const mockFetchChatHistory = fetchChatHistory as unknown as jest.Mock;
const mockApiPost = apiPost as unknown as jest.Mock;

// Mock scrollIntoView for auto-scroll tests
Object.defineProperty(global.HTMLElement.prototype, "scrollIntoView", {
  value: jest.fn(),
  writable: true,
});

function renderWithRoute(
  leadId = "c66a99bd-956b-46f0-a52b-a99ad738412e"
) {
  return render(
    <MemoryRouter initialEntries={[`/c/${leadId}`]}>
      <Routes>
        <Route path="/c/:leadId" element={<ChatWindow />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ChatWindow (with context + history)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the lead id and vehicle context in the header when context loads", async () => {
    (mockFetchLeadContext as any).mockResolvedValue({
      leadId: "c66a99bd-956b-46f0-a52b-a99ad738412e",
      vehicle: { year: "2020", make: "Honda", model: "Civic" },
      services: ["Window Tint"],
    });
    (mockFetchChatHistory as any).mockResolvedValue([]);

    renderWithRoute();

    // Static header
    const headerTitle = screen.getByText("Tint Chat Assistant");
    (expect(headerTitle) as any).toBeInTheDocument();

    // Context should show once loaded
    await waitFor(() => {
      // Match the whole context block by partial text, ignoring whitespace / <br/>
      const contextBlock = screen.getByText((content) =>
        content.includes("2020") &&
        content.includes("Honda") &&
        content.includes("Civic") &&
        content.includes("Window Tint") &&
        content.includes("Lead:") &&
        content.includes("c66a99bd-956b-46f0-a52b-a99ad738412e")
      );

      (expect(contextBlock) as any).toBeInTheDocument();
    });
  });

  it("loads and renders chat history in chronological order (createdAt ascending)", async () => {
    (mockFetchLeadContext as any).mockResolvedValue({});
    (mockFetchChatHistory as any).mockResolvedValue([
      {
        id: "2",
        role: "assistant",
        content: "Second message",
        createdAt: "2023-01-02T10:00:00Z",
      },
      {
        id: "1",
        role: "user",
        content: "First message",
        createdAt: "2023-01-01T10:00:00Z",
      },
    ]);

    renderWithRoute();

    await waitFor(() => {
      const items = screen.getAllByText(/message/i);
      (expect(items[0]) as any).toHaveTextContent("First message");
      (expect(items[1]) as any).toHaveTextContent("Second message");
    });
  });

  it("triggers auto-scroll when messages are loaded", async () => {
    (mockFetchLeadContext as any).mockResolvedValue({});
    (mockFetchChatHistory as any).mockResolvedValue([
      { id: "m1", role: "user", content: "Hello from history" },
    ]);

    renderWithRoute();

    await waitFor(() => {
      (expect(
        (global.HTMLElement.prototype.scrollIntoView as jest.Mock)
      ) as any).toHaveBeenCalled();
    });
  });

  it("shows the empty-state hint when history is empty", async () => {
    (mockFetchLeadContext as any).mockResolvedValue({});
    (mockFetchChatHistory as any).mockResolvedValue([]);

    renderWithRoute();

    await waitFor(() => {
      const emptyState = screen.getByText(
        /Ask anything about pricing, tint options, or booking an appointment./i
      );
      (expect(emptyState) as any).toBeInTheDocument();
    });
  });

  it("shows a clear error when chat history fails to load", async () => {
    (mockFetchLeadContext as any).mockResolvedValue({});
    (mockFetchChatHistory as any).mockRejectedValue(
      new Error("Network failure")
    );

    renderWithRoute();

    await waitFor(() => {
      const errorNode = screen.getByText("Unable to load chat history.");
      (expect(errorNode) as any).toBeInTheDocument();
    });
  });

  it("send flow: user message is sent and apiPost is called with correct URL and payload", async () => {
    (mockFetchLeadContext as any).mockResolvedValue({});
    (mockFetchChatHistory as any).mockResolvedValue([]);
    (mockApiPost as any).mockResolvedValue({
      data: { content: "Mock assistant reply", provider: "claude" },
    });

    renderWithRoute();

    const input = screen.getByPlaceholderText("Type a message…");
    const button = screen.getByRole("button", { name: /send/i });

    await userEvent.type(input, "Hello from test");
    await userEvent.click(button);

    await waitFor(() => {
      (expect(mockApiPost) as any).toHaveBeenCalledTimes(1);
    });

    (expect(mockApiPost) as any).toHaveBeenCalledWith(
      "/api/chat/c66a99bd-956b-46f0-a52b-a99ad738412e/message",
      { message: "Hello from test" }
    );

    // Both user + assistant messages appear
    await waitFor(() => {
      const userMsg = screen.getByText("Hello from test");
      const aiMsg = screen.getByText("Mock assistant reply");
      (expect(userMsg) as any).toBeInTheDocument();
      (expect(aiMsg) as any).toBeInTheDocument();
    });
  });
});
