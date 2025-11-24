import dotenv from 'dotenv';
dotenv.config();

import { ShopMonkeyAdapter } from './ShopMonkeyAdapter';

async function main() {
  const adapter = new ShopMonkeyAdapter({
    apiKey: process.env.SHOPMONKEY_API_KEY!,
    baseUrl: process.env.SHOPMONKEY_BASE_URL!
  });

  console.log('�� Testing ShopMonkey connection...\n');

  // Fetch tinting leads
  const leads = await adapter.fetchNewTintingLeads();
  
  console.log(`✅ Found ${leads.length} window tinting leads\n`);

  // Show first 3
  leads.slice(0, 3).forEach((lead, i) => {
    console.log(`--- Lead ${i + 1} ---`);
    console.log(`  Order: ${lead.crm_work_order_number}`);
    console.log(`  Customer: ${lead.customer_name}`);
    console.log(`  Phone: ${lead.customer_phone}`);
    console.log(`  Email: ${lead.customer_email}`);
    console.log(`  Vehicle: ${lead.vehicle_description}`);
    console.log(`  Service: ${lead.service_name}`);
    console.log(`  Cost: $${(lead.estimated_cost_cents || 0) / 100}`);
    console.log('');
  });
}

main().catch(console.error);
