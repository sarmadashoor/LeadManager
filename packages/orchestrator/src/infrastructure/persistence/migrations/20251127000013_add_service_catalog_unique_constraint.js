exports.up = async function(knex) {
  // Add unique constraint for upsert logic
  // This allows NULL location_id but requires uniqueness when crm_service_id is present
  await knex.schema.alterTable('service_catalog', (table) => {
    table.unique(['tenant_id', 'location_id', 'crm_service_id'], {
      indexName: 'service_catalog_unique_crm_id'
    });
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('service_catalog', (table) => {
    table.dropUnique(['tenant_id', 'location_id', 'crm_service_id'], 'service_catalog_unique_crm_id');
  });
};
