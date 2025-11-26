// packages/chat/src/ai/providers/ClaudeProvider.ts

import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AICompletionOptions, AIResponse } from './AIProvider';

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  public readonly name = 'claude';
  public readonly model: string;
  
  private readonly PRICE_INPUT = 3.00;  // per million tokens
  private readonly PRICE_OUTPUT = 15.00; // per million tokens
  
  constructor(config: { apiKey: string; model?: string }) {
    this.client = new Anthropic({
      apiKey: config.apiKey
    });
    this.model = config.model || 'claude-sonnet-4-20250514';
  }
  
  async complete(options: AICompletionOptions): Promise<AIResponse> {
    const startTime = Date.now();
    
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
      system: options.systemPrompt,
      messages: options.messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.content
      }))
    });
    
    const latency = Date.now() - startTime;
    
    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');
    
    return {
      content,
      metadata: {
        provider: this.name,
        model: this.model,
        tokens_used: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens
        },
        latency_ms: latency,
        finish_reason: response.stop_reason || 'unknown'
      }
    };
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.messages.create({
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