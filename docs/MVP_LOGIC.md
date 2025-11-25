# Lead Orchestrator - MVP Business Logic

**Version:** 1.1  
**Last Updated:** November 25, 2025  
**Status:** MVP Implementation - Webhooks Active

---

## Overview

This document defines the business logic for the MVP lead management system for Tint World window tinting services.

---

## 1. Lead Definition

### What is a "Website Lead"?

A qualified lead must meet ALL of these criteria:

| Field | Value | Reason |
|-------|-------|--------|
| `workflowStatusId` | `619813fb2c9c3e8ce527be48` OR `65fb14d76ee665db4d8d2ce0` | Website Leads OR Appointments workflow |
| `status` | `Estimate` | Quote created, not yet work in progress |
| `authorized` | `false` | Customer hasn't approved/committed |
| `messageCount` | `0` | Not yet contacted via ShopMonkey |
| `name` | Starts with "New Quote" | Website-generated (not walk-in) |
| `appointmentDates` | Empty array | No actual appointment scheduled yet |
| `invoiced` | `false` | Not yet invoiced |
| `paid` | `false` | Not yet paid |
| Service type | Contains "tint" or "window" | Our target service |

### ShopMonkey Workflow Status IDs (Tint World)
```
619813fb2c9c3e8ce527be48 = Website Leads (original target)
65fb14d76ee665db4d8d2ce0 = Appointments (website quotes land here too)
619813fb2c9c3e7f6a27be4b = Invoiced/Completed
```

**Note:** Website quote forms create orders in "Appointments" workflow even though no appointment is scheduled yet. We filter by `appointmentDates.length === 0` to catch these.

---

## 2. Demo Mode

**CRITICAL SAFETY FEATURE**

Demo mode prevents accidental contact with real customers during development/testing.

| Mode | Behavior |
|------|----------|
| `demoMode: true` (default) | Only process leads with email: `sarmadashoor1@gmail.com` |
| `demoMode: false` | Process ALL qualified leads (production only) |

**Demo mode is ON by default.** Must be explicitly disabled for production.

---

## 3. Timing Rules

### New Leads
- **Target:** Contact within 1 second of lead creation ✅ **ACHIEVED**
- **Method:** ShopMonkey webhooks (primary) + Polling backup
- **Actual Performance:** <1 second via webhooks, 30 seconds via polling backup

### Historical Backfill
- **Window:** Last 30 days maximum
- **Rationale:** After system is live, no lead should sit untouched for 30+ days
- **One-time operation:** Run once at system launch

### Lead Ingestion Methods

| Method | Speed | Reliability | Status |
|--------|-------|-------------|--------|
| Webhooks | <1 second | 99%+ | ✅ Primary |
| Polling | 30 seconds | 100% | ✅ Backup |

**Architecture:** Dual ingestion ensures no leads are missed. If webhook fails, polling catches it within 30 seconds.

---

## 4. Follow-Up Schedule

If customer doesn't respond, execute 13 touch points over 30 days:

| Touch Point | Day | Description |
|-------------|-----|-------------|
| 1 | 0 | Initial contact (within 1 sec) |
| 2 | 1 | First follow-up |
| 3 | 3 | Second follow-up |
| 4 | 5 | Third follow-up |
| 5 | 7 | Fourth follow-up |
| 6 | 10 | Fifth follow-up |
| 7 | 13 | Sixth follow-up |
| 8 | 16 | Seventh follow-up |
| 9 | 19 | Eighth follow-up |
| 10 | 22 | Ninth follow-up |
| 11 | 25 | Tenth follow-up |
| 12 | 27 | Eleventh follow-up |
| 13 | 30 | Final follow-up |

**Average interval:** ~2.3 days between touch points

### Stop Conditions
- Customer responds (any response)
- Customer books appointment
- Customer opts out
- 13 touch points completed
- Lead marked as lost/closed in CRM

---

## 5. Lead Status Flow
```
NEW → CONTACTED → CHAT_ACTIVE → APPOINTMENT_SCHEDULED → CONVERTED
                      ↓
                    LOST (after 13 touches with no response)
```

| Status | Description |
|--------|-------------|
| `new` | Lead imported, not yet contacted |
| `contacted` | Initial AI link sent |
| `chat_active` | Customer engaged with AI chat |
| `appointment_scheduled` | Appointment booked in CRM |
| `converted` | Service completed |
| `lost` | No response after all follow-ups |

---

## 6. MVP Scope

### In Scope
- ✅ ShopMonkey integration (webhooks + polling)
- ✅ Website Leads only
- ✅ Window tinting services only
- ✅ Demo mode for safe testing
- ✅ Initial contact logic
- ✅ Follow-up schedule (13 touches)
- ✅ Single tenant (Tint World Store094)
- ✅ Email integration (SendGrid)
- ✅ SMS integration (Twilio - pending A2P approval)

### Out of Scope (Future)
- ❌ Other swim lanes (walk-ins, phone quotes)
- ❌ Other services (PPF, ceramic coating, etc.)
- ❌ Multi-tenant architecture
- ❌ AI chat integration (placeholder link active)
- ❌ Appointment booking integration

---

## 7. Database Schema for Follow-ups

**Required fields on `leads` table:**
- `touch_point_count` - Number of contacts made (0-13)
- `next_touch_point_at` - When to send next follow-up
- `last_contacted_at` - Last contact timestamp
- `first_response_at` - When customer first responded

**Future table: `lead_touch_points`**
```sql
- id
- lead_id
- touch_point_number (1-13)
- scheduled_at
- sent_at
- channel (sms/email)
- status (pending/sent/failed)
- response_received
```

---

## 8. Configuration

### Environment Variables
```env
# Demo mode (default: true)
DEMO_MODE=true

# ShopMonkey
SHOPMONKEY_API_KEY=xxx
SHOPMONKEY_BASE_URL=https://api.shopmonkey.cloud/v3

# Webhook server
WEBHOOK_PORT=3000

# Polling interval (seconds) - backup only
POLL_INTERVAL_SECONDS=30

# Backfill window (days)
BACKFILL_DAYS=30

# Messaging
SENDGRID_API_KEY=xxx
SENDGRID_FROM_EMAIL=xxx
TWILIO_ACCOUNT_SID=xxx  # Optional
TWILIO_AUTH_TOKEN=xxx   # Optional
TWILIO_PHONE_NUMBER=xxx # Optional
```

---

## 9. Webhook Configuration

### ShopMonkey Webhook Setup
1. Login to ShopMonkey → Settings → Webhooks
2. Click "Add Webhook"
3. Configure:
   - **Name:** Lead Manager - Store094
   - **URL:** `https://your-domain.com/webhooks/shopmonkey/order`
   - **Events:** Order
   - **Status:** Enabled

### Webhook Security
- Returns 200 OK immediately (prevents retries)
- Fetches full customer/vehicle data from ShopMonkey API
- Validates all lead criteria before processing
- Logs all webhook attempts for debugging

### Development Setup
- Use ngrok to expose localhost:3000
- Example: `ngrok http 3000`
- Configure webhook URL: `https://abc123.ngrok-free.dev/webhooks/shopmonkey/order`

---

## 10. Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| Lead response time | Time from lead creation to first contact | <1 second |
| Webhook success rate | % of webhooks successfully processed | >99% |
| Polling backup usage | % of leads caught by polling (not webhook) | <1% |
| Response rate | % of leads that respond | TBD |
| Conversion rate | % of leads that book appointment | TBD |
| Touch points to conversion | Average touches before booking | TBD |
| Drop-off by touch point | Where leads stop engaging | TBD |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-23 | Initial MVP logic defined | Claude/Team |
| 2025-11-25 | Added webhook integration, updated timing to <1 sec | Claude/Team |
| 2025-11-25 | Expanded lead criteria (added Appointments workflow) | Claude/Team |
| 2025-11-25 | Added webhook configuration section | Claude/Team |