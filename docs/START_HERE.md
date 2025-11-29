# 📘 Lead Orchestrator — START HERE

**Last Updated:** November 28, 2025  
**Status:** Orchestrator + Chat API + Service Catalog Complete  
**Next:** Frontend integration, Authentication, Prompt Update

---

## 🎯 Purpose

This is the entry point for LLMs and developers joining the project. It explains how the repo is organized, what's already built, and where to look next.

---

## 🧭 How To Navigate This Repo

### Read these docs in order:

1. **`START_HERE.md`** (this file)  
   Navigation + status + component overview

2. **`PROJECT_STRUCTURE.txt`**  
   Full directory tree (auto-generated)

3. **`docs/HANDOFF.md`**  
   Deep status report (feature-by-feature)

4. **`docs/architecture/SYSTEM_OVERVIEW.md`**  
   High-level architecture + request flows

### For Specific Tasks:

#### 🔹 Chat API
- `packages/chat/README.md`
- `packages/chat/API.md`
- `packages/chat/src/services/*`
- `packages/chat/src/api/controllers/*`

#### 🔹 Orchestrator
- `packages/orchestrator/README.md`
- `packages/orchestrator/src/infrastructure/*`

#### 🔹 Frontend (React)
- `packages/frontend/src/components/ChatWindow.tsx`
- `packages/frontend/src/setupTests.ts`
- `packages/frontend/src/api/*` (to be created)

#### 🔹 Business Logic
- `docs/MVP_LOGIC.md`

#### 🔹 Next Features
- `docs/next_steps.md`

---

## 🚀 Quick Start Commands

### Orchestrator (Port 3000)

```bash
cd packages/orchestrator
npm run dev
```

### Chat API (Port 3001)

```bash
cd packages/chat
npm run dev
```

### Frontend UI (Port 5173)

```bash
cd packages/frontend
npm run dev
```

### Expose Webhooks

```bash
ngrok http 3000
```

### Run All Tests

```bash
npm test
```

---

## 📦 Monorepo Overview

```
LeadManager/
├── orchestrator/   → Webhooks, SMS, lead lifecycle (COMPLETE)
├── chat/           → AI chat API (COMPLETE, 33 tests)
├── frontend/       → React chat UI (STARTED + TDD setup)
└── shared/         → Shared types + validation
```

---

## 🗄 Database (PostgreSQL)

- Single shared DB across services
- Hosted via `docker-compose.yml`
- 12 migrations
- Tables include:
  - `leads`
  - `chat_sessions`
  - `chat_messages`
  - `tenants`
  - `location_hours`
  - `service_catalog`
  - `appointments`

### Chat API uses:
- `LeadContextRepository`
- `ChatMessageRepository`
- Shared connection pool

---

## 🏁 Current Status Snapshot

### ✅ Completed

- Orchestrator: Webhooks, SMS, polling, lead lifecycle
- Chat API: Multi-provider AI (Claude + OpenAI)
- Chat endpoints: message, stream, history, context, health
- Service catalog integration (ShopMonkey canned services)
- Lead context building (vehicle, services, pricing)
- TDD foundation across packages (40+ tests passing)
- Frontend scaffolded, ChatWindow component tested

### 🚧 In Progress

- Frontend chat integration (SSE + REST)
- System prompt update (must include all services)
- Build frontend API client (`src/api/chat.ts`)
- Chat layout & UI polish

### 📌 Planned (Next 7 days)

- Authentication (JWT or magic-link per lead)
- Rate limiting
- Chat link in SMS/email templates
- Deployment strategy (chat, orchestrator, frontend)
- Cloudflare / Nginx domains

---

## 🔌 How Components Talk to Each Other

```
[Customer Browser]  →  Frontend (5173)
      ↓                     ↓
 SSE / REST         →   Chat API (3001)
      ↓                     ↓
   PostgreSQL   ←  ChatMessageRepository
                    LeadContextRepository
```

```
[ShopMonkey]  →  Orchestrator (3000)
      ↓
   PostgreSQL  ← Orchestrator Repositories
```

### Frontend calls Chat API:
- `POST /api/chat/:leadId`
- `GET /api/chat/:leadId/history`
- `GET /api/chat/:leadId/context`
- `GET /api/chat/stream/:leadId` (SSE)

---

## ⚙️ Troubleshooting

### Port already in use

```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Start DB

```bash
docker-compose up -d
```

### Missing variables

- Each package has its own `.env`
- Chat needs: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`

---

## 📞 Additional References

| Purpose | File | Status |
|---------|------|--------|
| Summary | `docs/HANDOFF.md` | ✅ |
| Architecture flow | `docs/architecture/SYSTEM_OVERVIEW.md` | ✅ |
| Business logic | `docs/MVP_LOGIC.md` | ✅ |
| Next steps | `docs/next_steps.md` | ✅ |
| API contracts | `packages/chat/API.md` | ✅ |