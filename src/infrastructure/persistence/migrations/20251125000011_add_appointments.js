exports.up = async function(knex) {
  await knex.schema.createTable('appointments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable()
      .references('id').inTable('tenants').onDelete('CASCADE');
    table.uuid('location_id').notNullable()
      .references('id').inTable('locations').onDelete('CASCADE');
    table.uuid('lead_id').notNullable()
      .references('id').inTable('leads').onDelete('CASCADE');
    
    // Appointment details
    table.timestamp('scheduled_at').notNullable();
    table.integer('duration_minutes').notNullable();
    
    // Services (array of UUIDs from service_catalog)
    table.specificType('service_ids', 'UUID[]').notNullable();
    table.integer('total_price_cents').notNullable();
    
    // Status
    table.string('status', 50).notNullable().defaultTo('confirmed');
    // 'confirmed', 'cancelled', 'completed', 'no_show'
    
    // Customer confirmation
    table.timestamp('customer_confirmed_at');
    table.string('confirmation_method', 50); // 'email', 'sms', 'chat'
    
    // Staff assignment (future)
    table.uuid('assigned_technician_id');
    
    // ShopMonkey sync
    table.string('shopmonkey_appointment_id', 100);
    table.timestamp('synced_to_crm_at');
    
    // Cancellation tracking
    table.timestamp('cancelled_at');
    table.string('cancelled_by', 50); // 'customer', 'staff', 'system'
    table.text('cancellation_reason');
    
    // Completion tracking
    table.timestamp('completed_at');
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes for availability queries
    table.index(['tenant_id', 'location_id', 'scheduled_at']);
    table.index(['tenant_id', 'location_id', 'status']);
    table.index('lead_id');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('appointments');
};