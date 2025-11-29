// packages/frontend/src/setupTests.ts

// Extend Jest with @testing-library/jest-dom matchers
import "@testing-library/jest-dom";

import { TextEncoder, TextDecoder } from "util";

// Polyfill TextEncoder / TextDecoder for react-router / whatwg URL, etc.
if (!(global as any).TextEncoder) {
  (global as any).TextEncoder = TextEncoder;
}

if (!(global as any).TextDecoder) {
  (global as any).TextDecoder = TextDecoder as any;
}
