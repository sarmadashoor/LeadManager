# @lead-manager/chat

AI-powered chat API for automotive service leads using Claude and OpenAI.

**Status:** ✅ Core API Complete, 🚧 Production Integration Needed  
**Tests:** 33 passing  
**Port:** 3001

---

## Quick Start
```bash
# Install dependencies (from workspace root)
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env

# Run tests
npm test

# Start server
npm run dev
```

Server will start at `http://localhost:3001`

---

## Environment Variables

Create a `.env` file in this directory:
```bash
# Database (same as orchestrator)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lead_orchestrator

# AI Providers (need at least one)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...

# Optional
AI_PROVIDER=claude        # or 'openai'
PORT=3001
LOG_LEVEL=info
CORS_ORIGIN=*
```

---

## API Endpoints

### POST /api/chat/:leadId/message
Send a message and get AI response.

**Request:**
```json
{
  "message": "How much does ceramic tint cost?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "For your Toyota Camry, our Supreme Tint Package...",
    "provider": "claude",
    "metadata": {
      "tokens_used": {"input": 263, "output": 76},
      "latency_ms": 3138
    }
  }
}
```

### GET /api/chat/:leadId/stream
Server-Sent Events streaming (word-by-word).

**Query params:** `?message=Hello`

**Response:** SSE stream
```
data: {"text":"Hello "}
data: {"text":"there! "}
data: {"done":true,"provider":"claude"}
```

### GET /api/chat/:leadId/history
Get conversation history.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "role": "user",
      "content": "How much for tint?",
      "created_at": "2025-11-27T08:36:02.581Z"
    }
  ]
}
```

### GET /api/chat/:leadId/context
Get lead context (customer, vehicle, services).

### GET /health
Check AI provider status.

**Response:**
```json
{
  "status": "ok",
  "providers": {
    "claude": true,
    "openai": true
  }
}
```

---

## Architecture
```
Request → ChatController → ChatService → AIService → Claude/OpenAI
                              ↓              ↓
                     ChatMessageRepository  LeadContextRepository
                              ↓              ↓
                           PostgreSQL Database
```

### Key Components

**AI Layer (`src/ai/`)**
- `AIService.ts` - Main orchestrator, switches between providers
- `providers/ClaudeProvider.ts` - Anthropic Claude integration
- `providers/OpenAIProvider.ts` - OpenAI GPT integration
- `providers/AIProvider.ts` - Provider interface

**API Layer (`src/api/`)**
- `controllers/ChatController.ts` - HTTP request handlers
- `routes.ts` - Fastify route registration

**Service Layer (`src/services/`)**
- `ChatService.ts` - Business logic, orchestrates AI and data

**Data Layer (`src/repositories/`)**
- `ChatMessageRepository.ts` - Chat messages and sessions
- `LeadContextRepository.ts` - Lead data for AI context

---

## Testing
```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Coverage
npm test:coverage

# Specific test file
npm test ChatMessageRepository
```

**Test Coverage:** 33 tests across 6 suites
- ChatMessageRepository: 7 tests (database operations)
- ChatService: 8 tests (business logic)
- ChatController: 8 tests (HTTP layer)
- AI Providers: 10 tests (Claude + OpenAI)

---

## AI Provider Configuration

### Claude (Default)
- Model: `claude-sonnet-4-20250514`
- Latency: 3-7 seconds
- Cost: ~$0.005 per message
- Style: Conversational, detailed

### OpenAI
- Model: `gpt-4o`
- Latency: 1-2 seconds
- Cost: ~$0.002 per message
- Style: Concise, direct

**Switch providers:**
```bash
# In .env file
AI_PROVIDER=openai  # or 'claude'
```

---

## Database Schema

### chat_sessions
- `id` (uuid, primary key)
- `tenant_id` (uuid, foreign key → tenants)
- `lead_id` (uuid, foreign key → leads)
- `status` (varchar) - 'active', 'completed', 'abandoned'
- `started_at`, `last_message_at`, `completed_at` (timestamps)
- `messages_count`, `total_tokens_used` (integers)

### chat_messages
- `id` (uuid, primary key)
- `session_id` (uuid, foreign key → chat_sessions)
- `lead_id` (uuid, foreign key → leads)
- `role` (varchar) - 'user', 'assistant'
- `content` (text)
- `metadata` (jsonb) - tokens, latency, provider info
- `created_at` (timestamp)

---

## Development

### Adding a New AI Provider

1. Create provider in `src/ai/providers/`:
```typescript
export class GeminiProvider implements AIProvider {
  async generateResponse(context, message) {
    // Implementation
  }
  
  calculateCost(tokens) {
    // Pricing logic
  }
}
```

2. Register in `src/ai/providers/index.ts`
3. Add configuration to `src/config/ai-config.ts`
4. Add tests

### Adding a New Endpoint

1. Add method to `ChatController`
2. Register route in `routes.ts`
3. Add tests in `ChatController.test.ts`

---

## Troubleshooting

**"No AI providers configured"**
- Check `.env` file exists in this directory
- Verify at least one API key is set
- Restart the server

**"Lead not found"**
- Verify lead exists in database
- Check lead_id is valid UUID
- Ensure database connection works

**"Port 3001 already in use"**
```bash
lsof -ti:3001 | xargs kill -9
npm run dev
```

**Tests failing**
```bash
# Clean install
rm -rf node_modules
npm install
npm test
```

---

## Performance

**Response Times:**
- Health check: <50ms
- Message (Claude): 3-7s
- Message (OpenAI): 1-2s
- History retrieval: <100ms
- Context retrieval: <50ms

**Concurrency:**
- Handles 10-20 concurrent chats
- Each request is independent
- No shared state between requests

---

## Deployment

### Development
```bash
npm run dev  # Port 3001
```

### Production
```bash
npm run build
node dist/server.js
```

**Environment:** Set `NODE_ENV=production`

---

## Related Documentation

- **API Reference:** `API.md`
- **Architecture:** `../../docs/architecture/SYSTEM_OVERVIEW.md`
- **Implementation History:** `../../docs/architecture/PHASED_IMPLEMENTATION.md`

---

**Maintained by:** Lead Orchestrator Team  
**Last Updated:** November 27, 2025
