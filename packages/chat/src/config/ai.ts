// packages/chat/src/config/ai-config.ts

import { ProviderType } from '../ai/providers';

export interface AIConfig {
  provider: ProviderType;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  claudeModel?: string;
  openaiModel?: string;
  fallbackProvider?: ProviderType;
}

export function loadAIConfig(): AIConfig {
  return {
    provider: (process.env.AI_PROVIDER as ProviderType) || 'claude',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    claudeModel: process.env.CLAUDE_MODEL,
    openaiModel: process.env.OPENAI_MODEL,
    fallbackProvider: process.env.AI_FALLBACK_PROVIDER as ProviderType
  };
}