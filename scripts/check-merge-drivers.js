/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// Guard for the no-telemetry fork's merge strategy (NO_TELEMETRY_GUIDELINES.md
// §1.5). `.gitattributes` marks the fork-owned seams with `merge=<driver>` so
// upstream rewrites of them resolve automatically instead of opening a
// whole-file conflict. A merge driver is *declared* in .gitattributes but
// *defined* in .git/config, which git does not clone — so a fresh clone or
// worktree can carry the declaration with no driver behind it, and the merge
// then fails or falls back to a raw conflict with no explanation.
//
//   node scripts/check-merge-drivers.js          verify (exit 1 on drift)
//   node scripts/check-merge-drivers.js --fix    register missing drivers
//
// `npm install` runs this with --fix so every checkout ends up wired. Under
// --fix a driver it cannot register is a warning, not a failed install — the
// checkout degrades to an ordinary merge conflict instead.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const fix = process.argv.includes('--fix');

/**
 * The driver command for a given name. `true` is the canonical no-op that
 * leaves the "ours" file untouched, which is exactly what a fork seam needs.
 */
const DRIVER_COMMAND = 'true';

// A published install ships neither .gitattributes nor .git/config, so there
// is nothing to wire — the guard only applies to a fork checkout.
if (!existsSync(join(root, '.gitattributes'))) {
  console.log('No .gitattributes — not a checkout, merge drivers OK.');
  process.exit(0);
}

console.log('Checking git merge drivers declared in .gitattributes...');

const attributes = readFileSync(join(root, '.gitattributes'), 'utf8');

const pathsByDriver = new Map();
for (const rawLine of attributes.split('\n')) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;
  const match = line.match(/^(.+?)\s+merge=([^\s]+)$/);
  if (!match) continue;
  const [, path, driver] = match;
  if (!pathsByDriver.has(driver)) pathsByDriver.set(driver, []);
  pathsByDriver.get(driver).push(path.trim());
}

if (pathsByDriver.size === 0) {
  console.log('No merge drivers declared — nothing to check.');
  process.exit(0);
}

function readDriver(driver) {
  try {
    return execFileSync('git', ['config', '--get', `merge.${driver}.driver`], {
      cwd: root,
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

let hasError = false;

for (const [driver, paths] of pathsByDriver) {
  const configured = readDriver(driver);
  if (configured) {
    console.log(`  ok   merge=${driver} -> "${configured}"`);
    continue;
  }
  if (fix) {
    try {
      execFileSync(
        'git',
        ['config', '--local', `merge.${driver}.driver`, DRIVER_COMMAND],
        { cwd: root },
      );
    } catch {
      // Registration can fail outside a git worktree. Degrade to a plain
      // merge conflict rather than breaking `npm install`.
      console.warn(
        `  warn merge=${driver} could not be registered — upstream rewrites` +
          ` of ${paths.join(', ')} will conflict instead of merging automatically.`,
      );
      continue;
    }
    if (readDriver(driver)) {
      console.log(
        `  fix  registered merge.${driver}.driver="${DRIVER_COMMAND}"`,
      );
      continue;
    }
  }
  hasError = true;
  console.error(
    `\nError: .gitattributes declares merge=${driver} but` +
      ` merge.${driver}.driver is not configured in .git/config.`,
  );
  console.error('Affected paths:');
  for (const path of paths) console.error(`  - ${path}`);
  console.error(
    `\nFix: git config --local merge.${driver}.driver ${DRIVER_COMMAND}`,
  );
  console.error(
    '     (or run `npm install`, which registers it automatically)',
  );
}

if (hasError) process.exit(1);
console.log('Merge drivers OK.');
