import 'dotenv/config';
import { LeadPollingService } from './infrastructure/jobs/LeadPollingService';
import { TouchPointProcessor, TouchPointAction } from './infrastructure/jobs/TouchPointProcessor';

async function main() {
  console.log('Lead Orchestrator starting...');

  // Validate required environment variables
  const requiredEnvVars = ['SHOPMONKEY_API_KEY', 'TENANT_ID'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  const tenantId = process.env.TENANT_ID!;
  const demoMode = process.env.DEMO_MODE !== 'false'; // Default to true

  console.log(`Configuration:`);
  console.log(`  - Tenant ID: ${tenantId}`);
  console.log(`  - Demo Mode: ${demoMode ? 'ON (only test leads)' : 'OFF (all leads)'}`);
  console.log(`  - Poll Interval: ${process.env.POLL_INTERVAL_SECONDS || 30}s`);

  // Initialize Lead Polling Service
  const pollingService = new LeadPollingService({
    tenantId,
    shopMonkey: {
      apiKey: process.env.SHOPMONKEY_API_KEY!,
      baseUrl: process.env.SHOPMONKEY_BASE_URL || 'https://api.shopmonkey.cloud/v3',
      demoMode
    },
    pollIntervalMs: (parseInt(process.env.POLL_INTERVAL_SECONDS || '30', 10)) * 1000
  });

  // Initialize Touch Point Processor
  const touchPointProcessor = new TouchPointProcessor({
    tenantId,
    processIntervalMs: 10000, // Check every 10 seconds
    batchSize: 50
  });

  // Set up touch point handler (placeholder for messaging integration)
  touchPointProcessor.setTouchPointHandler(async (action: TouchPointAction) => {
    console.log(`[TouchPoint] Would send touch point ${action.touchPointNumber} to:`);
    console.log(`  - Lead: ${action.leadId}`);
    console.log(`  - Name: ${action.customerName || 'Unknown'}`);
    console.log(`  - Email: ${action.customerEmail || 'None'}`);
    console.log(`  - Phone: ${action.customerPhone || 'None'}`);
    
    // TODO: Integrate with Twilio/SendGrid in Phase 2
    // For now, just log and return true (simulating sent)
    return true;
  });

  // Start services
  pollingService.start();
  touchPointProcessor.start();

  console.log('Lead Orchestrator running. Press Ctrl+C to stop.');

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down...');
    pollingService.stop();
    touchPointProcessor.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});