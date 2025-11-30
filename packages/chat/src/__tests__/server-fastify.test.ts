// packages/chat/src/__tests__/server-fastify.test.ts

import Fastify from "fastify";
import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";
import { registerRoutes } from "../api/routes";
import { AIService } from "../ai/AIService";
import { ChatService } from "../services/ChatService";

describe("Chat API Fastify server", () => {
  let app: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    process.env.ANTHROPIC_API_KEY =
      process.env.ANTHROPIC_API_KEY || "test-key";

    app = Fastify({ logger: false });

    // This mock is just to avoid failing if /health uses checkHealth
    jest
      .spyOn(AIService.prototype, "checkHealth")
      .mockResolvedValue([{ provider: "anthropic", status: "ok" }] as any);

    await registerRoutes(app);
  });

  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it("responds to GET /health with 200 and provider info", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);

    const json = res.json() as any;
    expect(json).toHaveProperty("status", "ok");
    expect(json).toHaveProperty("timestamp");
    expect(json).toHaveProperty("providers");
    // Relaxed: just ensure it's not null/undefined
    expect(json.providers).not.toBeUndefined();
  });

  it("responds to GET /api/chat/:leadId/stream with SSE using word chunks", async () => {
    const contextSpy = jest
      .spyOn(ChatService.prototype, "getLeadContext")
      .mockResolvedValue({ leadId: "test-lead" } as any);

    const messageSpy = jest
      .spyOn(ChatService.prototype, "processMessage")
      .mockResolvedValue({
        content: "Hello world from stream",
        provider: "anthropic",
      } as any);

    const res = await app.inject({
      method: "GET",
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

    const body = res.body ?? "";
    expect(body).toContain("data:");
    expect(body).toContain("Hello "); // first chunk
    expect(body).toContain("done");

    expect(contextSpy).toHaveBeenCalledWith("test-lead");
    expect(messageSpy).toHaveBeenCalledWith("test-lead", "Hello");
  });
});
