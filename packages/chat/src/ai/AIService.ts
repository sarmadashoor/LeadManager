// packages/chat/src/ai/AIService.ts

import { AIProvider, createAIProvider, ProviderType } from './providers';
import { AIConfig, loadAIConfig } from '../config/ai-config';

export interface ChatContext {
  customer: {
    name: string;
    vehicle: string;
  };
  services: Array<{
    name: string;
    price: number;
    description: string;
  }>;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export class AIService {
  private config: AIConfig;
  private providers: Map<ProviderType, AIProvider>;
  
  constructor() {
    this.config = loadAIConfig();
    this.providers = new Map();
    this.initializeProviders();
  }
  
  private initializeProviders() {
    if (this.config.anthropicApiKey) {
      this.providers.set('claude', createAIProvider({
        type: 'claude',
        apiKey: this.config.anthropicApiKey,
        model: this.config.claudeModel
      }));
    }
    
    if (this.config.openaiApiKey) {
      this.providers.set('openai', createAIProvider({
        type: 'openai',
        apiKey: this.config.openaiApiKey,
        model: this.config.openaiModel
      }));
    }
    
    if (this.providers.size === 0) {
      throw new Error('No AI providers configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY');
    }
  }
  
  private selectProvider(): { provider: AIProvider; type: ProviderType } {
    const primaryProvider = this.providers.get(this.config.provider);
    if (primaryProvider) {
      return {
        provider: primaryProvider,
        type: this.config.provider
      };
    }
    
    // Fallback to any available provider
    const [type, provider] = Array.from(this.providers.entries())[0];
    return { provider, type };
  }
  
  async generateResponse(
    context: ChatContext,
    userMessage: string
  ): Promise<{
    content: string;
    provider: string;
    metadata: any;
  }> {
    const { provider, type } = this.selectProvider();
    
    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(context);
    
    // Build messages
    const messages = [
      ...context.conversationHistory,
      { role: 'user' as const, content: userMessage }
    ];
    
    try {
      const response = await provider.complete({
        systemPrompt,
        messages,
        maxTokens: 500,
        temperature: 0.7
      });
      
      return {
        content: response.content,
        provider: type,
        metadata: response.metadata
      };
      
    } catch (error) {
      // Try fallback if configured
      if (this.config.fallbackProvider && 
          this.config.fallbackProvider !== type &&
          this.providers.has(this.config.fallbackProvider)) {
        
        console.log(`${type} failed, trying fallback: ${this.config.fallbackProvider}`);
        
        const fallbackProvider = this.providers.get(this.config.fallbackProvider)!;
        const response = await fallbackProvider.complete({
          systemPrompt,
          messages,
          maxTokens: 500,
          temperature: 0.7
        });
        
        return {
          content: response.content,
          provider: this.config.fallbackProvider,
          metadata: {
            ...response.metadata,
            fallback: true,
            primaryProviderError: (error as Error).message
          }
        };
      }
      
      throw error;
    }
  }
  
  private buildSystemPrompt(context: ChatContext): string {
    return `You are an AI assistant for Tint World, a professional automotive window tinting service.

PERSONALITY:
- Friendly and helpful
- Professional but not stiff
- Focus on solving the customer's needs

CUSTOMER CONTEXT:
- Name: ${context.customer.name}
- Vehicle: ${context.customer.vehicle}

AVAILABLE SERVICES:
${context.services.map(s => `- ${s.name}: $${s.price} - ${s.description}`).join('\n')}

GUIDELINES:
- Keep responses concise (2-3 sentences max)
- Reference customer's vehicle when relevant
- Be specific with pricing
- If unsure, offer to connect with team`;
  }
  
  async checkHealth(): Promise<Record<ProviderType, boolean>> {
    const health: Partial<Record<ProviderType, boolean>> = {};
    
    for (const [type, provider] of this.providers.entries()) {
      health[type] = await provider.healthCheck();
    }
    
    return health as Record<ProviderType, boolean>;
  }
}