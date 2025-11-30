# Lead Orchestrator — MVP Business Logic

**Version:** 1.4  
**Last Updated:** November 29, 2025  
**Status:** Orchestrator Complete · Multi-Tenant Ready · AI Chat Ready

This document defines the business rules, lead qualification logic, timing behavior, and touch-point strategy for the MVP of the Tint World Lead Management System.

This file is intentionally minimal and excludes all implementation details (migrations, env vars, setup steps, etc.).  
For architecture or implementation, see:

- `README.md`
- `docs/architecture/SYSTEM_OVERVIEW.md`

---

## 1. Lead Qualification Logic (Website Leads)

A lead is considered a **Website Lead** only if all conditions match the required pattern.

| Field | Required Value | Notes |
|-------|----------------|-------|
| `workflowStatusId` | `619813fb2c9c3e8ce527be48` OR `65fb14d76ee665db4d8d2ce0` | Website Leads + Appointments (Shopmonkey quirk) |
| `status` | `"Estimate"` | Quote created, not work-in-progress |
| `authorized` | `false` | Customer has not committed yet |
| `messageCount` | `0` | No prior Shopmonkey contact |
| `name` | Starts with `"New Quote"` | Website form submissions |
| `appointmentDates` | empty array | No real appointment yet |
| `invoiced` | `false` | Not invoiced |
| `paid` | `false` | Not paid |
| service match | text contains `"tint"` or `"window"` | We only target window tinting services |

### Why Appointments Workflow?

Shopmonkey places website quotes in the Appointments workflow even when no appointment is created.  
We detect this with:

```javascript
appointmentDates.length === 0
```

---

## 2. Demo Mode (Safety Gate)

**Purpose:** prevent accidental contact with real Tint World customers in development.

### Modes

| Mode | Behavior |
|------|----------|
| `demoMode: true` | Only leads with a whitelisted test email are processed |
| `demoMode: false` | All qualified leads are processed (production) |

Demo mode defaults to `true`.

For the outbound message safety whitelist logic → see `README`.

---

## 3. Lead Ingestion Logic

We use a **dual ingestion model** to guarantee every lead is captured:

### Primary: Real-time Webhooks

- Triggered instantly on new Shopmonkey order events
- Median ingestion time < 1 second

### Backup: Polling (every 30s)

- Ensures no leads are missed if webhooks fail
- Picks up missed leads in ≤ 30 seconds

**Policy:**  
If both webhook and polling detect the same lead → webhook wins automatically.

---

## 4. Lead Contact Timing Policy

### Initial Contact

- **Goal:** first touch within 1 second of lead creation
- Achieved via webhook pipeline

### Historical Backfill

- Only the last 30 days are considered
- Backfill is one-time at system launch
- Prevents contacting stale leads

---

## 5. 13-Touch Follow-Up Strategy (30 Days)

If the customer does NOT respond, we send the following sequence:

| Touch # | Day | Description |
|---------|-----|-------------|
| 1 | 0 | Immediate first contact |
| 2 | 1 | Follow-up |
| 3 | 3 | Follow-up |
| 4 | 5 | Follow-up |
| 5 | 7 | Follow-up |
| 6 | 10 | Follow-up |
| 7 | 13 | Follow-up |
| 8 | 16 | Follow-up |
| 9 | 19 | Follow-up |
| 10 | 22 | Follow-up |
| 11 | 25 | Follow-up |
| 12 | 27 | Follow-up |
| 13 | 30 | Final follow-up |

**Average interval:** 2.3 days  
**Delivery channels:** SMS + Email  
**Outbound blocked unless customer email is whitelisted.**

### Stop Conditions

- Customer replies (SMS or chat)
- Customer books an appointment
- Customer opts out
- 13 touches completed
- Lead marked closed/lost on CRM

---

## 6. Lead Status Lifecycle

```
NEW
 → CONTACTED
 → CHAT_ACTIVE
 → APPOINTMENT_SCHEDULED
 → CONVERTED
       ↓
     LOST (if no response after 13 touches)
```

### Descriptions:

| Status | Meaning |
|--------|---------|
| `new` | Lead imported but untouched |
| `contacted` | Initial outbound message sent |
| `chat_active` | Customer entered AI chat flow |
| `appointment_scheduled` | Appointment booked in Shopmonkey |
| `converted` | Service performed |
| `lost` | No response after 13 touches |

---

## 7. MVP Scope (Strict)

### In Scope

- Website leads only
- Window tinting services only
- Shopmonkey CRM integration
- Webhook + polling ingestion
- Touch-point engine (13 touches)
- SMS and email via vendors
- Multi-tenant schema (1 tenant active in MVP)
- AI chat context loading + message history
- Service catalog ingestion (23 tinting services)

### In Progress / Next

- Frontend chat UI integration
- System prompt: catalog-aware responses
- Appointment booking from chat
- Tenant onboarding flow
- Authentication (JWT or magic-link)

### Not in MVP

- PPF / coating / bedliner services
- Walk-ins / phone quotes
- Multiple tenants in production
- Analytics dashboard (post-MVP)

---

## 8. Shopmonkey Service Catalog Logic

The system automatically imports, filters, and caches the tenant's window-tint-related services from:

```
GET /v3/canned_service?limit=200
```

### Rules:

- Only active services
- Location-specific
- Covers pricing, durations, names
- No manual data entry needed

**23 tinting services discovered for Store094.**

These power:

- Price quoting in chat
- Appointment booking routing
- Upsell recommendations (post-MVP)

---

## 9. KPIs (MVP + Post-MVP)

### MVP (system correctness)

- Lead response time: <1s
- Webhook delivery success: >99%
- Polling recovery rate: <1% of leads
- Touch-point execution correctness: 100% scheduled and sent (if allowed)

### Post-MVP (business metrics)

- Customer response rate
- Appointment conversion rate
- Drop-off by touch point
- Catalog-driven upsell rate
- Chat engagement rate
- Appointments scheduled via chat

---

## 10. Change Log

| Date | Change |
|------|--------|
| 2025-11-29 | Version 1.4 — Trimmed, non-duplicate, modernized for 3-doc structure |
| 2025-11-26 | Added service catalog section |
| 2025-11-26 | Workspace migration complete |
| 2025-11-25 | Webhook timing update (<1s) |
| 2025-11-25 | Multi-tenant schema summary |
| 2025-11-23 | Initial MVP logic draft |