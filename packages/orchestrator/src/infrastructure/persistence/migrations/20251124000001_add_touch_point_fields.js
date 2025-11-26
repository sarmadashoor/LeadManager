/**
 * Add touch point tracking fields to leads table
 * Supports the 13-touch follow-up schedule
 */
exports.up = function(knex) {
  return knex.schema.alterTable('leads', (table) => {
    // Touch point tracking
    table.integer('touch_point_count').notNullable().defaultTo(0);
    table.timestamp('next_touch_point_at');
    table.timestamp('last_contacted_at');
    
    // Index for efficient querying of leads due for follow-up
    table.index(['tenant_id', 'next_touch_point_at'], 'idx_leads_next_touch_point');
    table.index(['tenant_id', 'status', 'next_touch_point_at'], 'idx_leads_status_next_touch');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('leads', (table) => {
    table.dropIndex(['tenant_id', 'next_touch_point_at'], 'idx_leads_next_touch_point');
    table.dropIndex(['tenant_id', 'status', 'next_touch_point_at'], 'idx_leads_status_next_touch');
    table.dropColumn('touch_point_count');
    table.dropColumn('next_touch_point_at');
    table.dropColumn('last_contacted_at');
  });
};
