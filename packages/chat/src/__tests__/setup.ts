// packages/chat/src/__tests__/setup.ts

import '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'claude';
process.env.ANTHROPIC_API_KEY = 'test-key-anthropic';
process.env.OPENAI_API_KEY = 'test-key-openai';

// Increase timeout for API calls
jest.setTimeout(10000);
