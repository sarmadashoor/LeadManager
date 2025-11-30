# Lead Orchestrator — START HERE

**Last Updated:** November 29, 2025  
**Status:** Orchestrator + Chat API Complete  
**Next:** Frontend integration, authentication, catalog-driven prompt updates

This is the entry point for developers and LLMs.  
It explains *only* how to orient yourself and where the authoritative docs live.

---

## 🧭 What to Read (in Order)

1. **START_HERE.md** (you are here)  
2. **README.md** — How to run services, env setup, dev workflow  
3. **docs/MVP_LOGIC.md** — Business logic + lead criteria + touchpoints  
4. **docs/architecture/SYSTEM_OVERVIEW.md** — System flow + service interactions  
5. **PROJECT_STRUCTURE.md** — Auto-generated directory tree (for navigation)

All other documents have been archived to reduce duplication/noise.

---

## 📦 Monorepo Overview

```
LeadManager/
├── orchestrator/   → Lead ingestion, Shopmonkey, SMS/email, touchpoints
├── chat/           → AI chat API (Claude + GPT-4o, REST + SSE)
├── frontend/       → React/Vite customer chat UI
└── shared/         → Shared TypeScript types + validation
```

- **Orchestrator (3000):**  
  Webhooks → lead ingestion → multi-tenant DB → touchpoints (SendGrid/Twilio)  
  Includes **outbound safety whitelist (fail-closed)**.

- **Chat API (3001):**  
  SSE + REST, multi-provider LLM routing, session/history storage.

- **Frontend (5173):**  
  React chat UI (integration in progress).

---

## 🚀 Quick Development Commands

### Orchestrator (3000)

```bash
cd packages/orchestrator
npm run dev
```

### Chat API (3001)

```bash
cd packages/chat
npm run dev
```

### Frontend (5173)

```bash
cd packages/frontend
npm run dev
```

### Expose Webhooks (Shopmonkey)

```bash
ngrok http 3000
```

### Run All Tests

```bash
npm test
```

For complete dev instructions → see **README.md**.

---

## 🏁 Current Status Snapshot

### ✅ Orchestrator

- Real-time Shopmonkey webhooks
- Backup polling (30s)
- Touchpoint engine (13-touch sequence)
- Multi-tenant database
- SMS (Twilio) + Email (SendGrid)
- Whitelist safety gate (fail-closed)
- 47 passing tests

### ✅ Chat API

- REST endpoints
- SSE streaming
- Claude Sonnet 4.5 + GPT-4o routing
- Context loading via `LeadContextRepository`
- 33 passing tests

### 🚧 Frontend

- ChatWindow component ready
- API client (`streaming.ts`) in progress
- Needs end-to-end wiring to chat

---

## 🔐 Whitelist Safety (Fail-Closed)

Outbound messages (SMS/email) only send if:

```bash
LEAD_EMAIL_WHITELIST="email1@example.com,email2@example.com"
```

If empty → no outbound communication is permitted.

Protects real customers during development.

---

## 🔌 System Communication (High-Level)

### Customer → Chat

```
Browser (5173)
   → Chat API (3001)
       → PostgreSQL
```

### Shopmonkey → Lead Ingestion

```
Shopmonkey
   → Orchestrator (3000)
       → PostgreSQL
           → Touchpoint Processor (SendGrid/Twilio)
```

---

## 🗄 Database Notes

- Shared PostgreSQL instance
- 12 migrations completed
- Multi-tenant schema fully implemented

### Key tables:

- `tenants`
- `locations`
- `leads`
- `chat_sessions`
- `chat_messages`
- `location_hours`
- `service_catalog`
- `appointments`

### Chat API uses:

- `LeadContextRepository`
- `ChatMessageRepository`

---

## 📝 Development Notes

- Each package has its own `.env`, isolated by design.
- **Orchestrator** must include:  
  `LEAD_EMAIL_WHITELIST`, `SHOPMONKEY_API_KEY`, `SENDGRID_*`, `TWILIO_*`.
- **Chat API** must include at least one LLM key.
- **Frontend** requires no secrets in development.
- For canonical business logic → `docs/MVP_LOGIC.md`.

---

## 📁 Additional References

- **Full architecture:** `docs/architecture/SYSTEM_OVERVIEW.md`
- **Lead logic + timing rules:** `docs/MVP_LOGIC.md`
- **Directory tree:** `PROJECT_STRUCTURE.md`
- **Package-level docs:**
  - `packages/chat/README.md`, `API.md`
  - `packages/orchestrator/README.md`

---

This file is intentionally short, minimal, and non-duplicative.

For all operational details → see **README.md**.  
For business logic → see **docs/MVP_LOGIC.md**.