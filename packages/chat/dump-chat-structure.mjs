// dump-chat-structure.mjs
// Run from the chat package root: `node dump-chat-structure.mjs`
// Outputs:
//   - _chat_tree.txt        → folder/file tree
//   - _chat_files_dump.txt  → concatenated source file contents

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;

const TREE_OUTPUT = path.join(ROOT, '_chat_tree.txt');
const SCRAPE_OUTPUT = path.join(ROOT, '_chat_files_dump.txt');

// Directories we don't want to traverse
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.turbo',
  '.next',
  'dist',
  'build',
  'coverage',
  '.cache',
  '.idea',
  '.vscode',
  'logs',
  'tmp',
  '.DS_Store'
]);

// File extensions we care about for the scrape
const INCLUDED_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.env',
  '.env.local',
]);

// Avoid accidentally pulling in massive files
const MAX_FILE_SIZE_BYTES = 512 * 1024; // 512 KB per file

function isDirectory(fullPath) {
  try {
    return fs.statSync(fullPath).isDirectory();
  } catch {
    return false;
  }
}

function isFile(fullPath) {
  try {
    return fs.statSync(fullPath).isFile();
  } catch {
    return false;
  }
}

function shouldIncludeFile(filePath) {
  const rel = path.relative(ROOT, filePath);
  if (rel.startsWith('_chat_tree.txt') || rel.startsWith('_chat_files_dump.txt')) {
    return false;
  }

  const ext = path.extname(filePath);
  if (INCLUDED_EXTS.has(ext)) return true;

  // Allow some specific filenames without extensions
  const base = path.basename(filePath);
  if (base === 'package.json' || base === 'tsconfig.json') return true;

  return false;
}

function getChildrenSorted(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries
      .filter((d) => {
        if (d.isDirectory() && EXCLUDED_DIRS.has(d.name)) return false;
        return true;
      })
      .sort((a, b) => {
        // Directories first, then files, both alphabetically
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });
  } catch {
    return [];
  }
}

// ------- TREE GENERATION -------

function buildTree(dirPath, prefix = '') {
  const children = getChildrenSorted(dirPath);
  const lines = [];

  children.forEach((entry, index) => {
    const isLast = index === children.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const line = `${prefix}${connector}${entry.name}`;
    lines.push(line);

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      const childPath = path.join(dirPath, entry.name);
      lines.push(...buildTree(childPath, newPrefix));
    }
  });

  return lines;
}

// ------- FILE SCRAPE -------

function collectFiles(dirPath) {
  const files = [];
  const children = getChildrenSorted(dirPath);

  children.forEach((entry) => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (entry.isFile()) {
      if (shouldIncludeFile(fullPath)) {
        files.push(fullPath);
      }
    }
  });

  return files;
}

function scrapeFiles(filePaths) {
  const chunks = [];

  for (const filePath of filePaths) {
    let stats;
    try {
      stats = fs.statSync(filePath);
    } catch {
      continue;
    }

    if (!stats.isFile()) continue;
    if (stats.size > MAX_FILE_SIZE_BYTES) {
      const rel = path.relative(ROOT, filePath);
      chunks.push(
        `\n\n// ===== FILE: ${rel} (skipped: > ${MAX_FILE_SIZE_BYTES} bytes) =====\n`
      );
      continue;
    }

    const relPath = path.relative(ROOT, filePath);
    chunks.push(`\n\n// ===== FILE: ${relPath} =====\n`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      chunks.push(content);
    } catch (err) {
      chunks.push(`// [ERROR READING FILE]: ${err.message}`);
    }
  }

  return chunks.join('');
}

// ------- MAIN -------

function main() {
  console.log('Generating chat package tree and file dump...\nRoot:', ROOT);

  // Tree
  const treeLines = [path.basename(ROOT), ...buildTree(ROOT)];
  fs.writeFileSync(TREE_OUTPUT, treeLines.join('\n'), 'utf8');
  console.log(`✓ Wrote tree to ${TREE_OUTPUT}`);

  // File scrape
  const files = collectFiles(ROOT);
  console.log(`Found ${files.length} files to scrape...`);
  const dump = scrapeFiles(files);
  fs.writeFileSync(SCRAPE_OUTPUT, dump, 'utf8');
  console.log(`✓ Wrote file dump to ${SCRAPE_OUTPUT}`);

  console.log('\nDone.');
}

main();
