# 📡 Chat API Reference (v1.0)

**Base URL:** `http://localhost:3001`  
**Package:** `packages/chat`  
**Status:** CORE COMPLETE — REST, SSE, Providers, Repositories all working  
**Next Required:** Authentication + Frontend integration

---

## 1. 🔐 Authentication

### Current:
❌ No authentication (development only)

### Production Requirements:

- JWT or Magic Link tokens
- Per-lead rate limiting
- Per-tenant throttling (B2B SaaS)
- CORS control
- Session validation

---

## 2. 🚀 Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/:leadId/message` | Send a message → get AI response |
| GET | `/api/chat/:leadId/stream` | SSE streaming (token-by-token AI output) |
| GET | `/api/chat/:leadId/history` | Retrieve conversation history |
| GET | `/api/chat/:leadId/context` | Retrieve context used for prompt |
| GET | `/health` | Provider + server health check |

---

## 3. POST /api/chat/:leadId/message

Send a user message → save it → get AI response → store response.

```
POST /api/chat/{leadId}/message
```

### URL Params

- `leadId` — UUID (required)

### Request Body

```json
{
  "message": "How much does ceramic window tint cost?"
}
```

### Validation

- `"message"` must be a non-empty string
- Lead must exist in DB (`leads` table)

### Example Success Response (200)

```json
{
  "success": true,
  "data": {
    "content": "For your Toyota Camry, ceramic tint typically starts at $450...",
    "provider": "claude",
    "metadata": {
      "provider": "claude",
      "model": "claude-sonnet-4-20250514",
      "tokens_used": { "input": 263, "output": 76, "total": 339 },
      "latency_ms": 3138,
      "finish_reason": "end_turn"
    }
  }
}
```

### Common Errors

#### 400 – Missing Message

```json
{
  "success": false,
  "error": "Message is required"
}
```

#### 404 – Lead Not Found

```json
{
  "success": false,
  "error": "Lead not found"
}
```

#### 500 – Server Error

```json
{
  "success": false,
  "error": "Internal server error"
}
```

### Example cURL

```bash
curl -X POST http://localhost:3001/api/chat/LEAD_ID/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What services do you offer?"}'
```

---

## 4. GET /api/chat/:leadId/stream

Real-time streaming (SSE)

```
GET /api/chat/{leadId}/stream?message=Hello
```

### Returns

- `Content-Type: text/event-stream`

### Stream Events

```
data: {"text":"Hello "}
data: {"text":"there! "}
data: {"text":"How "}
data: {"done":true,"provider":"claude"}
```

### Example (with curl)

```bash
curl -N "http://localhost:3001/api/chat/LEAD_ID/stream?message=Hello"
```

### Example JavaScript Client

```javascript
const eventSource = new EventSource(
  `http://localhost:3001/api/chat/${leadId}/stream?message=${encodeURIComponent(message)}`
);

eventSource.onmessage = e => {
  const data = JSON.parse(e.data);

  if (data.done) {
    eventSource.close();
  } else {
    console.log("Token:", data.text);
  }
};

eventSource.onerror = (err) => {
  console.error("Stream error:", err);
  eventSource.close();
};
```

---

## 5. GET /api/chat/:leadId/history

Retrieve all messages stored in `chat_messages` table.

```
GET /api/chat/{leadId}/history
```

### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "9f1cd7f3-a67a-4a73-bc7f-a57fc4cc4fc3",
      "session_id": "59d8cfdb-273b-4579-b9f5-945a371f1893",
      "lead_id": "LEAD_ID",
      "role": "user",
      "content": "How much does ceramic tint cost?",
      "metadata": null,
      "created_at": "2025-11-27T08:36:02.581Z"
    },
    {
      "id": "041fcbc9-39c5-4efb-95d3-3df0cc247240",
      "role": "assistant",
      "content": "For your Toyota Camry...",
      "metadata": {
        "provider": "claude",
        "model": "claude-sonnet-4-20250514",
        "latency_ms": 3839,
        "tokens_used": { "input": 169, "output": 76, "total": 245 }
      }
    }
  ]
}
```

---

## 6. GET /api/chat/:leadId/context

Returns the lead context passed to AIService.

```
GET /api/chat/{leadId}/context
```

### Context Includes:

- Customer info
- Vehicle info
- Services (placeholder, will be replaced with ShopMonkey catalog)
- Conversation history (optional)

### Example Success Response

```json
{
  "success": true,
  "data": {
    "customer": {
      "name": "John Doe",
      "phone": "+15551234567",
      "email": "john@example.com",
      "vehicle": "2023 Toyota Camry"
    },
    "services": [
      {
        "name": "Supreme Tint Package",
        "price": 450,
        "description": "Ceramic tint for all windows"
      }
    ],
    "conversationHistory": []
  }
}
```

---

## 7. GET /health

Check provider + server health.

```
GET /health
```

### Example Response

```json
{
  "status": "ok",
  "timestamp": "2025-11-27T08:31:24.363Z",
  "providers": {
    "claude": true,
    "openai": true
  }
}
```

---

## 8. Rate Limiting (Planned)

### Development:
❌ None

### Production:
- ✔ 100 req/min per lead
- ✔ 1000 req/hour per tenant
- ✔ Burst protection
- ✔ Abuse detection

---

## 9. Error Format (Standard)

All errors follow this shape:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

---

## 10. AI Providers

Selected via `.env`:

```bash
AI_PROVIDER=claude     # "claude" | "openai"
AI_FALLBACK_PROVIDER=openai
```

### Provider Comparison

| Provider | Model | Latency | Cost/msg | Style | Notes |
|----------|-------|---------|----------|-------|-------|
| Claude | Sonnet 4.5 | 3–7 sec | ~$0.005 | Conversational | Excellent text quality |
| OpenAI | GPT-4o | 1–2 sec | ~$0.002 | Direct/concise | Fast, cheap |

---

## 11. WebSockets

- ❌ Not implemented
- ✔ SSE supported (`/stream`)
- ✔ WebSockets may be added once frontend grows

---

## 12. Changelog

### v1.0 – Nov 27, 2025

- `POST /message` endpoint
- `GET /stream` SSE
- `GET /history`
- `GET /context`
- `GET /health`
- Multi-provider integration (Claude + OpenAI)
- Repositories + Services layer complete

---

## 13. Support

- **Docs:** `packages/chat/README.md`
- **API:** This file
- **Issues:** GitHub or project issue tracker

---

## 14. Last Updated

**November 27, 2025**  
**Maintainer:** Lead Orchestrator Core Team