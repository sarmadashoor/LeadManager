import { db, testConnection } from './db';

async function main() {
  await testConnection();
  
  // Check tables exist
  const tables = await db.raw(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  console.log('\n📋 Tables in database:');
  tables.rows.forEach((row: any) => console.log(`   - ${row.table_name}`));
  
  await db.destroy();
}

main();
