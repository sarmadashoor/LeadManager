// packages/chat/src/index.ts

import * as dotenv from 'dotenv';
dotenv.config();

// AI Services
export { AIService, ChatContext } from './ai/AIService';
export * from './ai/providers';

// Repositories
export { ChatMessageRepository } from './modules/chat/ChatMessageRepository';
export type {
  ChatMessage,
  ChatSession,
} from './modules/chat/ChatMessageRepository';

// Services
export { ChatService } from './modules/chat/ChatService';
export type { ChatResponse } from './modules/chat/ChatService';

// API
export { ChatController } from './modules/chat/ChatController';
export { chatRoutes } from './bootstrap/routes';

// Server
export { buildServer } from './bootstrap/server';

console.log('🚀 Chat service initialized');
console.log(`📡 AI Provider: ${process.env.AI_PROVIDER || 'claude'}`);
