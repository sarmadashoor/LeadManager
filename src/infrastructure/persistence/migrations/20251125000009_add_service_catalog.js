exports.up = async function(knex) {
  await knex.schema.createTable('service_catalog', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable()
      .references('id').inTable('tenants').onDelete('CASCADE');
    table.uuid('location_id').nullable()
      .references('id').inTable('locations').onDelete('CASCADE');
    
    // Service identification
    table.string('service_type', 50).notNullable(); // 'window-tinting', 'ppf', etc.
    table.string('sku', 100);
    table.string('name', 200).notNullable();
    table.text('description');
    
    // Pricing
    table.integer('base_price_cents').notNullable();
    
    // Service details
    table.integer('duration_minutes');
    table.boolean('requires_appointment').defaultTo(true);
    
    // Display settings
    table.integer('display_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_featured').defaultTo(false);
    
    // CRM sync
    table.string('crm_service_id', 100);
    table.timestamp('last_synced_at');
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes for multi-tenant queries
    table.index(['tenant_id', 'location_id', 'service_type']);
    table.index(['tenant_id', 'location_id', 'is_active']);
    table.index(['tenant_id', 'service_type', 'is_active']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('service_catalog');
};