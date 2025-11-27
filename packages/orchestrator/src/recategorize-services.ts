/**
 * Re-categorize existing services with improved logic
 */
import dotenv from 'dotenv';
import path from 'path';
import { db } from './infrastructure/persistence/db';

dotenv.config({ path: path.join(__dirname, '../.env') });

function detectServiceType(name: string): string {
  const nameLower = name.toLowerCase();
  
  // Core services
  if (nameLower.includes('tint')) return 'window-tinting';
  if (nameLower.includes('ppf') || nameLower.includes('paint protection')) return 'ppf';
  if (nameLower.includes('ceramic') || nameLower.includes('coating')) return 'ceramic-coating';
  if (nameLower.includes('wrap')) return 'vinyl-wrap';
  if (nameLower.includes('detail')) return 'detailing';
  
  // Electronics & Audio
  if (nameLower.includes('amplifier') || nameLower.includes('amp')) return 'audio';
  if (nameLower.includes('speaker')) return 'audio';
  if (nameLower.includes('radio') || nameLower.includes('audio')) return 'audio';
  if (nameLower.includes('subwoofer') || nameLower.includes('sub enclosure')) return 'subwoofer-enclosure';
  if (nameLower.includes('converter') || nameLower.includes('line output')) return 'electronics';
  if (nameLower.includes('dsp') || nameLower.includes('equalizer')) return 'electronics';
  
  // Navigation & Tracking
  if (nameLower.includes('navigation') || nameLower.includes('gps')) return 'navigation';
  if (nameLower.includes('tracking')) return 'navigation';
  
  // Security & Safety
  if (nameLower.includes('breathalyzer')) return 'breathalyzer';
  if (nameLower.includes('backup') || nameLower.includes('back up')) return 'security';
  if (nameLower.includes('blind spot') || nameLower.includes('sensor')) return 'security';
  if (nameLower.includes('security') || nameLower.includes('alarm')) return 'security';
  if (nameLower.includes('avital') || nameLower.includes('remote start')) return 'security';
  
  // Accessories & Exterior
  if (nameLower.includes('bedliner') || nameLower.includes('bed liner') || nameLower.includes('bed-liner')) return 'bedliner';
  if (nameLower.includes('blackout trim')) return 'exterior-trim';
  if (nameLower.includes('chrome delete')) return 'accessories';
  if (nameLower.includes('visor')) return 'accessories';
  if (nameLower.includes('headlight') || nameLower.includes('tail light')) return 'lighting';
  
  // Interior & Sanitation
  if (nameLower.includes('biopledge') || nameLower.includes('antimicrobial')) return 'sanitation';
  
  // Admin
  if (nameLower.includes('deposit')) return 'deposit';
  
  return 'other';
}

async function main() {
  console.log('Re-categorizing services...\n');

  const services = await db('service_catalog')
    .select('id', 'name', 'service_type');

  let updated = 0;
  for (const service of services) {
    const newType = detectServiceType(service.name);
    
    if (newType !== service.service_type) {
      await db('service_catalog')
        .where({ id: service.id })
        .update({ service_type: newType });
      
      console.log(`${service.name}: ${service.service_type} → ${newType}`);
      updated++;
    }
  }

  console.log(`\n✅ Updated ${updated} services`);

  // Show new breakdown
  const grouped = await db('service_catalog')
    .select('service_type')
    .count('* as count')
    .groupBy('service_type')
    .orderBy('count', 'desc');

  console.log('\nNew breakdown:');
  for (const row of grouped) {
    console.log(`  ${row.service_type}: ${row.count}`);
  }

  await db.destroy();
}

main();
