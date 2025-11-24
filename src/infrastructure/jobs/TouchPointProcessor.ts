import { LeadRepository, Lead } from '../persistence/repositories/LeadRepository';
import { calculateNextTouchPointTime, MAX_TOUCH_POINTS, shouldMarkAsLost } from '../../domain/TouchPointSchedule';

export interface TouchPointProcessorConfig {
  tenantId: string;
  processIntervalMs?: number; // Default: 10000 (10 seconds)
  batchSize?: number; // Default: 50
}

export interface ProcessResult {
  processed: number;
  markedLost: number;
  errors: string[];
}

export interface TouchPointAction {
  leadId: string;
  touchPointNumber: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
}

/**
 * Touch Point Processor
 * 
 * Processes leads that are due for their next touch point.
 * Emits actions for the messaging layer to execute (SMS/Email).
 */
export class TouchPointProcessor {
  private leadRepo: LeadRepository;
  private tenantId: string;
  private processIntervalMs: number;
  private batchSize: number;
  private intervalHandle: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;

  // Callback for when a touch point needs to be sent
  private onTouchPointDue: ((action: TouchPointAction) => Promise<boolean>) | null = null;

  constructor(config: TouchPointProcessorConfig) {
    this.leadRepo = new LeadRepository();
    this.tenantId = config.tenantId;
    this.processIntervalMs = config.processIntervalMs ?? 10000;
    this.batchSize = config.batchSize ?? 50;
  }

  /**
   * Set the callback for when a touch point is due
   * The callback should return true if the touch point was sent successfully
   */
  setTouchPointHandler(handler: (action: TouchPointAction) => Promise<boolean>): void {
    this.onTouchPointDue = handler;
  }

  /**
   * Start processing on an interval
   */
  start(): void {
    if (this.intervalHandle) {
      console.log('[TouchPointProcessor] Already running');
      return;
    }

    console.log(`[TouchPointProcessor] Starting processing every ${this.processIntervalMs / 1000}s`);
    
    // Run immediately, then on interval
    this.process();
    this.intervalHandle = setInterval(() => this.process(), this.processIntervalMs);
  }

  /**
   * Stop processing
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      console.log('[TouchPointProcessor] Stopped');
    }
  }

  /**
   * Process leads due for touch points
   */
  async process(): Promise<ProcessResult> {
    if (this.isProcessing) {
      console.log('[TouchPointProcessor] Already processing, skipping');
      return { processed: 0, markedLost: 0, errors: ['Already processing'] };
    }

    this.isProcessing = true;
    const result: ProcessResult = {
      processed: 0,
      markedLost: 0,
      errors: []
    };

    try {
      const dueLeads = await this.leadRepo.findDueForTouchPoint(this.tenantId, this.batchSize);
      console.log(`[TouchPointProcessor] Found ${dueLeads.length} leads due for touch point`);

      for (const lead of dueLeads) {
        try {
          await this.processLead(lead, result);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Lead ${lead.id}: ${errorMsg}`);
          console.error(`[TouchPointProcessor] Error processing lead ${lead.id}:`, err);
        }
      }

      if (result.processed > 0 || result.markedLost > 0) {
        console.log(`[TouchPointProcessor] Processed: ${result.processed} sent, ${result.markedLost} marked lost`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Process failed: ${errorMsg}`);
      console.error('[TouchPointProcessor] Process error:', err);
    } finally {
      this.isProcessing = false;
    }

    return result;
  }

  /**
   * Process a single lead
   */
  private async processLead(lead: Lead, result: ProcessResult): Promise<void> {
    const nextTouchPointNumber = lead.touch_point_count + 1;

    // Check if lead has completed all touch points
    if (shouldMarkAsLost(lead.touch_point_count, lead.first_response_at !== null)) {
      await this.leadRepo.markAsLost(this.tenantId, lead.id);
      result.markedLost++;
      console.log(`[TouchPointProcessor] Lead ${lead.id} marked as lost (no response after ${MAX_TOUCH_POINTS} touches)`);
      return;
    }

    // Create touch point action
    const action: TouchPointAction = {
      leadId: lead.id,
      touchPointNumber: nextTouchPointNumber,
      customerName: lead.customer_name,
      customerEmail: lead.customer_email,
      customerPhone: lead.customer_phone
    };

    // Execute touch point (send message)
    let sent = false;
    if (this.onTouchPointDue) {
      sent = await this.onTouchPointDue(action);
    } else {
      // No handler - log and mark as sent for testing
      console.log(`[TouchPointProcessor] Touch point ${nextTouchPointNumber} due for lead ${lead.id} (no handler)`);
      sent = true; // Assume sent for testing
    }

    if (sent) {
      // Calculate next touch point time
      const nextTouchTime = calculateNextTouchPointTime(lead.created_at, nextTouchPointNumber);
      
      // Record this touch point and schedule next
      await this.leadRepo.recordTouchPoint(this.tenantId, lead.id, nextTouchTime);
      result.processed++;

      if (nextTouchTime) {
        console.log(`[TouchPointProcessor] Touch ${nextTouchPointNumber} sent for ${lead.id}, next at ${nextTouchTime.toISOString()}`);
      } else {
        console.log(`[TouchPointProcessor] Final touch ${nextTouchPointNumber} sent for ${lead.id}`);
      }
    }
  }

  /**
   * Get current processing status
   */
  getStatus(): { running: boolean; processing: boolean } {
    return {
      running: this.intervalHandle !== null,
      processing: this.isProcessing
    };
  }
}
