// src/api/streaming.ts

export type StreamingCallbacks = {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: unknown) => void;
};

/**
 * Runtime feature flag for streaming.
 * We'll wire this to an env var later (e.g. VITE_CHAT_STREAMING).
 * Default: false. Tests will override via jest.spyOn.
 */
export function isStreamingEnabled(): boolean {
  return false;
}

/**
 * Start a streaming chat request.
 *
 * For now this is a safe no-op implementation so tests can spy on it
 * without the real network logic existing yet.
 *
 * It returns a cleanup function that would close the stream (EventSource,
 * fetch reader, etc.) once we implement real streaming.
 */
export function sendStreamingMessage(
  _leadId: string,
  _message: string,
  callbacks: StreamingCallbacks
): () => void {
  // Default behavior: immediately signal completion so callers don't hang.
  try {
    callbacks.onDone();
  } catch {
    // ignore
  }

  // Cleanup function – currently a no-op.
  return () => {
    // no-op for now
  };
}
