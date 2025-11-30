// packages/chat/src/api/routes.ts

import { FastifyInstance } from "fastify";
import { ChatController } from "./controllers/ChatController";
import { ChatService } from "../services/ChatService";
import { AIService } from "../ai/AIService";
import { LeadContextRepository } from "../repositories/LeadContextRepository";
import { ChatMessageRepository } from "../repositories/ChatMessageRepository";

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  const aiService = new AIService();
  const leadRepo = new LeadContextRepository();
  const messageRepo = new ChatMessageRepository();
  const chatService = new ChatService(aiService, leadRepo, messageRepo);
  const controller = new ChatController(chatService);

  app.post("/api/chat/:leadId/message", controller.sendMessage);
  app.get("/api/chat/:leadId/stream", controller.streamMessage);
  app.get("/api/chat/:leadId/history", controller.getHistory);
  app.get("/api/chat/:leadId/context", controller.getContext);

  app.get("/health", async () => {
    const providerHealth = await aiService.checkHealth();
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      providers: providerHealth,
    };
  });
}

/**
 * Small wrapper used by tests so they can build a Fastify instance
 * and register all HTTP routes without actually listening on a port.
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await chatRoutes(app);
}
