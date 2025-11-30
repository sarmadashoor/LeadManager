/**
 * Force a fresh service catalog sync (deletes today's job record)
 * Run: npm run force:sync
 */
import dotenv from 'dotenv';
import path from 'path';
import { db } from './infrastructure/persistence/db';
import { ShopMonkeyAdapter } from './infrastructure/crm/ShopMonkeyAdapter';
import { ServiceCatalogSyncJob } from './infrastructure/jobs/ServiceCatalogSyncJob';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  console.log('=== Force Service Catalog Sync ===\n');

  const tenantId = process.env.TENANT_ID;
  if (!tenantId) {
    console.error('❌ TENANT_ID not found in .env');
    process.exit(1);
  }

  // Delete today's job execution to allow re-run
  const today = new Date().toISOString().split('T')[0];
  const jobKey = `service-catalog-sync:${tenantId}:${today}`;
  
  await db('job_executions').where({ job_key: jobKey }).del();
  console.log('Deleted previous job execution for today\n');

  // Initialize ShopMonkey adapter
  const adapter = new ShopMonkeyAdapter({
    apiKey: process.env.SHOPMONKEY_API_KEY!,
    baseUrl: 'https://api.shopmonkey.cloud/v3',
    demoMode: process.env.DEMO_MODE === 'true',
  });

  // Create and run sync job
  const job = new ServiceCatalogSyncJob({
    db,
    shopMonkeyAdapter: adapter,
    tenantId,
  });

  try {
    await job.execute();
    console.log('\nSync completed successfully');

    // Show results
    const counts = await db('service_catalog')
      .where({ tenant_id: tenantId, is_active: true })
      .groupBy('location_id')
      .select('location_id')
      .count('* as count');

    console.log('\nServices by location:');
    for (const row of counts) {
      console.log(`  ${row.location_id}: ${row.count} services`);
    }
    
    // Show sample services
    console.log('\nSample services:');
    const samples = await db('service_catalog')
      .where({ tenant_id: tenantId, is_active: true })
      .limit(5)
      .select('name', 'base_price_cents', 'service_type');
    
    for (const svc of samples) {
      const price = svc.base_price_cents / 100;
      console.log(`  - ${svc.name} ($${price}) [${svc.service_type}]`);
    }
  } catch (error) {
    console.error('\nSync failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

main();
