exports.up = function(knex) {
  return knex.schema.createTable('leads', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.uuid('location_id').references('id').inTable('locations');
    
    table.string('crm_source', 50).notNullable();
    table.string('crm_work_order_id', 255).notNullable();
    table.string('crm_work_order_number', 100);
    table.string('status', 50).notNullable().defaultTo('new');
    
    table.string('customer_external_id', 255);
    table.string('customer_name', 255);
    table.string('customer_phone', 20);
    table.string('customer_email', 255);
    
    table.string('vehicle_external_id', 255);
    table.integer('vehicle_year');
    table.string('vehicle_make', 100);
    table.string('vehicle_model', 100);
    table.text('vehicle_description');
    
    table.string('service_type', 100).notNullable();
    table.text('service_name');
    table.text('service_specifications');
    table.integer('estimated_cost_cents');
    
    table.uuid('chat_session_id');
    table.timestamp('invitation_sent_at');
    table.timestamp('first_response_at');
    table.timestamp('appointment_created_at');
    table.jsonb('crm_metadata');
    
    table.timestamps(true, true);
    table.timestamp('processed_at');
    
    table.unique(['tenant_id', 'crm_source', 'crm_work_order_id']);
    table.index('tenant_id');
    table.index(['tenant_id', 'status']);
    table.index(['tenant_id', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('leads');
};
