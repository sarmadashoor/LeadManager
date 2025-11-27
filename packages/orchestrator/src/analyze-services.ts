import dotenv from 'dotenv';
import path from 'path';
import { db } from './infrastructure/persistence/db';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const tenantId = process.env.TENANT_ID;

  const services = await db('service_catalog')
    .where({ tenant_id: tenantId, is_active: true })
    .select('name', 'service_type', 'base_price_cents')
    .orderBy('service_type')
    .orderBy('name');

  // Group by service_type
  const grouped = services.reduce((acc: any, svc) => {
    if (!acc[svc.service_type]) acc[svc.service_type] = [];
    acc[svc.service_type].push(svc);
    return acc;
  }, {});

  console.log('Service Breakdown:\n');
  
  for (const [type, svcs] of Object.entries(grouped) as any) {
    console.log(`\n${type.toUpperCase()} (${svcs.length} services):`);
    svcs.slice(0, 10).forEach((s: any) => {
      console.log(`  - ${s.name}`);
    });
    if (svcs.length > 10) {
      console.log(`  ... and ${svcs.length - 10} more`);
    }
  }

  await db.destroy();
}

main();
