// packages/chat/src/services/__tests__/ChatService.test.ts

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ChatService } from '../ChatService';
import { AIService } from '../../ai/AIService';
import { LeadContextRepository } from '../../repositories/LeadContextRepository';
import { ChatMessageRepository } from '../../repositories/ChatMessageRepository';
import { randomUUID } from 'crypto';

jest.mock('../../ai/AIService');
jest.mock('../../repositories/LeadContextRepository');
jest.mock('../../repositories/ChatMessageRepository');

describe('ChatService', () => {
  let chatService: ChatService;
  let mockAIService: jest.Mocked<AIService>;
  let mockLeadRepo: jest.Mocked<LeadContextRepository>;
  let mockMessageRepo: jest.Mocked<ChatMessageRepository>;
  
  const testLeadId = randomUUID();

  beforeEach(() => {
    mockAIService = new AIService() as jest.Mocked<AIService>;
    mockLeadRepo = new LeadContextRepository() as jest.Mocked<LeadContextRepository>;
    mockMessageRepo = new ChatMessageRepository() as jest.Mocked<ChatMessageRepository>;
    
    chatService = new ChatService(mockAIService, mockLeadRepo, mockMessageRepo);
  });

  describe('processMessage', () => {
    const mockContext = {
      customer: {
        name: 'John Doe',
        vehicle: '2023 Toyota Camry'
      },
      services: [
        { name: 'Ceramic Tint', price: 299, description: 'Premium ceramic window tinting' }
      ],
      conversationHistory: []
    };

    it('returns AI response for user message', async () => {
      mockLeadRepo.getLeadContext.mockResolvedValue(mockContext);
      mockAIService.generateResponse.mockResolvedValue({
        content: 'Ceramic tint for your Camry starts at $299.',
        provider: 'claude',
        metadata: { tokens: 100 }
      });
      mockMessageRepo.saveMessage.mockImplementation(async (leadId, role, content) => ({
        id: randomUUID(),
        session_id: randomUUID(),
        lead_id: leadId,
        role,
        content,
        created_at: new Date()
      }));
      mockMessageRepo.getMessagesByLead.mockResolvedValue([]);

      const response = await chatService.processMessage(testLeadId, 'How much for ceramic tint?');

      expect(response.content).toBe('Ceramic tint for your Camry starts at $299.');
      expect(response.provider).toBe('claude');
      expect(mockLeadRepo.getLeadContext).toHaveBeenCalledWith(testLeadId);
    });

    it('saves user message to database', async () => {
      mockLeadRepo.getLeadContext.mockResolvedValue(mockContext);
      mockAIService.generateResponse.mockResolvedValue({
        content: 'Response',
        provider: 'claude',
        metadata: {}
      });
      mockMessageRepo.saveMessage.mockImplementation(async (leadId, role, content) => ({
        id: randomUUID(),
        session_id: randomUUID(),
        lead_id: leadId,
        role,
        content,
        created_at: new Date()
      }));
      mockMessageRepo.getMessagesByLead.mockResolvedValue([]);

      await chatService.processMessage(testLeadId, 'How much for tint?');

      expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
        testLeadId,
        'user',
        'How much for tint?'
      );
    });

    it('saves AI response to database', async () => {
      mockLeadRepo.getLeadContext.mockResolvedValue(mockContext);
      mockAIService.generateResponse.mockResolvedValue({
        content: 'Tint starts at $299.',
        provider: 'claude',
        metadata: { tokens: 100 }
      });
      mockMessageRepo.saveMessage.mockImplementation(async (leadId, role, content) => ({
        id: randomUUID(),
        session_id: randomUUID(),
        lead_id: leadId,
        role,
        content,
        created_at: new Date()
      }));
      mockMessageRepo.getMessagesByLead.mockResolvedValue([]);

      await chatService.processMessage(testLeadId, 'How much?');

      expect(mockMessageRepo.saveMessage).toHaveBeenCalledTimes(2);
      expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
        testLeadId,
        'assistant',
        'Tint starts at $299.',
        expect.objectContaining({ provider: 'claude' })
      );
    });

    it('includes conversation history in AI context', async () => {
      const historyMessages = [
        { id: '1', session_id: '1', lead_id: testLeadId, role: 'user' as const, content: 'Hello', created_at: new Date() },
        { id: '2', session_id: '1', lead_id: testLeadId, role: 'assistant' as const, content: 'Hi!', created_at: new Date() }
      ];

      mockLeadRepo.getLeadContext.mockResolvedValue(mockContext);
      mockMessageRepo.getMessagesByLead.mockResolvedValue(historyMessages);
      mockAIService.generateResponse.mockResolvedValue({
        content: 'Response',
        provider: 'claude',
        metadata: {}
      });
      mockMessageRepo.saveMessage.mockImplementation(async (leadId, role, content) => ({
        id: randomUUID(),
        session_id: randomUUID(),
        lead_id: leadId,
        role,
        content,
        created_at: new Date()
      }));

      await chatService.processMessage(testLeadId, 'New message');

      expect(mockAIService.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationHistory: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi!' }
          ]
        }),
        'New message'
      );
    });

    it('throws error if lead not found', async () => {
      mockLeadRepo.getLeadContext.mockResolvedValue(null);

      await expect(
        chatService.processMessage(testLeadId, 'Hello')
      ).rejects.toThrow('Lead not found');
    });
  });

  describe('getConversationHistory', () => {
    it('retrieves conversation history for lead', async () => {
      const mockMessages = [
        { id: '1', session_id: '1', lead_id: testLeadId, role: 'user' as const, content: 'Hello', created_at: new Date() },
        { id: '2', session_id: '1', lead_id: testLeadId, role: 'assistant' as const, content: 'Hi!', created_at: new Date() }
      ];

      mockMessageRepo.getMessagesByLead.mockResolvedValue(mockMessages);

      const history = await chatService.getConversationHistory(testLeadId);

      expect(history).toEqual(mockMessages);
      expect(mockMessageRepo.getMessagesByLead).toHaveBeenCalledWith(testLeadId);
    });
  });

  describe('getLeadContext', () => {
    it('retrieves lead context', async () => {
      const mockContext = {
        customer: { name: 'John', vehicle: '2023 Camry' },
        services: [],
        conversationHistory: []
      };

      mockLeadRepo.getLeadContext.mockResolvedValue(mockContext);

      const context = await chatService.getLeadContext(testLeadId);

      expect(context).toEqual(mockContext);
      expect(mockLeadRepo.getLeadContext).toHaveBeenCalledWith(testLeadId);
    });

    it('returns null if lead not found', async () => {
      mockLeadRepo.getLeadContext.mockResolvedValue(null);

      const context = await chatService.getLeadContext(testLeadId);

      expect(context).toBeNull();
    });
  });
});
