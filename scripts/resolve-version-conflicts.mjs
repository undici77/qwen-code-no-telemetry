#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// Release-merge helper (NO_TELEMETRY_GUIDELINES.md §3). Resolves a conflict
// hunk to upstream's side ONLY when both sides are single version-like lines:
// "version", "sandboxImageUri" or an internal "@qwen-code/*" pin. Any other
// hunk (a real dependency change, anything else) leaves the file untouched and
// exits 1, so a genuine conflict is never taken by default.
//
//   node scripts/resolve-version-conflicts.mjs [files...]   (default: every
//   unmerged file except pnpm-lock.yaml, which is regenerated, never merged)

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const HUNK = /<<<<<<< [^\n]*\n(.*?)=======\n(.*?)>>>>>>> [^\n]*\n/gs;
const VERSION_LINE =
  /^\s*"(version|sandboxImageUri|@qwen-code\/[\w-]+)": "[^"]*",?\n$/;

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : execFileSync('git', ['diff', '--name-only', '--diff-filter=U'], {
      encoding: 'utf8',
    })
      .split('\n')
      .filter((f) => f && f !== 'pnpm-lock.yaml');

let unresolved = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const hunks = [...text.matchAll(HUNK)];
  const other = hunks.filter(
    ([, ours, theirs]) =>
      !VERSION_LINE.test(ours) || !VERSION_LINE.test(theirs),
  );
  if (other.length > 0) {
    unresolved += 1;
    console.error(`NOT resolved ${file}: ${other.length} non-version hunk(s)`);
    continue;
  }
  writeFileSync(
    file,
    text.replace(HUNK, (_m, _ours, theirs) => theirs),
  );
  console.log(`resolved     ${file}: ${hunks.length} hunk(s)`);
}
process.exit(unresolved > 0 ? 1 : 0);
