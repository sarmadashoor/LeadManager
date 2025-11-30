// packages/frontend/src/api/streaming.ts

export type StreamingCallbacks = {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: unknown) => void;
};

/**
 * Runtime feature flag for streaming.
 *
 * Source of truth:
 *   - Browser:  window.__CHAT_STREAMING_ENABLED__ (bool)
 *   - Jest:     tests can spy on isStreamingEnabled() directly
 *
 * Default: false (no streaming) if flag is missing.
 */
export function isStreamingEnabled(): boolean {
  if (typeof window === "undefined") {
    // In tests / SSR / non-browser: default off
    return false;
  }

  const w = window as any;
  if (typeof w.__CHAT_STREAMING_ENABLED__ !== "undefined") {
    return Boolean(w.__CHAT_STREAMING_ENABLED__);
  }

  return false;
}

/**
 * Start a streaming chat request using Server-Sent Events (SSE).
 *
 * The server sends events like:
 *   data: {"text":"Hello "}
 *   data: {"text":"world "}
 *   data: {"done":true,"provider":"claude"}
 */
export function sendStreamingMessage(
  leadId: string,
  message: string,
  callbacks: StreamingCallbacks
): () => void {
  if (typeof window === "undefined" || typeof window.EventSource === "undefined") {
    // Environment doesn't support SSE – fail gracefully
    callbacks.onError(new Error("Streaming not supported in this environment"));
    callbacks.onDone();
    return () => {};
  }

  const w = window as any;

  // Optional override; falls back to localhost:3001
  const baseUrl: string =
    w.__CHAT_API_BASE_URL__ || "http://localhost:3001";

  const params = new URLSearchParams({ message });
  const url = `${baseUrl}/api/chat/${encodeURIComponent(
    leadId
  )}/stream?${params.toString()}`;

  const es = new EventSource(url);

  es.onmessage = (event: MessageEvent<string>) => {
    try {
      const payload = JSON.parse(event.data) as {
        text?: string;
        done?: boolean;
        provider?: string;
        error?: string;
      };

      if (payload.error) {
        callbacks.onError(new Error(payload.error));
        es.close();
        callbacks.onDone();
        return;
      }

      if (typeof payload.text === "string") {
        callbacks.onChunk(payload.text);
      }

      if (payload.done) {
        es.close();
        callbacks.onDone();
      }
    } catch (err) {
      callbacks.onError(err);
      es.close();
      callbacks.onDone();
    }
  };

  es.onerror = (event: Event) => {
    callbacks.onError(event);
    es.close();
    callbacks.onDone();
  };

  // Cleanup function – called when component unmounts or we cancel
  return () => {
    es.close();
  };
}
