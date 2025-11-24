# Lead Orchestrator - Conversation Handoff Document

**Last Updated:** November 23, 2025  
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
| Database tests | 25 passing | `src/__tests__/` |
| Architecture docs | Complete | `docs/architecture/` |

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
    ├── infrastructure/
    │   ├── persistence/
    │   │   ├── db.ts
    │   │   ├── migrations/     # 6 migration files
    │   │   └── repositories/
    │   │       ├── LeadRepository.ts
    │   │       └── TenantRepository.ts
    │   └── crm/
    │       └── ShopMonkeyAdapter.ts
    └── __tests__/
        ├── database.test.ts
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
| `leads` | Customer leads from CRM |
| `chat_sessions` | AI chat conversations |
| `job_executions` | Background job tracking |

**All tables have `tenant_id` for multi-tenant isolation.**

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

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-tenancy | Shared DB, row-level | Industry standard, simpler ops |
| MVP architecture | Concrete classes, no interfaces | Faster to ship, refactor later (~3hrs) |
| Database | PostgreSQL + Knex | ACID compliance, good migrations |
| Testing | Vitest | Fast, TypeScript-first |
| CRM polling | 30 second interval | Balance speed vs API limits |
| Demo mode | Default ON | Safety for development |

---

## Next Steps (In Order)

### 1. Add Touch Point Schema
```sql
ALTER TABLE leads ADD COLUMN touch_point_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN next_touch_point_at TIMESTAMP;
```

### 2. Create Polling Job
- Poll ShopMonkey every 30 seconds
- Import new website leads
- Use Bull queue for job scheduling

### 3. Create Touch Point Scheduler
- Schedule follow-ups based on 13-touch schedule
- Track which touch point each lead is on

### 4. Integrate Messaging (Phase 2)
- Twilio for SMS
- SendGrid for Email
- Send AI chat link

---

## Commands Reference
```bash
# Start database
docker compose up -d

# Run migrations
npx knex migrate:latest

# Run tests
npm test

# Test ShopMonkey connection
npx tsx src/infrastructure/crm/test-shopmonkey.ts

# Check DB tables
docker exec leadmanager-db psql -U leadmanager -d leadmanager -c "\dt"
```

---

## Environment Setup
```env
DATABASE_URL=postgresql://leadmanager:leadmanager_dev@localhost:5432/leadmanager
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000
SHOPMONKEY_API_KEY=<your-key>
SHOPMONKEY_BASE_URL=https://api.shopmonkey.cloud/v3
DEMO_MODE=true
```

---

## To Continue Development

1. Read `docs/MVP_LOGIC.md` for business rules
2. Read `docs/architecture/PHASED_IMPLEMENTATION.md` for technical approach
3. Run `npm test` to verify everything works
4. Pick up from "Next Steps" above

---

## Test Data

- **Test customer email:** sarmadashoor1@gmail.com
- **Test customer name:** Sarmad Ashoor
- **ShopMonkey location:** Tint World - Store094 (San Diego)

---

## Questions to Ask in New Conversation

If starting fresh, ask:
1. "What's the current git status?"
2. "Are Docker containers running?"
3. "Do all tests pass?"
4. Then continue from Next Steps
