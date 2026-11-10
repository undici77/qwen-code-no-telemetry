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

import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import {
  existsSync,
  mkdirSync,
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

// ---------------------------------------------------------------------------
// Loopback fake model
// ---------------------------------------------------------------------------

// The session scenario is only evidence if it reaches a model: on a machine
// with no model configured the CLI exits before its first request, so the
// probe sees nothing and the run used to end "clean". Serving the model
// ourselves, on loopback and with a throwaway QWEN_HOME, makes the scenario
// hermetic and lets the run prove the round-trip happened.
function startFakeModel(tool, headers) {
  const requests = [];
  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      requests.push(req.url);
      for (const name of Object.keys(req.headers)) headers.add(name);
      if (
        req.method !== 'POST' ||
        !String(req.url).endsWith('/chat/completions')
      ) {
        res.writeHead(404).end();
        return;
      }
      let body = {};
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        // Treated as a plain request below.
      }
      const answered = (body.messages ?? []).some((m) => m.role === 'tool');
      const message =
        !answered && body.tools?.length
          ? {
              role: 'assistant',
              tool_calls: [
                {
                  index: 0,
                  id: 'call_egress_probe',
                  type: 'function',
                  function: {
                    name: tool.name,
                    arguments: JSON.stringify(tool.args),
                  },
                },
              ],
            }
          : { role: 'assistant', content: 'done' };
      const finish = message.tool_calls ? 'tool_calls' : 'stop';
      const usage = { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 };
      const base = { id: 'fake', created: 0, model: body.model ?? 'fake' };
      if (!body.stream) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            ...base,
            object: 'chat.completion',
            choices: [{ index: 0, message, finish_reason: finish }],
            usage,
          }),
        );
        return;
      }
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const send = (choice, extra = {}) =>
        res.write(
          `data: ${JSON.stringify({ ...base, object: 'chat.completion.chunk', choices: [choice], ...extra })}\n\n`,
        );
      send({ index: 0, delta: message, finish_reason: null });
      send({ index: 0, delta: {}, finish_reason: finish }, { usage });
      res.end('data: [DONE]\n\n');
    });
  });
  return new Promise((ok) =>
    server.listen(0, '127.0.0.1', () =>
      ok({
        url: `http://127.0.0.1:${server.address().port}/v1`,
        requests,
        close: () => server.close(),
      }),
    ),
  );
}

/** Async on purpose: the fake model lives in this process and must keep serving. */
function runAsync(cmd, args, env, timeout) {
  return new Promise((done) => {
    const child = spawn(cmd, args, { env, timeout, stdio: 'ignore' });
    child.on('error', (error) => done({ error }));
    child.on('exit', (status) => done({ status }));
  });
}

// The probe verdicts destinations; it cannot see what a request carries. A new
// identifier header (a session or install id) would leave the machine on the
// sanctioned channel without any destination changing. The fake model records
// every header name of the session scenario, and anything outside this list is
// a finding. v0.27.2 baseline: standard HTTP plus the OpenAI SDK's x-stainless-*
// platform fingerprint (arch, OS, runtime version).
const HEADER_ALLOW = new Set([
  'accept',
  'accept-encoding',
  'accept-language',
  'authorization',
  'connection',
  'content-length',
  'content-type',
  'host',
  'sec-fetch-mode',
  'user-agent',
]);

function unexpectedHeaders(names) {
  const extra = new Set(
    (process.env['QWEN_EGRESS_HEADER_ALLOW'] || '')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );
  return [...names]
    .filter(
      (n) =>
        !HEADER_ALLOW.has(n) && !n.startsWith('x-stainless-') && !extra.has(n),
    )
    .sort();
}

// Opt-in kernel cross-check (--strace, Linux). The probe is JavaScript running
// inside the traced process, so anything that escapes NODE_OPTIONS — a child
// that clears it, a native addon — is invisible to it. strace sees the same run
// from outside: every non-local address the kernel was asked to connect to must
// also appear in the probe's records, or the probe has a blind spot (exit 2).
// Ports 0 (routing probes) and 53 (resolver, counted not judged) are excluded.
const PRIVATE_PEER =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0$|::1$|f[cd][0-9a-f]{2}:|::ffff:(127|10|192\.168)\.)/i;

function kernelPeers(logFile) {
  const ips = new Set();
  let dns = 0;
  for (const line of readFileSync(logFile, 'utf8').split('\n')) {
    if (!line.includes('connect(')) continue;
    const port = /htons\((\d+)\)/.exec(line)?.[1];
    const ip =
      /inet_addr\("([^"]+)"\)/.exec(line)?.[1] ??
      /inet_pton\(AF_INET6, "([^"]+)"/.exec(line)?.[1];
    if (!ip || !port || port === '0') continue;
    if (port === '53') dns += 1;
    else if (!PRIVATE_PEER.test(ip)) ips.add(ip);
  }
  return { ips, dns };
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
    [
      '-e',
      `
      fetch('https://${canary}').catch(()=>{});
      // Second canary: an interpreter child. NODE_OPTIONS --import is a Node
      // flag, so this child is unhooked — the probe must still notice it.
      require('node:child_process').spawnSync('python3', ['-c', 'pass']);
    `,
    ],
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
  // A clean verdict only means something if the probe can see the child that
  // would have produced it. An unhooked interpreter must leave a BLIND row.
  if (!hits.some((h) => h.verdict === 'BLIND')) {
    console.error(
      `✗ SELF-TEST FAILED: an interpreter child spawned unhooked and nothing was verdicted BLIND (status ${r.status}).`,
    );
    console.error(
      '  Non-Node children open their sockets outside every hook here, so a clean verdict would not cover them.',
    );
    process.exit(2);
  }
  console.log('  blind child : interpreter spawn flagged BLIND ✓');
}

async function main() {
  const explicit = process.argv
    .find((a) => a.startsWith('--cli='))
    ?.slice('--cli='.length);
  const cli = resolveCli(explicit);
  const useStrace =
    process.argv.includes('--strace') ||
    process.env['QWEN_EGRESS_STRACE'] === '1';
  if (useStrace && spawnSync('strace', ['-V']).error) {
    console.error('✗ --strace needs strace on PATH (Linux).');
    process.exit(2);
  }
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

  const page = join(logDir, 'page.html');
  writeFileSync(page, '<html><body>EGRESS-PROBE-MARKER</body></html>\n');
  const headers = new Set();
  // Each session scenario is hermetic: its own fake model, its own throwaway
  // QWEN_HOME (optionally with settings), and a tool call the fake model forces.
  // `allow` extends the trusted hosts for that scenario only; `expect` returns a
  // message when the run does not prove what the scenario exists to prove.
  const sessions = [
    {
      name: 'session with one tool call',
      prompt: `Read the file ${scratch} and reply with its exact contents.`,
      tool: { name: 'read_file', args: { file_path: scratch } },
    },
    {
      // §1.5: with a key the tool registers and must contact serpapi.com and
      // nothing else, whatever DashScope-shaped values the settings carry.
      name: 'web_search (SerpApi key set)',
      prompt: 'Search the web for egress-probe.',
      flags: ['--approval-mode', 'yolo'],
      tool: { name: 'web_search', args: { query: 'egress probe' } },
      env: { SERPAPI_API_KEY: 'egress-probe' },
      allow: ['serpapi.com'],
      expect: (hits) =>
        hits.some((h) => String(h.target).includes('serpapi.com'))
          ? undefined
          : 'web_search never attempted serpapi.com — the tool did not run',
    },
    {
      // §1.7: remote publisher fully armed, auto-approving mode. The endpoint
      // is NOT allowlisted, so any attempt at it is a LEAK.
      name: 'artifact publish (oss armed, yolo)',
      prompt: `Publish ${page} as an artifact.`,
      flags: ['--approval-mode', 'yolo'],
      tool: { name: 'artifact', args: { file_path: page } },
      settings: {
        artifact: {
          publisher: 'oss',
          oss: {
            bucket: 'egress-probe',
            endpoint: 'oss-cn-hangzhou.aliyuncs.com',
          },
        },
      },
    },
  ];
  const scenarios = [
    { name: 'startup (--version)', args: ['--version'], timeout: 60_000, env },
    ...sessions.map((x, i) => ({
      ...x,
      args: [...(x.flags ?? []), '-p', x.prompt],
      timeout: 240_000,
      model: true,
      index: i,
    })),
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
    let fake;
    let scenarioEnv = s.env;
    if (s.model) {
      fake = await startFakeModel(s.tool, headers);
      const home = join(logDir, `qwen-home-${s.index}`);
      mkdirSync(home, { recursive: true });
      if (s.settings)
        writeFileSync(join(home, 'settings.json'), JSON.stringify(s.settings));
      scenarioEnv = {
        ...env,
        ...s.env,
        QWEN_EGRESS_ALLOWED: [...allowed, ...(s.allow ?? [])].join(','),
        QWEN_HOME: home,
        OPENAI_API_KEY: 'egress-probe',
        OPENAI_BASE_URL: fake.url,
        OPENAI_MODEL: 'egress-probe',
      };
    }
    const traceLog = join(logDir, `strace-${s.name.replace(/\W+/g, '-')}.log`);
    const r = await runAsync(
      useStrace ? 'strace' : cli.cmd,
      useStrace
        ? [
            '-f',
            '-qq',
            '-e',
            'trace=connect',
            '-o',
            traceLog,
            cli.cmd,
            ...cli.args,
            ...s.args,
          ]
        : [...cli.args, ...s.args],
      scenarioEnv,
      s.timeout,
    );
    fake?.close();
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
    if (useStrace && existsSync(traceLog)) {
      const { ips, dns } = kernelPeers(traceLog);
      const unseen = [...ips].filter(
        (ip) => !hits.some((h) => String(h.target).includes(ip)),
      );
      console.log(
        `    kernel cross-check: ${ips.size} non-local peer(s)${ips.size ? ` [${[...ips].join(', ')}]` : ''}, ${dns} resolver connect(s), ${unseen.length} unseen by the probe`,
      );
      for (const ip of unseen) {
        console.error(
          `✗ ${s.name}: the kernel connected to ${ip}; the probe recorded nothing for it.`,
        );
        failed = true;
      }
    }
    // A session that never completed a model round-trip observed nothing: the
    // tool call needs the model's reply, then a second request carrying the
    // tool result. Fewer than two requests means this is not evidence.
    if (fake && (r.status !== 0 || fake.requests.length < 2)) {
      console.error(
        `✗ ${s.name}: exit ${r.status}, ${fake.requests.length} model request(s) — the session never completed a tool round-trip.`,
      );
      failed = true;
    }
    const missing = s.expect?.(hits);
    if (missing) {
      console.error(`✗ ${s.name}: ${missing}`);
      failed = true;
    }
  }
  const badHeaders = unexpectedHeaders(headers);
  console.log(
    `  request headers: ${headers.size} distinct, ${badHeaders.length} unexpected`,
  );

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

  // BLIND = a child that ran outside every hook in the probe. Its traffic was
  // not observed, so it is neither clean nor a leak — it is unverified, and an
  // unverified child must be named and signed off, never passed by silence.
  const blind = [
    ...new Set(all.filter((h) => h.verdict === 'BLIND').map((h) => h.target)),
  ];
  const ack = new Set(
    (process.env['QWEN_EGRESS_BLIND_ACK'] || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  const exeOf = (t) =>
    String(t).split(/\s+/)[0].split(/[\\/]/).pop().toLowerCase();
  const unacked = blind.filter((t) => !ack.has(exeOf(t)));
  if (blind.length > 0) {
    console.log('\n  BLIND — children whose sockets this probe cannot see:');
    for (const b of blind)
      console.log(`    ${ack.has(exeOf(b)) ? 'acked   ' : 'UNACKED'} ${b}`);
  }

  for (const h of badHeaders) {
    console.log(
      `  header ${h.padEnd(36)} UNEXPECTED  (sent to the model endpoint)`,
    );
    leaks += 1;
  }
  if (leaks > 0) {
    console.log(
      `\n✗ ${leaks} finding(s): destination(s) not derived from your own config, or unexpected request header(s). Do not release.`,
    );
    console.log(
      '  Fix the code, or add the host to QWEN_EGRESS_ALLOW and record why in the release notes.',
    );
    process.exit(1);
  }
  if (unacked.length > 0) {
    console.error(
      `\n✗ ${unacked.length} blind child run(s) not acknowledged. Their egress is unverified — do not release.`,
    );
    console.error(
      '  Acknowledge a trusted runtime with QWEN_EGRESS_BLIND_ACK=<exe>[,<exe>…] and record why in the release notes.',
    );
    process.exit(1);
  }
  if (failed) {
    console.error(
      '\n✗ A scenario failed to run or never reached the model, so no egress evidence covers it.',
    );
    console.error(
      '  This run is inconclusive, not clean. Fix the CLI invocation or its model setup before releasing.',
    );
    process.exit(2);
  }
  console.log(
    '\n✓ No unexpected egress. Every destination was loopback, the container gateway, or a host your own config named.',
  );
}

await main();
