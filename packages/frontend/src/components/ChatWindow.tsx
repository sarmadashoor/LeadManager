import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiPost } from "../api/client";
import {
  fetchLeadContext,
  fetchChatHistory,
  LeadContext,
  ChatHistoryItem,
} from "../api/chat";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

const ChatWindow: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [context, setContext] = useState<LeadContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Validate leadId immediately
  useEffect(() => {
    if (!leadId) {
      setError("Invalid chat link: missing leadId in URL.");
    }
  }, [leadId]);

  // Load lead context
  useEffect(() => {
    if (!leadId) return;

    const loadContext = async () => {
      try {
        const data = await fetchLeadContext(leadId);
        setContext(data);
      } catch (err: any) {
        console.error(err);
        setError("Unable to load lead information.");
      } finally {
        setIsLoadingContext(false);
      }
    };

    loadContext();
  }, [leadId]);

  // Load history (with BEST UX sorting)
  useEffect(() => {
    if (!leadId) return;

    const loadHistory = async () => {
      try {
        const history = await fetchChatHistory(leadId);

        const sorted = [...history].sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          return 0;
        });

        setMessages(sorted);
      } catch (err: any) {
        console.error(err);
        setError("Unable to load chat history.");
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [leadId]);

  // Send message
  const handleSend = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!leadId) {
        setError("Lead ID missing.");
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
        const data = await apiPost(
          `/api/chat/${encodeURIComponent(leadId)}/message`,
          { message: userMessage.content }
        );

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

  if (!leadId) {
    return (
      <div style={{ padding: "1rem", fontFamily: "system-ui" }}>
        <h1>Lead Chat</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        fontFamily: "system-ui",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          height: "100vh",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
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
              {/* Context */}
              {isLoadingContext && "Loading lead…"}

              {!isLoadingContext && context && (
                <>
                  {context.vehicle?.year} {context.vehicle?.make}{" "}
                  {context.vehicle?.model}
                  {context.services?.length
                    ? ` • ${context.services.join(", ")}`
                    : ""}
                  <br />
                  Lead: {leadId}
                </>
              )}

              {!isLoadingContext && !context && (
                <span style={{ color: "red" }}>Context unavailable</span>
              )}
            </div>
          </div>

          <div style={{ fontSize: "0.75rem" }}>
            {isSending ? "Thinking…" : "Online"}
          </div>
        </header>

        {/* MESSAGES */}
        <div
          style={{
            flex: 1,
            padding: "1rem",
            overflowY: "auto",
            background: "#f9fafb",
          }}
        >
          {isLoadingHistory && (
            <div
              style={{
                textAlign: "center",
                color: "#6b7280",
                fontSize: "0.85rem",
              }}
            >
              Loading chat history…
            </div>
          )}

          {!isLoadingHistory && messages.length === 0 && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "#6b7280",
                textAlign: "center",
                marginTop: "1rem",
              }}
            >
              Ask anything about pricing, tint options, or booking an appointment.
            </div>
          )}

          {!isLoadingHistory &&
            messages.map((msg) => (
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

          {/* Error */}
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

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
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
