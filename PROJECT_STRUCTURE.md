# Lead Orchestrator - Project Structure

**Generated:** 2025-11-29T08:34:08.249Z
**Status:** Chat API Complete, Frontend Next

This file is auto-generated. Run `node generate-structure.js` to update.

---

## Package Overview

- **orchestrator/** - Main lead management service (Shopmonkey, SMS, webhooks)
- **chat/** - AI chat API with Claude + OpenAI (REST + SSE streaming)
- **frontend/** - React chat UI - customer interface (port 5173)
- **shared/** - Shared TypeScript types

---

## Directory Tree

```
LeadManager/

├── .env
├── .gitignore
├── PROJECT_STRUCTURE.md
├── README.md
├── docker-compose.yml
├── docs # Documentation and guides
│   ├── HANDOFF.md
│   ├── MVP_LOGIC.md
│   ├── START_HERE.md
│   ├── architecture # System architecture documentation
│   │   ├── PHASED_IMPLEMENTATION.md
│   │   └── SYSTEM_OVERVIEW.md
│   ├── archive # Historical documentation snapshots
│   │   └── current-11-25.md
│   ├── next_steps.md
│   └── reference
├── generate-structure.js
├── knexfile.js
├── package.json
├── packages
│   ├── chat # AI chat API - Claude/OpenAI integration (port 3001)
│   │   ├── .env
│   │   ├── API.md
│   │   ├── README.md
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── __tests__
│   │   │   │   ├── contracts
│   │   │   │   │   └── LeadContextContract.test.ts
│   │   │   │   ├── setup.ts
│   │   │   │   └── test-utils.ts
│   │   │   ├── ai
│   │   │   │   ├── AIService.ts
│   │   │   │   └── providers
│   │   │   ├── api
│   │   │   │   ├── controllers
│   │   │   │   └── routes.ts
│   │   │   ├── config
│   │   │   │   └── ai-config.ts
│   │   │   ├── demo.ts
│   │   │   ├── index.ts
│   │   │   ├── infrastructure
│   │   │   │   └── db.ts
│   │   │   ├── repositories
│   │   │   │   ├── ChatMessageRepository.ts
│   │   │   │   ├── LeadContextRepository.ts
│   │   │   │   └── __tests__
│   │   │   │       ├── ChatMessageRepository.test.ts
│   │   │   │       └── LeadContextRepository.test.ts
│   │   │   ├── server.ts
│   │   │   └── services
│   │   │       ├── ChatService.ts
│   │   │       └── __tests__
│   │   │           └── ChatService.test.ts
│   │   └── tsconfig.json
│   ├── frontend # React chat UI - customer interface (port 5173)
│   │   ├── index.html
│   │   ├── jest.config.cjs
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── App.tsx
│   │   │   ├── components
│   │   │   │   ├── ChatWindow.test.tsx
│   │   │   │   └── ChatWindow.tsx
│   │   │   ├── jest-dom.d.ts
│   │   │   ├── main.tsx
│   │   │   └── setupTests.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   └── vite.config.ts
│   ├── orchestrator # Lead management service - webhooks, SMS, polling (port 3000)
│   │   ├── .env
│   │   ├── README.md
│   │   ├── get-lead.ts
│   │   ├── jest.config.cjs
│   │   ├── knexfile.js
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── __tests__
│   │   │   │   ├── database.test.ts
│   │   │   │   ├── domain
│   │   │   │   │   └── TouchPointSchedule.test.ts
│   │   │   │   └── repositories
│   │   │   │       ├── LeadRepository.test.ts
│   │   │   │       └── TenantRepository.test.ts
│   │   │   ├── analyze-services.ts
│   │   │   ├── debug-service-sync.ts
│   │   │   ├── domain
│   │   │   │   └── TouchPointSchedule.ts
│   │   │   ├── force-sync.ts
│   │   │   ├── index.ts
│   │   │   ├── infrastructure
│   │   │   │   ├── crm
│   │   │   │   ├── jobs
│   │   │   │   ├── messaging
│   │   │   │   ├── persistence
│   │   │   │   ├── services
│   │   │   │   └── webhooks
│   │   │   ├── recategorize-services.ts
│   │   │   ├── show-other-services.ts
│   │   │   ├── test-service-sync.ts
│   │   │   ├── test-shopmonkey-services.ts
│   │   │   └── test-shopmonkey.ts
│   │   └── tsconfig.json
│   └── shared # Shared TypeScript types and validation
│       ├── package.json
│       ├── src
│       │   ├── index.ts
│       │   ├── types
│       │   │   └── index.ts
│       │   └── validation
│       │       └── index.ts
│       └── tsconfig.json
├── shopmonkey-response.json
├── tsconfig.json
├── vitest.config.ts
└── workspace-migration.sh
```


---

## Key Files

### Configuration
- `package.json` - Workspace root configuration
- `docker-compose.yml` - PostgreSQL database
- `knexfile.js` - Database migrations config (orchestrator)
- `.env` files - Environment variables (per package)

### Documentation
- `docs/START_HERE.md` - Navigation guide for LLMs
- `docs/HANDOFF.md` - Current status and known issues
- `docs/architecture/SYSTEM_OVERVIEW.md` - Architecture map
- `docs/architecture/PHASED_IMPLEMENTATION.md` - Implementation history

### Package Entry Points
- `packages/orchestrator/src/index.ts` - Orchestrator main
- `packages/chat/src/server.ts` - Chat API server
- `packages/chat/src/api/routes.ts` - Chat API routes
- `packages/frontend/src/App.tsx` - Frontend main

### Tests
- `packages/orchestrator/src/__tests__/` - Orchestrator tests
- `packages/chat/src/__tests__/` - Chat API tests

---

## Important Subdirectories

### packages/orchestrator/src/
- `infrastructure/` - Database, CRM, webhooks, messaging, jobs
  - `persistence/` - Database and repositories
  - `crm/` - Shopmonkey adapter
  - `webhooks/` - Webhook handlers
  - `messaging/` - Twilio/SendGrid services
  - `jobs/` - Polling and touch point processors
- `services/` - Business logic (LeadOrchestrationService)
- `domain/` - Domain models (if any)

### packages/chat/src/
- `ai/` - AI provider abstraction
  - `providers/` - Claude, OpenAI implementations
- `api/` - HTTP controllers and routes
  - `controllers/` - ChatController
- `repositories/` - Database access (ChatMessageRepository)
- `services/` - Business logic (ChatService)
- `infrastructure/` - Database connection

### packages/frontend/src/
- `components/` - React components
- `hooks/` - Custom React hooks
- `api/` - API client for chat

---

**Last Updated:** 11/29/2025
