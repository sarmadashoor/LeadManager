/**
 * Debug script to see service sync errors
 * Run: npm run debug:sync
 */
import dotenv from 'dotenv';
import path from 'path';
import { db } from './infrastructure/persistence/db';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const tenantId = process.env.TENANT_ID;

  // Get last job execution
  const lastJob = await db('job_executions')
    .where({ tenant_id: tenantId, job_type: 'service_catalog_sync' })
    .orderBy('started_at', 'desc')
    .first();

  if (!lastJob) {
    console.log('No job executions found');
    return;
  }

  console.log('Last Job Execution:');
  console.log('Status:', lastJob.status);
  console.log('Duration:', lastJob.duration_ms, 'ms');
  console.log('Errors:', lastJob.errors_count);
  console.log('\nMetadata:');
  console.log(JSON.stringify(lastJob.metadata, null, 2));

  await db.destroy();
}

main();
