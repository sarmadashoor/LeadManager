// packages/chat/src/__tests__/streaming/StreamingRoute.test.ts

import Fastify from "fastify";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { registerRoutes } from "../routes";

describe("Chat API streaming route (Fastify)", () => {
  let app: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    // ensure AIService initializes
    process.env.ANTHROPIC_API_KEY =
      process.env.ANTHROPIC_API_KEY || "test-key";

    app = Fastify({ logger: false });
    await registerRoutes(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("responds to GET /api/chat/:leadId/stream with SSE headers", async () => {
    const res = await app.inject({
      method: "GET",
      // 👇 IMPORTANT: pass a non-empty message, or controller returns 400
      url: "/api/chat/test-lead/stream?message=Hello",
      headers: {
        accept: "text/event-stream",
      },
    });

    expect(res.statusCode).toBe(200);

    const contentType =
      res.headers["content-type"] || res.headers["Content-Type"];
    expect(contentType).toBeDefined();
    expect(String(contentType)).toContain("text/event-stream");
  });
});
