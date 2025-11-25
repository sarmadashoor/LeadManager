exports.up = async function(knex) {
  await knex.schema.createTable('location_hours', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('location_id').notNullable()
      .references('id').inTable('locations').onDelete('CASCADE');
    table.integer('day_of_week').notNullable(); // 0=Sunday, 6=Saturday
    table.time('opens_at').notNullable();
    table.time('closes_at').notNullable();
    table.boolean('is_closed').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Unique constraint: one entry per location per day
    table.unique(['location_id', 'day_of_week']);
    
    // Indexes
    table.index('location_id');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('location_hours');
};