# Lead Orchestrator - Phased Implementation Guide

**Version:** 1.2  
**Last Updated:** November 26, 2025  
**Status:** Phase 1 (MVP) - Webhooks Implemented, Workspace Architecture Complete

---

## Overview

This document describes our **phased approach** to implementing the Lead Orchestrator architecture. We build pragmatically for MVP, with a clear upgrade path when complexity requires it.

**Philosophy:** "Make it work, make it right, make it fast"

**Current Architecture:** Monorepo with npm workspaces (4 packages)

---

## Current Phase: MVP (Single Tenant, Single CRM, Workspace Structure)

### What We're Building Now
```
┌─────────────────────────────────────────────────────────┐
│                  MVP Architecture (Workspace)            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   Package: @lead-manager/orchestrator                    │
│   ┌───────────────────────────────────────────────────┐ │
│   │                                                    │ │
│   │  ShopMonkey Webhooks (Real-time) ← PRIMARY        │ │
│   │       │                                            │ │
│   │       ▼                                            │ │
│   │  ┌──────────────────┐                             │ │
│   │  │ Webhook Handler   │  ← HTTP endpoint (Fastify) │ │
│   │  └────────┬─────────┘                             │ │
│   │           │                                        │ │
│   │           ▼                                        │ │
│   │  ┌──────────────────┐                             │ │
│   │  │ ShopMonkeyAdapter │  ← Fetches customer/vehicle│ │
│   │  │                   │     + services (23 found)  │ │
│   │  └────────┬─────────┘                             │ │
│   │           │                                        │ │
│   │           ▼                                        │ │
│   │  ┌──────────────────┐                             │ │
│   │  │  LeadRepository   │  ← Concrete class          │ │
│   │  └────────┬─────────┘                             │ │
│   │           │                                        │ │
│   │           ▼                                        │ │
│   │  ┌──────────────────┐                             │ │
│   │  │    PostgreSQL     │                             │ │
│   │  └──────────────────┘                             │ │
│   │                                                    │ │
│   │  ShopMonkey Polling (Every 30s) ← BACKUP          │ │
│   │       │                                            │ │
│   │       └────────────────────────────────┐          │ │
│   │                                         │          │ │
│   │                                         ▼          │ │
│   │                                (Same flow above)   │ │
│   │                                                    │ │
│   └────────────────────────────────────────────────────┘ │
│                                                          │
│   Package: @lead-manager/chat (Ready to build)          │
│   Package: @lead-manager/frontend (Ready to build)      │
│   Package: @lead-manager/shared (Ready to populate)     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### MVP Workspace Structure
```
LeadManager/
├── packages/
│   ├── orchestrator/              # Lead management service
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── index.ts       # Environment config
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── db.ts      # Database connection
│   │   │   │   │   ├── migrations/ # Schema migrations (12 total)
│   │   │   │   │   └── repositories/
│   │   │   │   │       ├── TenantRepository.ts
│   │   │   │   │       ├── LeadRepository.ts
│   │   │   │   │       └── JobExecutionRepository.ts
│   │   │   │   ├── crm/
│   │   │   │   │   └── ShopMonkeyAdapter.ts
│   │   │   │   ├── webhooks/
│   │   │   │   │   └── ShopMonkeyWebhookHandler.ts
│   │   │   │   ├── messaging/
│   │   │   │   │   ├── TwilioService.ts
│   │   │   │   │   └── SendGridService.ts
│   │   │   │   └── jobs/
│   │   │   │       ├── LeadPollingService.ts
│   │   │   │       └── TouchPointProcessor.ts
│   │   │   ├── services/
│   │   │   │   └── LeadOrchestrationService.ts
│   │   │   └── index.ts
│   │   ├── .env                   # Package-specific config
│   │   └── package.json
│   │
│   ├── chat/                      # Chat service (ready to build)
│   │   ├── src/
│   │   │   ├── api/               # Chat endpoints
│   │   │   └── services/          # ChatService, AIService
│   │   └── package.json
│   │
│   ├── frontend/                  # React chat UI (ready to build)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── App.tsx
│   │   └── package.json
│   │
│   └── shared/                    # Shared types (ready to populate)
│       ├── src/
│       │   ├── types/             # Lead, Customer, Vehicle, Service
│       │   └── validation/        # Zod schemas
│       └── package.json
│
├── package.json                   # Workspace root
└── docker-compose.yml
```

### What We Skip in MVP

| Component | MVP Approach | Full Architecture |
|-----------|--------------|-------------------|
| Repository interfaces | Concrete classes only | ILeadRepository interface |
| CRM adapter interface | ShopMonkeyAdapter direct | ICRMAdapter interface |
| Webhook interfaces | Direct Fastify handler | IWebhookHandler interface |
| Domain models | TypeScript types | Full classes with methods |
| Value objects | Plain strings | PhoneNumber, Email classes |
| Domain events | None | Event bus pattern |
| Tenant context middleware | Simple header check | Full middleware with caching |
| Package interfaces | Direct imports | Published npm packages |

---

## Recent Changes

### ✅ Workspace Migration (Nov 26, 2025)

**Problem Solved:**
- Single package structure limited scalability
- Chat and orchestrator code would mix
- Difficult to deploy services independently
- No clear boundaries between components

**Solution Implemented:**
- Converted to npm workspaces (4 packages)
- Moved orchestrator code to `packages/orchestrator/`
- Created empty packages ready for chat, frontend, shared
- Maintained all existing functionality

**Architecture Decisions:**
1. ✅ **Monorepo approach** - All packages in one repository
2. ✅ **Independent packages** - Each has own package.json, dependencies
3. ✅ **Shared types ready** - `@lead-manager/shared` for common types
4. ✅ **Easy to split** - Can move to separate repos later if needed
5. ✅ **Workspace commands** - `npm run dev:orchestrator`, `npm run dev:chat`

**Migration Results:**
- All tests passing (47 tests)
- Orchestrator running normally
- Webhooks still functional
- Zero downtime migration
- Ready for chat implementation

**Files Reorganized:**
- `src/*` → `packages/orchestrator/src/*`
- Root `package.json` → Workspace config
- Created 3 new empty packages

**Migration Time:** ~45 minutes

---

### ✅ Webhook Integration Added (Nov 25, 2025)

**Problem Solved:**
- ShopMonkey API had 5-30 minute lag
- Broke the 30-second response time requirement
- Polling couldn't solve this

**Solution Implemented:**
- Primary: ShopMonkey webhooks (instant notification)
- Backup: Polling every 30 seconds (catches webhook failures)
- Result: Lead response time reduced from 5-30 minutes to <1 second

**Architecture Decisions:**
1. ✅ **Additive, not destructive** - Webhooks added alongside polling
2. ✅ **Defense in depth** - Polling remains as backup
3. ✅ **No interfaces yet** - Direct implementation (MVP approach)
4. ✅ **Fetches full data** - Webhook calls ShopMonkey API for customer/vehicle details
5. ✅ **Same validation** - Uses identical lead qualification criteria

**Implementation:** `packages/orchestrator/src/infrastructure/webhooks/ShopMonkeyWebhookHandler.ts` (~220 lines)

**Deployment Requirements:**
- Public HTTPS endpoint (ngrok for dev, DNS for production)
- Webhook configured in ShopMonkey: Settings → Webhooks
- Port 3000 exposed (configurable via WEBHOOK_PORT env var)

---

### ✅ Multi-Tenant Schema Added (Migrations 8-12 - Nov 25, 2025)

**Problem Solved:**
- Needed to support 200+ Tint World franchise locations
- Each location has different pricing, hours, services
- Database wasn't ready for multi-tenant scaling

**Solution Implemented:**
- Added `location_hours` table (business hours per location)
- Added `service_catalog` table (location-specific pricing)
- Added `chat_messages` table (AI conversation storage)
- Added `appointments` table (booking management)
- Made `leads.location_id` required (multi-tenant enforcement)
- Added indexes for multi-tenant queries

**Architecture Decisions:**
1. ✅ **Each lead tied to location** - location_id now required
2. ✅ **Location-specific pricing** - service_catalog can vary by location
3. ✅ **Webhook validates location** - Ensures location exists before creating lead
4. ✅ **Ready for scaling** - Can now support hundreds of franchise locations

**Database Changes:**
- 5 new tables
- All queries scope by tenant_id
- Webhook handler validates location exists
- Ready for chat interface implementation

**Migration Location:** `packages/orchestrator/src/infrastructure/persistence/migrations/`

---

### ✅ ShopMonkey Service Discovery (Nov 26, 2025)

**Discovery:**
- Found 23 window tinting services via `/v3/canned_service` API
- Services include pricing from $109 to $600
- No manual data entry needed

**Key Services:**
- Ultimate Tint Package: $600 (XPEL XR Plus Nano-Ceramic)
- Supreme Tint Package: $450 (XPEL XR Black Ceramic)
- Premium Tint Package: $300 (XPEL CS BLACK Carbon)

**Integration Plan:**
- Fetch services from ShopMonkey in real-time
- Cache in Redis (5-10 min TTL)
- AI chat uses real pricing data
- No need to populate `service_catalog` table manually

---

## Phase 2: Chat Implementation (Current Focus)

### Chat Package Structure (Ready to Build)
```
packages/chat/
├── src/
│   ├── api/
│   │   ├── ChatController.ts      # REST endpoints
│   │   ├── routes.ts              # Fastify routes
│   │   └── middleware/            # Auth, validation
│   ├── services/
│   │   ├── ChatService.ts         # Conversation management
│   │   ├── AIService.ts           # AI provider integration
│   │   └── ContextBuilder.ts      # Load customer/vehicle/services
│   ├── prompts/
│   │   ├── system.ts              # System prompts
│   │   ├── functions.ts           # Function calling definitions
│   │   └── templates.ts           # Prompt templates
│   └── index.ts                   # Package entry point
├── .env                           # Chat-specific config
└── package.json
```

### Implementation Steps

**Week 1: Foundation**
1. Extract shared types to `@lead-manager/shared`
2. Add `getCannedServices()` to ShopMonkeyAdapter
3. Model AI conversations
4. Choose AI provider (Claude vs OpenAI)

**Week 2: Chat Backend**
1. Build ChatService with AI integration
2. Create Chat API endpoints
3. Implement context loading
4. Test with real ShopMonkey services

**Week 3: Frontend**
1. Build React chat UI in `packages/frontend`
2. Connect to chat API
3. Implement polling (3-second intervals)
4. End-to-end testing

---

## Phase 3: Abstraction Trigger

### When to Abstract

**Add interfaces when ANY of these occur:**

1. **Second CRM needed** (e.g., Tekmetric customer signs up)
2. **Second tenant with different config** (e.g., different polling interval)
3. **Unit testing requires mocking** (cannot test without real DB)
4. **Team grows beyond 2 engineers** (need clearer contracts)
5. **Second webhook provider** (e.g., different CRM with webhooks)
6. **Package publishing** (need stable interfaces for npm packages)

---

## Refactoring Guide: MVP → Full Architecture

### Step 1: Extract Repository Interfaces (1 hour)

**Before (MVP):**
```typescript
// packages/orchestrator/src/infrastructure/persistence/repositories/LeadRepository.ts
import { db } from '../db';

export class LeadRepository {
  async findByTenant(tenantId: string) {
    return db('leads').where({ tenant_id: tenantId });
  }

  async create(tenantId: string, data: CreateLeadData) {
    return db('leads').insert({ ...data, tenant_id: tenantId }).returning('*');
  }
}
```

**After (Full Architecture):**
```typescript
// packages/shared/src/repositories/ILeadRepository.ts
export interface ILeadRepository {
  findByTenant(tenantId: string): Promise<Lead[]>;
  create(tenantId: string, data: CreateLeadData): Promise<Lead>;
}

// packages/orchestrator/src/infrastructure/persistence/repositories/LeadRepository.ts
import { ILeadRepository } from '@lead-manager/shared/repositories';

export class LeadRepository implements ILeadRepository {
  // Same implementation, now implements interface
}
```

---

### Step 2: Extract CRM Adapter Interface (1 hour)

**Before (MVP):**
```typescript
// packages/orchestrator/src/infrastructure/crm/ShopMonkeyAdapter.ts
export class ShopMonkeyAdapter {
  async fetchNewLeads(since: Date): Promise<Lead[]> { }
  async getCustomer(customerId: string): Promise<Customer> { }
  async getCannedServices(locationId: string): Promise<Service[]> { }
}
```

**After (Full Architecture):**
```typescript
// packages/shared/src/ports/ICRMAdapter.ts
export interface ICRMAdapter {
  fetchNewLeads(since: Date): Promise<Lead[]>;
  getCustomer(customerId: string): Promise<Customer>;
  getVehicle(vehicleId: string): Promise<Vehicle>;
  getCannedServices(locationId: string): Promise<Service[]>;
  createAppointment(lead: Lead, appointment: AppointmentData): Promise<void>;
}

// packages/orchestrator/src/infrastructure/crm/ShopMonkeyAdapter.ts
export class ShopMonkeyAdapter implements ICRMAdapter { }

// Future: packages/orchestrator/src/infrastructure/crm/TekmetricAdapter.ts
export class TekmetricAdapter implements ICRMAdapter { }
```

---

### Step 3: Publish Shared Package (2 hours)

**When you need stable interfaces:**
```typescript
// packages/shared/package.json
{
  "name": "@lead-manager/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  }
}

// Other packages use published version
// packages/chat/package.json
{
  "dependencies": {
    "@lead-manager/shared": "^1.0.0"  // Specific version instead of "*"
  }
}
```

---

## Refactoring Summary

| Step | Time | Description |
|------|------|-------------|
| 1. Repository interfaces | 1 hour | Extract to `@lead-manager/shared` |
| 2. CRM adapter interface | 1 hour | Extract ICRMAdapter |
| 3. Webhook interface | 30 min | Extract IWebhookHandler (when 2nd CRM added) |
| 4. Adapter registry | 30 min | Create CRMAdapterRegistry |
| 5. Dependency injection | 30 min | Update services to use constructor injection |
| 6. Publish shared package | 2 hours | Build, version, publish to npm |
| **Total** | **~5.5 hours** | |

---

## Code Quality Rules (Both Phases)

### Always Required
```typescript
// ✅ ALWAYS: Tenant scoping on every query
async findByStatus(tenantId: string, status: string) {
  return db('leads').where({ tenant_id: tenantId, status });
}

// ❌ NEVER: Query without tenant_id
async findByStatus(status: string) {
  return db('leads').where({ status }); // DATA LEAK RISK!
}
```
```typescript
// ✅ ALWAYS: Input validation
const validated = CreateLeadSchema.parse(data);

// ❌ NEVER: Trust raw input
return db('leads').insert(data); // INJECTION RISK!
```
```typescript
// ✅ ALWAYS: Use workspace package names
import { Lead } from '@lead-manager/shared/types';

// ❌ AVOID: Relative imports across packages
import { Lead } from '../../../shared/src/types/Lead';
```

---

## Workspace-Specific Patterns

### Package Dependencies
```typescript
// ✅ Chat can depend on shared
// packages/chat/package.json
{
  "dependencies": {
    "@lead-manager/shared": "*"
  }
}

// ✅ Orchestrator can depend on shared
// packages/orchestrator/package.json
{
  "dependencies": {
    "@lead-manager/shared": "*"
  }
}

// ❌ Orchestrator should NOT depend on chat
// Keeps packages independent
```

### Development Workflow
```bash
# ✅ Start specific package
npm run dev:orchestrator
npm run dev:chat

# ✅ Test specific package
npm run test -w @lead-manager/orchestrator

# ✅ Install dependency in specific package
npm install axios -w @lead-manager/chat

# ✅ Build all packages
npm run build
```

---

## Checklist: Before Adding Complexity

Before abstracting, ask:

- [ ] Do we have a second CRM to integrate?
- [ ] Do we have multiple tenants with different configs?
- [ ] Is the team struggling to understand the code?
- [ ] Are we unable to write unit tests?
- [ ] Do we need to support multiple webhook providers?
- [ ] Are we publishing packages to npm?
- [ ] Do we have 3+ engineers working on different packages?

**If all answers are "No" → Stay with MVP approach**

---

## Summary

| Aspect | MVP (Now) | Full Architecture (Later) |
|--------|-----------|---------------------------|
| Structure | Monorepo workspaces (4 packages) | Same + published packages |
| Lead Ingestion | Webhooks + Polling backup | Event-driven architecture |
| Repositories | Concrete classes | Interface + Implementation |
| CRM Adapters | ShopMonkeyAdapter only | ICRMAdapter + Registry |
| Webhook Handlers | Direct Fastify handler | IWebhookHandler + Registry |
| Testing | Integration tests | Unit + Integration tests |
| Package Management | Workspace "*" dependencies | Versioned npm packages |
| Refactor Time | - | ~5.5 hours |
| Response Time | <1 second (webhooks) | <1 second (webhooks) |
| Deployment | Monorepo (same deploy) | Independent package deploys |

---

## Next Phase: Chat Implementation

**Current Status:** Workspace structure complete, orchestrator running, ready to build chat

**Next Steps:**
1. Extract shared types to `@lead-manager/shared`
2. Extend ShopMonkeyAdapter with `getCannedServices()`
3. Model AI conversations
4. Choose AI provider
5. Build chat service in `packages/chat`
6. Build React UI in `packages/frontend`

**Timeline:** 2-3 weeks to working chat