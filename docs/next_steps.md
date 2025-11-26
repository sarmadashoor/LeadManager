# Lead Orchestrator - Next Steps

**Created:** November 25, 2025  
**Status:** Multi-tenant schema complete, ready for chat implementation  
**For:** Next conversation/developer handoff

---

## What Was Just Completed ✅

### Webhooks (Nov 25, 2025)
- ✅ Real-time lead ingestion (<1 second response time)
- ✅ Webhook handler with comprehensive validation
- ✅ Polling retained as backup mechanism
- ✅ Production-ready (needs static domain)

### Multi-Tenant Schema (Nov 25, 2025 - Migrations 8-12)
- ✅ `location_hours` table - Business hours per location
- ✅ `service_catalog` table - Location-specific pricing
- ✅ `chat_messages` table - AI conversation history
- ✅ `appointments` table - Booking management
- ✅ `leads.location_id` required - Multi-tenant enforcement
- ✅ Indexes for tenant+location queries
- ✅ Webhook validates location before creating leads

**Result:** System ready for 200+ franchise locations with location-specific pricing.

---

## What's Next: AI Chat Interface 🎯

**Priority:** #1 - Critical for customer engagement

**Status:** Database ready, implementation needed

---

## Prerequisites Before Building Chat

These must be answered/completed before implementation:

### 1. **Choose AI Provider** (Decision Required)
**Options:**
- Anthropic Claude API (excellent for conversations, what we use)
- OpenAI GPT-4 (widely used, good docs)
- Open source (Llama, Mistral - more control, hosting needed)

**Considerations:**
- Cost per message
- Response quality for automotive services
- Rate limits
- API reliability

**Question for next conversation:** "Which AI provider should we use and why?"

---

### 2. **Real-Time Communication Approach** (Decision Required)
**Options:**
- **WebSockets** - True real-time, more complex
- **Server-Sent Events (SSE)** - One-way server→client, simpler
- **REST + Polling** - Simplest, slight delay

**Recommendation:** Start with REST + short polling (2-3 seconds), upgrade to WebSockets later if needed.

**Question for next conversation:** "What level of real-time communication do we need?"

---

### 3. **Populate Service Catalog** (Data Needed)
**Current state:** `service_catalog` table exists but is empty

**Need from Tint World:**
- List of all services (window tinting, PPF, ceramic coating, etc.)
- Pricing for each service
- Duration for each service
- Does pricing vary by location? (San Diego vs Phoenix)

**Action required:**
```sql
-- Example of what we need to populate:
INSERT INTO service_catalog (tenant_id, location_id, service_type, name, description, base_price_cents, duration_minutes)
VALUES 
  ('tenant-uuid', 'location-uuid', 'window-tinting', 'Full Car Ceramic Tint', 'Premium ceramic...', 39900, 180),
  ('tenant-uuid', 'location-uuid', 'window-tinting', 'Front Windows Only', 'Front 2 windows', 19900, 90);
```

**Question for next conversation:** "Can you provide Tint World's service catalog data?"

---

### 4. **Populate Location Hours** (Data Needed)
**Current state:** `location_hours` table exists but is empty

**Need from Tint World:**
- Store094 business hours (Mon-Sun)
- Are they closed any days?

**Action required:**
```sql
-- Example:
INSERT INTO location_hours (location_id, day_of_week, opens_at, closes_at, is_closed)
VALUES 
  ('location-uuid', 1, '09:00', '18:00', false), -- Monday
  ('location-uuid', 2, '09:00', '18:00', false), -- Tuesday
  -- ... etc
```

**Question for next conversation:** "What are Store094's business hours?"

---

### 5. **Research ShopMonkey APIs** (Investigation Needed)
**Need to determine:**
- Does ShopMonkey have an appointment booking API?
- Can we create appointments programmatically?
- Can we add messages to orders via API?
- Can we update order workflow status?

**Action required:**
1. Review ShopMonkey API documentation
2. Test if appointment creation is possible
3. Determine what we can sync back to ShopMonkey

**Question for next conversation:** "Have you checked ShopMonkey's API docs for appointment/messaging capabilities?"

---

### 6. **Design Chat UX Flow** (Planning Needed)
**Questions to answer:**
- What should the chat greeting say?
- How do we guide customers to booking?
- What if customer asks off-topic questions?
- When do we offer human handoff?
- What's the booking confirmation flow?

**Recommendation:** Create a simple flow diagram before building.

---

## Technical Implementation Plan (After Prerequisites)

### Phase 1: Basic Chat (Week 1)
**Goal:** Customer can chat, AI responds

1. Create chat frontend (React)
   - Simple message interface
   - Load lead context
   - Display conversation history

2. Create chat API endpoints
   - `GET /api/chat/session/:leadId` - Load context
   - `POST /api/chat/message` - Send message, get AI response

3. Integrate AI provider
   - Configure API keys
   - Build prompt with context (customer, vehicle, services)
   - Handle AI responses

4. Test end-to-end
   - Customer clicks link → Chat loads → Messages work

**Deliverable:** Working chat that answers questions about services

---

### Phase 2: Service Information (Week 1-2)
**Goal:** AI can answer pricing/service questions

1. Load service catalog in chat context
2. AI can query services and provide accurate pricing
3. Test with real Tint World services

**Deliverable:** AI accurately answers "How much for full car tint?"

---

### Phase 3: Appointment Booking (Week 2-3)
**Goal:** Customer can book appointments

1. Check availability
   - Query `appointments` table for booked slots
   - Show available times

2. Create appointment
   - Save to `appointments` table
   - Update lead status to `appointment_scheduled`
   - Stop touch point sequence

3. Confirmation
   - Send email/SMS confirmation
   - Provide appointment details

**Deliverable:** Customer can book and receive confirmation

---

### Phase 4: ShopMonkey Sync (Week 3)
**Goal:** ShopMonkey knows about appointments

1. Research ShopMonkey API capabilities
2. Implement sync:
   - Post message to ShopMonkey order when customer responds
   - Create appointment in ShopMonkey (if API exists)
   - Update order status

**Deliverable:** Staff sees customer activity in ShopMonkey

---

## Open Questions for Next Conversation

**Critical decisions needed:**
1. Which AI provider? (Claude API, OpenAI, other?)
2. What's the Tint World service catalog? (pricing, services)
3. What are Store094's business hours?
4. Does ShopMonkey support appointment creation via API?
5. What's the desired chat UX flow?

**Technical decisions:**
6. WebSockets or REST for chat communication?
7. How to handle AI errors (API down, bad response)?
8. What's the fallback if appointment booking fails?
9. When to escalate to human?

---

## Repository/Code Work Still Needed

**After chat is built:**

1. **Create ServiceCatalogRepository** (~100 lines)
   - Query services by location
   - Filter by active status
   - Handle location-specific vs tenant-wide pricing

2. **Create LocationRepository** (~80 lines)
   - Query location details
   - Get business hours
   - Check if location is open

3. **Update LeadRepository** (~50 lines)
   - All methods scope by tenant+location
   - Add method: `findByLocationAndStatus()`

4. **Write Tests**
   - ServiceCatalogRepository tests
   - LocationRepository tests
   - Update existing tests for location scoping

**Estimated time:** 3-4 hours (can be done alongside chat development)

---

## What NOT To Do Yet

❌ **Don't build chat without:**
- Knowing which AI provider
- Having service catalog data
- Understanding ShopMonkey API capabilities

❌ **Don't deploy to production without:**
- Static domain (not ngrok)
- Working chat interface
- End-to-end testing

❌ **Don't turn off demo mode until:**
- Chat is fully working
- Twilio A2P approved (for SMS)
- Production deployment stable

---

## Estimated Timeline

**If prerequisites answered quickly:**
- Week 1: Basic chat working
- Week 2: Service info + booking
- Week 3: ShopMonkey sync + polish
- Week 4: Production deployment

**Total: 3-4 weeks** (with clear answers to prerequisite questions)

---

## Starting Next Conversation

**Recommended opening:**
```
"I need to build the AI chat interface for customer engagement. 
The database schema is ready (location_hours, service_catalog, 
chat_messages, appointments tables exist).

Before I start building, I need to make some decisions:
1. Which AI provider should I use?
2. Can you provide the Tint World service catalog?
3. What are Store094's business hours?
4. Have we researched ShopMonkey's appointment API?

Let's answer these questions and then plan the chat implementation."
```

---

## Success Criteria

**Chat is successful when:**
- ✅ Customer receives chat link via email (<1 second)
- ✅ Customer can ask questions about services
- ✅ AI provides accurate pricing from service catalog
- ✅ Customer can book appointment
- ✅ Appointment syncs to ShopMonkey
- ✅ Staff sees customer activity in ShopMonkey
- ✅ Lead status updates appropriately
- ✅ Touch point sequence stops when customer engages

---

## Files to Reference in Next Conversation

**Architecture docs:**
- `docs/HANDOFF.md` - Complete system overview
- `docs/architecture/PHASED_IMPLEMENTATION.md` - Architecture approach
- `docs/MVP_LOGIC.md` - Business rules

**Database:**
- Migration 8: `location_hours` table
- Migration 9: `service_catalog` table
- Migration 10: `chat_messages` table
- Migration 11: `appointments` table

**Code:**
- `src/infrastructure/webhooks/ShopMonkeyWebhookHandler.ts` - How leads are imported
- `src/infrastructure/crm/ShopMonkeyAdapter.ts` - ShopMonkey API integration
- `src/domain/TouchPointSchedule.ts` - Touch point logic

---

**This document provides clear handoff for next conversation. All prerequisites identified, implementation plan outlined, open questions documented.**