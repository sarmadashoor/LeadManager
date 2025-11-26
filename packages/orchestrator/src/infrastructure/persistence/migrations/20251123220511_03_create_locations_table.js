exports.up = function(knex) {
  return knex.schema.createTable('locations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('external_id', 255);
    table.jsonb('address');
    table.string('timezone', 50).defaultTo('America/New_York');
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);
    
    table.unique(['tenant_id', 'external_id']);
    table.index('tenant_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('locations');
};
