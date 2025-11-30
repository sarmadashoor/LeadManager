// packages/chat/src/repositories/__tests__/ChatMessageRepository.test.ts

import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { ChatMessageRepository } from '../ChatMessageRepository';
import db from '../../../infrastructure/db';
import { randomUUID } from 'crypto';

describe('ChatMessageRepository', () => {
  let repository: ChatMessageRepository;
  let testLeadId: string;
  let testTenantId: string;
  let testLocationId: string;
  let createdSessionIds: string[] = [];
  let createdLeadIds: string[] = [];

  beforeEach(async () => {
    repository = new ChatMessageRepository();
    
    // Use existing tenant and location from DB
    const tenant = await db('tenants').first();
    const location = await db('locations').where('tenant_id', tenant.id).first();
    
    testTenantId = tenant.id;
    testLocationId = location.id;
    
    // Create a test lead
    testLeadId = randomUUID();
    await db('leads').insert({
      id: testLeadId,
      tenant_id: testTenantId,
      location_id: testLocationId,
      crm_source: 'shopmonkey',
      crm_work_order_id: `WO-TEST-${testLeadId.substring(0, 8)}`,
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      customer_phone: '555-0100',
      vehicle_year: 2023,
      vehicle_make: 'Toyota',
      vehicle_model: 'Camry',
      service_type: 'window_tinting',
      status: 'new',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    createdLeadIds.push(testLeadId);
  });

  afterEach(async () => {
    // Clean up in correct order (messages -> sessions -> leads)
    for (const sessionId of createdSessionIds) {
      await db('chat_messages').where('session_id', sessionId).del();
      await db('chat_sessions').where('id', sessionId).del();
    }
    createdSessionIds = [];
    
    for (const leadId of createdLeadIds) {
      await db('chat_messages').where('lead_id', leadId).del();
      await db('chat_sessions').where('lead_id', leadId).del();
      await db('leads').where('id', leadId).del();
    }
    createdLeadIds = [];
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('saveMessage', () => {
    it('saves user message to database', async () => {
      const message = await repository.saveMessage(testLeadId, 'user', 'Hello, how much for tint?');
      
      expect(message.id).toBeDefined();
      expect(message.session_id).toBeDefined();
      expect(message.lead_id).toBe(testLeadId);
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello, how much for tint?');
      expect(message.created_at).toBeInstanceOf(Date);
      
      const saved = await db('chat_messages').where('id', message.id).first();
      expect(saved).toBeDefined();
      expect(saved.content).toBe('Hello, how much for tint?');
      
      createdSessionIds.push(message.session_id);
    });

    it('saves assistant message to database', async () => {
      const message = await repository.saveMessage(testLeadId, 'assistant', 'Ceramic tint starts at $299.');
      
      expect(message.id).toBeDefined();
      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Ceramic tint starts at $299.');
      
      createdSessionIds.push(message.session_id);
    });

    it('creates chat session if it does not exist', async () => {
      const message = await repository.saveMessage(testLeadId, 'user', 'First message');
      
      const session = await db('chat_sessions').where('id', message.session_id).first();
      expect(session).toBeDefined();
      expect(session.lead_id).toBe(testLeadId);
      expect(session.tenant_id).toBe(testTenantId);
      expect(session.status).toBe('active');
      
      createdSessionIds.push(message.session_id);
    });

    it('reuses existing chat session for same lead', async () => {
      const message1 = await repository.saveMessage(testLeadId, 'user', 'First message');
      const message2 = await repository.saveMessage(testLeadId, 'assistant', 'Response');
      
      expect(message1.session_id).toBe(message2.session_id);
      
      createdSessionIds.push(message1.session_id);
    });
  });

  describe('getMessagesByLead', () => {
    beforeEach(async () => {
      const msg1 = await repository.saveMessage(testLeadId, 'user', 'Hello');
      createdSessionIds.push(msg1.session_id);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      await repository.saveMessage(testLeadId, 'assistant', 'Hi there!');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      await repository.saveMessage(testLeadId, 'user', 'How much?');
    });

    it('retrieves all messages for a lead', async () => {
      const messages = await repository.getMessagesByLead(testLeadId);
      
      expect(messages.length).toBeGreaterThanOrEqual(3);
      const lastThree = messages.slice(-3);
      expect(lastThree[0].content).toBe('Hello');
      expect(lastThree[1].content).toBe('Hi there!');
      expect(lastThree[2].content).toBe('How much?');
    });

    it('orders messages by created_at ascending', async () => {
      const messages = await repository.getMessagesByLead(testLeadId);
      
      for (let i = 1; i < messages.length; i++) {
        expect(messages[i].created_at.getTime()).toBeGreaterThanOrEqual(
          messages[i - 1].created_at.getTime()
        );
      }
    });

    it('returns empty array for lead with no messages', async () => {
      const newLeadId = randomUUID();
      await db('leads').insert({
        id: newLeadId,
        tenant_id: testTenantId,
        location_id: testLocationId,
        crm_source: 'shopmonkey',
        crm_work_order_id: `WO-TEST-${newLeadId.substring(0, 8)}`,
        customer_name: 'New User',
        customer_email: 'new@example.com',
        customer_phone: '555-0101',
        vehicle_year: 2023,
        vehicle_make: 'Honda',
        vehicle_model: 'Civic',
        service_type: 'window_tinting',
        status: 'new',
        created_at: new Date(),
        updated_at: new Date()
      });
      createdLeadIds.push(newLeadId);
      
      const messages = await repository.getMessagesByLead(newLeadId);
      
      expect(messages).toEqual([]);
    });
  });
});
