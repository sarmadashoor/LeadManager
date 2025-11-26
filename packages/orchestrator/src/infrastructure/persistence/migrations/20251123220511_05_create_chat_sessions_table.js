exports.up = function(knex) {
  return knex.schema.createTable('chat_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.uuid('lead_id').notNullable().references('id').inTable('leads');
    
    table.string('status', 50).notNullable().defaultTo('active');
    table.integer('messages_count').defaultTo(0);
    table.string('ai_model_used', 50);
    table.integer('total_tokens_used').defaultTo(0);
    
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('last_message_at');
    table.timestamp('completed_at');
    
    table.boolean('appointment_booked').defaultTo(false);
    table.integer('customer_satisfaction_score');
    table.timestamps(true, true);
    
    table.index('lead_id');
    table.index('tenant_id');
    table.index(['tenant_id', 'status']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('chat_sessions');
};
