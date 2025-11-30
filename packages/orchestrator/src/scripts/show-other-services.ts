/**
 * Show all services still categorized as 'other'
 */
import dotenv from 'dotenv';
import path from 'path';
import { db } from './infrastructure/persistence/db';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const services = await db('service_catalog')
    .where({ service_type: 'other' })
    .select('name', 'base_price_cents', 'description')
    .orderBy('name');

  console.log(`\nRemaining 'other' services (${services.length}):\n`);
  
  for (const svc of services) {
    const price = (svc.base_price_cents / 100).toFixed(2);
    console.log(`- ${svc.name} ($${price})`);
    if (svc.description) {
      console.log(`  └─ ${svc.description.substring(0, 80)}...`);
    }
  }

  await db.destroy();
}

main();
