# Lead Orchestrator - MVP Business Logic

**Version:** 1.0  
**Last Updated:** November 23, 2025  
**Status:** MVP Implementation

---

## Overview

This document defines the business logic for the MVP lead management system for Tint World window tinting services.

---

## 1. Lead Definition

### What is a "Website Lead"?

A qualified lead must meet ALL of these criteria:

| Field | Value | Reason |
|-------|-------|--------|
| `workflowStatusId` | `619813fb2c9c3e8ce527be48` | Website Leads swim lane in ShopMonkey |
| `status` | `Estimate` | Quote created, not yet work in progress |
| `authorized` | `false` | Customer hasn't approved/committed |
| `messageCount` | `0` | Not yet contacted via ShopMonkey |
| `name` | Starts with "New Quote" | Website-generated (not walk-in) |
| Service type | Contains "tint" or "window" | Our target service |

### ShopMonkey Workflow Status IDs (Tint World)
```
619813fb2c9c3e8ce527be48 = Website Leads (our target)
619813fb2c9c3e7f6a27be4b = Invoiced/Completed
65fb14d76ee665db4d8d2ce0 = Appointments
```

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
- **Target:** Contact within 30 seconds of lead creation
- **Method:** Real-time polling or webhook (future)

### Historical Backfill
- **Window:** Last 30 days maximum
- **Rationale:** After system is live, no lead should sit untouched for 30+ days
- **One-time operation:** Run once at system launch

---

## 4. Follow-Up Schedule

If customer doesn't respond, execute 13 touch points over 30 days:

| Touch Point | Day | Description |
|-------------|-----|-------------|
| 1 | 0 | Initial contact (within 30 sec) |
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
- ✅ ShopMonkey integration (polling)
- ✅ Website Leads only
- ✅ Window tinting services only
- ✅ Demo mode for safe testing
- ✅ Initial contact logic
- ✅ Follow-up schedule (13 touches)
- ✅ Single tenant (Tint World Store094)

### Out of Scope (Future)
- ❌ Webhooks (real-time)
- ❌ Other swim lanes
- ❌ Other services (PPF, ceramic, etc.)
- ❌ Multi-tenant
- ❌ AI chat integration
- ❌ SMS/Email sending (phase 2)

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

# Polling interval (seconds)
POLL_INTERVAL_SECONDS=30

# Backfill window (days)
BACKFILL_DAYS=30
```

---

## 9. Metrics to Track

| Metric | Description |
|--------|-------------|
| Lead response time | Time from lead creation to first contact |
| Response rate | % of leads that respond |
| Conversion rate | % of leads that book appointment |
| Touch points to conversion | Average touches before booking |
| Drop-off by touch point | Where leads stop engaging |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-23 | Initial MVP logic defined | Claude/Team |
