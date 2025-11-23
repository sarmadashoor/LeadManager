exports.up = function(knex) {
  return knex.schema.createTable('tenant_crm_configs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('crm_type', 50).notNullable();
    table.jsonb('crm_credentials').notNullable();
    table.boolean('polling_enabled').defaultTo(true);
    table.integer('polling_interval_minutes').defaultTo(5);
    table.timestamp('last_polled_at');
    table.string('last_poll_status', 50);
    table.integer('consecutive_failures').defaultTo(0);
    table.jsonb('last_error');
    table.timestamps(true, true);
    
    table.index('tenant_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tenant_crm_configs');
};
