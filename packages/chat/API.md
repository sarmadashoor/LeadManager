# Chat API Reference

**Base URL:** `http://localhost:3001`  
**Version:** 1.0  
**Status:** Core Complete, Needs Integration

---

## Authentication

Currently: None (development only)  
Production TODO: JWT tokens, rate limiting

---

## Endpoints

### POST /api/chat/:leadId/message

Send a message and receive AI response.

**URL Parameters:**
- `leadId` (uuid, required) - Lead identifier from database

**Request Body:**
```json
{
  "message": "How much does ceramic window tint cost?"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "content": "For your Toyota Camry, our Supreme Tint Package with ceramic tint for all windows is $450. Ceramic tint offers superior heat rejection and UV protection...",
    "provider": "claude",
    "metadata": {
      "provider": "claude",
      "model": "claude-sonnet-4-20250514",
      "tokens_used": {
        "input": 263,
        "output": 76,
        "total": 339
      },
      "latency_ms": 3138,
      "finish_reason": "end_turn"
    }
  }
}
```

**Error Responses:**

400 Bad Request:
```json
{
  "success": false,
  "error": "Message is required"
}
```

404 Not Found:
```json
{
  "success": false,
  "error": "Lead not found"
}
```

500 Internal Server Error:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/chat/8e379f21-3c10-4b69-97f9-bf4041c278df/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What services do you offer?"}'
```

---

### GET /api/chat/:leadId/stream

Server-Sent Events streaming endpoint for real-time responses.

**URL Parameters:**
- `leadId` (uuid, required) - Lead identifier

**Query Parameters:**
- `message` (string, required) - User message

**Response:** text/event-stream

**Event Format:**
```
data: {"text":"Hello "}

data: {"text":"there! "}

data: {"text":"How "}

data: {"done":true,"provider":"claude"}
```

**Example:**
```bash
curl -N http://localhost:3001/api/chat/8e379f21-3c10-4b69-97f9-bf4041c278df/stream?message=Hello
```

**JavaScript Client:**
```javascript
const eventSource = new EventSource(
  `http://localhost:3001/api/chat/${leadId}/stream?message=${encodeURIComponent(message)}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.done) {
    console.log('Complete!', data.provider);
    eventSource.close();
  } else {
    console.log('Token:', data.text);
  }
};

eventSource.onerror = (error) => {
  console.error('Stream error:', error);
  eventSource.close();
};
```

---

### GET /api/chat/:leadId/history

Retrieve conversation history for a lead.

**URL Parameters:**
- `leadId` (uuid, required) - Lead identifier

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "9f1cd7f3-a67a-4a73-bc7f-a57fc4cc4fc3",
      "session_id": "59d8cfdb-273b-4579-b9f5-945a371f1893",
      "lead_id": "8e379f21-3c10-4b69-97f9-bf4041c278df",
      "role": "user",
      "content": "How much does ceramic window tint cost?",
      "metadata": null,
      "created_at": "2025-11-27T08:36:02.581Z"
    },
    {
      "id": "041fcbc9-39c5-4efb-95d3-3df0cc247240",
      "session_id": "59d8cfdb-273b-4579-b9f5-945a371f1893",
      "lead_id": "8e379f21-3c10-4b69-97f9-bf4041c278df",
      "role": "assistant",
      "content": "For your Toyota Camry, our Supreme Tint Package...",
      "metadata": {
        "model": "claude-sonnet-4-20250514",
        "provider": "claude",
        "latency_ms": 3839,
        "tokens_used": {
          "input": 169,
          "output": 76,
          "total": 245
        }
      },
      "created_at": "2025-11-27T08:36:06.425Z"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3001/api/chat/8e379f21-3c10-4b69-97f9-bf4041c278df/history
```

---

### GET /api/chat/:leadId/context

Get lead context used for AI prompts (customer, vehicle, services).

**URL Parameters:**
- `leadId` (uuid, required) - Lead identifier

**Success Response (200):**
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

**Note:** Currently uses placeholder services. Production will fetch real ShopMonkey catalog.

**404 Response:**
```json
{
  "success": false,
  "error": "Lead not found"
}
```

---

### GET /health

Check AI provider availability.

**Success Response (200):**
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

**Example:**
```bash
curl http://localhost:3001/health
```

---

## Rate Limiting

**Current:** None  
**Production TODO:** 
- 100 requests per minute per lead
- 1000 requests per hour per tenant

---

## Error Handling

All endpoints follow consistent error format:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (missing/invalid parameters)
- `404` - Resource not found (lead doesn't exist)
- `500` - Internal server error

---

## AI Provider Selection

Control which AI provider to use via environment variable:
```bash
# In packages/chat/.env
AI_PROVIDER=claude  # or 'openai'
```

**Provider Characteristics:**

| Provider | Model | Latency | Cost/msg | Style |
|----------|-------|---------|----------|-------|
| Claude | Sonnet 4.5 | 3-7s | ~$0.005 | Conversational, detailed |
| OpenAI | GPT-4o | 1-2s | ~$0.002 | Concise, direct |

---

## WebSocket Support

**Status:** Not implemented  
**Alternative:** Use SSE streaming endpoint (`/stream`)

---

## Changelog

### v1.0 (Nov 27, 2025)
- Initial release
- POST /message endpoint
- GET /stream (SSE)
- GET /history
- GET /context
- GET /health
- Multi-provider support (Claude + OpenAI)

---

## Support

- **Documentation:** `README.md`
- **Examples:** See README Quick Start
- **Issues:** Report via GitHub

---

**Last Updated:** November 27, 2025
