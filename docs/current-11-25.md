┌─────────────────────────────────────────────────────────────────┐
│ CUSTOMER ACTION: Submits quote on tintworld.com                │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ SHOPMONKEY: Creates Order                                       │
│ - workflowStatusId: 65fb14d76ee665db4d8d2ce0 (Appointments)    │
│ - status: "Estimate"                                            │
│ - authorized: false                                             │
│ - messageCount: 0                                               │
│ - Contains: orderId, customerId, vehicleId                      │
│ - Does NOT contain: Full customer email/phone, vehicle details │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ SHOPMONKEY WEBHOOK: Fires immediately                          │
│ POST to: https://our-domain.com/webhooks/shopmonkey/order      │
│ Payload: Order data (incomplete)                               │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ OUR WEBHOOK HANDLER: Receives + Enriches                       │
│ 1. Validates order is a website lead                           │
│ 2. Calls ShopMonkey API: GET /customer/{customerId}            │
│ 3. Calls ShopMonkey API: GET /vehicle/{vehicleId}              │
│ 4. Assembles complete lead data                                │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ POSTGRESQL: Lead Record Created                                │
│                                                                 │
│ leads table:                                                    │
│ - id: uuid (our primary key)                                   │
│ - crm_work_order_id: orderId from ShopMonkey                   │
│ - crm_source: "shopmonkey"                                     │
│ - customer_name: "Sarmad Ashoor"                               │
│ - customer_email: "sarmad@example.com"                         │
│ - customer_phone: "+16194838249"                               │
│ - vehicle_description: "2024 Tesla Model 3"                    │
│ - service_name: "New Quote Auto Window Tinting"                │
│ - status: "new"                                                │
│ - touch_point_count: 0                                         │
│ - next_touch_point_at: NOW() (immediate)                       │
│ - crm_metadata: {full ShopMonkey order object}                 │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ TOUCH POINT PROCESSOR: Runs every 10 seconds                   │
│ 1. Queries: SELECT * FROM leads                                │
│    WHERE next_touch_point_at <= NOW()                          │
│ 2. Finds our lead (scheduled for NOW)                          │
│ 3. Calls touch point handler                                   │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ EMAIL SENT (SendGrid)                                           │
│ To: customer_email                                              │
│ Subject: "Your Tint World Quote is Ready!"                     │
│ Body: "Hi Sarmad, click here to chat: {LINK}"                  │
│ Link: https://chat.tintworld.com/{leadId}                      │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ SMS SENT (Twilio - when A2P approved)                          │
│ To: customer_phone                                              │
│ Body: "Hi Sarmad! Thanks for your quote. Chat: {LINK}"         │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE UPDATE                                                 │
│ UPDATE leads SET:                                               │
│   status = 'contacted'                                          │
│   touch_point_count = 1                                         │
│   last_contacted_at = NOW()                                     │
│   next_touch_point_at = NOW() + 1 day (for follow-up)          │
└─────────────────────────────────────────────────────────────────┘
                               ↓
                        ⏸️  **STOPS HERE**
                     (Chat doesn't exist yet)