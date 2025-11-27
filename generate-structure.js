#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ignore = [
  'node_modules', '.git', 'dist', 'build', '.next', 
  'coverage', '.turbo', '.DS_Store', 'package-lock.json'
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

function tree(dir, prefix = '', level = 0, maxLevel = 3, output = []) {
  if (level > maxLevel) return output;
  
  try {
    const items = fs.readdirSync(dir).filter(item => !ignore.includes(item));
    
    items.forEach((item, index) => {
      const fullPath = path.join(dir, item);
      const isLast = index === items.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const relativePath = fullPath.replace(process.cwd() + '/', '');
      
      let line = prefix + connector + item;
      
      // Add description if available
      if (descriptions[relativePath]) {
        line += ` # ${descriptions[relativePath]}`;
      }
      
      output.push(line);
      
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          tree(fullPath, newPrefix, level + 1, maxLevel, output);
        }
      } catch (e) {}
    });
  } catch (e) {}
  
  return output;
}

const header = `# Lead Orchestrator - Project Structure

**Generated:** ${new Date().toISOString()}
**Status:** Chat API Complete, Frontend Next

This file is auto-generated. Run \`node generate-structure.js\` to update.

---

## Package Overview

- **orchestrator/** - Main lead management service (Shopmonkey, SMS, webhooks)
- **chat/** - AI chat API with Claude + OpenAI (REST + SSE streaming)
- **frontend/** - React chat UI (not started yet)
- **shared/** - Shared TypeScript types

---

## Directory Tree

\`\`\`
LeadManager/
`;

const output = [header];
const treeLines = tree('.', '', 0, 3);
output.push(...treeLines);
output.push('```\n');

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
- \`packages/frontend/src/App.tsx\` - Frontend main (not built)

### Tests
- \`packages/orchestrator/src/__tests__/\` - Orchestrator tests
- \`packages/chat/src/__tests__/\` - Chat API tests (33 passing)

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

### packages/frontend/src/ (planned)
- \`components/\` - React components
- \`hooks/\` - Custom React hooks
- \`api/\` - API client for chat

---

**Last Updated:** ${new Date().toLocaleDateString()}
`);

const content = output.join('\n');
fs.writeFileSync('PROJECT_STRUCTURE.txt', content);
console.log('✅ Generated PROJECT_STRUCTURE.txt');
