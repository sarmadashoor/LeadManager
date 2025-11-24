import { db } from '../db';

// Types
export interface Lead {
  id: string;
  tenant_id: string;
  location_id: string | null;
  crm_source: string;
  crm_work_order_id: string;
  crm_work_order_number: string | null;
  status: string;
  customer_external_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  vehicle_external_id: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_description: string | null;
  service_type: string;
  service_name: string | null;
  service_specifications: string | null;
  estimated_cost_cents: number | null;
  chat_session_id: string | null;
  invitation_sent_at: Date | null;
  first_response_at: Date | null;
  appointment_created_at: Date | null;
  crm_metadata: Record<string, any> | null;
  version: number;
  created_at: Date;
  updated_at: Date;
  processed_at: Date | null;
  // Touch point tracking
  touch_point_count: number;
  next_touch_point_at: Date | null;
  last_contacted_at: Date | null;
}

export interface CreateLeadData {
  crm_source: string;
  crm_work_order_id: string;
  crm_work_order_number?: string;
  status?: string;
  customer_external_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_external_id?: string;
  vehicle_year?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_description?: string;
  service_type: string;
  service_name?: string;
  service_specifications?: string;
  estimated_cost_cents?: number;
  crm_metadata?: Record<string, any>;
  location_id?: string;
}

export class LeadRepository {
  // Always requires tenantId - enforces multi-tenant isolation
  async findByTenant(tenantId: string): Promise<Lead[]> {
    return db('leads').where({ tenant_id: tenantId }).orderBy('created_at', 'desc');
  }

  async findById(tenantId: string, leadId: string): Promise<Lead | null> {
    const lead = await db('leads').where({ tenant_id: tenantId, id: leadId }).first();
    return lead || null;
  }

  async findByStatus(tenantId: string, status: string): Promise<Lead[]> {
    return db('leads').where({ tenant_id: tenantId, status }).orderBy('created_at', 'desc');
  }

  async findByWorkOrderId(
    tenantId: string,
    crmSource: string,
    workOrderId: string
  ): Promise<Lead | null> {
    const lead = await db('leads')
      .where({
        tenant_id: tenantId,
        crm_source: crmSource,
        crm_work_order_id: workOrderId
      })
      .first();
    return lead || null;
  }

  async findUnprocessed(tenantId: string): Promise<Lead[]> {
    return db('leads')
      .where({ tenant_id: tenantId })
      .whereNull('processed_at')
      .orderBy('created_at', 'asc');
  }

  async create(tenantId: string, data: CreateLeadData): Promise<Lead> {
    const [lead] = await db('leads')
      .insert({
        ...data,
        tenant_id: tenantId,
        status: data.status || 'new'
      })
      .returning('*');
    return lead;
  }

  async upsert(tenantId: string, data: CreateLeadData): Promise<{ lead: Lead; created: boolean }> {
    const existing = await this.findByWorkOrderId(tenantId, data.crm_source, data.crm_work_order_id);
    
    if (existing) {
      const [updated] = await db('leads')
        .where({ id: existing.id, tenant_id: tenantId })
        .update({
          ...data,
          updated_at: new Date(),
          version: existing.version + 1
        })
        .returning('*');
      return { lead: updated, created: false };
    }
    
    const lead = await this.create(tenantId, data);
    return { lead, created: true };
  }

  async updateStatus(
    tenantId: string,
    leadId: string,
    status: string,
    expectedVersion: number
  ): Promise<Lead | null> {
    // Optimistic locking - only update if version matches
    const [updated] = await db('leads')
      .where({ tenant_id: tenantId, id: leadId, version: expectedVersion })
      .update({
        status,
        updated_at: new Date(),
        version: expectedVersion + 1
      })
      .returning('*');
    
    return updated || null;
  }

  async markAsProcessed(tenantId: string, leadId: string): Promise<Lead | null> {
    const [updated] = await db('leads')
      .where({ tenant_id: tenantId, id: leadId })
      .update({
        processed_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    return updated || null;
  }

  async markInvitationSent(tenantId: string, leadId: string): Promise<Lead | null> {
    const [updated] = await db('leads')
      .where({ tenant_id: tenantId, id: leadId })
      .update({
        status: 'contacted',
        invitation_sent_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    return updated || null;
  }

  // ============ Touch Point Methods ============

  /**
   * Find leads that are due for their next touch point
   * Returns leads where next_touch_point_at <= now and status allows follow-up
   */
  async findDueForTouchPoint(tenantId: string, limit: number = 100): Promise<Lead[]> {
    const now = new Date();
    return db('leads')
      .where({ tenant_id: tenantId })
      .whereIn('status', ['new', 'contacted']) // Only follow up on these statuses
      .where('touch_point_count', '<', 13) // Max 13 touch points
      .where('next_touch_point_at', '<=', now)
      .orderBy('next_touch_point_at', 'asc')
      .limit(limit);
  }

  /**
   * Schedule the next touch point for a lead
   * Uses the 13-touch schedule from MVP_LOGIC.md
   */
  async scheduleNextTouchPoint(
    tenantId: string,
    leadId: string,
    nextTouchPointAt: Date
  ): Promise<Lead | null> {
    const [updated] = await db('leads')
      .where({ tenant_id: tenantId, id: leadId })
      .update({
        next_touch_point_at: nextTouchPointAt,
        updated_at: new Date()
      })
      .returning('*');
    return updated || null;
  }

  /**
   * Record that a touch point was sent
   * Increments counter, updates timestamps, and schedules next touch point
   */
  async recordTouchPoint(
    tenantId: string,
    leadId: string,
    nextTouchPointAt: Date | null
  ): Promise<Lead | null> {
    const now = new Date();
    const [updated] = await db('leads')
      .where({ tenant_id: tenantId, id: leadId })
      .update({
        touch_point_count: db.raw('touch_point_count + 1'),
        last_contacted_at: now,
        next_touch_point_at: nextTouchPointAt,
        updated_at: now
      })
      .returning('*');
    return updated || null;
  }

  /**
   * Mark a lead as lost (no response after all touch points)
   */
  async markAsLost(tenantId: string, leadId: string): Promise<Lead | null> {
    const [updated] = await db('leads')
      .where({ tenant_id: tenantId, id: leadId })
      .update({
        status: 'lost',
        next_touch_point_at: null,
        updated_at: new Date()
      })
      .returning('*');
    return updated || null;
  }

  /**
   * Mark a lead as having responded (stops follow-up sequence)
   */
  async markAsResponded(tenantId: string, leadId: string): Promise<Lead | null> {
    const [updated] = await db('leads')
      .where({ tenant_id: tenantId, id: leadId })
      .update({
        status: 'chat_active',
        first_response_at: new Date(),
        next_touch_point_at: null, // Stop follow-ups
        updated_at: new Date()
      })
      .returning('*');
    return updated || null;
  }
}

export const leadRepository = new LeadRepository();
