# Lead Orchestrator - Conversation Handoff Document

**Last Updated:** November 24, 2025  
**Purpose:** Enable seamless continuation in a new conversation

---

## Project Summary

**Lead Orchestrator** is a multi-tenant SaaS platform that automates lead-to-appointment conversion for automotive service businesses. MVP focuses on Tint World window tinting.

**Core Flow:** ShopMonkey quote → Poll for leads → AI chat engagement → Book appointment

---

## What's Been Built

### ✅ Completed

| Component | Status | Location |
|-----------|--------|----------|
| Database schema | Done | `src/infrastructure/persistence/migrations/` |
| PostgreSQL + Redis (Docker) | Running | `docker-compose.yml` |
| Database connection | Tested | `src/infrastructure/persistence/db.ts` |
| Lead Repository | Done + Tests | `src/infrastructure/persistence/repositories/LeadRepository.ts` |
| Tenant Repository | Done + Tests | `src/infrastructure/persistence/repositories/TenantRepository.ts` |
| ShopMonkey Adapter | Done | `src/infrastructure/crm/ShopMonkeyAdapter.ts` |
| Touch Point Schedule | Done + Tests | `src/domain/TouchPointSchedule.ts` |
| Lead Polling Service | Done | `src/infrastructure/jobs/LeadPollingService.ts` |
| Touch Point Processor | Done | `src/infrastructure/jobs/TouchPointProcessor.ts` |
| Email Integration (SendGrid) | ✅ Working | `src/infrastructure/messaging/SendGridService.ts` |
| SMS Integration (Twilio) | ⏳ Pending A2P | `src/infrastructure/messaging/TwilioService.ts` |
| Main Entry Point | Done | `src/index.ts` |
| Database tests | 47 passing | `src/__tests__/` |
| Architecture docs | Complete | `docs/architecture/` |

### ⚠️ Known Issues

| Issue | Impact | Solution |
|-------|--------|----------|
| ShopMonkey API Lag | 5-30 min delay from UI to API | Normal - keep polling, lead will appear |
| Twilio A2P 10DLC | SMS not delivering | Complete registration (1-2 weeks) |
| Email to Spam | Low initial deliverability | Authenticate domain in SendGrid |

### 📁 Key Files
```
LeadManager/
├── docker-compose.yml          # PostgreSQL + Redis
├── knexfile.js                 # DB migrations config
├── .env                        # Local config (not committed)
├── docs/
│   ├── architecture/
│   │   ├── SYSTEM_DESIGN.md
│   │   ├── PHASED_IMPLEMENTATION.md
│   │   ├── QUICK_REFERENCE.md
│   │   └── LLM_CONTEXT_PROMPT.md
│   ├── MVP_LOGIC.md            # Business rules
│   └── HANDOFF.md              # This file
└── src/
    ├── domain/
    │   └── TouchPointSchedule.ts   # 13-touch schedule logic
    ├── infrastructure/
    │   ├── persistence/
    │   │   ├── db.ts
    │   │   ├── migrations/     # 7 migration files
    │   │   └── repositories/
    │   │       ├── LeadRepository.ts
    │   │       └── TenantRepository.ts
    │   ├── crm/
    │   │   └── ShopMonkeyAdapter.ts
    │   ├── messaging/
    │   │   ├── SendGridService.ts  # Email (working)
    │   │   └── TwilioService.ts    # SMS (pending A2P)
    │   └── jobs/
    │       ├── index.ts
    │       ├── LeadPollingService.ts
    │       └── TouchPointProcessor.ts
    ├── index.ts                # Main entry point
    └── __tests__/
        ├── database.test.ts
        ├── domain/
        │   └── TouchPointSchedule.test.ts
        └── repositories/
            ├── LeadRepository.test.ts
            └── TenantRepository.test.ts
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `tenants` | Customer accounts (Tint World) |
| `tenant_crm_configs` | CRM credentials per tenant |
| `locations` | Franchise locations |
| `leads` | Customer leads from CRM (with touch point fields) |
| `chat_sessions` | AI chat conversations |
| `job_executions` | Background job tracking |

**New fields on `leads` table (migration 7):**
- `touch_point_count` - Number of contacts made (0-13)
- `next_touch_point_at` - When to send next follow-up
- `last_contacted_at` - Last contact timestamp

---

## ShopMonkey Integration

### API Endpoints Used
- `GET /v3/order` - Fetch orders
- `GET /v3/customer/{id}` - Customer details
- `GET /v3/vehicle/{id}` - Vehicle details

### Website Lead Criteria
```typescript
order.workflowStatusId === '619813fb2c9c3e8ce527be48' &&
order.status === 'Estimate' &&
order.authorized === false &&
order.messageCount === 0 &&
order.name?.startsWith('New Quote')
```

### Demo Mode
- **ON by default** - Only processes `sarmadashoor1@gmail.com`
- Prevents accidental contact with real customers

---

## How the System Works

### Lead Polling (every 30 seconds)
1. `LeadPollingService` polls ShopMonkey for website leads
2. New leads are imported via `LeadRepository.upsert()`
3. Initial touch point is scheduled via `TouchPointSchedule`

### Touch Point Processing (every 10 seconds)
1. `TouchPointProcessor` finds leads due for touch points
2. Executes touch point handler (sends message)
3. Schedules next touch point based on 13-touch schedule
4. Marks leads as `lost` after 13 touches with no response

### 13-Touch Schedule
| Touch | Day | Touch | Day |
|-------|-----|-------|-----|
| 1 | 0 | 8 | 16 |
| 2 | 1 | 9 | 19 |
| 3 | 3 | 10 | 22 |
| 4 | 5 | 11 | 25 |
| 5 | 7 | 12 | 27 |
| 6 | 10 | 13 | 30 |
| 7 | 13 | | |

---

## Next Steps (In Order)

### ✅ Already Done
- Database migrations (7 total)
- Tenant created (ID in .env)
- Email integration working (SendGrid)
- SMS integration configured (Twilio - awaiting A2P)
- End-to-end tested successfully

### 🔜 Immediate Next Steps

1. **Complete Twilio A2P 10DLC Registration** (1-2 weeks)
   - Status: Awaiting approval
   - Once approved, SMS will deliver automatically

2. **Improve Email Deliverability**
   - Authenticate domain in SendGrid (instead of single sender)
   - Move emails from spam to primary inbox

3. **Build AI Chat Interface**
   - Currently using placeholder link: `https://chat.tintworld.com/{leadId}`
   - Need actual chat UI with AI agent

4. **Test with Real Customer** (after A2P approval)
   - Turn off demo mode: `DEMO_MODE=false`
   - Monitor first real lead through system

5. **Add Appointment Booking**
   - Integrate back with ShopMonkey calendar
   - Update order status when appointment booked

---

## Commands Reference
```bash
# Start database
docker compose up -d

# Run migrations
npx knex migrate:latest

# Run tests
npm test

# Start application
npm run dev

# Test ShopMonkey connection
npx tsx src/test-shopmonkey.ts

# Check DB tables
docker exec leadmanager-db psql -U leadmanager -d leadmanager -c "\dt"

# Check leads table structure
docker exec leadmanager-db psql -U leadmanager -d leadmanager -c "\d leads"
```

---

## Environment Setup
```env
DATABASE_URL=postgresql://leadmanager:leadmanager_dev@localhost:5432/leadmanager
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000

# ShopMonkey
SHOPMONKEY_API_KEY=<your-key>
SHOPMONKEY_BASE_URL=https://api.shopmonkey.cloud/v3

# Lead Orchestrator
TENANT_ID=<uuid-from-db>
DEMO_MODE=true
POLL_INTERVAL_SECONDS=30

# SendGrid (Email)
SENDGRID_API_KEY=<your-sendgrid-key>
SENDGRID_FROM_EMAIL=<your-verified-email>

# Twilio (SMS) - Optional
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>
```

---

## Test Data

- **Test customer email:** sarmadashoor1@gmail.com
- **Test customer name:** Sarmad Ashoor
- **ShopMonkey location:** Tint World - Store094 (San Diego)
- **Current tenant ID:** dea6e2aa-a961-4b4d-9df0-5329029abe13

---

## Important Notes

### ShopMonkey API Lag
- **Orders appear in ShopMonkey UI:** Instantly
- **Orders appear in API response:** 5-30 minutes later
- **Why:** API likely uses read replicas or caching
- **Impact:** Normal delay - keep app running, it will pick up new leads automatically

### Testing New Leads
1. Create quote on Tint World website (use "Get Quote" flow)
2. Verify it appears in ShopMonkey UI immediately
3. Wait 5-30 minutes for API to update
4. App will auto-detect and send email/SMS

### Current System Status (Nov 24, 2025)
- ✅ **Email:** Working (delivers to spam, normal for new sender)
- ⏳ **SMS:** Configured but pending Twilio A2P 10DLC approval
- ✅ **Polling:** Every 30 seconds (500 order limit)
- ✅ **Touch Points:** 13-touch schedule active
- ✅ **Demo Mode:** ON (safe for testing)

---

## Questions to Ask in New Conversation

If starting fresh, ask:
1. "What's the current git status?"
2. "Are Docker containers running?"
3. "Do all tests pass?"
4. Then continue from Next Steps above

---

## 🚨 CRITICAL ISSUE TO RESOLVE

### ShopMonkey API Lag (5-30 minutes)

**Problem:**
- Orders appear in ShopMonkey UI instantly
- Orders take 5-30 minutes to appear in API response
- This breaks our 30-second response goal

**Impact:**
- Customer requests quote at 10:00 AM
- We don't contact them until 10:05-10:30 AM
- Defeats the purpose of instant response

**Must Investigate:**
1. Does ShopMonkey have **webhooks**? (instant notification)
2. Is there a more real-time API endpoint?
3. Can we filter by `createdDate` to bypass cache?
4. Can we increase polling to every 5 seconds? (rate limits?)
5. Contact ShopMonkey support - ask about API lag

**This is the #1 priority to fix before production.**

