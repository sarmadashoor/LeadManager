# Lead Orchestrator

AI-powered lead management system for automotive service franchises.  
Integrates with Shopmonkey CRM, automates customer communications, and provides intelligent AI chat support.

**Status:**

- **Orchestrator:** Production-ready
- **Chat API:** Core Complete (needs catalog integration, frontend, auth)
- **Frontend:** Not started
- **Tests:** 80+ passing across all packages
- **Architecture:** Monorepo with 4 packages

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker (PostgreSQL)
- ngrok (for webhook testing)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd LeadManager

# Install dependencies (all packages)
npm install

# Start PostgreSQL
docker-compose up -d
```

Run database migrations:

```bash
cd packages/orchestrator
npm run migrate
cd ../..
```

Set up environment variables:

```bash
cp packages/orchestrator/.env.example packages/orchestrator/.env
cp packages/chat/.env.example packages/chat/.env
# Edit both .env files with real credentials
```

---

## ▶️ Run Everything

### Terminal 1 — Orchestrator (Lead engine)

```bash
cd packages/orchestrator
npm run dev
# http://localhost:3000
```

### Terminal 2 — Chat API (AI engine)

```bash
cd packages/chat
npm run dev
# http://localhost:3001
```

### Terminal 3 — ngrok (Webhook exposure)

```bash
ngrok http 3000
# Copy HTTPS URL for Shopmonkey webhook settings
```

---

## Verify Installation

```bash
# Orchestrator health
curl http://localhost:3000/health

# Chat API health
curl http://localhost:3001/health

# Test chat
curl -X POST http://localhost:3001/api/chat/LEAD_ID/message \
  -H "Content-Type: application/json" \
  -d '{"message": "How much for ceramic tint?"}'
```

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Shopmonkey CRM → ngrok → Orchestrator (3000)              │
│                                ↓                            │
│                     PostgreSQL (shared) ← Chat API (3001)  │
│                                ↓                            │
│                        Outbound SMS / Email                 │
└────────────────────────────────────────────────────────────┘
```

### Packages

| Package | Purpose | Port | Status |
|---------|---------|------|--------|
| `orchestrator` | Lead engine, Shopmonkey integration, SMS/email | 3000 | ✅ Production-Ready |
| `chat` | AI chat engine (Claude + OpenAI) | 3001 | ✅ Core OK, 🚧 Needs service catalog, auth, frontend |
| `frontend` | React chat interface | 5173 | 🚧 Not Started |
| `shared` | Centralized TypeScript types | — | 📦 Ready |

---

## 🎯 Features

### ✅ Completed

#### Lead Management (Orchestrator)

- Real-time Shopmonkey webhook processing (<100ms)
- 30s backup polling (fail-safe)
- Multi-tenant DB: supports 200+ franchise locations
- Twilio SMS automation (touch points, follow-ups)
- SendGrid email automation
- Lead lifecycle + status tracking
- Touch point cadence engine (every 10s check)

#### AI Chat (Chat API)

**Note:** Core API is complete. Catalog integration (real services), auth, and frontend UI are still pending.

- Multi-provider AI routing
  - Claude Sonnet 4.5
  - OpenAI GPT-4o
- 4 REST endpoints
- SSE streaming
- Conversation history + sessions
- Provider-level metadata: latency, tokens, model
- 33 tests (API, services, repos, providers)

### 🚧 In Progress

- React chat UI (`packages/frontend`)
- Real catalog integration in Chat API
- Omnichannel chat link (email → web chat)
- Booking pipeline

### 📋 Planned

- Production deployment playbooks
- Additional CRM integrations (Shopmonkey alternatives)
- Analytics dashboard for franchises
- Rate limiting per lead/tenant

---

## 📚 Documentation

### Start Here (for LLMs + Devs)

- **Navigation Guide:** `docs/START_HERE.md`
- **Project Structure:** `PROJECT_STRUCTURE.txt`
- **Architecture Overview:** `docs/architecture/SYSTEM_OVERVIEW.md`
- **Current System State:** `docs/HANDOFF.md`

### Package READMEs

- **Orchestrator** — `packages/orchestrator/README.md`
- **Chat API** — `packages/chat/README.md`
- **Chat API Reference** — `packages/chat/API.md`

### Additional Docs

- **MVP Logic** — `docs/MVP_LOGIC.md`
- **Implementation History** — `docs/architecture/PHASED_IMPLEMENTATION.md`
- **Roadmap / Next Steps** — `docs/next_steps.md`

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Per package
cd packages/chat && npm test
cd packages/orchestrator && npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### 📊 Test Summary

- **Orchestrator:** 47 tests
- **Chat API:** 33 tests
- **Total:** 80+ passing

---

## 🛠️ Technology Stack

### Backend

- Node.js 18+
- TypeScript
- Fastify
- PostgreSQL (Docker)
- Knex.js (migrations & queries)
- Jest (tests)

### AI

- Claude Sonnet 4.5
- GPT-4o
- Complete provider abstraction layer
- ~$0.002–$0.005 per message

### External Systems

- Shopmonkey API v3
- Twilio
- SendGrid
- ngrok

### Frontend (planned)

- React + Vite
- Tailwind or ShadCN (TBD)

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Webhook response | <100ms |
| Chat response (Claude) | 3–7s |
| Chat response (OpenAI) | 1–2s |
| SMS Delivery | 1–2s |
| Email Delivery | 1–3s |
| Lead Polling | 30s |
| Touch point engine | 10s |

---

## 🚢 Deployment

### Development

```bash
npm run dev:orchestrator   # Terminal 1
npm run dev:chat           # Terminal 2
ngrok http 3000            # Terminal 3
```

### Production (future)

- Cloud VM or Kubernetes
- NGINX/Caddy reverse proxy
- SSL termination
- Managed PostgreSQL
- Webhook URL configured in Shopmonkey
- Centralized logging + monitoring

---

## 🔧 Common Issues

### Port already in use

```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Database not running

```bash
docker-compose up -d
npm run migrate
```

### Webhooks not triggering

- Ensure ngrok tunnel is active
- Verify Shopmonkey webhook URL
- Check orchestrator logs

### Chat API errors

- Missing API keys in `packages/chat/.env`
- Database URL incorrect

---

## 🤝 Contributing

### Workflow

1. Create branch
2. Implement feature
3. Run tests
4. Update docs
5. PR

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Unit tests required
- Document all public APIs

---

## 📝 Environment Variables

### Orchestrator (`packages/orchestrator/.env`)

- `DATABASE_URL`
- `SHOPMONKEY_API_KEY`
- `TWILIO_*`
- `SENDGRID_*`
- `TENANT_ID`

### Chat (`packages/chat/.env`)

- `DATABASE_URL`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `AI_PROVIDER`

---

## 📞 Support

- **Documentation:** `docs/`
- **Architecture:** `docs/architecture/`
- **Issues:** GitHub Issues

---

## 📄 License

[Your License Here]

---

**Built with ❤️ for Tint World® and automotive service franchises**

**Last Updated:** November 27, 2025