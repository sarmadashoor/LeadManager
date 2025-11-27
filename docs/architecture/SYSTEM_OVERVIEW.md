# System Overview - Lead Orchestrator Architecture

**Last Updated:** November 27, 2025  
**Current Phase:** Chat Core Complete, Needs: Catalog Integration, Frontend, Auth

---

## High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL WORLD                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Shopmonkey CRM ──────────────┐                             │
│  (Webhooks + API)             │                             │
│                               │                             │
│  Customer Browser ─────────┐  │                             │
│  (Future: Chat UI)         │  │                             │
│                            │  │                             │
└────────────────────────────┼──┼─────────────────────────────┘
                             │  │
                             │  │
                    ┌────────┼──┼────────┐
                    │   ngrok tunnel    │  ONE tunnel
                    │  (port 3000 only) │  for webhooks
                    └────────┼──┼────────┘
                             │  │
                             │  │
┌────────────────────────────┼──┼─────────────────────────────┐
│                 YOUR LOCALHOST                               │
├────────────────────────────┼──┼─────────────────────────────┤
│                            ▼  ▼                              │
│              ┌─────────────────────────────┐                 │
│              │   ORCHESTRATOR (port 3000)  │                 │
│              │   packages/orchestrator/    │                 │
│              ├─────────────────────────────┤                 │
│              │ • Shopmonkey webhooks       │                 │
│              │ • Lead ingestion & polling  │                 │
│              │ • SMS via Twilio            │                 │
│              │ • Email via SendGrid        │                 │
│              │ • Touch point scheduling    │                 │
│              │ • Will serve frontend HTML  │                 │
│              └──────────┬──────────────────┘                 │
│                         │                                    │
│                         │ Internal HTTP                      │
│                         │ (localhost:3001)                   │
│                         ▼                                    │
│              ┌─────────────────────────────┐                 │
│              │    CHAT API (port 3001)     │                 │
│              │    packages/chat/           │                 │
│              ├─────────────────────────────┤                 │
│              │ • REST API endpoints        │ ✅ COMPLETE    │
│              │ • SSE streaming             │                 │
│              │ • Claude + OpenAI providers │                 │
│              │ • Conversation history      │                 │
│              │ • Cost tracking             │                 │
│              └──────────┬──────────────────┘                 │
│                         │                                    │
│                         ▼                                    │
│              ┌─────────────────────────────┐                 │
│              │   PostgreSQL Database       │                 │
│              │   (Docker container)        │                 │
│              │   Shared by both services   │                 │
│              └─────────────────────────────┘                 │
│                                                              │
│              ┌─────────────────────────────┐                 │
│              │   FRONTEND (port 5173)      │                 │
│              │   packages/frontend/        │                 │
│              ├─────────────────────────────┤                 │
│              │ • React + Vite              │ 🚧 NOT STARTED │
│              │ • Chat UI components        │                 │
│              │ • Calls Chat API directly   │                 │
│              └─────────────────────────────┘                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Scenario 1: New Lead from Shopmonkey
```
1. Shopmonkey sends webhook
   ↓
2. ngrok forwards to Orchestrator (3000)
   ↓
3. Orchestrator validates and creates lead in DB
   ↓
4. Orchestrator sends SMS to customer with chat link
   ↓
5. Customer clicks link (Future: opens chat UI)
```

### Scenario 2: Customer Chats (Future)
```
1. Customer opens chat link
   ↓
2. Browser loads React app from Orchestrator
   ↓
3. React app calls Chat API (3001) via REST
   ↓
4. Chat API fetches lead context from DB
   ↓
5. Chat API calls Claude/OpenAI with context
   ↓
6. AI response streamed back to customer
   ↓
7. Messages saved to DB for history
```

### Scenario 3: Touch Point Automation
```
1. TouchPointProcessor runs every 10s
   ↓
2. Finds leads due for follow-up
   ↓
3. Sends SMS/Email via Twilio/SendGrid
   ↓
4. Updates lead status in DB
```

---

## Technology Stack

### Backend Services
- **Language:** TypeScript
- **Runtime:** Node.js
- **HTTP Server:** Fastify (both services)
- **Database:** PostgreSQL (Docker)
- **ORM:** Knex.js
- **Testing:** Jest

### AI Providers
- **Primary:** Claude Sonnet 4.5 (Anthropic)
- **Secondary:** GPT-4o (OpenAI)
- **Switching:** Via `AI_PROVIDER` env var

### External Services
- **CRM:** Shopmonkey API v3
- **SMS:** Twilio
- **Email:** SendGrid
- **Tunneling:** ngrok (dev), DNS (production)

### Frontend (Planned)
- **Framework:** React
- **Build Tool:** Vite
- **State:** React hooks
- **Styling:** TBD

---

## Port Assignments

| Service | Port | External Access |
|---------|------|-----------------|
| Orchestrator | 3000 | Via ngrok (webhooks) |
| Chat API | 3001 | Internal only |
| Frontend (dev) | 5173 | localhost only |
| PostgreSQL | 5432 | Docker network |

---

## Database Schema

### Core Tables (Orchestrator)
- `tenants` - Franchise locations
- `locations` - Physical store locations
- `leads` - Customer leads (main table)
- `job_executions` - Polling/processing jobs
- `location_hours` - Business hours
- `service_catalog` - Services per location

### Chat Tables (Chat API)
- `chat_sessions` - Conversation sessions
- `chat_messages` - Individual messages

### Future Tables
- `appointments` - Scheduled bookings

**Note:** Both services share the same database. Multi-tenant architecture ready (every lead has tenant_id).

---

## Environment Variables

### Orchestrator (.env in packages/orchestrator/)
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lead_orchestrator

# Shopmonkey
SHOPMONKEY_API_KEY=...
SHOPMONKEY_TENANT_ID=...

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# SendGrid
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...

# Tenant
TENANT_ID=... (your franchise ID)

# Optional
DEMO_MODE=true  (only process test leads)
POLL_INTERVAL_MS=30000
WEBHOOK_PORT=3000
```

### Chat API (.env in packages/chat/)
```bash
# Database (same as orchestrator)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lead_orchestrator

# AI Providers (need at least one)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...

# Optional
AI_PROVIDER=claude  (or 'openai')
PORT=3001
LOG_LEVEL=info
```

---

## Deployment Architecture

### Development (Current)
```
Your Laptop:
  - Orchestrator (3000)
  - Chat API (3001)
  - PostgreSQL (Docker)
  - ngrok tunnel
```

### Production (Future)
```
Cloud Server:
  - Orchestrator (behind nginx)
  - Chat API (behind nginx)
  - PostgreSQL (managed service)
  - Domain with SSL
```

---

## Key Design Decisions

### Why Two Separate Services?
- **Separation of concerns:** Lead management vs AI chat
- **Independent scaling:** Chat may need more resources
- **Different deployment cycles:** Can update chat without touching orchestrator
- **Technology flexibility:** Could rewrite chat in Python later

### Why Shared Database?
- **Simplicity:** One source of truth
- **No sync issues:** Real-time data consistency
- **Easy queries:** Join across leads and messages
- **Cost:** Single database to manage

### Why Monorepo?
- **Shared development:** Work on both at once
- **Type safety:** Share TypeScript types via @lead-manager/shared
- **Easy testing:** Test integration between services
- **Single git repo:** Simpler version control

### Why ngrok?
- **Development only:** Easy webhook testing
- **Production:** Will use proper DNS + SSL

---

## Performance Characteristics

### Orchestrator
- Webhook response: <100ms
- SMS send: 1-2s (Twilio API)
- Email send: 1-3s (SendGrid API)
- Polling cycle: 30s
- Touch point processing: 10s

### Chat API
- Claude response: 3-7s
- OpenAI response: 1-2s
- History retrieval: <100ms
- Health check: <50ms

### Database
- Simple queries: <10ms
- Complex joins: <50ms
- Message inserts: <20ms

---

## Security Considerations

### Current (MVP)
- No authentication (internal only)
- Environment variables for secrets
- PostgreSQL with password
- ngrok with random URL

### Production TODO
- JWT authentication
- API keys per tenant
- Rate limiting
- HTTPS everywhere
- Secrets management (AWS Secrets Manager, etc.)
- Database encryption at rest

---

## Monitoring & Observability

### Current
- Fastify logging (pino)
- Console logs
- Manual testing

### Production TODO
- Application monitoring (DataDog, New Relic)
- Error tracking (Sentry)
- Log aggregation (CloudWatch, Elasticsearch)
- Uptime monitoring
- Cost tracking per AI provider

---

## Scaling Considerations

### Current Capacity
- **Leads:** Hundreds per day
- **Messages:** Thousands per day
- **Concurrent users:** ~10-20

### Future Scaling
- **Horizontal:** Multiple orchestrator instances
- **Chat API:** Separate instances with load balancer
- **Database:** Read replicas
- **Caching:** Redis for frequent queries

---

**Next:** See `docs/HANDOFF.md` for current development status
