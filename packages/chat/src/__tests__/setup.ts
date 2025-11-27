// packages/chat/src/__tests__/setup.ts

import db from '../infrastructure/db';

// Ensure database connections are cleaned up after all tests
afterAll(async () => {
  await db.destroy();
});
