// packages/chat/src/ai/providers/index.ts

import { AIProvider } from './AIProvider';
import { ClaudeProvider } from './ClaudeProvider';
import { OpenAIProvider } from './OpenAIProvider';

export type ProviderType = 'claude' | 'openai';

export interface ProviderConfig {
  type: ProviderType;
  apiKey: string;
  model?: string;
}

export function createAIProvider(config: ProviderConfig): AIProvider {
  switch (config.type) {
    case 'claude':
      return new ClaudeProvider({
        apiKey: config.apiKey,
        model: config.model
      });
      
    case 'openai':
      return new OpenAIProvider({
        apiKey: config.apiKey,
        model: config.model
      });
      
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}

// Re-export everything
export * from './AIProvider';
export { ClaudeProvider } from './ClaudeProvider';
export { OpenAIProvider } from './OpenAIProvider';