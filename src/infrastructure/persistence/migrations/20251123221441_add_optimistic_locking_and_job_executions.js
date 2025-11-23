exports.up = async function(knex) {
  // Add optimistic locking to leads
  await knex.schema.alterTable('leads', (table) => {
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('locked_at');
    table.string('locked_by', 100);
  });

  // Add optimistic locking to chat_sessions
  await knex.schema.alterTable('chat_sessions', (table) => {
    table.integer('version').notNullable().defaultTo(1);
  });

  // Create job_executions table for idempotency and observability
  await knex.schema.createTable('job_executions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    
    table.string('job_type', 100).notNullable();
    table.string('job_key', 255);  // For idempotency (e.g., "poll:tenant:123:2024-01-01")
    table.string('status', 50).notNullable().defaultTo('running');
    
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    table.integer('duration_ms');
    
    table.integer('leads_processed').defaultTo(0);
    table.integer('leads_created').defaultTo(0);
    table.integer('invitations_sent').defaultTo(0);
    table.integer('errors_count').defaultTo(0);
    
    table.text('error_message');
    table.text('error_stack');
    table.jsonb('metadata');
    
    table.timestamps(true, true);
    
    // Prevent duplicate job runs
    table.unique(['job_key']);
    table.index('tenant_id');
    table.index(['job_type', 'started_at']);
    table.index('status');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('job_executions');
  
  await knex.schema.alterTable('chat_sessions', (table) => {
    table.dropColumn('version');
  });
  
  await knex.schema.alterTable('leads', (table) => {
    table.dropColumn('version');
    table.dropColumn('locked_at');
    table.dropColumn('locked_by');
  });
};
