# @lead-manager/orchestrator

Lead management and orchestration service for automotive service businesses. Handles Shopmonkey CRM integration, outbound SMS/email automation, and lead lifecycle management.

**Status:** ✅ Core API Complete, 🚧 Production Integration Needed  
**Outbound Safety:** 🔐 Default fail-closed (no SMS/email unless explicitly whitelisted)  
**Port:** 3000

## ⚠️ SAFETY FIRST — READ BEFORE RUNNING

This service can send real emails and SMS messages.

### To protect real customers:

🔐 **Outbound communications require explicit whitelisting**

We now enforce a hard outbound email whitelist:

- Only emails explicitly listed in `LEAD_EMAIL_WHITELIST` may receive outbound messaging.
- If whitelist is empty, ALL outbound is disabled.
- SMS is also blocked unless the lead's email is whitelisted.

This protects against accidentally contacting real Tint World customers.

**Example:**

```bash
LEAD_EMAIL_WHITELIST="sam@example.com,test@test.com"
```

Anything not on this list is fully skipped.

## Quick Start

```bash
# Install dependencies (from workspace root)
npm install

# Create environment file
cp .env.example .env

# Start database
docker-compose up -d

# Run migrations
npm run migrate

# Start orchestrator (dev mode)
npm run dev
```

Server runs at: `http://localhost:3000`

## Environment Variables

Create `.env` in `packages/orchestrator/`:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lead_orchestrator

# Shopmonkey CRM
SHOPMONKEY_API_KEY=your_api_key
SHOPMONKEY_COMPANY_ID=your_company_id

# Messaging - SendGrid
SENDGRID_API_KEY=SG.xxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Messaging - Twilio (optional; auto-disabled if missing)
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Tenant
TENANT_ID=your_tenant_uuid

# Outbound Safety (required for outbound messaging)
# Comma-separated list of allowed outbound recipient emails
# If empty → ALL outbound disabled; SMS also blocked by design
LEAD_EMAIL_WHITELIST="sam@example.com,test@example.com"

# Behavior
DEMO_MODE=false
POLL_INTERVAL_SECONDS=30
WEBHOOK_PORT=3000
LOG_LEVEL=info
```

### 🔐 Important Behavior Notes

| Setting | Behavior |
|---------|----------|
| `LEAD_EMAIL_WHITELIST` empty | ❌ No outbound email or SMS allowed |
| Email not in whitelist | ❌ Touch point skipped entirely |
| SMS without whitelist pass | ❌ Blocked |
| Twilio not configured | SMS disabled (safe default) |

## Architecture

### Lead Ingestion – Dual Strategy

#### Primary: Webhooks (Real-time)

```
Shopmonkey → ngrok (local) / production URL → Webhook Handler → DB
                                                   ↓
                                           Touch Point Processor
```

#### Backup: Polling (Every 30s)

```
Cron Loop → Shopmonkey API → Sync → DB
                                  ↓
                         Touch Point Processor
```

## Key Features

### 🔐 1. Outbound Safety Gate (NEW)

Every outbound touch point passes through this logic:

```javascript
if (!isWhitelistedEmail(customerEmail)) → skip everything
```

- Protects real customers
- Required for development
- Works for both SMS and Email

### 2. Real-Time Webhook Processing

- Order created → instant lead creation
- <100ms internal processing
- Idempotent

### 3. Polling Backup (Fail-Safe)

- Runs every 30 seconds
- Catches missed webhook events
- Syncs website leads

### 4. Touch Point Automation

- Runs every 10 seconds
- Generates nurture sequence (email + SMS)
- Now obeys whitelist safety gate

### 5. Multi-Tenant Architecture

- Designed for 200+ franchise locations
- Database isolation
- Shopmonkey account isolation

## API Endpoints

### POST /webhooks/shopmonkey/order

Receives order creation webhooks.

**Request Headers:**

```
X-Shopmonkey-Signature: <signature>
Content-Type: application/json
```

**Response:**

```json
{ "success": true, "leadId": "uuid" }
```

## Database

Run migrations:

```bash
npm run migrate
npm run migrate:rollback
npm run migrate:make migration_name
```

### Key Tables

- `tenants`
- `leads`
- `job_executions`
- `location_hours`
- `service_catalog`
- `chat_sessions`
- `chat_messages`

### Lead Lifecycle

- `new`
- `contacted`
- `engaged`
- `qualified`
- `appointment_set`
- `completed`
- `lost`

## Development

### Local Run

**Terminal 1: DB**

```bash
docker-compose up
```

**Terminal 2: Orchestrator**

```bash
npm run dev
```

**Terminal 3: ngrok (for webhooks)**

```bash
ngrok http 3000
```

### Outbound Testing

**1. Add your email to whitelist**

```bash
LEAD_EMAIL_WHITELIST="your_email@example.com"
```

**2. Trigger a touch point**

- Create order in Shopmonkey
- Watch terminal logs
- Verify:

```
[TouchPoint] Email your_email@example.com is whitelisted → SENDING
```

**3. Non-whitelisted lead**

Should show:

```
Email <customer> NOT whitelisted; skipping all outbound
```

This confirms safety behavior.

### Demo Mode

`DEMO_MODE=true` filters inbound leads from Shopmonkey.

**Note:**
- It does not override the whitelist.
- Safety gate always applies.

## Deployment

### Production Run

```bash
npm run build
node dist/index.js
```

### Production Checklist

- [ ] Set `DEMO_MODE=false`
- [ ] Configure `LEAD_EMAIL_WHITELIST` correctly
- [ ] Set real webhook URL in Shopmonkey
- [ ] Enable SSL
- [ ] Set up logs + monitoring
- [ ] Turn on Postgres backups

### Monitoring

Track:

- Webhook processing rate
- Touch point success rate
- Outbound skip rate (due to whitelist)
- Lead ingestion rate
- SMS/Email delivery

## Troubleshooting

### Outbound not sending

- Check whitelist
- Check Twilio/SendGrid keys
- Check if SMS blocked due to whitelist

### Webhook not firing

- Verify ngrok URL
- Verify Shopmonkey webhook setup

### Database issues

```bash
docker-compose up -d
npm run migrate
```

## Integration with Chat Service

**Flow:**

1. Lead stored by orchestrator
2. Touch point sends link: `https://chat.tintworld.com/<leadId>`
3. Customer opens chat frontend
4. Chat API (port 3001) loads lead context
5. AI responds

## Performance

- **Webhook:** <100ms internal
- **Touch point loop:** every 10s
- **Polling:** every 30s
- Can scale horizontally

## Related Docs

- `../../docs/architecture/SYSTEM_OVERVIEW.md`
- `../../docs/MVP_LOGIC.md`
- `../chat/README.md`

---

**Maintained by:** Lead Manager Engineering  
**Last Updated:** November 30, 2025 (whitelist-safe version)