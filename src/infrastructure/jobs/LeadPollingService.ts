import { ShopMonkeyAdapter, ShopMonkeyConfig } from '../crm/ShopMonkeyAdapter';
import { LeadRepository, Lead } from '../persistence/repositories/LeadRepository';
import { calculateNextTouchPointTime } from '../../domain/TouchPointSchedule';

export interface LeadPollingServiceConfig {
  shopMonkey: ShopMonkeyConfig;
  tenantId: string;
  pollIntervalMs?: number; // Default: 30000 (30 seconds)
}

export interface PollResult {
  newLeadsImported: number;
  existingLeadsUpdated: number;
  errors: string[];
}

/**
 * Lead Polling Service
 * 
 * Polls ShopMonkey for new website leads and imports them into the database.
 * Schedules initial touch points for new leads.
 */
export class LeadPollingService {
  private shopMonkey: ShopMonkeyAdapter;
  private leadRepo: LeadRepository;
  private tenantId: string;
  private pollIntervalMs: number;
  private intervalHandle: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;

  constructor(config: LeadPollingServiceConfig) {
    this.shopMonkey = new ShopMonkeyAdapter(config.shopMonkey);
    this.leadRepo = new LeadRepository();
    this.tenantId = config.tenantId;
    this.pollIntervalMs = config.pollIntervalMs ?? 30000;
  }

  /**
   * Start polling on an interval
   */
  start(): void {
    if (this.intervalHandle) {
      console.log('[LeadPollingService] Already running');
      return;
    }

    console.log(`[LeadPollingService] Starting polling every ${this.pollIntervalMs / 1000}s`);
    
    // Run immediately, then on interval
    this.poll();
    this.intervalHandle = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      console.log('[LeadPollingService] Stopped');
    }
  }

  /**
   * Run a single poll (for testing or manual trigger)
   */
  async poll(): Promise<PollResult> {
    if (this.isPolling) {
      console.log('[LeadPollingService] Poll already in progress, skipping');
      return { newLeadsImported: 0, existingLeadsUpdated: 0, errors: ['Poll already in progress'] };
    }

    this.isPolling = true;
    const result: PollResult = {
      newLeadsImported: 0,
      existingLeadsUpdated: 0,
      errors: []
    };

    try {
      console.log('[LeadPollingService] Polling ShopMonkey...');
      const websiteLeads = await this.shopMonkey.fetchWebsiteLeads();
      console.log(`[LeadPollingService] Found ${websiteLeads.length} website leads`);

      for (const leadData of websiteLeads) {
        try {
          const { lead, created } = await this.leadRepo.upsert(this.tenantId, leadData);
          
          if (created) {
            result.newLeadsImported++;
            // Schedule initial touch point for new leads
            await this.scheduleInitialTouchPoint(lead);
            console.log(`[LeadPollingService] New lead imported: ${lead.id} (${leadData.customer_name})`);
          } else {
            result.existingLeadsUpdated++;
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Lead ${leadData.crm_work_order_id}: ${errorMsg}`);
          console.error(`[LeadPollingService] Error processing lead:`, err);
        }
      }

      console.log(`[LeadPollingService] Poll complete: ${result.newLeadsImported} new, ${result.existingLeadsUpdated} updated`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Poll failed: ${errorMsg}`);
      console.error('[LeadPollingService] Poll error:', err);
    } finally {
      this.isPolling = false;
    }

    return result;
  }

  /**
   * Schedule the initial touch point (contact within 30 seconds)
   */
  private async scheduleInitialTouchPoint(lead: Lead): Promise<void> {
    const nextTouchTime = calculateNextTouchPointTime(lead.created_at, 0);
    if (nextTouchTime) {
      await this.leadRepo.scheduleNextTouchPoint(this.tenantId, lead.id, nextTouchTime);
      console.log(`[LeadPollingService] Scheduled initial touch point for lead ${lead.id} at ${nextTouchTime.toISOString()}`);
    }
  }

  /**
   * Get current polling status
   */
  getStatus(): { running: boolean; polling: boolean } {
    return {
      running: this.intervalHandle !== null,
      polling: this.isPolling
    };
  }
}
