# Lead Orchestrator - Next Steps

**Last Updated:** November 26, 2025  
**Status:** Chat core complete, ready for API & frontend

---

## What Was Just Completed ✅ (Nov 26, 2025)

### Multi-Provider AI Chat System
- ✅ AIProvider interface (clean abstraction)
- ✅ ClaudeProvider implementation (Anthropic Claude Sonnet 4.5)
- ✅ OpenAIProvider implementation (OpenAI GPT-4o)
- ✅ AIService orchestrator (provider selection, fallback)
- ✅ Configuration system (environment-based)
- ✅ Database integration (shared PostgreSQL)
- ✅ LeadContextRepository (fetch lead data from DB)
- ✅ 10 tests passing (TDD approach established)
- ✅ Real API testing (both providers confirmed working)
- ✅ Cost tracking (built-in per provider)
- ✅ Health monitoring (check provider availability)

**Performance verified:**
- Claude: 3.4s, 254 tokens, $0.005/msg, conversational
- OpenAI: 1.5s, 174 tokens, $0.002/msg, concise

**Result:** Can toggle between AI providers with single env var. System ready for REST API layer.

---

## Immediate Next Steps (Priority Order)

### 1. Chat REST API (2-3 hours) 🎯 NEXT
**Goal:** HTTP endpoints for frontend to call

**What to build:**
```
POST /api/chat/:leadId
- Fetches lead context from DB
- Sends message to AI
- Returns AI response
- Saves to chat_messages table

GET /api/health
- Checks provider health
- Returns status of Claude & OpenAI

GET /api/chat/:leadId/history
- Fetches conversation history
- Returns all messages for session
```

**Files to create:**
- `packages/chat/src/api/routes.ts` - Fastify route definitions
- `packages/chat/src/api/controllers/ChatController.ts` - Business logic
- `packages/chat/src/server.ts` - Start HTTP server

**Test:**
```bash
curl -X POST http://localhost:3001/api/chat/LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{"message": "How much for ceramic tint?"}'
```

---

### 2. React Chat UI (1 day)
**Goal:** Customer-facing chat interface

**Location:** `packages/frontend/`

**Components needed:**
```
src/components/
├── ChatWindow.tsx       # Main chat container
├── MessageList.tsx      # Display messages
├── MessageInput.tsx     # Input field + send
├── TypingIndicator.tsx  # "AI is typing..."
└── ChatHeader.tsx       # Customer name, vehicle
```

**API Integration:**
```typescript
// Fetch lead context on mount
const { customer, services } = await fetch(`/api/chat/${leadId}/context`);

// Send message
const response = await fetch(`/api/chat/${leadId}`, {
  method: 'POST',
  body: JSON.stringify({ message: userInput })
});

// Poll for new messages
setInterval(() => {
  fetch(`/api/chat/${leadId}/messages?after=${lastMessageId}`)
}, 2000);
```

---

### 3. Orchestrator → Chat Integration (2-3 hours)
**Goal:** Connect lead flow to chat

**Changes needed in orchestrator:**

**File:** `packages/orchestrator/src/infrastructure/messaging/SendGridService.ts`

Update email to include chat link:
```typescript
const chatLink = `${process.env.CHAT_URL}/${lead.id}`;

const emailContent = `
Hi ${lead.customer_name},

Thanks for your interest! I can answer questions about your 
${lead.vehicle_year} ${lead.vehicle_make} ${lead.vehicle_model}.

Chat with me: ${chatLink}

- Tint World Team
`;
```

**Environment variable:**
```bash
# packages/orchestrator/.env
CHAT_URL=http://localhost:3000/chat
# Production: https://chat.tintworld.com
```

---

### 4. Appointment Booking Flow (3-4 hours)
**Goal:** Customer can book via chat

**What happens:**
1. Customer asks about booking
2. AI detects intent: "Would you like to schedule?"
3. AI shows available times (from `location_hours` table)
4. Customer selects time
5. AI creates appointment in `appointments` table
6. AI syncs to ShopMonkey (if API available)
7. Confirmation email/SMS sent

**Needs:**
- Availability checking logic
- Appointment creation in DB
- ShopMonkey sync (research API)
- Notification service call

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

## Repository/Code Work Still Needed

### Chat Package
**Repositories:**
- [ ] ServiceCatalogRepository (fetch from ShopMonkey, cache in Redis)
- [ ] LocationRepository (business hours, location details)
- [ ] ChatMessageRepository (save/load conversation history)
- [ ] AppointmentRepository (create, update appointments)

**Services:**
- [ ] AppointmentService (booking logic)
- [ ] NotificationService (confirmations)

**API Endpoints:**
- [ ] POST /api/chat/:leadId (in progress)
- [ ] GET /api/chat/:leadId/history
- [ ] GET /api/chat/:leadId/context
- [ ] POST /api/chat/:leadId/appointment
- [ ] GET /api/health

### Orchestrator Package
**Updates needed:**
- [ ] Update email template with chat link
- [ ] Add chat engagement tracking
- [ ] Update touch point logic (stop if customer engages via chat)

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

## Feature Roadmap

### Phase 1: MVP (Current - Week 1-2)
- [x] Orchestrator working
- [x] Multi-provider AI
- [ ] Chat API endpoints
- [ ] Basic chat UI
- [ ] Manual appointment booking (human takes over)

### Phase 2: Automation (Week 3-4)
- [ ] AI-powered appointment booking
- [ ] Calendar integration
- [ ] Automated confirmations
- [ ] Follow-up automation

### Phase 3: Scale (Month 2)
- [ ] Multi-location support (200+ franchises)
- [ ] Location-specific pricing
- [ ] A/B testing AI providers
- [ ] Analytics dashboard

### Phase 4: Advanced (Month 3+)
- [ ] Voice chat support
- [ ] Multiple languages
- [ ] Advanced AI features (image analysis, etc.)
- [ ] Mobile app

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

## Open Issues

### High Priority
- Chat API endpoints not built (next immediate task)
- Frontend not started
- No end-to-end testing yet

### Medium Priority
- Demo mode still ON (safe but limiting)
- Using ngrok (need static domain for production)
- Twilio sandbox mode (SMS may not deliver)
- No logging/monitoring yet

### Low Priority
- Test coverage could be higher
- Need ESLint/Prettier
- Documentation could be expanded

---

## Success Criteria

**Chat package is DONE when:**
- [x] Multi-provider AI working (both Claude and OpenAI tested)
- [x] Can toggle providers via env var
- [x] Tests passing (10/10 currently)
- [x] Database integration working
- [ ] REST API endpoints working (next)
- [ ] Frontend UI built and connected
- [ ] Customer can chat and get responses
- [ ] Appointment booking works (manual or automated)
- [ ] End-to-end flow tested

**System is PRODUCTION READY when:**
- [ ] All tests passing
- [ ] Coverage >80%
- [ ] Static domain configured
- [ ] Demo mode OFF
- [ ] Monitoring in place
- [ ] Documentation complete
- [ ] Security review done
- [ ] Load testing completed

---

## Starting Next Conversation

**Quick start commands:**
```bash
# Verify chat is working
cd packages/chat
npm test          # Should see 10 passing
npm run demo      # Should get AI response

# Check what's running
docker compose ps  # Database should be up
```

**Recommended opening:**
```
"I'm continuing work on Lead Orchestrator. Last session we built 
the multi-provider AI chat system (Claude + OpenAI) with TDD. 
It's working and tested. 

Next priority: Build REST API endpoints for the chat service so 
frontend can call it.

Let's start with POST /api/chat/:leadId endpoint."
```

**Or if you want to see current state:**
```
"Show me the current status of the chat package and what works so far."
```

---

## Files to Reference

**What we built:**
- `packages/chat/README.md` - Complete usage guide
- `packages/chat/src/ai/` - All AI provider code
- `packages/chat/src/demo.ts` - Working demo script

**What's next:**
- `packages/chat/src/api/routes.ts` - (to be created)
- `packages/chat/src/server.ts` - (to be created)
- `packages/frontend/` - (to be built)

---

## Detailed Implementation Plan

### Week 1: Chat API + Frontend Foundation
**Days 1-2: REST API**
- Set up Fastify server
- Create route handlers
- Database integration
- Error handling
- Health checks

**Days 3-4: Frontend Setup**
- Initialize React app
- Set up routing
- Basic layout
- API client setup

**Day 5: Integration Testing**
- Test API with Postman
- Test frontend → API connection
- Fix bugs

### Week 2: Chat UI + Polish
**Days 1-3: Chat Components**
- Message display
- Input handling
- Conversation history
- Typing indicators
- Error states

**Days 4-5: Orchestrator Integration**
- Update email templates
- Add chat links
- Test full flow
- Bug fixes

### Week 3: Booking + Automation
**Days 1-2: Appointment Logic**
- Availability checking
- Booking creation
- Confirmation flow

**Days 3-5: Polish + Deploy**
- Testing
- Documentation
- Deployment prep
- Go live

---

## Cost Analysis

### Development Time (Estimated)
- Chat API: 2-3 hours ✅ NEXT
- Frontend UI: 1 day
- Integration: 1 day
- Booking flow: 3-4 hours
- Testing/polish: 1 day
**Total: ~1 week**

### Operating Costs (Monthly)
- Database: $25-50
- Redis: $10-20
- Hosting (3 services): $60-100
- SendGrid: $15-50
- Twilio: $50-200
- AI (Claude/OpenAI): $50-500 (scales with usage)
**Total: $210-920/month**

### Revenue Potential
- 100 leads/month: $4,000-8,000 revenue potential
- Break-even: ~25-30 leads/month
- Scale economics improve significantly

---

**Status: Ready for REST API development** 🚀