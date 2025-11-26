# Lead Orchestrator - MVP Business Logic

**Version:** 1.3  
**Last Updated:** November 26, 2025  
**Status:** MVP Implementation - Webhooks Active, Multi-Tenant Ready, Workspace Architecture

---

## Overview

This document defines the business logic for the MVP lead management system for Tint World window tinting services.

**Architecture:** Monorepo with npm workspaces (4 packages: orchestrator, chat, frontend, shared)

---

## 1. Lead Definition

### What is a "Website Lead"?

A qualified lead must meet ALL of these criteria:

| Field | Value | Reason |
|-------|-------|--------|
| `workflowStatusId` | `619813fb2c9c3e8ce527be48` OR `65fb14d76ee665db4d8d2ce0` | Website Leads OR Appointments workflow |
| `status` | `Estimate` | Quote created, not yet work in progress |
| `authorized` | `false` | Customer hasn't approved/committed |
| `messageCount` | `0` | Not yet contacted via ShopMonkey |
| `name` | Starts with "New Quote" | Website-generated (not walk-in) |
| `appointmentDates` | Empty array | No actual appointment scheduled yet |
| `invoiced` | `false` | Not yet invoiced |
| `paid` | `false` | Not yet paid |
| Service type | Contains "tint" or "window" | Our target service |

### ShopMonkey Workflow Status IDs (Tint World)
```
619813fb2c9c3e8ce527be48 = Website Leads (original target)
65fb14d76ee665db4d8d2ce0 = Appointments (website quotes land here too)
619813fb2c9c3e7f6a27be4b = Invoiced/Completed
```

**Note:** Website quote forms create orders in "Appointments" workflow even though no appointment is scheduled yet. We filter by `appointmentDates.length === 0` to catch these.

---

## 2. Demo Mode

**CRITICAL SAFETY FEATURE**

Demo mode prevents accidental contact with real customers during development/testing.

| Mode | Behavior |
|------|----------|
| `demoMode: true` (default) | Only process leads with email: `sarmadashoor1@gmail.com` |
| `demoMode: false` | Process ALL qualified leads (production only) |

**Demo mode is ON by default.** Must be explicitly disabled for production.

**Configuration:** Set in `packages/orchestrator/.env`

---

## 3. Timing Rules

### New Leads
- **Target:** Contact within 1 second of lead creation ✅ **ACHIEVED**
- **Method:** ShopMonkey webhooks (primary) + Polling backup
- **Actual Performance:** <1 second via webhooks, 30 seconds via polling backup

### Historical Backfill
- **Window:** Last 30 days maximum
- **Rationale:** After system is live, no lead should sit untouched for 30+ days
- **One-time operation:** Run once at system launch

### Lead Ingestion Methods

| Method | Speed | Reliability | Status |
|--------|-------|-------------|--------|
| Webhooks | <1 second | 99%+ | ✅ Primary |
| Polling | 30 seconds | 100% | ✅ Backup |

**Architecture:** Dual ingestion ensures no leads are missed. If webhook fails, polling catches it within 30 seconds.

**Implementation:** `packages/orchestrator/src/infrastructure/webhooks/ShopMonkeyWebhookHandler.ts`

---

## 4. Follow-Up Schedule

If customer doesn't respond, execute 13 touch points over 30 days:

| Touch Point | Day | Description |
|-------------|-----|-------------|
| 1 | 0 | Initial contact (within 1 sec) |
| 2 | 1 | First follow-up |
| 3 | 3 | Second follow-up |
| 4 | 5 | Third follow-up |
| 5 | 7 | Fourth follow-up |
| 6 | 10 | Fifth follow-up |
| 7 | 13 | Sixth follow-up |
| 8 | 16 | Seventh follow-up |
| 9 | 19 | Eighth follow-up |
| 10 | 22 | Ninth follow-up |
| 11 | 25 | Tenth follow-up |
| 12 | 27 | Eleventh follow-up |
| 13 | 30 | Final follow-up |

**Average interval:** ~2.3 days between touch points

**Implementation:** `packages/orchestrator/src/domain/TouchPointSchedule.ts`

### Stop Conditions
- Customer responds (any response)
- Customer books appointment
- Customer opts out
- 13 touch points completed
- Lead marked as lost/closed in CRM

---

## 5. Lead Status Flow
```
NEW → CONTACTED → CHAT_ACTIVE → APPOINTMENT_SCHEDULED → CONVERTED
                      ↓
                    LOST (after 13 touches with no response)
```

| Status | Description |
|--------|-------------|
| `new` | Lead imported, not yet contacted |
| `contacted` | Initial AI link sent |
| `chat_active` | Customer engaged with AI chat |
| `appointment_scheduled` | Appointment booked in CRM |
| `converted` | Service completed |
| `lost` | No response after all follow-ups |

---

## 6. MVP Scope

### In Scope
- ✅ ShopMonkey integration (webhooks + polling)
- ✅ Website Leads only
- ✅ Window tinting services only
- ✅ Demo mode for safe testing
- ✅ Initial contact logic
- ✅ Follow-up schedule (13 touches)
- ✅ Single tenant (Tint World Store094)
- ✅ Email integration (SendGrid)
- ✅ SMS integration (Twilio)
- ✅ Multi-tenant database schema (ready for scale)
- ✅ Workspace architecture (4 packages)
- ✅ ShopMonkey service catalog integration (23 services)

### In Progress / Next
- 🔜 AI chat integration (packages ready)
- 🔜 React chat UI (packages ready)
- 🔜 Appointment booking integration

### Out of Scope (Future)
- ❌ Other swim lanes (walk-ins, phone quotes)
- ❌ Other services (PPF, ceramic coating, etc.)
- ❌ Multiple active tenants (schema ready, not activated)

---

## 7. Database Schema

### Core Tables (Operational)

**`tenants`** - Customer accounts
- Multi-tenant architecture support
- Currently: Single tenant (Tint World)

**`tenant_crm_configs`** - CRM credentials per tenant
- Supports multiple CRM types per tenant
- Currently: ShopMonkey for Tint World

**`locations`** - Franchise locations
- Each lead belongs to a location
- Supports location-specific settings
- Currently: Store094 (San Diego La Mesa)

**`leads`** - Customer leads
- `location_id` - Required (enforced at DB level)
- `touch_point_count` - Number of contacts made (0-13)
- `next_touch_point_at` - When to send next follow-up
- `last_contacted_at` - Last contact timestamp
- `first_response_at` - When customer first responded
- `appointment_created_at` - When appointment booked

**`chat_sessions`** - AI chat conversations
- Links to lead
- Tracks conversation status

**`job_executions`** - Background job tracking
- Polling service history
- Touch point processor history

### New Tables (Multi-Tenant Ready - Migrations 8-12)

**`location_hours`** (Migration 8)
- Business hours per location
- Day-specific hours (Mon-Sun)
- Closed days tracking
- Supports different hours per franchise
- **Status:** Table ready, needs data population

**`service_catalog`** (Migration 9)
- Location-specific OR tenant-wide pricing
- Service details (name, description, duration)
- Price in cents
- Active/featured status
- **Status:** Table ready, services fetched from ShopMonkey API (no manual entry needed)
- **Enables:** Location-specific pricing for 200+ franchises

**`chat_messages`** (Migration 10)
- Stores AI conversation history
- User, assistant, system messages
- Metadata for AI context
- Fast retrieval by session or lead
- **Status:** Ready for chat implementation

**`appointments`** (Migration 11)
- Appointment bookings per location
- Links to services from catalog
- Status tracking (confirmed, cancelled, completed, no_show)
- ShopMonkey sync tracking
- Customer confirmation tracking
- **Status:** Ready for booking implementation

### Multi-Tenant Capabilities

The schema now supports:
- ✅ **Multiple franchises** (e.g., 200+ Tint World locations)
- ✅ **Location-specific pricing** (San Diego ≠ Phoenix prices)
- ✅ **Location-specific hours** (different timezones, schedules)
- ✅ **Per-location appointments** (separate calendars)
- ✅ **Tenant isolation** (all queries scope by tenant_id)

---

## 8. ShopMonkey Service Catalog

### Service Discovery (Nov 26, 2025)

**23 window tinting services found** via `/v3/canned_service` API:

**Key Services:**
- Ultimate Tint Package: $600.00 (XPEL XR Plus Nano-Ceramic)
- Ultimate Tint Windshield: $300.00
- Supreme Tint Package: $450.00 (XPEL XR Black Ceramic)
- Supreme Tint Windshield: $250.00
- Premium Tint Package: $300.00 (XPEL CS BLACK Carbon)

**Additional Services:**
- 18+ bedliner and coating services
- Prices range: $109 - $600

**API Integration:**
- Endpoint: `GET /v3/canned_service?limit=200`
- Filter: Active services for location (ignore "bookable" flag)
- Usage: AI chat fetches real-time pricing
- Implementation: `ShopMonkeyAdapter.getCannedServices()`

**Benefits:**
- ✅ No manual data entry required
- ✅ Always up-to-date pricing
- ✅ Staff manages in one place (ShopMonkey)
- ✅ AI uses real pricing data

---

## 9. Configuration

### Environment Variables

**Location:** `packages/orchestrator/.env`
```env
# Demo mode (default: true)
DEMO_MODE=true

# ShopMonkey
SHOPMONKEY_API_KEY=xxx
SHOPMONKEY_BASE_URL=https://api.shopmonkey.cloud/v3

# Webhook server
WEBHOOK_PORT=3000

# Polling interval (seconds) - backup only
POLL_INTERVAL_SECONDS=30

# Backfill window (days)
BACKFILL_DAYS=30

# Messaging
SENDGRID_API_KEY=xxx
SENDGRID_FROM_EMAIL=xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=xxx

# Database
DATABASE_URL=postgresql://leadmanager:leadmanager_dev@localhost:5432/leadmanager
REDIS_URL=redis://localhost:6379

# Tenant
TENANT_ID=dea6e2aa-a961-4b4d-9df0-5329029abe13
```

---

## 10. Webhook Configuration

### ShopMonkey Webhook Setup
1. Login to ShopMonkey → Settings → Webhooks
2. Click "Add Webhook"
3. Configure:
   - **Name:** Lead Manager - Store094
   - **URL:** `https://your-domain.com/webhooks/shopmonkey/order`
   - **Events:** Order
   - **Status:** Enabled

### Webhook Processing
- Validates location exists in database (required)
- Returns 200 OK immediately (prevents retries)
- Fetches full customer/vehicle data from ShopMonkey API
- Validates all lead criteria before processing
- Links lead to location_id automatically
- Logs all webhook attempts for debugging

**Implementation:** `packages/orchestrator/src/infrastructure/webhooks/ShopMonkeyWebhookHandler.ts`

### Development Setup
- Use ngrok to expose localhost:3000
- Example: `ngrok http 3000`
- Configure webhook URL: `https://abc123.ngrok-free.dev/webhooks/shopmonkey/order`

---

## 11. Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| Lead response time | Time from lead creation to first contact | <1 second ✅ |
| Webhook success rate | % of webhooks successfully processed | >99% |
| Polling backup usage | % of leads caught by polling (not webhook) | <1% |
| Response rate | % of leads that respond | TBD |
| Conversion rate | % of leads that book appointment | TBD |
| Touch points to conversion | Average touches before booking | TBD |
| Drop-off by touch point | Where leads stop engaging | TBD |
| Chat engagement | % of customers who use chat | TBD (after chat launch) |
| Booking via chat | % of appointments booked via chat | TBD (after chat launch) |

---

## 12. Workspace Architecture

### Package Structure
```
LeadManager/
├── packages/
│   ├── orchestrator/          # Lead management & webhooks
│   │   ├── src/
│   │   │   ├── domain/        # Business logic
│   │   │   ├── infrastructure/ # External integrations
│   │   │   └── services/       # Application services
│   │   └── package.json
│   │
│   ├── chat/                   # AI chat service (ready to build)
│   │   ├── src/
│   │   │   ├── api/           # Chat endpoints
│   │   │   └── services/       # ChatService, AIService
│   │   └── package.json
│   │
│   ├── frontend/               # React chat UI (ready to build)
│   │   ├── src/
│   │   │   └── components/     # Chat components
│   │   └── package.json
│   │
│   └── shared/                 # Shared types (ready to populate)
│       ├── src/
│       │   ├── types/          # Lead, Customer, Vehicle, Service
│       │   └── validation/     # Zod schemas
│       └── package.json
│
└── package.json                # Workspace root
```

### Benefits
- ✅ Clean separation of concerns
- ✅ Independent deployment capability
- ✅ Shared types prevent duplication
- ✅ Easy to split into separate repos later
- ✅ Clear boundaries for team scaling

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-23 | Initial MVP logic defined | Claude/Team |
| 2025-11-25 | Added webhook integration, updated timing to <1 sec | Claude/Team |
| 2025-11-25 | Expanded lead criteria (added Appointments workflow) | Claude/Team |
| 2025-11-25 | Added webhook configuration section | Claude/Team |
| 2025-11-25 | Added multi-tenant schema section (migrations 8-12) | Claude/Team |
| 2025-11-25 | Updated version to 1.2, status to "Multi-Tenant Ready" | Claude/Team |
| 2025-11-26 | **Workspace migration complete** - Converted to monorepo | Claude/Team |
| 2025-11-26 | Added ShopMonkey service catalog section (23 services) | Claude/Team |
| 2025-11-26 | Updated version to 1.3, added workspace architecture | Claude/Team |
| 2025-11-26 | Updated all file paths to workspace structure | Claude/Team |