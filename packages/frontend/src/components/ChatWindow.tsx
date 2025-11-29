import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";

import { apiPost } from "../api/client";
import { fetchLeadContext, fetchChatHistory } from "../api/chat";
import {
  isStreamingEnabled,
  sendStreamingMessage,
} from "../api/streaming";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type LeadContext = {
  leadId: string;
  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
  };
  services?: string[];
} | null;

const ChatWindow: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [headerContext, setHeaderContext] = useState<LeadContext>(null);

  // Auto-scroll reference
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Holds the active streaming-cancel function (if streaming is in progress)
  const streamCancelRef = useRef<(() => void) | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll every time messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load context + history on mount / when leadId changes
  useEffect(() => {
    if (!leadId) {
      setError("Invalid chat link: missing leadId in URL.");
      return;
    }

    let cancelled = false;

    const loadContextAndHistory = async () => {
      setIsLoadingHistory(true);
      setError(null);

      try {
        const [ctx, history] = await Promise.all([
          fetchLeadContext(leadId),
          fetchChatHistory(leadId),
        ]);

        if (cancelled) return;

        if (ctx) {
          setHeaderContext(ctx as LeadContext);
        }

        if (Array.isArray(history)) {
          const sorted = [...history].sort((a, b) => {
            const at = a.createdAt
              ? new Date(a.createdAt).getTime()
              : 0;
            const bt = b.createdAt
              ? new Date(b.createdAt).getTime()
              : 0;
            return at - bt;
          });
          setMessages(sorted);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Unable to load chat history.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadContextAndHistory();

    return () => {
      cancelled = true;
    };
  }, [leadId]);

  // Cleanup any active stream on unmount
  useEffect(() => {
    return () => {
      if (streamCancelRef.current) {
        streamCancelRef.current();
        streamCancelRef.current = null;
      }
    };
  }, []);

  const handleSend = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!leadId) {
        setError("Lead ID missing.");
        return;
      }

      const trimmed = input.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      };

      // Append user message immediately
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsSending(true);
      setError(null);

      // STREAMING MODE
      if (isStreamingEnabled()) {
        // Cancel any previous stream
        if (streamCancelRef.current) {
          streamCancelRef.current();
          streamCancelRef.current = null;
        }

        const assistantId = `assistant-${Date.now()}`;

        // Start with an empty assistant bubble
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "",
          },
        ]);

        const cancel = sendStreamingMessage(leadId, trimmed, {
          onChunk: (chunk: string) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: (m.content ?? "") + chunk }
                  : m
              )
            );
          },
          onDone: () => {
            setIsSending(false);
          },
          onError: (err: unknown) => {
            console.error(err);
            setError(
              "We couldn't send your message. Please try again."
            );
            setIsSending(false);
          },
        });

        streamCancelRef.current = cancel;
        return;
      }

      // FALLBACK: non-streaming POST
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
      } catch (err) {
        console.error(err);
        setError(
          "We couldn't send your message. Please try again."
        );
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

  // Build header context line from loaded context
  const vehicle = headerContext?.vehicle;
  const services = headerContext?.services ?? [];
  const hasVehicle =
    vehicle &&
    (vehicle.year || vehicle.make || vehicle.model);

  const vehicleLine = hasVehicle
    ? `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${
        vehicle.model ?? ""
      }`.trim()
    : null;

  const servicesLine =
    services.length > 0 ? ` • ${services.join(", ")}` : "";

  const headerLine =
    vehicleLine || servicesLine
      ? `${vehicleLine ?? ""}${servicesLine}`
      : "Ask anything about your vehicle or booking.";

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
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Tint Chat Assistant
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                opacity: 0.8,
              }}
            >
              {headerLine}
              <br />
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
          {messages.length === 0 && !isLoadingHistory && (
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
                  color:
                    msg.role === "user"
                      ? "#f9fafb"
                      : "#111827",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8rem",
              color: "#b91c1c",
              background: "#fee2e2",
              borderTop: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}

        {isSending && (
          <div
            style={{
              padding: "0.25rem 1rem",
              fontSize: "0.8rem",
              color: "#6b7280",
            }}
          >
            Assistant is typing…
          </div>
        )}

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
              background: "#111827",
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
