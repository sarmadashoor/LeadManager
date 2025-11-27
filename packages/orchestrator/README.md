# @lead-manager/orchestrator

Lead management and orchestration service for automotive service businesses. Handles Shopmonkey CRM integration, SMS/email automation, and lead lifecycle management.

**Status:** ✅ Core API Complete, 🚧 Production Integration Needed  
**Tests:** 47 passing  
**Port:** 3000

---

## Quick Start
```bash
# Install dependencies (from workspace root)
npm install

# Set up environment variables
cp .env.example .env
# Add your credentials to .env

# Start database
docker-compose up -d

# Run migrations
npm run migrate

# Run tests
npm test

# Start server
npm run dev
```

Server will start at `http://localhost:3000`

---

## Environment Variables

Create a `.env` file in this directory:
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lead_orchestrator

# Shopmonkey CRM
SHOPMONKEY_API_KEY=your_api_key
SHOPMONKEY_COMPANY_ID=your_company_id

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (Email)
SENDGRID_API_KEY=SG.xxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Tenant Configuration
TENANT_ID=your_tenant_uuid

# Optional
DEMO_MODE=true              # Only process test leads
POLL_INTERVAL_MS=30000      # 30 seconds
WEBHOOK_PORT=3000
LOG_LEVEL=info
```

---

## Architecture

### Lead Ingestion (Dual Strategy)

**Primary: Webhooks (Real-time)**
```
Shopmonkey → ngrok → Webhook Handler → Database
                                     ↓
                                  SMS/Email
```

**Backup: Polling (Every 30s)**
```
Cron Job → Shopmonkey API → Lead Processor → Database
                                           ↓
                                        SMS/Email
```

### Core Services
```
LeadOrchestrationService
    ↓
┌───┴────┬─────────┬──────────┬──────────┐
│        │         │          │          │
Shopmonkey  Twilio  SendGrid  Touch    Lead
Adapter     Service Service   Point   Repository
                              Processor
```

---

## Key Features

### 1. Real-time Webhook Processing
- Instant notification when leads created in Shopmonkey
- <1 second response time
- Validates and enriches lead data
- Sends immediate SMS to customer

### 2. Polling Backup
- Runs every 30 seconds
- Catches any missed webhooks
- Processes website leads from Shopmonkey
- Fail-safe mechanism

### 3. Touch Point Automation
- Runs every 10 seconds
- Schedules follow-up communications
- Handles multi-step nurture sequences
- SMS and email support

### 4. Multi-Tenant Architecture
- Ready for 200+ franchise locations
- Tenant isolation in database
- Location-specific pricing and hours
- Centralized management

---

## API Endpoints

### Webhooks

**POST /webhooks/shopmonkey/order**
Receives order creation webhooks from Shopmonkey.

**Request Headers:**
```
X-Shopmonkey-Signature: signature_here
Content-Type: application/json
```

**Payload:** Shopmonkey order webhook event

**Response:**
```json
{
  "success": true,
  "leadId": "uuid"
}
```

---

## Database

### Migrations
```bash
# Run all migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Create new migration
npm run migrate:make migration_name
```

### Key Tables

**Core Tables:**
- `tenants` - Franchise organizations
- `locations` - Physical store locations
- `leads` - Customer leads (main table)
- `location_hours` - Business hours per location
- `service_catalog` - Services and pricing

**Job Tables:**
- `job_executions` - Polling and processing jobs

**Chat Tables (shared with chat service):**
- `chat_sessions` - Conversation sessions
- `chat_messages` - Individual messages

### Lead Lifecycle States

1. **new** - Just created, no contact yet
2. **contacted** - Initial SMS/email sent
3. **engaged** - Customer responded
4. **qualified** - Ready for appointment
5. **appointment_set** - Appointment booked
6. **completed** - Service completed
7. **lost** - Customer declined

---

## Components

### Infrastructure Layer

**CRM Integration (`src/infrastructure/crm/`)**
- `ShopMonkeyAdapter.ts` - API client for Shopmonkey
- Fetches orders, customers, vehicles, services
- Handles rate limiting and errors

**Webhooks (`src/infrastructure/webhooks/`)**
- `ShopMonkeyWebhookHandler.ts` - Processes webhook events
- Signature verification
- Lead validation and enrichment

**Messaging (`src/infrastructure/messaging/`)**
- `TwilioService.ts` - SMS via Twilio
- `SendGridService.ts` - Email via SendGrid
- Template support

**Jobs (`src/infrastructure/jobs/`)**
- `LeadPollingService.ts` - Polls Shopmonkey every 30s
- `TouchPointProcessor.ts` - Handles follow-ups every 10s

**Persistence (`src/infrastructure/persistence/`)**
- `db.ts` - Database connection (Knex)
- `repositories/` - Data access layer
- `migrations/` - Database schema versions

### Service Layer

**LeadOrchestrationService**
- Coordinates lead processing
- Calls CRM, messaging, and database
- Main business logic

---

## Testing
```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Coverage
npm test:coverage

# Integration tests only
npm test -- --testPathPattern=integration
```

**Test Coverage:** 47 tests
- Repository tests: Database operations
- Service tests: Business logic
- Integration tests: End-to-end flows

---

## Development

### Running Locally

**Terminal 1: Database**
```bash
docker-compose up
```

**Terminal 2: Orchestrator**
```bash
cd packages/orchestrator
npm run dev
```

**Terminal 3: ngrok (for webhooks)**
```bash
ngrok http 3000
# Copy the HTTPS URL and configure in Shopmonkey
```

### Testing Webhooks

Use ngrok URL in Shopmonkey:
1. Go to Settings → Webhooks
2. Add webhook: `https://YOUR_NGROK_URL.ngrok.io/webhooks/shopmonkey/order`
3. Subscribe to: Order Created
4. Create test order in Shopmonkey
5. Watch logs for webhook processing

### Demo Mode

Set `DEMO_MODE=true` to only process leads with:
- Customer email containing "test" or "demo"
- Phone numbers starting with +1555

---

## Deployment

### Development
```bash
npm run dev
# Requires ngrok for webhooks
```

### Production
```bash
npm run build
node dist/index.js

# Set up proper DNS and SSL
# Configure Shopmonkey webhook to production URL
```

**Production Checklist:**
- [ ] Set `DEMO_MODE=false`
- [ ] Configure real Shopmonkey webhook URL
- [ ] Set up SSL certificate
- [ ] Configure monitoring/alerting
- [ ] Set up log aggregation
- [ ] Enable database backups

---

## Monitoring

### Logs

All services use structured logging (pino):
```javascript
console.log('[Service] Action completed', { leadId, duration });
```

### Health Checks

Monitor these processes:
- Webhook server running (port 3000)
- Polling service running (logs every 30s)
- Touch point processor running (logs every 10s)
- Database connection healthy

### Metrics to Track

- Leads created per hour
- Webhook response time
- SMS delivery rate
- Email delivery rate
- Touch point success rate
- Database query performance

---

## Troubleshooting

**"Webhook signature invalid"**
- Verify `SHOPMONKEY_API_KEY` matches key in Shopmonkey
- Check webhook payload format hasn't changed

**"SMS not sending"**
- Verify Twilio credentials
- Check phone number format (+1XXXXXXXXXX)
- Verify Twilio account balance

**"No leads being polled"**
- Check `DEMO_MODE` setting
- Verify Shopmonkey API credentials
- Check date range in polling logic

**"Database connection failed"**
```bash
docker-compose up -d  # Start PostgreSQL
npm run migrate       # Run migrations
```

**"Port 3000 already in use"**
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

---

## Integration with Chat Service

The orchestrator shares the same PostgreSQL database with the chat service. When a lead is ready for chat:

1. Orchestrator creates lead in database
2. Orchestrator sends SMS with chat link
3. Customer clicks link → Opens chat UI (future)
4. Chat UI calls Chat API (port 3001)
5. Chat API reads lead data from shared database

**Future:** Orchestrator will serve the frontend HTML and coordinate the full customer experience.

---

## Performance

**Webhook Processing:**
- Response time: <100ms
- Throughput: 100+ webhooks/minute

**Polling:**
- Cycle time: 30 seconds
- Shopmonkey API latency: 200-500ms
- Processes 10-50 leads per cycle

**Touch Points:**
- Processing interval: 10 seconds
- SMS send: 1-2s per message
- Email send: 1-3s per message

---

## Related Documentation

- **System Overview:** `../../docs/architecture/SYSTEM_OVERVIEW.md`
- **Implementation History:** `../../docs/architecture/PHASED_IMPLEMENTATION.md`
- **Business Logic:** `../../docs/MVP_LOGIC.md`
- **Chat API:** `../chat/README.md`

---

**Maintained by:** Lead Orchestrator Team  
**Last Updated:** November 27, 2025
