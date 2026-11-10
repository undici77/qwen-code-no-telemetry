#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// What did upstream ADD that could reach the network? (NO_TELEMETRY_GUIDELINES.md §3)
//
// Every other gate verifies the fork's own state. None of them says what the
// upstream side of a merge introduced, so a new host, a new network primitive,
// a new dependency or a new uploader class passes unless someone happens to
// read the diff. This lists them for a human to read before the merge commit.
// It is a report, not a gate: it exits 0, and "nothing found" is a finding.
//
//   node scripts/merge-egress-report.mjs <previous-ref> <new-ref>

import { execFileSync } from 'node:child_process';

const [prev, next] = process.argv.slice(2);
if (!prev || !next) {
  console.error('usage: merge-egress-report.mjs <previous-ref> <new-ref>');
  process.exit(2);
}
const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });

// Added production source lines, with their file. Tests, docs and locale
// tables name hosts constantly and prove nothing about runtime egress.
const SRC = [
  'packages/*/src/*',
  ':!*.test.*',
  ':!*/__tests__/*',
  ':!*.md',
  ':!*/i18n/locales/*',
];
const added = [];
let file = '';
for (const line of git('diff', `${prev}..${next}`, '-U0', '--', ...SRC).split(
  '\n',
)) {
  if (line.startsWith('+++ b/')) file = line.slice(6);
  else if (line.startsWith('+') && !line.startsWith('+++'))
    added.push({ file, text: line.slice(1) });
}
const bucket = (f) =>
  /packages\/web-shell\/client|packages\/web-shell\/src/.test(f)
    ? 'browser (web-shell UI, not the CLI process)'
    : 'node (CLI / core / bridges)';

const section = (title, rows) => {
  console.log(`\n## ${title} (${rows.length})`);
  if (rows.length === 0) console.log('  none');
  for (const r of rows) console.log(`  ${r}`);
};

const hosts = new Map();
for (const { file: f, text } of added) {
  for (const m of text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)) {
    const key = `${bucket(f)} | ${m[1].toLowerCase()}`;
    hosts.set(key, [...(hosts.get(key) ?? []), f]);
  }
}
section(
  'hosts named in added source',
  [...hosts]
    .sort()
    .map(([k, fs]) => `${k}  <- ${[...new Set(fs)][0]} (+${fs.length - 1})`),
);

const PRIMITIVE =
  /\bfetch\(|https?\.(request|get)\(|net\.(connect|createConnection)\(|new WebSocket\(|dgram|\b(curl|wget)\b|git (clone|fetch)|npm view/;
section(
  'network primitives in added source lines',
  added
    .filter((a) => PRIMITIVE.test(a.text) && !/^\s*(\/\/|\*)/.test(a.text))
    .map((a) => `${a.file}: ${a.text.trim().slice(0, 110)}`),
);

section(
  'new uploader / publisher / reporter code',
  added
    .filter((a) =>
      /class \w*(Publisher|Uploader|Reporter|Tracker|Telemetry)\b/.test(a.text),
    )
    .map((a) => `${a.file}: ${a.text.trim().slice(0, 110)}`),
);

const deps = (ref, f) => {
  try {
    const j = JSON.parse(git('show', `${ref}:${f}`));
    return Object.entries({
      ...j.dependencies,
      ...j.optionalDependencies,
      ...j.devDependencies,
    });
  } catch {
    return [];
  }
};
const manifests = git(
  'diff',
  '--name-only',
  `${prev}..${next}`,
  '--',
  '*package.json',
)
  .split('\n')
  .filter(Boolean);
const newDeps = [];
for (const f of manifests) {
  const before = new Set(deps(prev, f).map(([n]) => n));
  for (const [n, v] of deps(next, f))
    if (!before.has(n)) newDeps.push(`${f}: ${n}@${v}`);
}
section('dependencies added to a manifest', newDeps);
console.log(
  '\nRead each row: a host or primitive in the CLI process needs a gate and an entry in §17;\nbrowser rows matter only to Web Shell. Re-run `npm run check:egress` afterwards.',
);
