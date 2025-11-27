// packages/chat/src/repositories/ChatMessageRepository.ts

import db from '../infrastructure/db';
import { randomUUID } from 'crypto';

export interface ChatMessage {
  id: string;
  session_id: string;
  lead_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface ChatSession {
  id: string;
  tenant_id: string;
  lead_id: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class ChatMessageRepository {
  async saveMessage(
    leadId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>
  ): Promise<ChatMessage> {
    const sessionId = await this.getOrCreateSession(leadId);
    
    const [message] = await db('chat_messages')
      .insert({
        id: randomUUID(),
        session_id: sessionId,
        lead_id: leadId,
        role,
        content,
        metadata: metadata || null,  // Knex handles JSONB automatically
        created_at: new Date()
      })
      .returning('*');
    
    await db('chat_sessions')
      .where('id', sessionId)
      .update({ 
        last_message_at: new Date(),
        updated_at: new Date()
      });
    
    return message;  // No parsing needed - Knex handles it
  }

  async getMessagesByLead(leadId: string): Promise<ChatMessage[]> {
    const messages = await db('chat_messages')
      .where('lead_id', leadId)
      .orderBy('created_at', 'asc')
      .select('*');
    
    return messages;  // No parsing needed - Knex handles it
  }

  private async getOrCreateSession(leadId: string): Promise<string> {
    const existingSession = await db('chat_sessions')
      .where('lead_id', leadId)
      .where('status', 'active')
      .first();
    
    if (existingSession) {
      return existingSession.id;
    }
    
    const lead = await db('leads').where('id', leadId).select('tenant_id').first();
    if (!lead) {
      throw new Error('Lead not found');
    }
    
    const [session] = await db('chat_sessions')
      .insert({
        id: randomUUID(),
        tenant_id: lead.tenant_id,
        lead_id: leadId,
        status: 'active',
        started_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    return session.id;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const session = await db('chat_sessions')
      .where('id', sessionId)
      .first();
    
    return session || null;
  }

  async getSessionByLead(leadId: string): Promise<ChatSession | null> {
    const session = await db('chat_sessions')
      .where('lead_id', leadId)
      .where('status', 'active')
      .first();
    
    return session || null;
  }
}
