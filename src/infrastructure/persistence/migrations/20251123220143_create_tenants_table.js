exports.up = function(knex) {
  return knex.schema.createTable('tenants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('slug', 50).unique().notNullable();
    table.string('name', 255).notNullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.string('plan_tier', 50);
    table.string('subscription_status', 50);
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    table.index('slug');
    table.index('status');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tenants');
};
