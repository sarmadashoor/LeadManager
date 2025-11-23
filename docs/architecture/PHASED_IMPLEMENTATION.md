# Lead Orchestrator - Phased Implementation Guide

**Version:** 1.0  
**Last Updated:** November 23, 2025  
**Status:** Phase 1 (MVP)

---

## Overview

This document describes our **phased approach** to implementing the Lead Orchestrator architecture. We build pragmatically for MVP, with a clear upgrade path when complexity requires it.

**Philosophy:** "Make it work, make it right, make it fast"

---

## Current Phase: MVP (Single Tenant, Single CRM)

### What We're Building Now
```
┌─────────────────────────────────────────────────────────┐
│                     MVP Architecture                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ShopMonkey API                                        │
│        │                                                 │
│        ▼                                                 │
│   ┌──────────────────┐                                  │
│   │ ShopMonkeyAdapter │  ← Direct implementation        │
│   └────────┬─────────┘                                  │
│            │                                             │
│            ▼                                             │
│   ┌──────────────────┐                                  │
│   │  LeadRepository   │  ← Concrete class (no interface)│
│   └────────┬─────────┘                                  │
│            │                                             │
│            ▼                                             │
│   ┌──────────────────┐                                  │
│   │    PostgreSQL     │                                  │
│   └──────────────────┘                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### MVP File Structure
```
src/
├── config/
│   └── index.ts                 # Environment config
├── infrastructure/
│   ├── persistence/
│   │   ├── db.ts               # Database connection
│   │   ├── migrations/         # Schema migrations
│   │   └── repositories/
│   │       ├── TenantRepository.ts      # Concrete class
│   │       ├── LeadRepository.ts        # Concrete class
│   │       └── JobExecutionRepository.ts
│   ├── crm/
│   │   └── ShopMonkeyAdapter.ts         # Direct implementation
│   ├── messaging/
│   │   ├── TwilioService.ts
│   │   └── SendGridService.ts
│   └── queue/
│       └── JobScheduler.ts
├── services/
│   └── LeadOrchestrationService.ts      # Business logic
├── api/
│   └── routes/
│       └── webhooks.ts
└── __tests__/
    ├── database.test.ts
    ├── repositories/
    │   └── LeadRepository.test.ts
    └── crm/
        └── ShopMonkeyAdapter.test.ts
```

### What We Skip in MVP

| Component | MVP Approach | Full Architecture |
|-----------|--------------|-------------------|
| Repository interfaces | Concrete classes only | ILeadRepository interface |
| CRM adapter interface | ShopMonkeyAdapter direct | ICRMAdapter interface |
| Domain models | TypeScript types | Full classes with methods |
| Value objects | Plain strings | PhoneNumber, Email classes |
| Domain events | None | Event bus pattern |
| Tenant context middleware | Simple header check | Full middleware with caching |

---

## Phase 2: Abstraction Trigger

### When to Abstract

**Add interfaces when ANY of these occur:**

1. **Second CRM needed** (e.g., Tekmetric customer signs up)
2. **Second tenant with different config** (e.g., different polling interval)
3. **Unit testing requires mocking** (cannot test without real DB)
4. **Team grows beyond 2 engineers** (need clearer contracts)

---

## Refactoring Guide: MVP → Full Architecture

### Step 1: Extract Repository Interfaces (1 hour)

**Before (MVP):**
```typescript
// src/infrastructure/persistence/repositories/LeadRepository.ts
import { db } from '../db';

export class LeadRepository {
  async findByTenant(tenantId: string) {
    return db('leads').where({ tenant_id: tenantId });
  }

  async create(tenantId: string, data: CreateLeadData) {
    return db('leads').insert({ ...data, tenant_id: tenantId }).returning('*');
  }
}
```

**After (Full Architecture):**
```typescript
// src/domain/repositories/ILeadRepository.ts
export interface ILeadRepository {
  findByTenant(tenantId: string): Promise<Lead[]>;
  create(tenantId: string, data: CreateLeadData): Promise<Lead>;
}

// src/infrastructure/persistence/repositories/LeadRepository.ts
import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';

export class LeadRepository implements ILeadRepository {
  // Same implementation, now implements interface
}
```

---

### Step 2: Extract CRM Adapter Interface (1 hour)

**Before (MVP):**
```typescript
// src/infrastructure/crm/ShopMonkeyAdapter.ts
export class ShopMonkeyAdapter {
  async fetchNewLeads(since: Date): Promise<Lead[]> { }
  async getCustomer(customerId: string): Promise<Customer> { }
}
```

**After (Full Architecture):**
```typescript
// src/domain/ports/ICRMAdapter.ts
export interface ICRMAdapter {
  fetchNewLeads(since: Date): Promise<Lead[]>;
  getCustomer(customerId: string): Promise<Customer>;
  getVehicle(vehicleId: string): Promise<Vehicle>;
  createAppointment(lead: Lead, appointment: AppointmentData): Promise<void>;
}

// src/infrastructure/crm/ShopMonkeyAdapter.ts
export class ShopMonkeyAdapter implements ICRMAdapter { }

// src/infrastructure/crm/TekmetricAdapter.ts (NEW)
export class TekmetricAdapter implements ICRMAdapter { }
```

---

### Step 3: Add Adapter Registry (30 min)
```typescript
// src/infrastructure/crm/CRMAdapterRegistry.ts
export class CRMAdapterRegistry {
  private adapters = new Map([
    ['shopmonkey', ShopMonkeyAdapter],
    ['tekmetric', TekmetricAdapter],
  ]);

  getAdapter(crmType: string, config: any): ICRMAdapter {
    const AdapterClass = this.adapters.get(crmType);
    return new AdapterClass(config);
  }
}
```

---

### Step 4: Add Dependency Injection (30 min)

**Before:**
```typescript
export class LeadOrchestrationService {
  private leadRepo = new LeadRepository();
  private crmAdapter = new ShopMonkeyAdapter(config);
}
```

**After:**
```typescript
export class LeadOrchestrationService {
  constructor(
    private leadRepo: ILeadRepository,
    private crmAdapter: ICRMAdapter
  ) {}
}
```

---

## Refactoring Summary

| Step | Time | Description |
|------|------|-------------|
| 1. Repository interfaces | 1 hour | Extract ILeadRepository, ITenantRepository |
| 2. CRM adapter interface | 1 hour | Extract ICRMAdapter |
| 3. Adapter registry | 30 min | Create CRMAdapterRegistry |
| 4. Dependency injection | 30 min | Update services to use constructor injection |
| **Total** | **~3 hours** | |

---

## Code Quality Rules (Both Phases)

### Always Required
```typescript
// ✅ ALWAYS: Tenant scoping on every query
async findByStatus(tenantId: string, status: string) {
  return db('leads').where({ tenant_id: tenantId, status });
}

// ❌ NEVER: Query without tenant_id
async findByStatus(status: string) {
  return db('leads').where({ status }); // DATA LEAK RISK!
}
```
```typescript
// ✅ ALWAYS: Input validation
const validated = CreateLeadSchema.parse(data);

// ❌ NEVER: Trust raw input
return db('leads').insert(data); // INJECTION RISK!
```

---

## Checklist: Before Adding Complexity

Before abstracting, ask:

- [ ] Do we have a second CRM to integrate?
- [ ] Do we have multiple tenants with different configs?
- [ ] Is the team struggling to understand the code?
- [ ] Are we unable to write unit tests?

**If all answers are "No" → Stay with MVP approach**

---

## Summary

| Aspect | MVP (Now) | Full Architecture (Later) |
|--------|-----------|---------------------------|
| Repositories | Concrete classes | Interface + Implementation |
| CRM Adapters | ShopMonkeyAdapter only | ICRMAdapter + Registry |
| Testing | Integration tests | Unit + Integration tests |
| Refactor Time | - | ~3 hours |

**Bottom Line:** Build correctly for current needs, with documented upgrade path.
