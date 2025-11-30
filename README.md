# Lead Orchestrator Monorepo

AI-powered lead management system for automotive service franchises (Tint World first, multi-tenant everywhere).  
Handles lead ingestion, Shopmonkey synchronization, SMS/email automation, and intelligent AI chat.

**Status (Nov 29, 2025):**  
- ✅ Orchestrator fully operational (webhooks + polling + touchpoints)  
- ✅ Chat API fully operational (Claude + OpenAI, SSE streaming)  
- 🚧 Frontend integration in progress  
- 🛡️ Outbound whitelist safety enabled (no accidental customer contact)  

Monorepo consists of **4 packages:** orchestrator, chat, frontend, shared.

---

## 📘 Documentation

If you're new, read in this order:

1. **START HERE:** `docs/START_HERE.md`  
2. **Business Logic:** `docs/MVP_LOGIC.md`  
3. **Architecture Overview:** `docs/architecture/SYSTEM_OVERVIEW.md`  

Full directory tree (auto-generated):  
→ `PROJECT_STRUCTURE.md`

Old planning docs + phased implementation live in `docs/archive/`.

---

## 🚀 Quick Start (Local Development)

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

### 3. Environment variables

Each package uses its own `.env`.

Create them:

```bash
cp packages/orchestrator/.env.example packages/orchestrator/.env
cp packages/chat/.env.example packages/chat/.env
cp packages/frontend/.env.example packages/frontend/.env
```

Fill in real keys:

| Variable | Package | Notes |
|----------|---------|-------|
| `DATABASE_URL` | orchestrator, chat | Shared database |
| `SHOPMONKEY_API_KEY` | orchestrator | Required for CRM sync |
| `SENDGRID_*` | orchestrator | Email automation |
| `TWILIO_*` | orchestrator | SMS automation |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | chat | LLM providers |
| `AI_PROVIDER` | chat | "claude" or "openai" |
| `VITE_CHAT_API_URL` | frontend | Points to port 3001 |

**Safety:**  
Orchestrator uses `LEAD_EMAIL_WHITELIST` — only whitelisted emails can receive outbound messages.

### ▶️ Run All Services

#### Orchestrator (Port 3000)

```bash
cd packages/orchestrator
npm run dev
```

#### Chat API (Port 3001)

```bash
cd packages/chat
npm run dev
```

#### Frontend (Port 5173)

```bash
cd packages/frontend
npm run dev
```

#### Webhook Exposure (Shopmonkey)

```bash
ngrok http 3000
```

## 🛠️ Health Checks

```bash
curl http://localhost:3000/health    # Orchestrator
curl http://localhost:3001/health    # Chat API
```

Send a test chat message:

```bash
curl -X POST http://localhost:3001/api/chat/LEAD_ID/message \
  -H "Content-Type: application/json" \
  -d '{"message": "How much for ceramic tint?"}'
```

## 🧪 Testing

Run all tests:

```bash
npm test
```

Specific packages:

```bash
cd packages/orchestrator && npm test
cd packages/chat && npm test
cd packages/frontend && npm test
```

Coverage:

```bash
npm test -- --coverage
```

**Current test count:**

- **Orchestrator:** 47 tests
- **Chat API:** 33 tests
- **Total:** 80+ passing

## 🧱 Architecture Summary

High-level flow:

```
Customer → Frontend (5173) → Chat API (3001) → PostgreSQL
                                ↑
                       Orchestrator (3000)
                          ↑        ↓
                   Shopmonkey CRM  Touchpoints (SMS/Email)
```

More detail:  
→ `docs/architecture/SYSTEM_OVERVIEW.md`

## 📦 Monorepo Packages

| Package | Purpose | Port | Status |
|---------|---------|------|--------|
| `orchestrator/` | Lead ingestion, webhooks, polling, SMS, email, touchpoints | 3000 | ✅ Fully operational |
| `chat/` | AI chat API (Claude + OpenAI) with SSE | 3001 | ✅ Fully operational |
| `frontend/` | React chat UI | 5173 | 🚧 Integration in progress |
| `shared/` | Shared TS types + validation | - | ✅ Ready |

## 🔧 Common Issues

### Port conflicts

```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### DB not running

```bash
docker-compose up -d
```

### Webhook not firing

- Make sure ngrok URL is set in Shopmonkey.
- Check orchestrator logs for signature or payload issues.

### Chat API not responding

- Missing AI keys = most common cause.
- Ensure `DATABASE_URL` matches orchestrator.

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Run tests
4. Update docs
5. Submit PR

**Style:** TypeScript strict, ESLint, Prettier, tests required.

## 📄 License

[Your License Here]

---

**Built for Tint World franchises**  
**Last Updated:** November 29, 2025