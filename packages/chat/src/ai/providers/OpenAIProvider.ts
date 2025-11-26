// packages/chat/src/ai/providers/OpenAIProvider.ts

import OpenAI from 'openai';
import { AIProvider, AICompletionOptions, AIResponse } from './AIProvider';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  public readonly name = 'openai';
  public readonly model: string;
  
  private readonly PRICE_INPUT = 2.50;  // per million tokens
  private readonly PRICE_OUTPUT = 10.00; // per million tokens
  
  constructor(config: { apiKey: string; model?: string }) {
    this.client = new OpenAI({
      apiKey: config.apiKey
    });
    this.model = config.model || 'gpt-4o';
  }
  
  async complete(options: AICompletionOptions): Promise<AIResponse> {
    const startTime = Date.now();
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    messages.push(...options.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })));
    
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
      messages
    });
    
    const latency = Date.now() - startTime;
    const choice = response.choices[0];
    const content = choice.message.content || '';
    
    return {
      content,
      metadata: {
        provider: this.name,
        model: this.model,
        tokens_used: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0
        },
        latency_ms: latency,
        finish_reason: choice.finish_reason || 'unknown'
      }
    };
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }]
      });
      return true;
    } catch (error) {
      return false;
    }
  }
  
  calculateCost(tokensUsed: { input: number; output: number }): number {
    const inputCost = (tokensUsed.input / 1_000_000) * this.PRICE_INPUT;
    const outputCost = (tokensUsed.output / 1_000_000) * this.PRICE_OUTPUT;
    return inputCost + outputCost;
  }
}