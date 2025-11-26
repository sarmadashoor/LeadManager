exports.up = async function(knex) {
  await knex.schema.createTable('chat_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('session_id').notNullable()
      .references('id').inTable('chat_sessions').onDelete('CASCADE');
    table.uuid('lead_id').notNullable()
      .references('id').inTable('leads').onDelete('CASCADE');
    
    table.string('role', 20).notNullable(); // 'user', 'assistant', 'system'
    table.text('content').notNullable();
    table.jsonb('metadata'); // For AI thinking, tools used, etc.
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes for fast retrieval
    table.index(['session_id', 'created_at']);
    table.index(['lead_id', 'created_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('chat_messages');
};