# Lead Orchestrator - Start Here

**Last Updated:** November 27, 2025  
**Status:** Chat Core Complete, Needs: Catalog Integration, Frontend, Auth

---

## 🎯 For LLMs Starting a New Conversation

Read these files **in this order** for complete context:

### Essential (Read First)
1. **This file** - Navigation guide
2. `PROJECT_STRUCTURE.txt` - See the codebase layout
3. `docs/HANDOFF.md` - Current system status, what's working, known issues
4. `docs/architecture/SYSTEM_OVERVIEW.md` - Architecture map

### By Task
- **Working on Chat API**: `packages/chat/README.md`, `packages/chat/API.md`
- **Working on Orchestrator**: `packages/orchestrator/README.md`
- **Understanding Business Logic**: `docs/MVP_LOGIC.md`
- **Planning Next Features**: `docs/next_steps.md`
- **Implementation History**: `docs/architecture/PHASED_IMPLEMENTATION.md`

---

## 🚀 Quick Start Commands

**Start Everything:**
```bash
# Terminal 1: Orchestrator (webhooks, SMS, lead management)
cd packages/orchestrator
npm run dev  # Port 3000

# Terminal 2: Chat API (AI chat backend)
cd packages/chat
npm run dev  # Port 3001

# Terminal 3: ngrok (expose orchestrator to internet)
ngrok http 3000
```

**Run Tests:**
```bash
# All tests
npm test

# Specific package
cd packages/chat && npm test
cd packages/orchestrator && npm test
```

---

## 📦 System Components

### Packages (Monorepo)
- **`packages/orchestrator/`** - Main lead management service (port 3000)
  - Shopmonkey webhooks & polling
  - SMS/Email via Twilio/SendGrid
  - Lead lifecycle management
  - Database owner

- **`packages/chat/`** - AI chat API service (port 3001) ✅ COMPLETE
  - Multi-provider AI (Claude + OpenAI)
  - REST + SSE streaming endpoints
  - Conversation history
  - Shares database with orchestrator

- **`packages/frontend/`** - React chat UI (port 5173) 🚧 NOT STARTED
  - Chat interface
  - Will call chat API

- **`packages/shared/`** - Shared types/validation 📦 READY TO USE

### Database
- Single PostgreSQL database (Docker)
- Shared by orchestrator and chat
- 12 migrations applied

---

## 🎯 Current Status (Nov 27, 2025)

### ✅ Complete
- Orchestrator running (webhooks + polling)
- Chat API with multi-provider AI (33 tests passing)
- Database schema (multi-tenant ready)
- All tests passing

### 🚧 In Progress
- Frontend (React chat UI) - NEXT

### 📋 Planned
- Email integration (add chat link)
- Production deployment
- Additional CRM integrations

---

## �� Common Issues & Solutions

**Port already in use:**
```bash
lsof -ti:3000 | xargs kill -9  # Orchestrator
lsof -ti:3001 | xargs kill -9  # Chat API
```

**Database connection issues:**
```bash
docker-compose up -d  # Start PostgreSQL
```

**Environment variables missing:**
- Check `.env` files in each package directory
- Required: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` for chat
- Required: `TWILIO_*` and `SENDGRID_*` for orchestrator

**Tests failing:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm test
```

---

## 📞 Support

- **Architecture Questions**: See `docs/architecture/SYSTEM_OVERVIEW.md`
- **Business Logic**: See `docs/MVP_LOGIC.md`
- **API Reference**: See `packages/chat/API.md`
- **Implementation History**: See `docs/architecture/PHASED_IMPLEMENTATION.md`

---

**Next: Read `PROJECT_STRUCTURE.txt` to see the codebase layout**
