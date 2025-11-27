// packages/chat/src/index.ts

import * as dotenv from 'dotenv';
dotenv.config();

// AI Services
export { AIService } from './ai/AIService';
export { ChatContext } from './ai/AIService';
export * from './ai/providers';

// Repositories
export { LeadContextRepository } from './repositories/LeadContextRepository';
export { ChatMessageRepository } from './repositories/ChatMessageRepository';
export type { ChatMessage, ChatSession } from './repositories/ChatMessageRepository';

// Services
export { ChatService } from './services/ChatService';
export type { ChatResponse } from './services/ChatService';

// API
export { ChatController } from './api/controllers/ChatController';
export { chatRoutes } from './api/routes';

// Server
export { buildServer } from './server';

console.log('🚀 Chat service initialized');
console.log(`📡 AI Provider: ${process.env.AI_PROVIDER || 'claude'}`);
