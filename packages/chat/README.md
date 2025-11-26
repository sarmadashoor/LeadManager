# Chat Package - Multi-Provider AI Service

## Status: ✅ Core Complete (Nov 26, 2025)

Multi-provider AI chat system with Claude and OpenAI support, built using TDD.

---

## What's Built

### ✅ Complete
- **Multi-Provider AI System** - Toggle between Claude Sonnet 4.5 and OpenAI GPT-4o
- **Provider Abstraction** - Clean interface for adding more providers
- **Configuration System** - Environment-based provider selection
- **Database Integration** - Shares PostgreSQL with orchestrator
- **Repository Pattern** - Fetch lead context from DB
- **Test Coverage** - 10 tests passing, TDD approach
- **Cost Tracking** - Built-in cost calculation per provider

### 🔜 Next Steps
- REST API endpoints (FastAPI routes)
- React chat UI (packages/frontend)
- End-to-end integration testing

---

## Quick Start

### 1. Install Dependencies
```bash
cd packages/chat
npm install
```

### 2. Configure API Keys
Edit `packages/chat/.env`:
```bash
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-openai-key-here
AI_FALLBACK_PROVIDER=openai
```

### 3. Run Tests
```bash
npm test
```

### 4. Test with Real APIs
```bash
# Test with Claude
npm run demo

# Test with OpenAI
AI_PROVIDER=openai npm run demo
```

---

## Provider Comparison (From Real Tests)

| Provider | Style | Speed | Cost/msg | Tokens/msg |
|----------|-------|-------|----------|------------|
| **Claude** | Conversational, detailed | 3.4s | $0.005 | 254 |
| **OpenAI** | Concise, direct | 1.5s | $0.002 | 174 |

**Winner:** OpenAI is 2x faster and cheaper. Claude is more conversational.

**Use Case:**
- Claude: When you want detailed, friendly responses
- OpenAI: When you want fast, concise responses

---

## Architecture
```
packages/chat/
├── src/
│   ├── ai/
│   │   ├── providers/
│   │   │   ├── AIProvider.ts          # Interface
│   │   │   ├── ClaudeProvider.ts      # Claude implementation
│   │   │   ├── OpenAIProvider.ts      # OpenAI implementation
│   │   │   └── index.ts               # Factory
│   │   └── AIService.ts               # Orchestrator
│   ├── config/
│   │   └── ai-config.ts               # Environment config
│   ├── infrastructure/
│   │   └── db.ts                      # Database connection
│   ├── repositories/
│   │   └── LeadContextRepository.ts   # Fetch lead data
│   └── __tests__/                     # Test utilities
```

---

## How to Toggle Providers

### Method 1: Environment Variable
```bash
AI_PROVIDER=claude npm run demo
AI_PROVIDER=openai npm run demo
```

### Method 2: In Code
```typescript
import { AIService } from './ai/AIService';

// Reads from process.env.AI_PROVIDER
const aiService = new AIService();

const response = await aiService.generateResponse(context, message);
console.log(response.provider); // 'claude' or 'openai'
```

---

## Testing
```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:coverage

# Type check
npm run type-check
```

**Current Coverage:** 10 tests passing
- AIProvider interface tests
- ClaudeProvider tests (4)
- OpenAIProvider tests (4)
- LeadContextRepository tests (2)

---

## Environment Variables
```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional
AI_PROVIDER=claude
AI_FALLBACK_PROVIDER=openai
CLAUDE_MODEL=claude-sonnet-4-20250514
OPENAI_MODEL=gpt-4o
DATABASE_URL=postgresql://...
```

---

## Next Development Steps

1. **Add REST API** (2-3 hours)
   - Fastify routes for chat
   - Endpoint: `POST /api/chat/:leadId`
   - Health check endpoint

2. **Build Frontend** (1 day)
   - React chat UI in packages/frontend
   - Connect to chat API
   - Display conversation history

3. **Integration** (1 day)
   - Orchestrator sends email with chat link
   - Frontend calls chat API
   - End-to-end flow

---

## Troubleshooting

**Tests fail:**
```bash
npm install
npm test
```

**Demo fails:**
- Check `.env` has valid API keys
- Check database running: `docker compose ps`

**API key errors:**
- Anthropic: https://console.anthropic.com/settings/keys
- OpenAI: https://platform.openai.com/api-keys

---

## License

MIT