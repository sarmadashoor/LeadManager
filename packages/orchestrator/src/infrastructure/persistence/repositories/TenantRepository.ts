import { db } from '../db';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: string;
  plan_tier: string | null;
  subscription_status: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface TenantCRMConfig {
  id: string;
  tenant_id: string;
  crm_type: string;
  crm_credentials: Record<string, any>;
  polling_enabled: boolean;
  polling_interval_minutes: number;
  last_polled_at: Date | null;
  last_poll_status: string | null;
  consecutive_failures: number;
  last_error: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTenantData {
  slug: string;
  name: string;
  plan_tier?: string;
}

export interface CreateCRMConfigData {
  crm_type: string;
  crm_credentials: Record<string, any>;
  polling_interval_minutes?: number;
}

export class TenantRepository {
  async findById(tenantId: string): Promise<Tenant | null> {
    const tenant = await db('tenants').where({ id: tenantId }).whereNull('deleted_at').first();
    return tenant || null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await db('tenants').where({ slug }).whereNull('deleted_at').first();
    return tenant || null;
  }

  async findActive(): Promise<Tenant[]> {
    return db('tenants').where({ status: 'active' }).whereNull('deleted_at');
  }

  async create(data: CreateTenantData): Promise<Tenant> {
    const [tenant] = await db('tenants')
      .insert({ ...data, status: 'active' })
      .returning('*');
    return tenant;
  }

  async getCRMConfig(tenantId: string): Promise<TenantCRMConfig | null> {
    const config = await db('tenant_crm_configs').where({ tenant_id: tenantId }).first();
    return config || null;
  }

  async createCRMConfig(tenantId: string, data: CreateCRMConfigData): Promise<TenantCRMConfig> {
    const [config] = await db('tenant_crm_configs')
      .insert({
        tenant_id: tenantId,
        crm_type: data.crm_type,
        crm_credentials: JSON.stringify(data.crm_credentials),
        polling_interval_minutes: data.polling_interval_minutes || 5
      })
      .returning('*');
    return config;
  }

  async updateLastPolled(tenantId: string, status: 'success' | 'failed'): Promise<void> {
    const update: any = {
      last_polled_at: new Date(),
      last_poll_status: status,
      updated_at: new Date()
    };

    if (status === 'success') {
      update.consecutive_failures = 0;
      update.last_error = null;
    } else {
      update.consecutive_failures = db.raw('consecutive_failures + 1');
    }

    await db('tenant_crm_configs').where({ tenant_id: tenantId }).update(update);
  }

  async recordPollError(tenantId: string, error: Error): Promise<void> {
    await db('tenant_crm_configs')
      .where({ tenant_id: tenantId })
      .update({
        last_poll_status: 'failed',
        consecutive_failures: db.raw('consecutive_failures + 1'),
        last_error: JSON.stringify({ message: error.message, stack: error.stack }),
        updated_at: new Date()
      });
  }
}

export const tenantRepository = new TenantRepository();
