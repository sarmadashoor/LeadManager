#!/usr/bin/env node

/**
 * dump-frontend.js
 *
 * Produces a full text dump of:
 *  - directory tree (recursive)
 *  - contents of all major source files
 *
 * Output is saved to: frontend_dump.txt
 *
 * Useful for LLM analysis.
 */

const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = "frontend_dump.txt";
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

// ----------------------------------------------
// Step 1: Build directory tree
// ----------------------------------------------
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

// ----------------------------------------------
// Step 2: Gather file contents
// ----------------------------------------------
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

// ----------------------------------------------
// Step 3: Generate output file
// ----------------------------------------------
let output = "";

// HEADER
output += "==============================\n";
output += " FRONTEND DIRECTORY TREE\n";
output += "==============================\n\n";
output += buildTree(ROOT);

// CONTENTS
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

// WRITE TO FILE
fs.writeFileSync(OUTPUT_FILE, output);

console.log(`✅ Frontend dump created: ${OUTPUT_FILE}`);
