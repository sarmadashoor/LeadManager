// @ts-nocheck
const { db } = require('../../infrastructure/persistence/db');
const { TenantRepository } = require('../../infrastructure/persistence/repositories/TenantRepository');

describe('TenantRepository', () => {
  const repo = new TenantRepository();
  const createdTenantIds = [];

  afterEach(async () => {
    for (const id of createdTenantIds) {
      await db('tenant_crm_configs').where({ tenant_id: id }).delete();
      await db('tenants').where({ id }).delete();
    }
    createdTenantIds.length = 0;
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('create', () => {
    it('should create a tenant with active status', async () => {
      const tenant = await repo.create({
        slug: `test-tenant-${Date.now()}`,
        name: 'Test Tenant'
      });
      createdTenantIds.push(tenant.id);

      expect(tenant.id).toBeDefined();
      expect(tenant.status).toBe('active');
    });
  });

  describe('findBySlug', () => {
    it('should find tenant by slug', async () => {
      const slug = `find-slug-${Date.now()}`;
      const created = await repo.create({ slug, name: 'Find Me' });
      createdTenantIds.push(created.id);

      const found = await repo.findBySlug(slug);

      expect(found).not.toBeNull();
      if (!found) {
        throw new Error('Expected tenant to be found');
      }

      expect(found.name).toBe('Find Me');
    });

    it('should return null for non-existent slug', async () => {
      const found = await repo.findBySlug('does-not-exist');
      expect(found).toBeNull();
    });
  });

  describe('CRM Config', () => {
    it('should create and retrieve CRM config', async () => {
      const tenant = await repo.create({
        slug: `crm-config-${Date.now()}`,
        name: 'CRM Test'
      });
      createdTenantIds.push(tenant.id);

      const config = await repo.createCRMConfig(tenant.id, {
        crm_type: 'shopmonkey',
        crm_credentials: { api_key: 'test-key' },
        polling_interval_minutes: 10
      });

      expect(config.crm_type).toBe('shopmonkey');
      expect(config.polling_enabled).toBe(true);
      expect(config.polling_interval_minutes).toBe(10);

      const retrieved = await repo.getCRMConfig(tenant.id);
      expect(retrieved).not.toBeNull();
      if (!retrieved) {
        throw new Error('Expected CRM config to be retrieved');
      }
      expect(retrieved.crm_type).toBe('shopmonkey');
    });
  });

  describe('updateLastPolled', () => {
    it('should update poll status and reset failures on success', async () => {
      const tenant = await repo.create({
        slug: `poll-test-${Date.now()}`,
        name: 'Poll Test'
      });
      createdTenantIds.push(tenant.id);

      await repo.createCRMConfig(tenant.id, {
        crm_type: 'shopmonkey',
        crm_credentials: { api_key: 'test' }
      });

      await repo.updateLastPolled(tenant.id, 'success');

      const config = await repo.getCRMConfig(tenant.id);
      expect(config).not.toBeNull();
      if (!config) {
        throw new Error('Expected CRM config to be retrieved');
      }

      expect(config.last_poll_status).toBe('success');
      expect(config.consecutive_failures).toBe(0);
    });
  });
});
