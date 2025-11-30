#!/usr/bin/env node

/**
 * dump-orchestrator.cjs
 *
 * Produces a full text dump of:
 *   - directory tree (recursive)
 *   - contents of all orchestrator source files
 *
 * Output file: orchestrator_dump.txt
 */

const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = "orchestrator_dump.txt";
const ROOT = process.cwd();

const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  ".idea",
  ".vscode",
  ".turbo",
  "coverage",
]);

const IGNORE_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".map",
  ".lock",
  ".woff",
  ".woff2",
  ".ttf",
]);

/* ===============================
   Step 1: Directory Tree
   =============================== */

function buildTree(dir, prefix = "") {
  const items = fs.readdirSync(dir).filter(f => !f.startsWith(".DS_Store"));
  let output = "";

  items.forEach((item, idx) => {
    const fullPath = path.join(dir, item);
    const isLast = idx === items.length - 1;
    const connector = isLast ? "└── " : "├── ";

    output += `${prefix}${connector}${item}\n`;

    if (fs.statSync(fullPath).isDirectory()) {
      if (!IGNORE_DIRS.has(item)) {
        const newPrefix = prefix + (isLast ? "    " : "│   ");
        output += buildTree(fullPath, newPrefix);
      }
    }
  });

  return output;
}

/* ===============================
   Step 2: Collect file paths
   =============================== */

function collectFiles(dir) {
  let results = [];

  const items = fs.readdirSync(dir);

  for (const item of items) {
    if (IGNORE_DIRS.has(item)) continue;

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(collectFiles(fullPath));
    } else {
      const ext = path.extname(item);
      if (!IGNORE_EXT.has(ext)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

/* ===============================
   Step 3: Generate Dump
   =============================== */

let output = "";

// Header
output += "==============================\n";
output += " ORCHESTRATOR DIRECTORY TREE\n";
output += "==============================\n\n";
output += buildTree(ROOT);

// File contents
output += "\n\n==============================\n";
output += " FILE CONTENTS\n";
output += "==============================\n\n";

const files = collectFiles(ROOT);

for (const f of files) {
  output += `\n----------------------------------------------\n`;
  output += `FILE: ${path.relative(ROOT, f)}\n`;
  output += `----------------------------------------------\n\n`;

  try {
    const contents = fs.readFileSync(f, "utf8");
    output += contents + "\n";
  } catch (err) {
    output += `(Error reading file)\n`;
  }
}

// Write output
fs.writeFileSync(OUTPUT_FILE, output);
console.log(`✅ Orchestrator dump created: ${OUTPUT_FILE}`);
