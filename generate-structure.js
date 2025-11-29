#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

//
// ─── IGNORE RULES ───────────────────────────────────────────
//
const ignoreExact = new Set([
  'node_modules',
  '.git',
  '.turbo',
  'dist',
  'build',
  '.next',
  'coverage',
  '.DS_Store',
  '.idea',
  '.vscode',
  'package-lock.json',
  'yarn.lock',
  '.pnpm-store',
]);

// ignore by file extension
const ignoreExtensions = new Set([
  '.log',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.ico',
  '.map',
  '.css', // optional – remove if needed
  '.woff',
  '.woff2',
]);

// ignore by substring anywhere in path
const ignorePatterns = [
  'node_modules',
  '.git',
  '.turbo',
  'dist',
  'build',
  '.next',
  '.cache',
  'coverage',
];

//
// ─── DESCRIPTIONS USED IN OUTPUT ─────────────────────────────
//
const descriptions = {
  'packages/orchestrator': 'Lead management service - webhooks, SMS, polling (port 3000)',
  'packages/chat': 'AI chat API - Claude/OpenAI integration (port 3001)',
  'packages/frontend': 'React chat UI - customer interface (port 5173)',
  'packages/shared': 'Shared TypeScript types and validation',
};

const DEFAULT_MAX_LEVEL = 4;
const TEST_MAX_LEVEL = 10;

//
// ─── PATH FILTER ─────────────────────────────────────────────
//
function shouldIgnore(item, fullPath) {
  const lower = item.toLowerCase();

  // exact match
  if (ignoreExact.has(item) || ignoreExact.has(lower)) return true;

  // extension match
  const ext = path.extname(item).toLowerCase();
  if (ignoreExtensions.has(ext)) return true;

  // substring patterns
  for (const pattern of ignorePatterns) {
    if (fullPath.toLowerCase().includes(pattern)) return true;
  }

  return false;
}

//
// ─── TREE WALKER ─────────────────────────────────────────────
//
function tree(dir, prefix = '', level = 0, maxLevel = DEFAULT_MAX_LEVEL, output = []) {
  if (level > maxLevel) return output;

  let items;
  try {
    items = fs.readdirSync(dir).filter(item => {
      const fullPath = path.join(dir, item);
      return !shouldIgnore(item, fullPath);
    });
  } catch {
    return output;
  }

  items.forEach((item, index) => {
    const fullPath = path.join(dir, item);
    const isLast = index === items.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const relativePath = fullPath.replace(process.cwd() + path.sep, '');

    let line = prefix + connector + item;

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
      const isTestsDir =
        item === '__tests__' || relativePath.includes(`${path.sep}__tests__`);
      const nextMaxLevel = isTestsDir ? TEST_MAX_LEVEL : maxLevel;

      tree(fullPath, newPrefix, level + 1, nextMaxLevel, output);
    }
  });

  return output;
}

//
// ─── OUTPUT TEMPLATE ─────────────────────────────────────────
//
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
output.push(...tree('.'));
output.push('```' + '\n');

output.push(`
---

## Key Files
- package.json — workspace root
- docker-compose.yml — PostgreSQL config
- knexfile.js — migrations config
- .env — environment per package

---

## Last Updated: ${nowPretty}
`);

fs.writeFileSync('PROJECT_STRUCTURE.md', output.join('\n'));
console.log('✅ Generated PROJECT_STRUCTURE.md');
