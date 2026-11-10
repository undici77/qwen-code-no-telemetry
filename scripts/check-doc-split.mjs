#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// Lossless-restructure proof for the fork's prose docs, the counterpart of
// compact-md-tables.mjs for content that moves between files. Every non-empty
// line of the OLD file must appear, count included, among the lines of the NEW
// files taken together. Whatever is new is listed so a human can read exactly
// what was added. A deliberate rewrite is named with --accept <substring>.
//
//   node scripts/check-doc-split.mjs <old.md> <new.md>... [--accept <text>]...

import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const accept = [];
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--accept') accept.push(args[++i]);
  else files.push(args[i]);
}
const [oldFile, ...newFiles] = files;
if (!oldFile || newFiles.length === 0) {
  console.error(
    'usage: check-doc-split.mjs <old.md> <new.md>... [--accept <text>]...',
  );
  process.exit(2);
}

const lines = (f) =>
  readFileSync(f, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
const tally = (ls) => {
  const m = new Map();
  for (const l of ls) m.set(l, (m.get(l) ?? 0) + 1);
  return m;
};

const oldLines = lines(oldFile);
const newLines = newFiles.flatMap(lines);
const have = tally(newLines);
const missing = [];
for (const [l, n] of tally(oldLines)) {
  if (accept.some((a) => l.includes(a))) continue;
  const short = n - (have.get(l) ?? 0);
  for (let i = 0; i < short; i++) missing.push(l);
}
const added = [];
const want = tally(oldLines);
for (const [l, n] of have) {
  const extra = n - (want.get(l) ?? 0);
  for (let i = 0; i < extra; i++) added.push(l);
}

console.log(
  `old: ${oldLines.length} lines | new (${newFiles.length} files): ${newLines.length} lines | added: ${added.length}`,
);
for (const l of added) console.log(`  + ${l.slice(0, 150)}`);
if (missing.length > 0) {
  console.error(
    `\n✗ ${missing.length} line(s) of ${oldFile} are not in the new files:`,
  );
  for (const l of missing.slice(0, 20)) console.error(`  - ${l.slice(0, 150)}`);
  process.exit(1);
}
console.log('\n✓ every line of the old file is present in the new files.');
