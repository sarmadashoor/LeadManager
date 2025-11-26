// packages/chat/src/infrastructure/db.ts

import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://leadmanager:leadmanager_dev@localhost:5432/leadmanager',
  pool: {
    min: 2,
    max: 10
  }
});

export default db;