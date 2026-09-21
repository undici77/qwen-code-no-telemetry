#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// Egress tripwire for the no-telemetry fork (NO_TELEMETRY_GUIDELINES.md §18).
//
// Every other §1–§17 check inspects source or shipped bytes, so each one can
// only prove what the code *says* it does. This one proves what the running
// binary actually attempts, and it is the only check here that catches an
// arbitrary new egress path — including a leak that never touches any of the
// subsystems the other gates watch.
//
//   node scripts/check-egress.mjs                 run the fast scenario, verdict
//   node scripts/check-egress.mjs --cli=<path>    trace that entry instead
//
// It works by preloading itself into the traced process via NODE_OPTIONS and
// wrapping every way out of Node: net/tls/http/https sockets, fetch, dgram,
// WebSocket, dns resolution, and child_process spawns (a `curl` subprocess
// bypasses the whole Node stack, so its argv is inspected instead).
//
// The allowlist is DERIVED, not hardcoded: every URL found in the user's own
// settings, whatever key it sits under, plus loopback and the container
// gateway. Anything else is a leak. Deriving it means a machine whose model
// endpoint is remote is not falsely accused, and — because the walk is generic
// rather than a list of known keys — a new remote option added by an upstream
// merge shows up as a finding instead of being silently trusted.

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const PROBE = join(__dirname, 'check-egress-probe.mjs');

// ---------------------------------------------------------------------------
// Allowlist derivation
// ---------------------------------------------------------------------------

const LOCAL_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'host.docker.internal',
  'gateway.docker.internal',
  'kubernetes.docker.internal',
  'metadata.google.internal',
]);

function isLocalHost(host) {
  if (!host) return true;
  const h = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (h === '::' || h === '::1' || h === '0.0.0.0') return true;
  if (h.startsWith('127.')) return true;
  if (h.startsWith('::ffff:127.')) return true;
  if (LOCAL_HOSTS.has(h)) return true;
  // fd00::/8 ULA and 192.168/16 + 10/8 + 172.16/12 — a container talking to
  // its own host or LAN is not the internet.
  if (/^f[cd][0-9a-f]{2}:/i.test(h)) return true;
  if (/^10\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

function hostFromUrl(value) {
  if (typeof value !== 'string') return undefined;
  const m = /^(?:https?|wss?|ftp):\/\/(?:[^/@]*@)?\[?([^\]/:]+)/i.exec(
    value.trim(),
  );
  return m ? m[1].toLowerCase() : undefined;
}

/** Walk any value and collect every host named by any string in it. */
function collectHosts(node, out) {
  if (typeof node === 'string') {
    const h = hostFromUrl(node);
    if (h) out.add(h);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectHosts(item, out);
    return;
  }
  if (node && typeof node === 'object') {
    for (const value of Object.values(node)) collectHosts(value, out);
  }
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

function deriveAllowlist(cwd) {
  const allowed = new Set();
  const sources = [
    join(process.env['HOME'] || '', '.qwen', 'settings.json'),
    join(process.env['QWEN_HOME'] || '', 'settings.json'),
    join(cwd, '.qwen', 'settings.json'),
    join(cwd, '.qwen', 'settings.local.json'),
  ];
  for (const file of sources) {
    if (!file.startsWith('/') || !existsSync(file)) continue;
    collectHosts(readJson(file), allowed);
  }
  // Any *_BASE_URL / *_ENDPOINT the operator exported is their own config.
  for (const [key, value] of Object.entries(process.env)) {
    if (/(BASE_URL|ENDPOINT|SERVER_URL|HTTP_URL)$/i.test(key)) {
      const h = hostFromUrl(value);
      if (h) allowed.add(h);
    }
  }
  // §1.5: web_search is SerpApi-backed and only registers with a key, so the
  // host is legitimate exactly when that key exists.
  if (process.env['SERPAPI_API_KEY']) allowed.add('serpapi.com');
  for (const h of (process.env['QWEN_EGRESS_ALLOW'] || '').split(',')) {
    if (h.trim()) allowed.add(h.trim().toLowerCase());
  }
  return allowed;
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function resolveCli(explicit) {
  if (explicit) return { cmd: process.execPath, args: [resolve(explicit)] };
  const fromEnv = process.env['QWEN_CODE_CLI'];
  if (fromEnv && existsSync(fromEnv))
    return { cmd: process.execPath, args: [fromEnv] };
  const repoEntry = join(root, 'scripts', 'cli-entry.js');
  if (existsSync(repoEntry))
    return { cmd: process.execPath, args: [repoEntry] };
  return { cmd: 'qwen', args: [] };
}

// Proves the detector is alive. A tripwire that can only ever print "clean"
// is indistinguishable from a broken one — the first version of this script
// did exactly that, reporting zero attempts while strace showed six sockets
// open, because the launcher and the CLI overwrote each other's log. So every
// run starts by reaching for a host that can never be allowed and asserting the
// probe catches it; if it does not, the run fails as BROKEN rather than clean.
function selfTest() {
  const canary = 'egress-tripwire-selftest.invalid';
  const dir = mkdtempSync(join(tmpdir(), 'qwen-egress-selftest-'));
  const log = join(dir, 'hits.json');
  const r = spawnSync(
    process.execPath,
    ['-e', `fetch('https://${canary}').catch(()=>{})`],
    {
      env: {
        ...process.env,
        NODE_OPTIONS: `--import=${pathToFileURL(PROBE).href}`,
        QWEN_EGRESS_LOG: log,
        QWEN_EGRESS_ALLOWED: '',
      },
      encoding: 'utf8',
      timeout: 60_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const hits = [];
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('hits.'))
        hits.push(...(readJson(join(dir, name)) ?? []));
    }
  }
  rmSync(dir, { recursive: true, force: true });
  const caught = hits.some(
    (h) => String(h.target).includes(canary) && h.verdict === 'LEAK',
  );
  if (!caught) {
    console.error(
      `✗ SELF-TEST FAILED: the probe did not flag ${canary} as a LEAK (status ${r.status}).`,
    );
    console.error(
      '  The detector is not running — its verdict cannot be trusted. Fix the probe before releasing.',
    );
    process.exit(2);
  }
  console.log('  self-test   : probe caught the canary host as LEAK ✓');
}

function main() {
  const explicit = process.argv
    .find((a) => a.startsWith('--cli='))
    ?.slice('--cli='.length);
  const cli = resolveCli(explicit);
  const allowed = deriveAllowlist(process.cwd());
  const logDir = mkdtempSync(join(tmpdir(), 'qwen-egress-'));
  const logFile = join(logDir, 'hits.json');
  const scratch = join(logDir, 'scratch.txt');
  writeFileSync(scratch, 'EGRESS-PROBE-MARKER\n');

  const env = {
    ...process.env,
    NODE_OPTIONS: [
      process.env['NODE_OPTIONS'],
      `--import=${pathToFileURL(PROBE).href}`,
    ]
      .filter(Boolean)
      .join(' '),
    QWEN_EGRESS_PROBE: '1',
    QWEN_EGRESS_LOG: logFile,
    QWEN_EGRESS_ALLOWED: [...allowed].join(','),
  };

  const scenarios = [
    { name: 'startup (--version)', args: ['--version'], timeout: 60_000 },
    {
      name: 'session with one tool call',
      args: [
        '-p',
        `Read the file ${scratch} and reply with its exact contents.`,
      ],
      timeout: 240_000,
    },
  ];

  console.log('Egress tripwire — NO_TELEMETRY_GUIDELINES.md §18');
  selfTest();
  console.log(`  entry      : ${cli.args[0] ?? cli.cmd}`);
  console.log(
    `  trusted    : ${[...allowed].sort().join(', ') || '(loopback only)'}`,
  );
  console.log('  anything not listed above and not loopback is a LEAK.\n');

  const all = [];
  let failed = false;
  for (const s of scenarios) {
    // Fresh per-scenario evidence: the probe writes one file per PID.
    for (const stale of readdirSync(logDir)) {
      if (stale.startsWith('hits.'))
        rmSync(join(logDir, stale), { force: true });
    }
    const r = spawnSync(cli.cmd, [...cli.args, ...s.args], {
      env,
      timeout: s.timeout,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (r.error) {
      console.error(`✗ ${s.name}: spawn failed — ${r.error.message}`);
      failed = true;
      continue;
    }
    const hits = [];
    for (const name of readdirSync(logDir)) {
      if (!name.startsWith('hits.')) continue;
      hits.push(...(readJson(join(logDir, name)) ?? []));
      rmSync(join(logDir, name), { force: true });
    }
    all.push(...hits.map((h) => ({ ...h, scenario: s.name })));
    const status = r.status === 0 ? 'ran' : `exit ${r.status}`;
    console.log(`  ${s.name}: ${status}, ${hits.length} egress attempt(s)`);
  }

  rmSync(logDir, { recursive: true, force: true });

  const byHost = new Map();
  for (const h of all) {
    const key = `${h.kind} ${h.target}`;
    const prev = byHost.get(key);
    if (prev) prev.count += 1;
    else byHost.set(key, { ...h, count: 1 });
  }

  console.log(
    '\n  kind   destination                                  verdict   hits  first call site',
  );
  console.log('  ' + '-'.repeat(104));
  let leaks = 0;
  const rows = [...byHost.values()].sort((a, b) =>
    a.verdict === b.verdict ? 0 : a.verdict === 'LEAK' ? -1 : 1,
  );
  if (rows.length === 0) {
    console.log('  (no egress attempts at all)');
  }
  for (const r of rows) {
    const target = r.target.padEnd(42);
    console.log(
      `  ${r.kind.padEnd(6)} ${target} ${r.verdict.padEnd(10)} ${String(r.count).padStart(4)}  ${r.site ?? `(no app frame — ${r.scenario})`}`,
    );
    if (r.verdict === 'LEAK') leaks += 1;
  }

  const spawned = all.filter((h) => h.kind === 'spawn');
  if (spawned.length > 0) {
    console.log('\n  spawned commands:');
    for (const s of spawned) console.log(`    ${s.target}`);
  }

  if (leaks > 0) {
    console.log(
      `\n✗ ${leaks} destination(s) not derived from your own config. Do not release.`,
    );
    console.log(
      '  Fix the code, or add the host to QWEN_EGRESS_ALLOW and record why in the release notes.',
    );
    process.exit(1);
  }
  console.log(
    '\n✓ No unexpected egress. Every destination was loopback, the container gateway, or a host your own config named.',
  );
}

main();
