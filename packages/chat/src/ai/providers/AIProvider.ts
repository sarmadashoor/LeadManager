// packages/chat/src/ai/providers/AIProvider.ts

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  metadata: {
    provider: string;
    model: string;
    tokens_used: {
      input: number;
      output: number;
      total: number;
    };
    latency_ms: number;
    finish_reason: string;
  };
}

export interface AICompletionOptions {
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  complete(options: AICompletionOptions): Promise<AIResponse>;
  healthCheck(): Promise<boolean>;
  calculateCost(tokensUsed: { input: number; output: number }): number;
}