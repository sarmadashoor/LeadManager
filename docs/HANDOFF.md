# Lead Orchestrator - Conversation Handoff Document

**Last Updated:** November 26, 2025  
**Purpose:** Enable seamless continuation in a new conversation

---

## Recent Progress (Nov 26, 2025)

### ✅ Chat Package - Multi-Provider AI Complete

**What was built:**
- Multi-provider AI system (Claude Sonnet 4.5 + OpenAI GPT-4o)
- Provider abstraction layer with clean interface
- Toggle between providers via environment variable
- Cost tracking and health monitoring
- Database integration (shares PostgreSQL with orchestrator)
- LeadContextRepository for fetching lead data
- 10 tests passing (TDD approach)
- Tested with REAL API calls - both providers working

**Files created:**
- `packages/chat/src/ai/providers/` - AIProvider interface, ClaudeProvider, OpenAIProvider
- `packages/chat/src/ai/AIService.ts` - Main orchestrator
- `packages/chat/src/config/ai-config.ts` - Configuration
- `packages/chat/src/infrastructure/db.ts` - Database connection
- `packages/chat/src/repositories/LeadContextRepository.ts` - Fetch lead context
- `packages/chat/.env` - Environment configuration
- Tests for all providers

**Performance from real tests:**
- Claude: 3.4s latency, 254 tokens, $0.005/msg, conversational style
- OpenAI: 1.5s latency, 174 tokens, $0.002/msg, concise style

---

## Project Summary

**Lead Orchestrator** is a multi-tenant SaaS platform that automates lead-to-appointment conversion for automotive service businesses. MVP focuses on Tint World window tinting.

**Core Flow:** ShopMonkey webhook → Fetch customer data → Schedule touch point → AI chat engagement → Book appointment

---

## Architecture

**Monorepo Structure:** npm workspaces with 4 packages
```
LeadManager/
├── packages/
│   ├── orchestrator/     # Lead management & webhooks (✅ WORKING)
│   ├── chat/            # AI chat service (✅ CORE COMPLETE - Nov 26)
│   ├── frontend/        # React chat UI (ready to build)
│   └── shared/          # Shared types (ready to populate)
```

---

## What's Been Built

### ✅ Orchestrator Package (Complete)
- Database schema (12 migrations)
- Multi-tenant schema (ready for 200+ locations)
- ShopMonkey integration (webhooks + polling)
- Touch point system (13-touch schedule)
- Email/SMS integration (SendGrid, Twilio)
- Lead repository with tests
- Polling and webhook handlers

### ✅ Chat Package (Core Complete - Nov 26, 2025)
- **Multi-Provider AI System**
  - Claude Sonnet 4.5 integration
  - OpenAI GPT-4o integration
  - Provider abstraction layer
  - Easy toggle via env var
  
- **Infrastructure**
  - Database connection (shared with orchestrator)
  - Configuration system
  - LeadContextRepository
  - Test utilities and mocks
  
- **Testing**
  - 10 tests passing
  - TDD approach established
  - Real API integration tested
  
- **Documentation**
  - README with usage examples
  - Provider comparison data
  - Troubleshooting guide

### 🔜 Chat Package - Next Steps
- REST API endpoints (Fastify routes)
- Endpoint: `POST /api/chat/:leadId`
- Health check endpoint
- Integration with frontend

### 📦 Frontend Package (Ready to Build)
- React chat UI
- Connect to chat API
- Message display and input
- Conversation history

---

## Database Tables

**Orchestrator tables (Working):**
- `tenants`, `tenant_crm_configs`, `locations`
- `leads`, `chat_sessions`, `chat_messages`
- `location_hours`, `service_catalog`, `appointments`
- `job_executions`

**Chat access:**
- Reads from same database
- Uses `leads` table for context
- Ready to use `chat_messages` for history

---

## ShopMonkey Integration

**Working:**
- Webhooks (<1 second response time)
- Polling backup (30 seconds)
- Service catalog (23 services discovered via API)
- Customer/vehicle data fetching

**Configuration:**
- Webhook URL: Production needs static domain (not ngrok)
- Events: Order events
- Validation: Location must exist in DB

---

## Environment Configuration

### Orchestrator (`packages/orchestrator/.env`)
```env
DATABASE_URL=postgresql://...
SHOPMONKEY_API_KEY=xxx
SENDGRID_API_KEY=xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
TENANT_ID=xxx
DEMO_MODE=true
```

### Chat (`packages/chat/.env`)
```env
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
AI_FALLBACK_PROVIDER=openai
DATABASE_URL=postgresql://...
```

---

## Commands Reference
```bash
# Start orchestrator
cd packages/orchestrator
npm run dev

# Test chat with Claude
cd packages/chat
npm run demo

# Test chat with OpenAI
AI_PROVIDER=openai npm run demo

# Run tests
npm test

# Run database
docker compose up -d
```

---

## Next Development Priorities

### 1. Chat REST API (2-3 hours) 🎯 NEXT
**Goal:** HTTP endpoints for frontend to call

**Tasks:**
- Create `packages/chat/src/api/routes.ts`
- Endpoint: `POST /api/chat/:leadId` - send message, get AI response
- Endpoint: `GET /api/health` - check provider health
- Start server: `packages/chat/src/server.ts`

**Implementation:**
```typescript
// POST /api/chat/:leadId
{
  message: "How much for tint?",
  conversationHistory: []
}
// Returns: { response: "...", provider: "claude", ... }
```

### 2. React Chat UI (1 day)
**Goal:** Customer-facing chat interface

**Location:** `packages/frontend/`

**Tasks:**
- Chat window component
- Message display
- Input field with send button
- Load conversation history
- Connect to chat API

### 3. Integration (1 day)
**Goal:** End-to-end flow working

**Tasks:**
- Orchestrator generates chat link with lead ID
- Email includes link: `https://chat.tintworld.com/:leadId`
- Frontend loads, fetches lead context
- Customer chats with AI
- Eventually: booking flow

---

## Testing Strategy

**Orchestrator:** Some tests exist, need expansion
**Chat:** 10 tests passing, TDD established
**Frontend:** Will need component tests
**Integration:** Manual testing initially, then automated

---

## Known Issues & Considerations

### Working Well ✅
- Webhooks (instant lead capture)
- Multi-provider AI (both tested)
- Database schema (multi-tenant ready)
- Touch point system

### Needs Attention ⚠️
- Demo mode still ON (only processes test email)
- Twilio in sandbox mode
- Need static domain for webhooks (using ngrok currently)
- Chat API endpoints not built yet
- Frontend not started

### Future Enhancements
- A/B testing between AI providers
- Conversation caching
- Advanced analytics
- Additional providers (Gemini, etc.)

---

## Key Files & Locations
```
LeadManager/
├── packages/
│   ├── orchestrator/
│   │   ├── src/
│   │   │   ├── infrastructure/
│   │   │   │   ├── webhooks/ShopMonkeyWebhookHandler.ts
│   │   │   │   ├── crm/ShopMonkeyAdapter.ts
│   │   │   │   ├── persistence/repositories/
│   │   │   │   └── messaging/
│   │   │   └── domain/TouchPointSchedule.ts
│   │   └── .env
│   │
│   ├── chat/
│   │   ├── src/
│   │   │   ├── ai/
│   │   │   │   ├── providers/ (AIProvider, Claude, OpenAI)
│   │   │   │   └── AIService.ts
│   │   │   ├── repositories/LeadContextRepository.ts
│   │   │   ├── infrastructure/db.ts
│   │   │   └── demo.ts
│   │   ├── .env
│   │   └── README.md (comprehensive guide)
│   │
│   └── docs/
│       ├── HANDOFF.md (this file)
│       ├── MVP_LOGIC.md
│       └── next_steps.md
```

---

## Success Metrics

**Current Status:**
- ✅ <1 second lead response time (webhooks)
- ✅ 100% webhook success rate (with polling backup)
- ✅ Multi-provider AI working (tested)
- ✅ Database multi-tenant ready
- 🔜 Chat API endpoints (next)
- 🔜 Customer engagement via chat
- 🔜 Appointment booking

---

## For Next Conversation

**Start here:**
1. Review `packages/chat/README.md` for what's built
2. Review `next_steps.md` for priorities
3. Decide: Build chat API or frontend first?

**Quick verification:**
```bash
cd packages/chat
npm test          # Should see 10 tests passing
npm run demo      # Should get AI response
```

**Questions to ask:**
- "What's the current status of the chat package?"
- "Show me how to test provider switching"
- "Let's build the REST API endpoints"
- "How do we integrate chat with orchestrator?"

---

## Detailed Feature Status

### Orchestrator - What Works
✅ **Webhook Handler**
- Receives ShopMonkey order events
- <1 second response time
- Validates location exists
- Creates lead in database

✅ **Polling System**
- Backup for missed webhooks
- Runs every 30 seconds
- Fetches new orders since last poll
- Prevents duplicates

✅ **Touch Point System**
- 13-touch schedule over 30 days
- Email + SMS cadence
- Configurable timing
- Status tracking

✅ **Database Schema**
- Multi-tenant architecture
- 12 migrations complete
- Ready for 200+ locations
- Optimistic locking
- Job execution tracking

✅ **ShopMonkey Integration**
- API adapter complete
- Service catalog (23 services)
- Customer data fetching
- Vehicle info retrieval

✅ **Messaging**
- SendGrid email integration
- Twilio SMS integration
- Template system
- Delivery tracking

### Chat - What Works
✅ **AI Providers**
- Claude Sonnet 4.5 (tested, working)
- OpenAI GPT-4o (tested, working)
- Clean abstraction layer
- Easy to add more providers

✅ **Configuration**
- Environment-based
- Toggle providers instantly
- Fallback support
- Model overrides

✅ **Database Access**
- Shared PostgreSQL
- Lead context fetching
- Repository pattern

✅ **Testing**
- 10 tests passing
- TDD approach
- Mock utilities
- Integration tested

### Chat - What's Missing
❌ REST API endpoints
❌ Server setup
❌ Frontend integration
❌ Conversation history storage
❌ Appointment booking logic

### Frontend - Not Started
❌ React components
❌ Chat UI
❌ API integration
❌ Routing
❌ Styling

---

## Technical Debt / Improvements

### Testing
- [ ] Add integration tests for chat API
- [ ] Add tests for LeadContextRepository with real DB
- [ ] Add frontend component tests
- [ ] End-to-end test: webhook → email → chat → booking

### Configuration
- [ ] Add TypeScript path aliases (`@/` imports)
- [ ] Set up ESLint + Prettier
- [ ] Add pre-commit hooks (husky)

### Performance
- [ ] Add Redis caching for ShopMonkey service catalog
- [ ] Implement conversation caching
- [ ] Add rate limiting to chat API

### Monitoring
- [ ] Add logging (winston or pino)
- [ ] Track AI provider usage/costs
- [ ] Set up error tracking (Sentry?)
- [ ] Add health check endpoints

---

## Deployment Preparation

### Infrastructure
- [ ] Static domain for webhooks (replace ngrok)
- [ ] Deploy orchestrator (VPS or container)
- [ ] Deploy chat service (separate container)
- [ ] Deploy frontend (Vercel/Cloudflare Pages)
- [ ] Configure CDN for frontend assets

### Security
- [ ] API authentication (JWT tokens?)
- [ ] Rate limiting on endpoints
- [ ] CORS configuration
- [ ] Environment variable management (Vault?)

### Monitoring
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Error tracking (Sentry)
- [ ] Log aggregation (CloudWatch, Datadog)
- [ ] Cost tracking dashboard

---

## Questions to Answer

### Technical Decisions
1. **Chat communication:** REST polling (current plan) or WebSockets?
2. **Authentication:** How to secure chat endpoints? JWT? Magic links?
3. **ShopMonkey appointment API:** Does it exist? Need to research.
4. **A/B testing:** When to enable automated provider testing?

### Business Decisions
5. **Demo mode:** When to turn off and go live?
6. **Twilio production:** Get A2P approval for SMS?
7. **Domain setup:** What domain for chat? `chat.tintworld.com`?
8. **Pricing model:** How to bill customers? Per lead? Per location?

---

**All systems operational. Ready for next phase of development.** 🚀