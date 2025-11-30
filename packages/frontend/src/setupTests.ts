// packages/frontend/src/setupTests.ts

import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Polyfill TextEncoder / TextDecoder...
if (!(global as any).TextEncoder) {
  (global as any).TextEncoder = TextEncoder;
}

if (!(global as any).TextDecoder) {
  (global as any).TextDecoder = TextDecoder as any;
}

// Default streaming flags for tests (can be overridden in tests)
(global as any).__CHAT_STREAMING_ENABLED__ = false;
(global as any).__CHAT_API_BASE_URL__ = "http://localhost:3001";
