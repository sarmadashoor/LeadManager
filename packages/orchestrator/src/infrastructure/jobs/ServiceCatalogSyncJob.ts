import { Knex } from 'knex';
import { ShopMonkeyAdapter } from '../crm/ShopMonkeyAdapter';
import { ServiceSyncService } from '../services/ServiceSyncService';

export interface ServiceCatalogSyncJobConfig {
  db: Knex;
  shopMonkeyAdapter: ShopMonkeyAdapter;
  tenantId: string;
}

export class ServiceCatalogSyncJob {
  private db: Knex;
  private shopMonkeyAdapter: ShopMonkeyAdapter;
  private tenantId: string;

  constructor(config: ServiceCatalogSyncJobConfig) {
    this.db = config.db;
    this.shopMonkeyAdapter = config.shopMonkeyAdapter;
    this.tenantId = config.tenantId;
  }

  /**
   * Execute the service catalog sync job
   * Records execution in job_executions table
   */
  async execute(): Promise<void> {
    const startTime = Date.now();
    const jobKey = `service-catalog-sync:${this.tenantId}:${new Date().toISOString().split('T')[0]}`;

    console.log('[ServiceCatalogSyncJob] Starting job:', jobKey);

    // Record job start
    const [jobExecution] = await this.db('job_executions')
      .insert({
        tenant_id: this.tenantId,
        job_type: 'service_catalog_sync',
        job_key: jobKey,
        status: 'running',
        started_at: new Date(),
      })
      .returning('*')
      .onConflict('job_key')
      .ignore(); // Skip if already running today

    if (!jobExecution) {
      console.log('[ServiceCatalogSyncJob] Job already ran today, skipping');
      return;
    }

    try {
      // Execute sync
      const syncService = new ServiceSyncService(
        this.db,
        this.shopMonkeyAdapter,
        this.tenantId
      );

      const result = await syncService.syncAllServices();

      // Calculate metrics
      const duration = Date.now() - startTime;
      const errorCount = result.results.reduce((sum, r) => sum + r.errors.length, 0);

      // Update job execution with success
      await this.db('job_executions')
        .where({ id: jobExecution.id })
        .update({
          status: errorCount > 0 ? 'completed_with_errors' : 'completed',
          completed_at: new Date(),
          duration_ms: duration,
          leads_processed: result.totalServices, // Reusing field for services
          metadata: {
            locations_processed: result.totalLocations,
            services_synced: result.totalServices,
            results: result.results,
          },
          errors_count: errorCount,
          error_message: errorCount > 0 ? 'Some services failed to sync' : null,
        });

      console.log('[ServiceCatalogSyncJob] Job completed successfully:', {
        duration: `${duration}ms`,
        locations: result.totalLocations,
        services: result.totalServices,
        errors: errorCount,
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Update job execution with failure
      await this.db('job_executions')
        .where({ id: jobExecution.id })
        .update({
          status: 'failed',
          completed_at: new Date(),
          duration_ms: duration,
          errors_count: 1,
          error_message: error.message,
          error_stack: error.stack,
        });

      console.error('[ServiceCatalogSyncJob] Job failed:', error);
      throw error;
    }
  }

  /**
   * Schedule this job to run periodically
   * Call this from your main job scheduler
   */
  static scheduleDaily(config: ServiceCatalogSyncJobConfig): NodeJS.Timeout {
    const job = new ServiceCatalogSyncJob(config);
    
    // Run immediately on startup
    job.execute().catch(console.error);

    // Then run every 24 hours
    return setInterval(() => {
      job.execute().catch(console.error);
    }, 24 * 60 * 60 * 1000); // 24 hours
  }
}
