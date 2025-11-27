import { Knex } from 'knex';

export interface ServiceCatalogRow {
  id: string;
  tenant_id: string;
  location_id: string | null;
  service_type: string;
  sku: string | null;
  name: string;
  description: string | null;
  base_price_cents: number;
  duration_minutes: number | null;
  requires_appointment: boolean;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  crm_service_id: string | null;
  last_synced_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateServiceCatalogData {
  tenant_id: string;
  location_id: string | null;
  service_type: string;
  sku?: string;
  name: string;
  description?: string;
  base_price_cents: number;
  duration_minutes?: number;
  requires_appointment?: boolean;
  display_order?: number;
  is_active?: boolean;
  is_featured?: boolean;
  crm_service_id?: string;
}

export class ServiceCatalogRepository {
  constructor(private db: Knex) {}

  /**
   * Upsert service (insert or update if exists)
   * Matches on: tenant_id + location_id + crm_service_id
   */
  async upsertService(data: CreateServiceCatalogData): Promise<ServiceCatalogRow> {
    const now = new Date();
    
    const payload = {
      ...data,
      last_synced_at: now,
      updated_at: now,
    };

    // Use PostgreSQL INSERT ... ON CONFLICT
    const [result] = await this.db('service_catalog')
      .insert(payload)
      .onConflict(['tenant_id', 'location_id', 'crm_service_id'])
      .merge({
        name: data.name,
        description: data.description,
        base_price_cents: data.base_price_cents,
        duration_minutes: data.duration_minutes,
        display_order: data.display_order,
        is_active: data.is_active ?? true,
        last_synced_at: now,
        updated_at: now,
      })
      .returning('*');

    return result;
  }

  /**
   * Mark services as inactive if not synced recently
   * Used to handle deleted services in CRM
   */
  async markStaleServicesInactive(
    tenantId: string,
    locationId: string,
    olderThanHours: number = 48
  ): Promise<number> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - olderThanHours);

    const updated = await this.db('service_catalog')
      .where({
        tenant_id: tenantId,
        location_id: locationId,
        is_active: true,
      })
      .where('last_synced_at', '<', cutoff)
      .update({
        is_active: false,
        updated_at: new Date(),
      });

    return updated;
  }

  /**
   * Get all active services for a location
   */
  async getActiveServicesForLocation(
    tenantId: string,
    locationId: string
  ): Promise<ServiceCatalogRow[]> {
    return this.db('service_catalog')
      .where({
        tenant_id: tenantId,
        location_id: locationId,
        is_active: true,
      })
      .orderBy('display_order', 'asc')
      .orderBy('name', 'asc');
  }

  /**
   * Get service count by location (for monitoring)
   */
  async getServiceCountByLocation(tenantId: string): Promise<Array<{ location_id: string; count: number }>> {
    return this.db('service_catalog')
      .where({ tenant_id: tenantId, is_active: true })
      .groupBy('location_id')
      .select('location_id')
      .count('* as count');
  }
}
