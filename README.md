# Lead Orchestrator

AI-powered lead management system for automotive service franchises. Integrates with Shopmonkey CRM, automates customer communications, and provides intelligent chat support.

**Status:** Chat Core Complete, Needs: Catalog Integration, Frontend, Auth  
**Architecture:** Monorepo with 4 packages  
**Tests:** 80+ passing across all packages

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)
- ngrok (for webhook testing)

### Installation
```bash
# Clone repository
git clone <repo-url>
cd LeadManager

# Install dependencies (all packages)
npm install

# Start database
docker-compose up -d

# Run migrations
cd packages/orchestrator
npm run migrate
cd ../..

# Set up environment variables
cp packages/orchestrator/.env.example packages/orchestrator/.env
cp packages/chat/.env.example packages/chat/.env
# Edit .env files with your credentials
```

### Run Everything

**Terminal 1: Orchestrator**
```bash
cd packages/orchestrator
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2: Chat API**
```bash
cd packages/chat
npm run dev
# Runs on http://localhost:3001
```

**Terminal 3: ngrok (for webhooks)**
```bash
ngrok http 3000
# Copy HTTPS URL for Shopmonkey webhook configuration
```

### Verify It Works
```bash
# Health check - Orchestrator
curl http://localhost:3000/health

# Health check - Chat API
curl http://localhost:3001/health

# Send test chat message
curl -X POST http://localhost:3001/api/chat/LEAD_ID/message \
  -H "Content-Type: application/json" \
  -d '{"message": "How much for ceramic tint?"}'
```

---

## �� Architecture
```
┌─────────────────────────────────────────────────────────┐
│  Shopmonkey CRM → ngrok → Orchestrator (3000)          │
│                              ↓                          │
│                        PostgreSQL ← Chat API (3001)     │
│                              ↓                          │
│                        Customer SMS/Email               │
└─────────────────────────────────────────────────────────┘
```

### Packages

| Package | Purpose | Port | Status |
|---------|---------|------|--------|
| **orchestrator** | Lead management, webhooks, SMS/email | 3000 | ✅ Production Ready |
| **chat** | AI chat API (Claude + OpenAI) | 3001 | ✅ Core Complete, 🚧 Needs Integration |
| **frontend** | React chat UI | 5173 | 🚧 Not Started |
| **shared** | Shared TypeScript types | - | 📦 Ready to Use |

---

## 🎯 Features

### ✅ Completed

**Lead Management (Orchestrator)**
- Real-time webhook processing from Shopmonkey (<1s response)
- Backup polling every 30s (fail-safe)
- Multi-tenant architecture (200+ locations ready)
- SMS automation via Twilio
- Email automation via SendGrid
- Touch point scheduling and follow-ups

**AI Chat (Chat API)**
- **Note:** Core API works, still needs: real service catalog, frontend, auth
- Multi-provider AI (Claude Sonnet 4.5 + OpenAI GPT-4o)
- REST API with 4 endpoints
- SSE streaming support
- Conversation history
- Cost tracking per provider
- 33 tests passing

### 🚧 In Progress

**Frontend**
- React chat UI
- Real-time message display
- Integration with chat API

### 📋 Planned

- Email chat link integration
- Appointment booking
- Additional CRM integrations
- Analytics dashboard

---

## 📚 Documentation

### For LLMs / New Developers
1. **Start here:** [`docs/START_HERE.md`](docs/START_HERE.md) - Navigation guide
2. **Project structure:** [`PROJECT_STRUCTURE.txt`](PROJECT_STRUCTURE.txt) - File tree
3. **Architecture:** [`docs/architecture/SYSTEM_OVERVIEW.md`](docs/architecture/SYSTEM_OVERVIEW.md)
4. **Current status:** [`docs/HANDOFF.md`](docs/HANDOFF.md)

### Package Documentation
- **Orchestrator:** [`packages/orchestrator/README.md`](packages/orchestrator/README.md)
- **Chat API:** [`packages/chat/README.md`](packages/chat/README.md)
- **Chat API Reference:** [`packages/chat/API.md`](packages/chat/API.md)

### Additional Resources
- **Business Logic:** [`docs/MVP_LOGIC.md`](docs/MVP_LOGIC.md)
- **Implementation History:** [`docs/architecture/PHASED_IMPLEMENTATION.md`](docs/architecture/PHASED_IMPLEMENTATION.md)
- **Next Steps:** [`docs/next_steps.md`](docs/next_steps.md)

---

## 🧪 Testing
```bash
# Run all tests (all packages)
npm test

# Test specific package
cd packages/chat && npm test
cd packages/orchestrator && npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

**Test Summary:**
- Orchestrator: 47 tests
- Chat API: 33 tests
- Total: 80+ tests passing

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **HTTP:** Fastify
- **Database:** PostgreSQL (Docker)
- **ORM:** Knex.js
- **Testing:** Jest

### AI
- **Primary:** Claude Sonnet 4.5 (Anthropic)
- **Secondary:** OpenAI GPT-4o
- **Cost:** ~$0.002-0.005 per message

### External Services
- **CRM:** Shopmonkey API v3
- **SMS:** Twilio
- **Email:** SendGrid
- **Tunneling:** ngrok (dev)

### Frontend (Planned)
- **Framework:** React
- **Build:** Vite
- **Styling:** TBD

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Webhook response | <100ms |
| Chat response (Claude) | 3-7s |
| Chat response (OpenAI) | 1-2s |
| SMS delivery | 1-2s |
| Email delivery | 1-3s |
| Polling cycle | 30s |
| Touch point check | 10s |

---

## �� Deployment

### Development (Current)
```bash
# Local development with ngrok
npm run dev:orchestrator  # Terminal 1
npm run dev:chat          # Terminal 2
ngrok http 3000          # Terminal 3
```

### Production (Future)
- Deploy to cloud server (AWS, GCP, etc.)
- Set up proper DNS and SSL
- Configure production webhook URL in Shopmonkey
- Use managed PostgreSQL
- Set up monitoring and logging

---

## 🔧 Common Issues

**Port already in use:**
```bash
lsof -ti:3000 | xargs kill -9  # Orchestrator
lsof -ti:3001 | xargs kill -9  # Chat
```

**Database not running:**
```bash
docker-compose up -d
npm run migrate
```

**Webhooks not working:**
- Check ngrok is running
- Verify Shopmonkey webhook URL is correct
- Check webhook signature in logs

**Chat not responding:**
- Verify API keys in `packages/chat/.env`
- Check database connection
- Test with `/health` endpoint

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch
2. Make changes
3. Run tests: `npm test`
4. Update documentation
5. Commit with descriptive message
6. Create pull request

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Test coverage required
- Document all public APIs

---

## 📝 Environment Variables

### Orchestrator (packages/orchestrator/.env)
- `DATABASE_URL` - PostgreSQL connection
- `SHOPMONKEY_API_KEY` - CRM integration
- `TWILIO_*` - SMS configuration
- `SENDGRID_*` - Email configuration
- `TENANT_ID` - Your franchise ID

### Chat (packages/chat/.env)
- `DATABASE_URL` - Same as orchestrator
- `ANTHROPIC_API_KEY` - Claude API
- `OPENAI_API_KEY` - OpenAI API
- `AI_PROVIDER` - 'claude' or 'openai'

See package READMEs for complete lists.

---

## 📞 Support

- **Documentation:** [`docs/`](docs/)
- **Issues:** GitHub Issues
- **Architecture Questions:** See [`docs/architecture/`](docs/architecture/)

---

## 📄 License

[Your License Here]

---

**Built with ❤️ for Tint World franchises**  
**Last Updated:** November 27, 2025
