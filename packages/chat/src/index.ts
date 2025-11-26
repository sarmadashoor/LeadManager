// packages/chat/src/index.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { AIService } from './ai/AIService';

console.log('🚀 Chat service initialized');
console.log(`📡 AI Provider: ${process.env.AI_PROVIDER || 'claude'}`);

// Export for use by other services
export { AIService };
export { ChatContext } from './ai/AIService';
export * from './ai/providers';