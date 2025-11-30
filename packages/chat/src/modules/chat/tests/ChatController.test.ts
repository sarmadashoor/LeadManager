// packages/chat/src/api/controllers/__tests__/ChatController.test.ts

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ChatController } from '../../../modules/chat/ChatController';
import { ChatService } from '../ChatService';

import { randomUUID } from 'crypto';

jest.mock('../ChatService');

describe('ChatController', () => {
  let controller: ChatController;
  let mockChatService: jest.Mocked<ChatService>;
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    mockChatService = new ChatService(null as any, null as any, null as any) as jest.Mocked<ChatService>;
    controller = new ChatController(mockChatService);

    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
      raw: {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      }
    };
  });

  describe('sendMessage', () => {
    const testLeadId = randomUUID();

    beforeEach(() => {
      mockRequest = {
        params: { leadId: testLeadId },
        body: { message: 'How much for tint?' }
      };
    });

    it('returns AI response on successful message', async () => {
      const mockResponse = {
        content: 'Ceramic tint starts at $299.',
        provider: 'claude',
        metadata: { tokens: 100 }
      };

      mockChatService.processMessage.mockResolvedValue(mockResponse);

      await controller.sendMessage(mockRequest, mockReply);

      expect(mockChatService.processMessage).toHaveBeenCalledWith(
        testLeadId,
        'How much for tint?'
      );
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockResponse
      });
    });

    it('returns 404 if lead not found', async () => {
      mockChatService.processMessage.mockRejectedValue(new Error('Lead not found'));

      await controller.sendMessage(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Lead not found'
      });
    });

    it('returns 400 if message is missing', async () => {
      mockRequest.body = {};

      await controller.sendMessage(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Message is required'
      });
    });

    it('returns 500 on unexpected errors', async () => {
      mockChatService.processMessage.mockRejectedValue(new Error('Database error'));

      await controller.sendMessage(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('getHistory', () => {
    const testLeadId = randomUUID();

    beforeEach(() => {
      mockRequest = {
        params: { leadId: testLeadId }
      };
    });

    it('returns conversation history', async () => {
      const mockHistory = [
        { id: '1', session_id: '1', lead_id: testLeadId, role: 'user' as const, content: 'Hello', created_at: new Date() },
        { id: '2', session_id: '1', lead_id: testLeadId, role: 'assistant' as const, content: 'Hi!', created_at: new Date() }
      ];

      mockChatService.getConversationHistory.mockResolvedValue(mockHistory);

      await controller.getHistory(mockRequest, mockReply);

      expect(mockChatService.getConversationHistory).toHaveBeenCalledWith(testLeadId);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockHistory
      });
    });

    it('returns empty array if no messages', async () => {
      mockChatService.getConversationHistory.mockResolvedValue([]);

      await controller.getHistory(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });
  });

  describe('getContext', () => {
    const testLeadId = randomUUID();

    beforeEach(() => {
      mockRequest = {
        params: { leadId: testLeadId }
      };
    });

    it('returns lead context', async () => {
      const mockContext = {
        customer: {
          name: 'John Doe',
          vehicle: '2023 Toyota Camry'
        },
        services: [
          { name: 'Ceramic Tint', price: 299, description: 'Premium tinting' }
        ],
        conversationHistory: []
      };

      mockChatService.getLeadContext.mockResolvedValue(mockContext);

      await controller.getContext(mockRequest, mockReply);

      expect(mockChatService.getLeadContext).toHaveBeenCalledWith(testLeadId);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockContext
      });
    });

    it('returns 404 if lead not found', async () => {
      mockChatService.getLeadContext.mockResolvedValue(null);

      await controller.getContext(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Lead not found'
      });
    });
  });
});
