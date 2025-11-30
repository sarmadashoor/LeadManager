import 'dotenv/config';
import Fastify from 'fastify';
import { LeadPollingService } from './infrastructure/jobs/LeadPollingService';
import { TouchPointProcessor, TouchPointAction } from './infrastructure/jobs/TouchPointProcessor';
import { TwilioService } from './infrastructure/messaging/TwilioService';
import { SendGridService } from './infrastructure/messaging/SendGridService';
import { registerShopMonkeyWebhook } from './infrastructure/webhooks/ShopMonkeyWebhookHandler';

const EMAIL_WHITELIST = (process.env.LEAD_EMAIL_WHITELIST || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

function isWhitelistedEmail(email?: string | null): boolean {
  if (!email) return false;
  // Fail CLOSED: if no whitelist configured, send nothing
  if (EMAIL_WHITELIST.length === 0) return false;
  return EMAIL_WHITELIST.includes(email.toLowerCase());
}

async function main() {
  console.log('Lead Orchestrator starting...');

  // Validate required environment variables
  const requiredEnvVars = [
    'SHOPMONKEY_API_KEY',
    'TENANT_ID',
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  const tenantId = process.env.TENANT_ID!;
  const demoMode = process.env.DEMO_MODE !== 'false';
  const webhookPort = parseInt(process.env.WEBHOOK_PORT || '3000', 10);

  console.log(`Configuration:`);
  console.log(`  - Tenant ID: ${tenantId}`);
  console.log(`  - Demo Mode: ${demoMode ? 'ON (only test leads)' : 'OFF (all leads)'}`);
  console.log(`  - Poll Interval: ${process.env.POLL_INTERVAL_SECONDS || 30}s`);
  console.log(`  - Webhook Port: ${webhookPort}`);
  console.log(
    `  - Email whitelist: ${
      EMAIL_WHITELIST.length ? EMAIL_WHITELIST.join(', ') : '(EMPTY – all outbound disabled by whitelist)'
    }`
  );

  // Initialize Fastify server for webhooks
  const fastify = Fastify({
    logger: true
  });

  // Register webhook routes
  registerShopMonkeyWebhook(fastify, tenantId, {
    apiKey: process.env.SHOPMONKEY_API_KEY!,
    baseUrl: process.env.SHOPMONKEY_BASE_URL || 'https://api.shopmonkey.cloud/v3',
    demoMode
  });

  // Start Fastify server
  try {
    await fastify.listen({ port: webhookPort, host: '0.0.0.0' });
    console.log(`✅ Webhook server listening on port ${webhookPort}`);
  } catch (err) {
    console.error('Failed to start webhook server:', err);
    process.exit(1);
  }

  // Initialize Messaging Services
  const sendGridService = new SendGridService({
    apiKey: process.env.SENDGRID_API_KEY!,
    fromEmail: process.env.SENDGRID_FROM_EMAIL!,
    fromName: 'Tint World'
  });

  // Optional: Initialize Twilio if configured
  let twilioService: TwilioService | null = null;
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    twilioService = new TwilioService({
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    });
    console.log('  - SMS: Enabled');
  } else {
    console.log('  - SMS: Disabled (no Twilio config)');
  }

  // Initialize Lead Polling Service (continues as backup)
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
    processIntervalMs: 10000,
    batchSize: 50
  });

  // Set up touch point handler with whitelist gate
  touchPointProcessor.setTouchPointHandler(async (action: TouchPointAction) => {
    const email = action.customerEmail;

    console.log(
      `[TouchPoint] Preparing touch point ${action.touchPointNumber} for lead ${action.leadId} (${action.customerName}), email=${email || '<none>'}`
    );

    // 🔐 HARD GATE: only proceed if email is whitelisted
    if (!isWhitelistedEmail(email)) {
      console.log(
        `[TouchPoint] Email ${email || '<none>'} is NOT whitelisted; skipping all outbound for lead ${action.leadId} (marking as processed to avoid retry)`
      );
      // Treat as processed so this lead doesn't get picked up forever
      return true;
    }

    const chatLink = `https://chat.tintworld.com/${action.leadId}`;
    const { subject, text, html } = generateEmailContent(
      action.touchPointNumber,
      action.customerName,
      chatLink
    );
    const smsBody = generateSmsContent(
      action.touchPointNumber,
      action.customerName,
      chatLink
    );

    let emailSent = false;
    let smsSent = false;

    // Send Email (whitelisted only)
    if (email) {
      const emailResult = await sendGridService.sendEmail({
        to: email,
        subject,
        text,
        html
      });
      emailSent = emailResult.success;
    } else {
      console.log(`[TouchPoint] No email for lead ${action.leadId} (even though whitelist passed)`);
    }

    // SMS: still allowed, but only for leads that passed the email whitelist gate above.
    // If you want SMS fully disabled for MVP, comment this block out.
    if (twilioService && action.customerPhone) {
      const smsResult = await twilioService.sendSms({
        to: action.customerPhone,
        body: smsBody
      });
      smsSent = smsResult.success;
    }

    // Consider success if at least one channel worked
    return emailSent || smsSent;
  });

  // Start background jobs
  pollingService.start();
  touchPointProcessor.start();

  console.log('');
  console.log('✅ Lead Orchestrator fully running:');
  console.log(`   - Webhook server: http://localhost:${webhookPort}`);
  console.log(`   - Webhook endpoint: http://localhost:${webhookPort}/webhooks/shopmonkey/order`);
  console.log(`   - Polling: Every ${process.env.POLL_INTERVAL_SECONDS || 30}s (backup)`);
  console.log(`   - Touch points: Every 10s`);
  console.log('');
  console.log('Press Ctrl+C to stop.');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down...');
    pollingService.stop();
    touchPointProcessor.stop();
    await fastify.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

function generateSmsContent(touchPointNumber: number, customerName: string | null, chatLink: string): string {
  const name = customerName ? customerName.split(' ')[0] : 'there';
  
  const messages: Record<number, string> = {
    1: `Hi ${name}! Thanks for requesting a quote from Tint World. I'm here to help answer any questions and get your appointment scheduled. ${chatLink}`,
    2: `Hi ${name}, just following up on your window tinting quote. Have any questions? ${chatLink}`,
    3: `${name}, still interested in getting your windows tinted? I'm here to help! ${chatLink}`,
  };

  return messages[touchPointNumber] || 
    `Hi ${name}, following up on your Tint World quote. Let me know if you'd like to schedule! ${chatLink}`;
}

function generateEmailContent(
  touchPointNumber: number,
  customerName: string | null,
  chatLink: string
): {
  subject: string;
  text: string;
  html: string;
} {
  const name = customerName ? customerName.split(' ')[0] : 'there';
  
  const subjects: Record<number, string> = {
    1: 'Your Tint World Quote is Ready!',
    2: 'Following up on your window tinting quote',
    3: 'Still interested in window tinting?',
  };

  const subject = subjects[touchPointNumber] || 'Your Tint World Quote';

  const text = `Hi ${name},\n\nThank you for requesting a quote from Tint World! We're excited to help you with your window tinting needs.\n\nI'm here to answer any questions you might have and help you schedule an appointment that works for you.\n\nClick here to chat with me: ${chatLink}\n\nLooking forward to hearing from you!\n\nBest regards,\nTint World Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Hi ${name},</h2>
      <p>Thank you for requesting a quote from Tint World! We're excited to help you with your window tinting needs.</p>
      <p>I'm here to answer any questions you might have and help you schedule an appointment that works for you.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${chatLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Chat With Us Now</a>
      </p>
      <p>Looking forward to hearing from you!</p>
      <p>Best regards,<br>Tint World Team</p>
    </div>
  `;

  return { subject, text, html };
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
