/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// Preloaded half of the egress tripwire (NO_TELEMETRY_GUIDELINES.md §18);
// loaded via NODE_OPTIONS --import by scripts/check-egress.mjs, which owns the
// allowlist and the verdict table. This file only records what the process
// reaches for, including the children it spawns.

import net from 'node:net';
import tls from 'node:tls';
import http from 'node:http';
import https from 'node:https';
import dgram from 'node:dgram';
import dns from 'node:dns';
import childProcess from 'node:child_process';
import { writeFileSync } from 'node:fs';

const allowed = new Set(
  (process.env['QWEN_EGRESS_ALLOWED'] || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);
const logFile = process.env['QWEN_EGRESS_LOG'];
const hits = [];

const LOCAL_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'host.docker.internal',
  'gateway.docker.internal',
  'kubernetes.docker.internal',
]);

function isLocalHost(host) {
  if (!host) return true;
  const h = String(host)
    .replace(/^\[|\]$/g, '')
    .toLowerCase();
  if (h === '::' || h === '::1' || h === '0.0.0.0') return true;
  if (h.startsWith('127.') || h.startsWith('::ffff:127.')) return true;
  if (LOCAL_HOSTS.has(h)) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(h)) return true;
  if (/^10\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

/** First frame outside Node internals and outside this file — the culprit. */
function callSite() {
  const stack = (new Error().stack || '').split('\n').slice(2);
  for (const line of stack) {
    if (line.includes('check-egress-probe.mjs')) continue;
    if (/node:(internal|node:)/.test(line)) continue;
    const m = /\(?((?:file:\/\/|\/)[^():]+):(\d+):(\d+)\)?/.exec(line);
    if (m) return `${m[1].replace(/^file:\/\//, '')}:${m[2]}`;
  }
  return undefined;
}

function record(kind, host, port, note, forced) {
  const target = host ? (port ? `${host}:${port}` : host) : (note ?? kind);
  const local = isLocalHost(host);
  const h = String(host ?? '')
    .replace(/^\[|\]$/g, '')
    .toLowerCase();
  // `forced` exists because a row with no host used to fall through
  // isLocalHost(undefined) → true and be verdicted 'ok' no matter what it was.
  const verdict = forced ?? (local || allowed.has(h) ? 'ok' : 'LEAK');
  hits.push({ kind, target, verdict, site: callSite() });
}

// ---------------------------------------------------------------------------
// Sockets, TLS, HTTP, fetch, datagrams, DNS
// ---------------------------------------------------------------------------

const origSocketConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const [a, b] = args;
  // Undici hands us an options object whose host/port are not populated at
  // call time, so reading them yields undefined and the old fallback recorded
  // every connection as "0.0.0.0" — noise that could also mask a real peer.
  // The 'lookup' event carries the resolved address and port, which is the
  // ground truth, so the destination is captured there instead.
  if (typeof a === 'object' && a !== null && typeof a.path === 'string') {
    record('unix', undefined, undefined, a.path);
  } else if (typeof a === 'string') {
    record('unix', undefined, undefined, a);
  } else if (typeof a === 'object' && a !== null && (a.host || a.port)) {
    record('tcp', a.host ?? '0.0.0.0', a.port);
  } else if (typeof a === 'number') {
    record('tcp', b ?? '0.0.0.0', a);
  }
  this.once('lookup', (_err, address, port) => {
    if (address) record('peer', address, port);
  });
  this.once('connect', () => {
    const ra = this.remoteAddress;
    if (ra && this.remotePort) record('peer', ra, this.remotePort);
  });
  return origSocketConnect.apply(this, args);
};

const origTlsConnect = tls.connect;
tls.connect = function (...args) {
  const a = args[0];
  if (typeof a === 'object' && a !== null)
    record('tls', a.host ?? '0.0.0.0', a.port);
  else if (typeof a === 'string') record('tcp', args[1] ?? '0.0.0.0', a);
  return origTlsConnect.apply(this, args);
};

for (const [mod, kind] of [
  [http, 'http'],
  [https, 'https'],
]) {
  const orig = mod.request;
  mod.request = function (...args) {
    const a = args[0];
    if (typeof a === 'string' || a instanceof URL) {
      const u = new URL(String(a));
      record(kind, u.hostname, Number(u.port) || (kind === 'https' ? 443 : 80));
    } else if (a && typeof a === 'object') {
      record(kind, a.hostname ?? a.host ?? '0.0.0.0', a.port);
    }
    return orig.apply(this, args);
  };
  const origGet = mod.get;
  mod.get = function (...args) {
    const a = args[0];
    if (typeof a === 'string' || a instanceof URL) {
      const u = new URL(String(a));
      record(kind, u.hostname, Number(u.port) || (kind === 'https' ? 443 : 80));
    }
    return origGet.apply(this, args);
  };
}

const origFetch = globalThis.fetch;
if (typeof origFetch === 'function') {
  globalThis.fetch = function (input, ...rest) {
    try {
      const raw =
        typeof input === 'string' || input instanceof URL
          ? String(input)
          : input?.url;
      if (raw) {
        const u = new URL(raw);
        record(
          'fetch',
          u.hostname,
          Number(u.port) || (u.protocol === 'https:' ? 443 : 80),
        );
      }
    } catch {
      record('fetch', undefined, undefined, 'unparseable input');
    }
    return origFetch.call(this, input, ...rest);
  };
}

const origWs = globalThis.WebSocket;
if (typeof origWs === 'function') {
  globalThis.WebSocket = class extends origWs {
    constructor(address, ...rest) {
      try {
        const u = new URL(String(address));
        record(
          'ws',
          u.hostname,
          Number(u.port) || (u.protocol === 'wss:' ? 443 : 80),
        );
      } catch {
        record('ws', undefined, undefined, String(address));
      }
      super(address, ...rest);
    }
  };
}

const origDgramSend = dgram.Socket.prototype.send;
dgram.Socket.prototype.send = function (...args) {
  const [, b, c] = args;
  if (typeof c === 'string')
    record('udp', c, typeof b === 'number' ? b : undefined);
  else if (typeof b === 'number') record('udp', c ?? '0.0.0.0', b);
  return origDgramSend.apply(this, args);
};

const origLookup = dns.lookup;
dns.lookup = function (hostname, ...rest) {
  record('dns', hostname);
  return origLookup.call(this, hostname, ...rest);
};

// ---------------------------------------------------------------------------
// Child processes — a curl/git/npm subprocess bypasses every hook above, so
// its argv is the only evidence there is.
// ---------------------------------------------------------------------------

const NET_TOOLS =
  /^(curl|wget|nc|ncat|telnet|ssh|scp|sftp|rsync|git|npm|npx|pnpm|yarn|pip|pip3|uv|gh|docker|podman|brew|cargo|go|aria2c|openssl)$/;

// Interpreters this probe cannot instrument: NODE_OPTIONS --import is a Node
// flag, so a python/ruby/java child opens its sockets entirely unhooked. A
// spawn of one is a blind spot and must never verdict 'ok' by silence.
const BLIND_SPAWNERS =
  /^(python|python3|python[0-9.]+|ruby|perl|php|java|deno|bun|dotnet|uvx|conda|Rscript)$/i;

const URL_HOST_RE = /(?:https?|wss?|ftp):\/\/(?:[^/@\s]*@)?\[?([^\]/:\s]+)/gi;

function scanSpawn(cmd, args) {
  const all = [String(cmd ?? ''), ...(args ?? []).map(String)];
  const exe = all[0].split(/[\\/]/).pop();
  const joined = all.join(' ');
  if (NET_TOOLS.test(exe)) {
    // The argv names the peer, so use it: a spawned curl to a host your config
    // never named is a LEAK, not an unexamined 'ok'.
    const hosts = new Set(
      [...joined.matchAll(URL_HOST_RE)].map((m) => m[1].toLowerCase()),
    );
    if (hosts.size === 0) {
      record('spawn', undefined, undefined, joined.slice(0, 200), 'BLIND');
    } else {
      for (const h of hosts) record('spawn', h, undefined, `${exe} → ${h}`);
    }
  }
  // `sh -c "curl …"` hides the tool inside the command string.
  if (/^(sh|bash|zsh|cmd|powershell)$/i.test(exe)) {
    for (const m of joined.matchAll(
      /(?:^|[;&|]\s*)(curl|wget|nc|git|npm|gh)\b/gi,
    )) {
      record(
        'spawn',
        undefined,
        undefined,
        `${m[1]} (inside shell): ${joined.slice(0, 180)}`,
        'BLIND',
      );
    }
  }
  if (BLIND_SPAWNERS.test(exe)) {
    record('blind', undefined, undefined, joined.slice(0, 200), 'BLIND');
  }
}

for (const name of [
  'spawn',
  'spawnSync',
  'exec',
  'execFile',
  'execSync',
  'execFileSync',
]) {
  const orig = childProcess[name];
  if (typeof orig !== 'function') continue;
  childProcess[name] = function (cmd, optionsOrArgs, _options) {
    scanSpawn(cmd, Array.isArray(optionsOrArgs) ? optionsOrArgs : undefined);
    return orig.apply(this, arguments);
  };
}

// ---------------------------------------------------------------------------
// Flush
// ---------------------------------------------------------------------------

let flushed = false;
function flush() {
  if (flushed || !logFile) return;
  flushed = true;
  // One file per PID. The launcher and the CLI it spawns both preload this
  // module and share QWEN_EGRESS_LOG; if they wrote the same path, the
  // launcher — which makes no requests and exits last — would overwrite the
  // child's real hits with an empty list and the tripwire would report a
  // clean run while traffic flowed.
  const out = `${logFile}.${process.pid}.json`;
  try {
    writeFileSync(out, JSON.stringify(hits));
  } catch {
    // The runner treats a missing log as "no attempts"; never crash the host.
  }
}

process.on('exit', flush);
process.on('beforeExit', flush);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, flush);
}
