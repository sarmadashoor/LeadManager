// @ts-nocheck

const { db, testConnection } = require('../infrastructure/persistence/db');

describe('Database', () => {
  beforeAll(async () => {
    await testConnection();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('Setup', () => {
    it('should connect to database', async () => {
      const result = await db.raw('SELECT 1 as connected');
      expect(result.rows[0].connected).toBe(1);
    });

    it('should have all required tables', async () => {
      const tables = await db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);

      const tableNames = tables.rows.map((r) => r.table_name);

      expect(tableNames).toContain('tenants');
      expect(tableNames).toContain('tenant_crm_configs');
      expect(tableNames).toContain('locations');
      expect(tableNames).toContain('leads');
      expect(tableNames).toContain('chat_sessions');
      expect(tableNames).toContain('job_executions');
    });

    it('should have version column on leads for optimistic locking', async () => {
      const columns = await db.raw(`
        SELECT column_name, column_default
        FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'version'
      `);

      expect(columns.rows.length).toBe(1);
      expect(columns.rows[0].column_default).toBe('1');
    });

    it('should have unique constraint on leads to prevent duplicates', async () => {
      const constraints = await db.raw(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'leads' AND constraint_type = 'UNIQUE'
      `);

      expect(constraints.rows.length).toBeGreaterThan(0);
    });

    it('should have job_key unique constraint for idempotency', async () => {
      const constraints = await db.raw(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'job_executions' AND constraint_type = 'UNIQUE'
      `);

      expect(constraints.rows.length).toBeGreaterThan(0);
    });

    it('should enforce foreign key from leads to tenants', async () => {
      const fk = await db.raw(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'leads' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%tenant%'
      `);

      expect(fk.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Race Condition Prevention', () => {
    let tenantId;
    let locationId;

    beforeEach(async () => {
      // Create tenant
      const [tenant] = await db('tenants')
        .insert({ slug: `test-race-${Date.now()}`, name: 'Test Race Tenant' })
        .returning('*');
      tenantId = tenant.id;

      // Create location for this tenant (for NOT NULL location_id on leads)
      const [location] = await db('locations')
        .insert({
          tenant_id: tenantId,
          name: 'Test Race Location',
        })
        .returning('*');
      locationId = location.id;
    });

    afterEach(async () => {
      await db('job_executions').where({ tenant_id: tenantId }).delete();
      await db('leads').where({ tenant_id: tenantId }).delete();
      await db('locations').where({ tenant_id: tenantId }).delete();
      await db('tenants').where({ id: tenantId }).delete();
    });

    it('should prevent duplicate leads with same crm_work_order_id', async () => {
      await db('leads').insert({
        tenant_id: tenantId,
        location_id: locationId,
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-123',
        service_type: 'window-tinting',
      });

      await expect(
        db('leads').insert({
          tenant_id: tenantId,
          location_id: locationId,
          crm_source: 'shopmonkey',
          crm_work_order_id: 'WO-123',
          service_type: 'window-tinting',
        }),
      ).rejects.toThrow();
    });

    it('should allow same crm_work_order_id for different tenants', async () => {
      await db('leads').insert({
        tenant_id: tenantId,
        location_id: locationId,
        crm_source: 'shopmonkey',
        crm_work_order_id: 'WO-MULTI',
        service_type: 'window-tinting',
      });

      // Second tenant
      const [tenant2] = await db('tenants')
        .insert({ slug: `test-race-2-${Date.now()}`, name: 'Test Tenant 2' })
        .returning('*');

      // Location for second tenant
      const [location2] = await db('locations')
        .insert({
          tenant_id: tenant2.id,
          name: 'Test Race Location 2',
        })
        .returning('*');

      const [lead] = await db('leads')
        .insert({
          tenant_id: tenant2.id,
          location_id: location2.id,
          crm_source: 'shopmonkey',
          crm_work_order_id: 'WO-MULTI',
          service_type: 'window-tinting',
        })
        .returning('*');

      expect(lead.id).toBeDefined();

      await db('leads').where({ tenant_id: tenant2.id }).delete();
      await db('locations').where({ tenant_id: tenant2.id }).delete();
      await db('tenants').where({ id: tenant2.id }).delete();
    });

    it('should prevent duplicate job executions with same job_key', async () => {
      const jobKey = `poll:${tenantId}:${Date.now()}`;

      await db('job_executions').insert({
        tenant_id: tenantId,
        job_type: 'poll-crm',
        job_key: jobKey,
        status: 'running',
      });

      await expect(
        db('job_executions').insert({
          tenant_id: tenantId,
          job_type: 'poll-crm',
          job_key: jobKey,
          status: 'running',
        }),
      ).rejects.toThrow();
    });
  });
});
