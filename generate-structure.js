#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ignore = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.turbo',
  '.DS_Store',
  'package-lock.json'
];

const descriptions = {
  'packages/orchestrator': 'Lead management service - webhooks, SMS, polling (port 3000)',
  'packages/chat': 'AI chat API - Claude/OpenAI integration (port 3001)',
  'packages/frontend': 'React chat UI - customer interface (port 5173)',
  'packages/shared': 'Shared TypeScript types and validation',
  'docs': 'Documentation and guides',
  'docs/architecture': 'System architecture documentation',
  'docs/archive': 'Historical documentation snapshots',
  'src/infrastructure': 'Database, CRM adapters, external services',
  'src/services': 'Business logic layer',
  'src/api': 'HTTP controllers and routes',
  'src/repositories': 'Database access layer',
  'src/__tests__': 'Test files and utilities'
};

// Default depth for most of the tree
const DEFAULT_MAX_LEVEL = 4;
// Extra depth for tests (we want to see all test files)
const TEST_MAX_LEVEL = 10;

function tree(dir, prefix = '', level = 0, maxLevel = DEFAULT_MAX_LEVEL, output = []) {
  if (level > maxLevel) return output;

  let items;
  try {
    items = fs.readdirSync(dir).filter(item => !ignore.includes(item));
  } catch {
    return output;
  }

  items.forEach((item, index) => {
    const fullPath = path.join(dir, item);
    const isLast = index === items.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const relativePath = fullPath.replace(process.cwd() + path.sep, '');

    let line = prefix + connector + item;

    // Add description if available
    if (descriptions[relativePath]) {
      line += ` # ${descriptions[relativePath]}`;
    }

    output.push(line);

    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      return;
    }

    if (stat.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');

      // If this is a __tests__ directory (anywhere), allow deeper traversal
      const isTestsDir =
        item === '__tests__' || relativePath.includes(`${path.sep}__tests__`);

      const nextMaxLevel = isTestsDir ? TEST_MAX_LEVEL : maxLevel;

      tree(fullPath, newPrefix, level + 1, nextMaxLevel, output);
    }
  });

  return output;
}

const nowIso = new Date().toISOString();
const nowPretty = new Date().toLocaleDateString();

const header = `# Lead Orchestrator - Project Structure

**Generated:** ${nowIso}
**Status:** Chat API Complete, Frontend Next

This file is auto-generated. Run \`node generate-structure.js\` to update.

---

## Package Overview

- **orchestrator/** - Main lead management service (Shopmonkey, SMS, webhooks)
- **chat/** - AI chat API with Claude + OpenAI (REST + SSE streaming)
- **frontend/** - React chat UI - customer interface (port 5173)
- **shared/** - Shared TypeScript types

---

## Directory Tree

\`\`\`
LeadManager/
`;

const output = [header];
const treeLines = tree('.');
output.push(...treeLines);
output.push('```' + '\n');

output.push(`
---

## Key Files

### Configuration
- \`package.json\` - Workspace root configuration
- \`docker-compose.yml\` - PostgreSQL database
- \`knexfile.js\` - Database migrations config (orchestrator)
- \`.env\` files - Environment variables (per package)

### Documentation
- \`docs/START_HERE.md\` - Navigation guide for LLMs
- \`docs/HANDOFF.md\` - Current status and known issues
- \`docs/architecture/SYSTEM_OVERVIEW.md\` - Architecture map
- \`docs/architecture/PHASED_IMPLEMENTATION.md\` - Implementation history

### Package Entry Points
- \`packages/orchestrator/src/index.ts\` - Orchestrator main
- \`packages/chat/src/server.ts\` - Chat API server
- \`packages/chat/src/api/routes.ts\` - Chat API routes
- \`packages/frontend/src/App.tsx\` - Frontend main

### Tests
- \`packages/orchestrator/src/__tests__/\` - Orchestrator tests
- \`packages/chat/src/__tests__/\` - Chat API tests

---

## Important Subdirectories

### packages/orchestrator/src/
- \`infrastructure/\` - Database, CRM, webhooks, messaging, jobs
  - \`persistence/\` - Database and repositories
  - \`crm/\` - Shopmonkey adapter
  - \`webhooks/\` - Webhook handlers
  - \`messaging/\` - Twilio/SendGrid services
  - \`jobs/\` - Polling and touch point processors
- \`services/\` - Business logic (LeadOrchestrationService)
- \`domain/\` - Domain models (if any)

### packages/chat/src/
- \`ai/\` - AI provider abstraction
  - \`providers/\` - Claude, OpenAI implementations
- \`api/\` - HTTP controllers and routes
  - \`controllers/\` - ChatController
- \`repositories/\` - Database access (ChatMessageRepository)
- \`services/\` - Business logic (ChatService)
- \`infrastructure/\` - Database connection

### packages/frontend/src/
- \`components/\` - React components
- \`hooks/\` - Custom React hooks
- \`api/\` - API client for chat

---

**Last Updated:** ${nowPretty}
`);

const content = output.join('\n');

fs.writeFileSync('PROJECT_STRUCTURE.md', content);
console.log('✅ Generated PROJECT_STRUCTURE.md');
