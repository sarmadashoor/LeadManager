exports.up = async function(knex) {
  // First, make sure all existing leads have a location_id
  // For Store094, set to their location
  const store094Location = await knex('locations')
    .where({ external_id: '6198139a5391fa197fac13e7' })
    .first();
  
  if (store094Location) {
    // Update any leads without location_id to use Store094
    await knex('leads')
      .whereNull('location_id')
      .update({ location_id: store094Location.id });
  }
  
  // Now make location_id required
  await knex.schema.alterTable('leads', (table) => {
    table.uuid('location_id').notNullable().alter();
  });
  
  // Add multi-tenant indexes for better query performance
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS leads_tenant_location_status 
    ON leads(tenant_id, location_id, status)
  `);
  
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS leads_tenant_next_touch 
    ON leads(tenant_id, next_touch_point_at) 
    WHERE next_touch_point_at IS NOT NULL
  `);
  
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS leads_location_status 
    ON leads(location_id, status)
  `);
};

exports.down = async function(knex) {
  // Drop indexes
  await knex.raw('DROP INDEX IF EXISTS leads_tenant_location_status');
  await knex.raw('DROP INDEX IF EXISTS leads_tenant_next_touch');
  await knex.raw('DROP INDEX IF EXISTS leads_location_status');
  
  // Make location_id nullable again
  await knex.schema.alterTable('leads', (table) => {
    table.uuid('location_id').nullable().alter();
  });
};