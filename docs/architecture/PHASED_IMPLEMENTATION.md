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

## Phase 2: Chat Implementation (IN PROGRESS)

### ✅ Chat Core Complete (Nov 26, 2025)

**What Was Built:**
- Multi-provider AI system (Claude Sonnet 4.5 + OpenAI GPT-4o)
- Provider abstraction layer (AIProvider interface)
- Toggle between providers via environment variable
- Cost tracking and health monitoring per provider
- Database integration (shared PostgreSQL with orchestrator)
- LeadContextRepository for fetching lead data
- 10 tests passing (TDD approach)
- Tested with REAL API calls - both providers working

**Chat Package Structure (Implemented):**
```
packages/chat/
├── src/
│   ├── ai/
│   │   ├── providers/
│   │   │   ├── AIProvider.ts          # Interface ✅
│   │   │   ├── ClaudeProvider.ts      # Claude implementation ✅
│   │   │   ├── OpenAIProvider.ts      # OpenAI implementation ✅
│   │   │   └── index.ts               # Factory ✅
│   │   └── AIService.ts               # Orchestrator ✅
│   ├── config/
│   │   └── ai-config.ts               # Environment config ✅
│   ├── infrastructure/
│   │   └── db.ts                      # Database connection ✅
│   ├── repositories/
│   │   └── LeadContextRepository.ts   # Fetch lead data ✅
│   ├── __tests__/                     # Test utilities ✅
│   └── demo.ts                        # Demo script ✅
├── .env                               # Chat-specific config ✅
└── package.json                       # Dependencies ✅
```

**Performance Results (Real API Tests):**
- Claude: 3.4s latency, 254 tokens, $0.005/msg, conversational style
- OpenAI: 1.5s latency, 174 tokens, $0.002/msg, concise style

**Architecture Decisions:**
1. ✅ **Multi-provider support** - Easy to add Gemini, Llama, etc.
2. ✅ **Shared database** - Chat reads from same PostgreSQL as orchestrator
3. ✅ **TDD approach** - All new code test-driven (10 tests passing)
4. ✅ **Configuration-driven** - Toggle providers via env var
5. ✅ **Cost tracking** - Built-in per provider

### 🔜 Chat Remaining Work (Next 1-2 Weeks)

**Week 1: REST API (2-3 hours)**
1. ✅ AI providers working (DONE)
2. ✅ Database integration (DONE)
3. ✅ Tests passing (DONE)
4. ⏳ Create REST API endpoints:
   - `POST /api/chat/:leadId` - Send message, get AI response
   - `GET /api/health` - Check provider health
   - `GET /api/chat/:leadId/history` - Conversation history
5. ⏳ Start Fastify server
6. ⏳ Test with curl/Postman

**Week 2-3: Frontend (1 day)**
1. Build React chat UI in `packages/frontend`
2. Chat window component
3. Message display
4. Input field
5. Connect to chat API
6. Polling (2-3 second intervals)

**Integration (1 day):**
1. Update orchestrator email with chat link
2. End-to-end testing
3. Deploy

---

## Summary

| Aspect | MVP (Now) | Full Architecture (Later) |
|--------|-----------|---------------------------|
| Structure | Monorepo workspaces (4 packages) | Same + published packages |
| Lead Ingestion | Webhooks + Polling backup ✅ | Event-driven architecture |
| Repositories | Concrete classes ✅ | Interface + Implementation |
| CRM Adapters | ShopMonkeyAdapter only ✅ | ICRMAdapter + Registry |
| Webhook Handlers | Direct Fastify handler ✅ | IWebhookHandler + Registry |
| **AI Chat** | **Multi-provider core ✅ (NEW)** | **REST API + Frontend** |
| Testing | Integration tests + TDD (10 tests) ✅ | Unit + Integration tests |
| Package Management | Workspace "*" dependencies ✅ | Versioned npm packages |
| Refactor Time | - | ~5.5 hours |
| Response Time | <1 second (webhooks) ✅ | <1 second (webhooks) |
| Deployment | Monorepo (same deploy) | Independent package deploys |

---

## Next Immediate Steps

**Current Status:** Chat core complete (AI providers working), ready for REST API

**Next Steps (Priority Order):**
1. **REST API endpoints** (2-3 hours) 🎯 NEXT
   - `POST /api/chat/:leadId`
   - Fastify server setup
   - Test with curl
2. **React Frontend** (1 day)
   - Chat UI components
   - Connect to API
3. **Integration** (1 day)
   - Email with chat link
   - End-to-end testing

**Timeline:** 1 week to working chat interface