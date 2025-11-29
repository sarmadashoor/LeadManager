# Lead Orchestrator — Next Steps

**Last Updated:** November 28, 2025  
**Status:** Chat API Complete • Service Catalog Integrated • Frontend NEXT

---

## ✅ What Was Just Completed (Nov 27–28, 2025)

### 1. Full Chat API (33 tests passing)

- `POST /api/chat/:leadId` — send message
- `GET /api/chat/:leadId/history` — conversation history
- `GET /api/chat/:leadId/context` — lead details + services
- `GET /api/health` — provider health
- SSE streaming endpoint (real-time replies)
- Conversation persistence (PostgreSQL)
- Session management
- Robust error handling
- Multi-provider AI (Claude + GPT-4o)
- Cost tracking + provider telemetry
- Test coverage now 33 full tests (unit + integration)

### 2. Service Catalog Integration (ShopMonkey → DB)

- `ServiceCatalogRepository` implemented
- `ServiceSyncService` (fetches all services at once)
- Upsert logic for per-location service lists
- 100 Tint World services synced
- `LeadContextRepository` now injects real prices & service descriptors
- AI context now accurate

### 3. Orchestrator Validated

- Webhooks (order created)
- Polling backup
- Touch points
- Messaging
- DB migrations (12)
- Multi-tenant architecture confirmed

### 🎉 Result: Backend is formal MVP-ready. Only frontend + auth remain.

---

## 🚀 Immediate Next Steps (Updated)

### 🔥 Priority 1 — React Frontend Chat UI (1–2 days)

**Goal:** A working chat interface that loads a session and interacts with the Chat API.

**Tasks:**

- [ ] Build `<ChatWindow />` (UI container)
- [ ] Build `<MessageList />` (history + streaming)
- [ ] Build `<MessageInput />`
- [ ] Build `<TypingIndicator />`
- [ ] Build context loader (`/api/chat/:leadId/context`)
- [ ] Integrate SSE streaming endpoint
- [ ] Show real service catalog inside context panel

**Folder:** `packages/frontend/src/components/`

**Backend endpoints available:**

- `GET /api/chat/:leadId/context`
- `GET /api/chat/:leadId/history`
- `POST /api/chat/:leadId`
- `GET /api/chat/:leadId/stream` (SSE)
- `GET /api/health`

### 🔥 Priority 2 — AI Prompt Update to Include Full Service Catalog (1–2 hours)

The system prompt STILL assumes "tint only" → NO.

**Now we have:**

- Ceramic tint
- Regular tint
- Paint protection film
- Vehicle wraps
- Bedliners
- Audio systems
- Remote starters
- Security systems
- Detailing
- Wheels/Tires
- Paint correction
- much more (100 services)

**Tasks:**

- [ ] Update system prompt in `AIService` to reference full offering
- [ ] Add tone & persona standards (friendly, helpful, authoritative)
- [ ] Add disclaimers + safe booking phrases
- [ ] Add pricing rules
- [ ] Add upsell logic (subtle, not pushy)

### 🔥 Priority 3 — Authentication for Chat Links (4–6 hours)

**Problem:**

Right now: `https://chat.tintworld.com/LEAD_ID` gives anyone full chat.

**Solution:**

Add signed JWT magic links.

**Flow:**

1. Orchestrator emails: `https://chat.tintworld.com/session?token=XYZ`
2. Frontend sends token → Chat API verifies → loads lead

**Tasks:**

- [ ] JWT sign+verify
- [ ] Middleware in Chat API
- [ ] Update email/SMS templates
- [ ] Update frontend to pass token in all requests

---

## 🧩 Secondary Steps

### Step 4 — Orchestrator → Chat Integration (Finalize)

**Status:** Not done  
**Goal:** All customer touch points include a chat link

**Tasks:**

- [ ] Insert chat URL into SMS + email templates
- [ ] Store first engagement timestamp
- [ ] Stop touch points after chat engagement
- [ ] Track last AI interaction

### Step 5 — Appointment Booking V1 (3–4 hours)

We now have:

- Real operating hours
- Real service catalog
- Real lead context

**Booking flow skeleton:**

1. Customer asks: "I want to schedule"
2. AI triggers:
   - → `GET location_hours`
   - → Suggest times
   - → `POST /api/chat/:leadId/appointment`
   - → Save to DB
   - → Send confirmation email/SMS
   - → (Optional) Sync to ShopMonkey

### Step 6 — Logging, Monitoring, Error Tracking

**Minimum production readiness:**

- Winston/Pino logger
- Request/response logs
- Slow request warnings
- Provider latency graphs
- Error tracking (Sentry)

---

## 📋 Updated Technical Debt / Improvements

### Testing

- [ ] Frontend unit tests + integration tests
- [ ] Chat API e2e tests
- [ ] Appointment booking test suite
- [ ] Load testing (k6 or artillery)

### Performance

- [ ] Redis caching for service catalog
- [ ] Streaming over WebSocket (optional)
- [ ] Caching for lead context

### CI/CD

- [ ] GitHub Actions pipeline
- [ ] Linting + formatting
- [ ] Unit + integration tests
- [ ] Build → containerize → deploy

---

## 🗺 Updated Feature Roadmap (Nov 28, 2025)

### Phase 1 — Backend Stable (Done)

- ✓ Chat API
- ✓ AI providers
- ✓ DB integration
- ✓ Service catalog
- ✓ 33 tests

### Phase 2 — Frontend + Prompt Update (Next)

- ⟲ Build React UI
- ⟲ Update system prompt
- ⟲ Add JWT authentication

### Phase 3 — Appointment Booking

- ⟲ Show availability
- ⟲ Create appointment
- ⟲ Confirm via SMS/email
- ⟲ Optional: push to ShopMonkey

### Phase 4 — Growth + Scale

- ⟲ A/B test AI providers
- ⟲ Multi-location branding
- ⟲ Analytics dashboard
- ⟲ Go live with 1–3 Tint World stores

---

## 🎉 System Readiness Snapshot

| Component | Status |
|-----------|--------|
| Orchestrator | ✅ Production-ready |
| Chat API | ✅ Fully complete + tested |
| Service Catalog | ✅ Full integration |
| Frontend | ⏳ Not started |
| Authentication | ⏳ Needed |
| Prompt update | ⏳ Needed |
| Appointment flow | 🚧 Partial (context ready, UI not ready) |

---

## 🎯 Recommended Workflow for Next Session

**Paste this at the start:**

```
I'm continuing development on Lead Orchestrator. 
The Chat API and service catalog are now complete. 
Next priorities: 
1) Frontend chat UI, 
2) AI system prompt update, 
3) JWT authentication. 
Let's start with the frontend.
```