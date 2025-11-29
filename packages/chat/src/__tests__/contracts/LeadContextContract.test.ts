// @ts-nocheck

import db from '../../infrastructure/db';
import { LeadContextRepository } from '../../repositories/LeadContextRepository';

describe('Contract: Orchestrator lead data <> Chat lead context', () => {
  const leadContextRepo = new LeadContextRepository();

  let tenantId: string | null = null;
  let locationId: string | null = null;
  let leadId: string | null = null;

  beforeAll(async () => {
    // Sanity check that the DB connection is up
    await db.raw('SELECT 1');
  });

  beforeEach(async () => {
    // 1) Create a tenant similar to orchestrator behaviour
    const [tenant] = await db('tenants')
      .insert({
        slug: `contract-tenant-${Date.now()}`,
        name: 'Contract Test Tenant',
      })
      .returning('*');

    tenantId = tenant.id;

    // 2) Create a minimal valid location for that tenant
    const [location] = await db('locations')
      .insert({
        tenant_id: tenantId,
        name: 'Contract Test Location',
      })
      .returning('*');

    locationId = location.id;

    // 3) Create a lead that matches orchestrator’s usage
    const [lead] = await db('leads')
      .insert({
        tenant_id: tenantId,
        location_id: locationId,
        crm_source: 'shopmonkey',
        crm_work_order_id: `WO-CONTRACT-${Date.now()}`,
        service_type: 'window-tinting',
        status: 'new',
        customer_name: 'Contract Test Lead',
      })
      .returning('*');

    leadId = lead.id;
  });

  // Belt-and-suspenders cleanup: wipe everything tied to this tenant
  afterEach(async () => {
    if (!tenantId) return;

    try {
      // Get all lead IDs for this tenant
      const leadRows = await db('leads')
        .select('id')
        .where({ tenant_id: tenantId });

      const leadIdsForTenant = leadRows.map((r: any) => r.id);

      if (leadIdsForTenant.length > 0) {
        // Delete chat-related rows first (FK safety)
        await db('chat_messages')
          .whereIn('lead_id', leadIdsForTenant)
          .delete();

        await db('chat_sessions')
          .whereIn('lead_id', leadIdsForTenant)
          .delete();
      }

      // Then delete leads & locations for this tenant
      await db('leads').where({ tenant_id: tenantId }).delete();
      await db('locations').where({ tenant_id: tenantId }).delete();

      // Finally, delete the tenant itself
      await db('tenants').where({ id: tenantId }).delete();
    } finally {
      // Reset IDs for the next test even if something above throws
      tenantId = null;
      locationId = null;
      leadId = null;
    }
  });

  afterAll(async () => {
    if (db && typeof db.destroy === 'function') {
      await db.destroy();
    }
  });

  it('Chat LeadContextRepository can build context for a lead created by orchestrator', async () => {
    if (!leadId) {
      throw new Error('Lead not created in beforeEach');
    }

    // IMPORTANT: this method name matches your existing repo tests
    const context: any = await leadContextRepo.getLeadContext(leadId);

    // Log once so we can see the exact shape while stabilizing the contract
    // eslint-disable-next-line no-console
    console.log(
      'Contract LeadContext for lead',
      leadId,
      JSON.stringify(context, null, 2),
    );

    // Core contract: context exists
    expect(context).not.toBeNull();
    expect(context).toBeDefined();

    // --- Customer contract ---
    expect(context.customer).toBeDefined();
    expect(context.customer.name).toBe('Contract Test Lead');

    // We don’t care exactly what vehicle is, but we do care the field exists
    // (so the chat UI can safely render it).
    expect(context.customer).toHaveProperty('vehicle');

    // --- Services contract ---
    expect(Array.isArray(context.services)).toBe(true);
    expect(context.services.length).toBeGreaterThan(0);

    const firstService = context.services[0];
    expect(firstService).toHaveProperty('name');
    expect(firstService).toHaveProperty('price');
    expect(firstService).toHaveProperty('description');

    // Because the lead was created with service_type = 'window-tinting',
    // we expect the recommended services to be *about tinting*.
    // This is the actual cross-package behaviour we care about.
    const anyTintService = context.services.some((s: any) =>
      typeof s.name === 'string' &&
      s.name.toLowerCase().includes('tint'),
    );
    expect(anyTintService).toBe(true);

    // --- Conversation history contract ---
    expect(Array.isArray(context.conversationHistory)).toBe(true);
    expect(context.conversationHistory.length).toBe(0);
  });
});
