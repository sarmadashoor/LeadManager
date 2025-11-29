import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatWindow from "./ChatWindow";

const API_BASE_URL = "http://localhost:3001";

describe("ChatWindow", () => {
  beforeEach(() => {
    // Reset fetch mock for each test
    global.fetch = jest.fn() as any;
  });

  it("shows the lead id in the header when leadId is present in URL", () => {
    // Arrange: URL with leadId
    window.history.pushState(
      {},
      "Test",
      "/?leadId=c66a99bd-956b-46f0-a52b-a99ad738412e"
    );

    render(<ChatWindow />);

    expect(
      screen.getByText("Lead: c66a99bd-956b-46f0-a52b-a99ad738412e")
    ).toBeInTheDocument();
  });

  it("calls the chat API with the correct URL and payload on send", async () => {
    // Arrange: URL with leadId
    window.history.pushState(
      {},
      "Test",
      "/?leadId=c66a99bd-956b-46f0-a52b-a99ad738412e"
    );

    const mockResponse = {
      success: true,
      data: {
        content: "Mock assistant reply",
        provider: "claude",
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<ChatWindow />);

    const input = screen.getByPlaceholderText("Type a message…");
    const button = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Hello from test" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/chat/c66a99bd-956b-46f0-a52b-a99ad738412e/message`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hello from test" }),
      })
    );
  });

  it("renders the assistant reply when API returns success", async () => {
    // Arrange: URL with leadId
    window.history.pushState(
      {},
      "Test",
      "/?leadId=c66a99bd-956b-46f0-a52b-a99ad738412e"
    );

    const mockResponse = {
      success: true,
      data: {
        content: "Mock assistant reply from API",
        provider: "claude",
      },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<ChatWindow />);

    const input = screen.getByPlaceholderText("Type a message…");
    const button = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Hello again" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("Mock assistant reply from API")
      ).toBeInTheDocument();
    });
  });

  it("shows a clear error when leadId is missing from URL", () => {
    // Arrange: URL *without* leadId
    window.history.pushState({}, "Test", "/");

    render(<ChatWindow />);

    expect(screen.getByText("Lead Chat")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Missing leadId in URL\. Example: http:\/\/localhost:5173\/\?leadId=TEST_LEAD_ID/
      )
    ).toBeInTheDocument();
  });

 it("shows an error in the chat UI when the API responds with an error", async () => {
  // Arrange: URL with leadId
  window.history.pushState(
    {},
    "Test",
    "/?leadId=c66a99bd-956b-46f0-a52b-a99ad738412e"
  );

  (global.fetch as any).mockResolvedValue({
    ok: false,
    status: 500,
    statusText: "Internal Server Error",
    text: async () => "Something went wrong upstream",
  });

  // Silence console.error for this test only
  const consoleSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  render(<ChatWindow />);

  const input = screen.getByPlaceholderText("Type a message…");
  const button = screen.getByRole("button", { name: /send/i });

  fireEvent.change(input, { target: { value: "Trigger error" } });
  fireEvent.click(button);

  await waitFor(() => {
    expect(
      screen.getByText(
        /Chat API error \(500\): Something went wrong upstream/
      )
    ).toBeInTheDocument();
  });

  // Restore console.error after assertion
  consoleSpy.mockRestore();
});

});
