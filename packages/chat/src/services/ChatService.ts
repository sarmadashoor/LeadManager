// packages/chat/src/services/ChatService.ts

import { AIService, ChatContext } from '../ai/AIService';
import { LeadContextRepository } from '../repositories/LeadContextRepository';
import { ChatMessageRepository, ChatMessage } from '../repositories/ChatMessageRepository';

export interface ChatResponse {
  content: string;
  provider: string;
  metadata?: Record<string, any>;
}

export class ChatService {
  constructor(
    private aiService: AIService,
    private leadRepo: LeadContextRepository,
    private messageRepo: ChatMessageRepository
  ) {}

  async processMessage(leadId: string, userMessage: string): Promise<ChatResponse> {
    const context = await this.leadRepo.getLeadContext(leadId);
    if (!context) {
      throw new Error('Lead not found');
    }

    const history = await this.messageRepo.getMessagesByLead(leadId);
    const conversationHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const completeContext: ChatContext = {
      ...context,
      conversationHistory
    };

    await this.messageRepo.saveMessage(leadId, 'user', userMessage);

    const aiResponse = await this.aiService.generateResponse(completeContext, userMessage);

    await this.messageRepo.saveMessage(
      leadId,
      'assistant',
      aiResponse.content,
      {
        provider: aiResponse.provider,
        ...aiResponse.metadata
      }
    );

    return {
      content: aiResponse.content,
      provider: aiResponse.provider,
      metadata: aiResponse.metadata
    };
  }

  async getConversationHistory(leadId: string): Promise<ChatMessage[]> {
    return this.messageRepo.getMessagesByLead(leadId);
  }

  async getLeadContext(leadId: string): Promise<ChatContext | null> {
    return this.leadRepo.getLeadContext(leadId);
  }
}
