import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { db } from '../../infrastructure/persistence/db';
import { LeadRepository } from '../../infrastructure/persistence/repositories/LeadRepository';

describe('LeadRepository', () => {
  const repo = new LeadRepository();
  let tenantId: string;

  beforeAll(async () => {
    const [tenant] = await db('tenants')
      .insert({ slug: `test-lead-repo-${Date.now()}`, name: 'Test Tenant' })
      .returning('*');
    tenantId = tenant.id;
  });

  afterAll(async () => {
    await db('leads').where({ tenant_id: tenantId }).delete();
    await db('tenants').where({ id: tenantId }).delete();
    await db.destroy();
  });

  afterEach(async () => {
    await db('leads').where({ tenant_id: tenantId }).delete();
  });

  describe('create', () => {
    it('should create a lead with tenant_id', async () => {
      const lead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-001',
        service_type: 'window-tinting',
        customer_name: 'John Doe'
      });

      expect(lead.id).toBeDefined();
      expect(lead.tenant_id).toBe(tenantId);
      expect(lead.status).toBe('new');
      expect(lead.version).toBe(1);
    });
  });

  describe('findByTenant', () => {
    it('should only return leads for the specified tenant', async () => {
      // Create lead for our tenant
      await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-002',
        service_type: 'window-tinting'
      });

      // Create another tenant with a lead
      const [otherTenant] = await db('tenants')
        .insert({ slug: `other-tenant-${Date.now()}`, name: 'Other' })
        .returning('*');
      
      await repo.create(otherTenant.id, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-003',
        service_type: 'window-tinting'
      });

      // Query should only return our tenant's lead
      const leads = await repo.findByTenant(tenantId);
      expect(leads.length).toBe(1);
      expect(leads[0].crm_work_order_id).toBe('WO-002');

      // Cleanup other tenant
      await db('leads').where({ tenant_id: otherTenant.id }).delete();
      await db('tenants').where({ id: otherTenant.id }).delete();
    });
  });

  describe('findByWorkOrderId', () => {
    it('should find lead by CRM work order ID', async () => {
      await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-FIND-001',
        service_type: 'window-tinting'
      });

      const found = await repo.findByWorkOrderId(tenantId, 'shopmonkey', 'WO-FIND-001');
      expect(found).not.toBeNull();
      expect(found!.crm_work_order_id).toBe('WO-FIND-001');
    });

    it('should return null for non-existent work order', async () => {
      const found = await repo.findByWorkOrderId(tenantId, 'shopmonkey', 'DOES-NOT-EXIST');
      expect(found).toBeNull();
    });

    it('should not find lead from different tenant', async () => {
      await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-TENANT-CHECK',
        service_type: 'window-tinting'
      });

      const [otherTenant] = await db('tenants')
        .insert({ slug: `check-tenant-${Date.now()}`, name: 'Check' })
        .returning('*');

      // Should not find it with different tenant
      const found = await repo.findByWorkOrderId(otherTenant.id, 'shopmonkey', 'WO-TENANT-CHECK');
      expect(found).toBeNull();

      await db('tenants').where({ id: otherTenant.id }).delete();
    });
  });

  describe('upsert', () => {
    it('should create new lead if not exists', async () => {
      const { lead, created } = await repo.upsert(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-UPSERT-001',
        service_type: 'window-tinting',
        customer_name: 'Jane Doe'
      });

      expect(created).toBe(true);
      expect(lead.customer_name).toBe('Jane Doe');
    });

    it('should update existing lead', async () => {
      // Create initial
      await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-UPSERT-002',
        service_type: 'window-tinting',
        customer_name: 'Original Name'
      });

      // Upsert with updated data
      const { lead, created } = await repo.upsert(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-UPSERT-002',
        service_type: 'window-tinting',
        customer_name: 'Updated Name'
      });

      expect(created).toBe(false);
      expect(lead.customer_name).toBe('Updated Name');
      expect(lead.version).toBe(2);
    });
  });

  describe('updateStatus with optimistic locking', () => {
    it('should update status when version matches', async () => {
      const lead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-LOCK-001',
        service_type: 'window-tinting'
      });

      const updated = await repo.updateStatus(tenantId, lead.id, 'contacted', lead.version);
      
      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('contacted');
      expect(updated!.version).toBe(2);
    });

    it('should fail update when version mismatch (race condition)', async () => {
      const lead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-LOCK-002',
        service_type: 'window-tinting'
      });

      // Simulate another process updating first
      await db('leads').where({ id: lead.id }).update({ version: 5 });

      // Our update should fail due to version mismatch
      const updated = await repo.updateStatus(tenantId, lead.id, 'contacted', lead.version);
      expect(updated).toBeNull();
    });
  });

  describe('findByStatus', () => {
    it('should filter by status', async () => {
      await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-STATUS-001',
        service_type: 'window-tinting',
        status: 'new'
      });

      await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-STATUS-002',
        service_type: 'window-tinting',
        status: 'contacted'
      });

      const newLeads = await repo.findByStatus(tenantId, 'new');
      expect(newLeads.length).toBe(1);
      expect(newLeads[0].crm_work_order_id).toBe('WO-STATUS-001');
    });
  });

  describe('markInvitationSent', () => {
    it('should update status and timestamp', async () => {
      const lead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-INVITE-001',
        service_type: 'window-tinting'
      });

      const updated = await repo.markInvitationSent(tenantId, lead.id);

      expect(updated!.status).toBe('contacted');
      expect(updated!.invitation_sent_at).not.toBeNull();
    });
  });

  // ============ Touch Point Tests ============

  describe('findDueForTouchPoint', () => {
    it('should find leads with next_touch_point_at in the past', async () => {
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago
      const lead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-DUE-001',
        service_type: 'window-tinting',
        status: 'new'
      });

      await repo.scheduleNextTouchPoint(tenantId, lead.id, pastDate);

      const dueLeads = await repo.findDueForTouchPoint(tenantId);
      expect(dueLeads.length).toBe(1);
      expect(dueLeads[0].id).toBe(lead.id);
    });

    it('should not find leads with next_touch_point_at in the future', async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      const lead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-FUTURE-001',
        service_type: 'window-tinting',
        status: 'new'
      });

      await repo.scheduleNextTouchPoint(tenantId, lead.id, futureDate);

      const dueLeads = await repo.findDueForTouchPoint(tenantId);
      expect(dueLeads.length).toBe(0);
    });

    it('should not find leads that have reached 13 touch points', async () => {
      const pastDate = new Date(Date.now() - 60000);
      const lead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-MAXED-001',
        service_type: 'window-tinting',
        status: 'contacted'
      });

      // Manually set touch_point_count to 13
      await db('leads').where({ id: lead.id }).update({ 
        touch_point_count: 13,
        next_touch_point_at: pastDate
      });

      const dueLeads = await repo.findDueForTouchPoint(tenantId);
      expect(dueLeads.length).toBe(0);
    });

    it('should only find leads with eligible statuses', async () => {
      const pastDate = new Date(Date.now() - 60000);
      
      // Create lead with 'lost' status (not eligible)
      const lostLead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-LOST-001',
        service_type: 'window-tinting',
        status: 'lost'
      });
      await repo.scheduleNextTouchPoint(tenantId, lostLead.id, pastDate);

      // Create lead with 'new' status (eligible)
      const newLead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-NEW-001',
        service_type: 'window-tinting',
        status: 'new'
      });
      await repo.scheduleNextTouchPoint(tenantId, newLead.id, pastDate);

      const dueLeads = await repo.findDueForTouchPoint(tenantId);
      expect(dueLeads.length).toBe(1);
      expect(dueLeads[0].id).toBe(newLead.id);
    });
  });

  describe('recordTouchPoint', () => {
    it('should increment touch_point_count and update timestamps', async () => {
      const lead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-TOUCH-001',
        service_type: 'window-tinting'
      });

      expect(lead.touch_point_count).toBe(0);

      const nextTime = new Date(Date.now() + 86400000); // Tomorrow
      const updated = await repo.recordTouchPoint(tenantId, lead.id, nextTime);

      expect(updated!.touch_point_count).toBe(1);
      expect(updated!.last_contacted_at).not.toBeNull();
      expect(updated!.next_touch_point_at).not.toBeNull();
    });

    it('should set next_touch_point_at to null when no more touch points', async () => {
      const lead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-TOUCH-002',
        service_type: 'window-tinting'
      });

      const updated = await repo.recordTouchPoint(tenantId, lead.id, null);

      expect(updated!.touch_point_count).toBe(1);
      expect(updated!.next_touch_point_at).toBeNull();
    });
  });

  describe('markAsLost', () => {
    it('should update status and clear next touch point', async () => {
      const lead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-LOST-TEST-001',
        service_type: 'window-tinting',
        status: 'contacted'
      });

      await repo.scheduleNextTouchPoint(tenantId, lead.id, new Date());
      const updated = await repo.markAsLost(tenantId, lead.id);

      expect(updated!.status).toBe('lost');
      expect(updated!.next_touch_point_at).toBeNull();
    });
  });

  describe('markAsResponded', () => {
    it('should update status and stop follow-ups', async () => {
      const lead = await repo.create(tenantId, {
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-RESPOND-001',
        service_type: 'window-tinting',
        status: 'contacted'
      });

      await repo.scheduleNextTouchPoint(tenantId, lead.id, new Date());
      const updated = await repo.markAsResponded(tenantId, lead.id);

      expect(updated!.status).toBe('chat_active');
      expect(updated!.first_response_at).not.toBeNull();
      expect(updated!.next_touch_point_at).toBeNull();
    });
  });
});
