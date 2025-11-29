import React, { useCallback, useEffect, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const API_BASE_URL = "http://localhost:3001";

const ChatWindow: React.FC = () => {
  const [leadId, setLeadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read leadId from URL (?leadId=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("leadId");
    if (!id) {
      setError(
        "Missing leadId in URL. Example: http://localhost:5173/?leadId=TEST_LEAD_ID"
      );
    } else {
      setLeadId(id);
    }
  }, []);

  const handleSend = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!leadId) {
        setError("leadId not set.");
        return;
      }
      if (!input.trim()) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: input.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsSending(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/chat/${encodeURIComponent(leadId)}/message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: userMessage.content }),
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Chat API error (${response.status}): ${
              text || response.statusText
            }`
          );
        }

        const data = await response.json();

        // Support both:
        // - { success: true, data: { content: "..." } }
        // - { response: "..." }
        const assistantContent: string =
          data?.data?.content ??
          (typeof data.response === "string"
            ? data.response
            : JSON.stringify(data));

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: assistantContent,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to send message.");
      } finally {
        setIsSending(false);
      }
    },
    [leadId, input]
  );

  if (error && !leadId) {
    return (
      <div style={{ padding: "1rem", fontFamily: "system-ui" }}>
        <h1>Lead Chat</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!leadId) {
    return (
      <div style={{ padding: "1rem", fontFamily: "system-ui" }}>
        <h1>Lead Chat</h1>
        <p>Loading lead information from URL...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          height: "80vh",
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#111827",
            color: "#f9fafb",
          }}
        >
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Tint Chat Assistant
            </div>
            <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              Lead: {leadId}
            </div>
          </div>
          <div style={{ fontSize: "0.75rem" }}>
            {isSending ? "Thinking…" : "Online"}
          </div>
        </header>

        <div
          style={{
            flex: 1,
            padding: "1rem",
            overflowY: "auto",
            background: "#f9fafb",
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "#6b7280",
                textAlign: "center",
                marginTop: "1rem",
              }}
            >
              Ask anything about pricing, tint options, or booking an
              appointment.
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: "0.5rem",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  lineHeight: 1.4,
                  background:
                    msg.role === "user" ? "#111827" : "#e5e7eb",
                  color: msg.role === "user" ? "#f9fafb" : "#111827",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {error && (
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "0.8rem",
                color: "red",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSend}
          style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid #eee",
            display: "flex",
            gap: "0.5rem",
            background: "#ffffff",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={isSending}
            style={{
              flex: 1,
              padding: "0.5rem 0.75rem",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: "none",
              fontSize: "0.9rem",
              background: isSending ? "#9ca3af" : "#111827",
              color: "#f9fafb",
              cursor: isSending ? "default" : "pointer",
            }}
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
