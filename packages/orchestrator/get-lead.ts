import { db } from './src/infrastructure/persistence/db';

async function main() {
  const lead = await db('leads').select('id', 'customer_name', 'service_name').first();
  if (!lead) {
    console.log('No leads found. Run orchestrator to create one first.');
    await db.destroy();
    return;
  }
  console.log('Lead ID:', lead.id);
  console.log('Customer:', lead.customer_name);
  console.log('Service:', lead.service_name);
  console.log('\nTest command:');
  console.log(`curl -X POST http://localhost:3001/api/chat/${lead.id}/message -H "Content-Type: application/json" -d '{"message": "How much for ceramic coating?"}'`);
  await db.destroy();
}

main();
