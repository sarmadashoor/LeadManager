// packages/chat/src/api/controllers/ChatController.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import { ChatService } from './ChatService';

interface SendMessageRequest {
  Params: {
    leadId: string;
  };
  Body: {
    message: string;
  };
}

interface LeadParams {
  Params: {
    leadId: string;
  };
}

interface StreamMessageRequest {
  Params: {
    leadId: string;
  };
  Querystring: {
    message: string;
  };
}

export class ChatController {
  constructor(private chatService: ChatService) {}

  sendMessage = async (
    request: FastifyRequest<SendMessageRequest>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const { leadId } = request.params;
      const { message } = request.body;

      if (!message || message.trim().length === 0) {
        reply.code(400).send({
          success: false,
          error: 'Message is required'
        });
        return;
      }

      const response = await this.chatService.processMessage(leadId, message);

      reply.send({
        success: true,
        data: response
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Lead not found') {
        reply.code(404).send({
          success: false,
          error: 'Lead not found'
        });
      } else {
        console.error('Error in sendMessage:', error);
        reply.code(500).send({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  };

  getHistory = async (
    request: FastifyRequest<LeadParams>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const { leadId } = request.params;

      const history = await this.chatService.getConversationHistory(leadId);

      reply.send({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error in getHistory:', error);
      reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  getContext = async (
    request: FastifyRequest<LeadParams>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const { leadId } = request.params;

      const context = await this.chatService.getLeadContext(leadId);

      if (!context) {
        reply.code(404).send({
          success: false,
          error: 'Lead not found'
        });
        return;
      }

      reply.send({
        success: true,
        data: context
      });
    } catch (error) {
      console.error('Error in getContext:', error);
      reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  streamMessage = async (
    request: FastifyRequest<StreamMessageRequest>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const { leadId } = request.params;
      const { message } = request.query;

      if (!message || message.trim().length === 0) {
        reply.code(400).send({
          success: false,
          error: 'Message is required'
        });
        return;
      }

      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');

      const context = await this.chatService.getLeadContext(leadId);
      if (!context) {
        reply.raw.write(`data: ${JSON.stringify({ error: 'Lead not found' })}\n\n`);
        reply.raw.end();
        return;
      }

      const response = await this.chatService.processMessage(leadId, message);
      
      const words = response.content.split(' ');
      for (const word of words) {
        reply.raw.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      reply.raw.write(`data: ${JSON.stringify({ done: true, provider: response.provider })}\n\n`);
      reply.raw.end();
    } catch (error) {
      console.error('Error in streamMessage:', error);
      reply.raw.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
      reply.raw.end();
    }
  };
}
