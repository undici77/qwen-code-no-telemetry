#!/usr/bin/env node
/**
 * No-telemetry fork: verify the always-on context docs and the invariants
 * they claim. Run with `npm run check:context`.
 *
 * Two failure kinds, both already seen in this repo:
 *  - a documented gate that cannot see what it claims (word-greps, the missing
 *    inline-import form, name-only greps), and
 *  - a documented invariant that quietly drifted (stale file.ts:NNNN cites).
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { compactTables } from './compact-md-tables.mjs';

const read = (f) => {
  try {
    return readFileSync(f, 'utf8');
  } catch {
    return '';
  }
};

/** Every non-test .ts file under dir. */
function productionTsFiles(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((e) => {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) return productionTsFiles(p);
    return p.endsWith('.ts') && !p.endsWith('.test.ts') ? [p] : [];
  });
}

const failures = [];
const check = (name, ok, detail = '') => {
  if (!ok) failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
};

// ── Doc hygiene: gates that cannot see what they claim ──────────────────────
const DOCS = ['AGENTS.md', 'QWEN.md', 'NO_TELEMETRY_GUIDELINES.md'];
const docText = DOCS.map(read).join('\n');

/** Command lines inside ``` fences only — prose that forbids a gate is not a gate. */
function commandLines(md) {
  const out = [];
  let inFence = false;
  for (const line of md.split('\n')) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence && /^\s*grep\s/.test(line)) out.push(line.trim());
  }
  return out;
}

const allGateCmds = DOCS.flatMap((f) => commandLines(read(f)));
const wordGates = allGateCmds.filter((l) => /dashscope/i.test(l));
check(
  'docs must not gate on the word "dashscope" (it matches inert upstream code)',
  wordGates.length === 0,
  wordGates.join(' | '),
);
const lineCites = docText.match(/[\w/.-]+\.(?:ts|tsx|js|json):\d+/g) ?? [];
check(
  'docs must not carry brittle file.ts:NNNN citations',
  lineCites.length === 0,
  lineCites.join(', '),
);

// Fork-owned docs carry their tables column-aligned by hand. That padding is
// ~15% of the deep reference and buys nothing a renderer cannot do itself, so
// it is stripped by a tool that proves it lost nothing before writing. A
// padded table re-appearing after a merge is formatting drift, not content.
for (const f of ['NO_TELEMETRY_GUIDELINES.md', 'QWEN.md']) {
  const src = read(f);
  if (!src) continue;
  let r;
  try {
    r = compactTables(src);
  } catch (e) {
    check(`${f}: table structure unparseable`, false, e.message);
    continue;
  }
  const saved = Buffer.byteLength(src) - Buffer.byteLength(r.text);
  check(
    `${f}: fork-owned docs must not carry column-padded tables`,
    saved === 0 && r.cellsVerbatim && r.proseSafe,
    `${saved} B of table padding — fix: node scripts/compact-md-tables.mjs --write`,
  );
}

for (const f of DOCS) {
  const cmds = commandLines(read(f));
  if (cmds.some((l) => /from '@opentelemetry/.test(l))) {
    check(
      `${f}: §12 gate must also cover inline import() type references`,
      cmds.some((l) => /import\('@opentelemetry/.test(l)),
      'add: grep -rn "import(\'@opentelemetry" — the from-form cannot see them',
    );
  }
}

// ── §12 / §1: no real otel reference in production core ────────────────────
const otelHits = (re) =>
  productionTsFiles('packages/core/src')
    .filter((f) => re.test(read(f)))
    .join(', ');

check(
  "§12 no `from '@opentelemetry` in production core",
  !otelHits(/from '@opentelemetry/),
  otelHits(/from '@opentelemetry/),
);
check(
  "§12 no inline `import('@opentelemetry` in production core",
  !otelHits(/import\('@opentelemetry/),
  otelHits(/import\('@opentelemetry/),
);

// ── §1.5 SerpApi is the only host the search path can contact ──────────────
const serpapi = read('packages/core/src/tools/serpapi-web-search.ts');
const foreignHosts = [...serpapi.matchAll(/https?:\/\/[a-z0-9.-]+/gi)]
  .map((m) => m[0])
  .filter((h) => !/(serpapi|example)\.com$/i.test(h));

check(
  '§1.5 search path contacts only serpapi.com',
  foreignHosts.length === 0,
  foreignHosts.join(', '),
);
check(
  '§1.5 request URL is the hardcoded serpapi template',
  /`https:\/\/serpapi\.com\/search\?/.test(serpapi),
);
check(
  '§1.5 seam re-exports the fork backend',
  /export \* from '\.\/serpapi-web-search\.js'/.test(
    read('packages/core/src/tools/web-search.ts'),
  ),
);

// ── §1.6 concurrency gate, never a per-turn rejection cap ──────────────────
const bridge = read(
  'packages/core/src/services/visionBridge/vision-bridge-service.ts',
);
const gateRefs = (
  bridge.match(
    /tryAcquireBridgeSlotSync|waitForBridgeSlot|releaseBridgeSlot/g,
  ) ?? []
).length;

check(
  '§1.6 no per-turn rejection cap names',
  !/turnImageCounts|budget was exhausted/.test(bridge),
);
check(
  '§1.6 concurrency gate present (7+ refs)',
  gateRefs >= 7,
  `found ${gateRefs}`,
);
check(
  '§1.6 slot pool bound to VISION_BRIDGE_MAX_IMAGES',
  /bridgeSlotsAvailable = VISION_BRIDGE_MAX_IMAGES/.test(bridge),
);

// ── §11 the four named loggers still forward to local stats ────────────────
const loggers = read('packages/core/src/telemetry/loggers.ts');
for (const fn of [
  'logApiResponse',
  'logApiError',
  'logToolCall',
  'recordSkillInvocation',
]) {
  const at = loggers.indexOf(`function ${fn}(`);
  const body = at < 0 ? '' : loggers.slice(at, at + 4000);
  check(
    `§11 ${fn} forwards to uiTelemetryService.addEvent`,
    /uiTelemetryService\.addEvent/.test(body),
    at < 0 ? 'function not found' : 'no addEvent call in body',
  );
}

// ── §13 completion must clear the live view before the awaited callback ────
const scheduler = read('packages/core/src/core/coreToolScheduler.ts');
// Absolute, ordered indices anchored on unambiguous syntax. The method name
// also appears at earlier call sites, and `onAllToolCallsComplete` appears in
// a comment inside the method — anchor on the await itself.
const defAt = scheduler.indexOf('private async checkAndNotifyCompletion(');
const clearAt = scheduler.indexOf('this.toolCalls = []', defAt);
const notifyAt = scheduler.indexOf('this.notifyToolCallsUpdate()', clearAt);
const awaitAt = scheduler.indexOf(
  'await this.onAllToolCallsComplete(',
  notifyAt,
);

check('§13 definition of checkAndNotifyCompletion found', defAt > 0);
check(
  '§13 live view cleared before notifying',
  clearAt > 0 && notifyAt > clearAt,
  `clear=${clearAt} notify=${notifyAt}`,
);
check(
  '§13 notify precedes the awaited onAllToolCallsComplete',
  notifyAt > 0 && awaitAt > notifyAt,
  `notify=${notifyAt} await=${awaitAt}`,
);
const finallyNotify = scheduler.indexOf(
  'this.notifyToolCallsUpdate()',
  awaitAt,
);
check(
  '§13 finally block re-notifies after the continuation',
  finallyNotify > awaitAt,
  `second notify=${finallyNotify}`,
);
check(
  '§13 regression test still exists',
  read('packages/core/src/core/coreToolScheduler.test.ts').includes(
    'clears the live tool-call view before a slow completion callback resolves',
  ),
);

// ── §14/§15/§16 fork hooks survived ────────────────────────────────────────
const countTag = (files) =>
  files.reduce(
    (n, f) => n + (read(f).match(/no-telemetry fork/g) ?? []).length,
    0,
  );
const s14 = countTag([
  'packages/core/src/core/client.ts',
  'packages/core/src/core/environmentContext.ts',
  'packages/core/src/memory/refresh.ts',
]);
const s15 = countTag([
  'packages/cli/src/ui/statusLinePresets.ts',
  'packages/cli/src/ui/hooks/useStatusLine.ts',
]);

check('§14 fork hooks present (7+)', s14 >= 7, `found ${s14}`);
check('§15 fork hooks present (7+)', s15 >= 7, `found ${s15}`);
check(
  '§16 prelude reuse wired (2 sites)',
  (
    read('packages/core/src/core/environmentContext.ts').match(
      /reuseResumedPreludeIfUnchanged/g,
    ) ?? []
  ).length === 2,
);
const agentProd = productionTsFiles('packages/core/src/agents');
const agentOptIn = agentProd.filter((f) =>
  read(f).includes('includeAutoMemoryReminder'),
);
check(
  '§14 agents directory exists (guard against a vacuous pass)',
  agentProd.length > 0,
  'no production .ts under packages/core/src/agents/',
);
check(
  '§14 subagents never opt into the reminder',
  agentOptIn.length === 0,
  agentOptIn.join(', '),
);

// ── Review rules live in exactly one home ──────────────────────────────────
const crCount = (f) => (read(f).match(/^## Code Review$/gm) ?? []).length;

check(
  'AGENTS.md carries exactly one ## Code Review',
  crCount('AGENTS.md') === 1,
  `found ${crCount('AGENTS.md')}`,
);
check(
  'QWEN.md carries no ## Code Review (no double injection)',
  crCount('QWEN.md') === 0,
  `found ${crCount('QWEN.md')}`,
);
check(
  'both always-on context files exist',
  existsSync('AGENTS.md') && existsSync('QWEN.md'),
);

// ── Both context files must actually load ───────────────────────────────────
// The fork-patch detail lives only in QWEN.md. Narrowing context.fileName to
// AGENTS.md alone drops it from context silently. .qwen/settings.json is
// git-ignored, so this guards the machine it is set on rather than the repo.
let settings;
try {
  settings = JSON.parse(read('.qwen/settings.json'));
} catch {
  settings = null;
}
const names = settings?.context?.fileName;
check(
  'context.fileName must load both QWEN.md and AGENTS.md',
  names === undefined ||
    ([names].flat().includes('QWEN.md') &&
      [names].flat().includes('AGENTS.md')),
  `context.fileName=${JSON.stringify(names)}`,
);

// ── Every fork-tagged file must be documented and guarded ──────────────────
// The §14/§15 checklists historically covered 5 of 10 tagged files, so a merge
// could strip the §1.5 inert-key guards in the config files unnoticed.
const TAGGED = [
  'packages/core/src/config/config.ts',
  'packages/core/src/core/client.ts',
  'packages/core/src/core/environmentContext.ts',
  'packages/core/src/memory/refresh.ts',
  'packages/cli/src/config/config.ts',
  'packages/cli/src/config/settingsSchema.ts',
  'packages/cli/src/ui/statusLinePresets.ts',
  'packages/cli/src/ui/hooks/useStatusLine.ts',
  'packages/core/src/tools/artifact/create-publisher.ts',
  'packages/core/src/tools/artifact/artifact-tool.ts',
];
const tagCount = (f) => (read(f).match(/\[no-telemetry fork\]/g) ?? []).length;
for (const f of TAGGED) {
  check(
    `${f} carries its [no-telemetry fork] guard`,
    tagCount(f) >= 1,
    'tag count 0',
  );
}
// -F: the pattern contains [], which git grep would read as a character class.
const taggedNow = execFileSync(
  'git',
  ['grep', '-l', '-F', '--', '[no-telemetry fork]', 'packages/'],
  { encoding: 'utf8' },
)
  .split('\n')
  .filter((l) => l.endsWith('.ts') || l.endsWith('.tsx'))
  .filter((l) => !l.endsWith('.test.ts') && !l.endsWith('.test.tsx'))
  .sort();
const undocumented = taggedNow.filter((f) => !TAGGED.includes(f));
check(
  'every fork-tagged production file is covered by the gate',
  undocumented.length === 0,
  `undocumented: ${undocumented.join(', ')} — document it and add it here`,
);
const S14 = [
  'packages/core/src/core/client.ts',
  'packages/core/src/core/environmentContext.ts',
  'packages/core/src/memory/refresh.ts',
];
const S15 = [
  'packages/cli/src/ui/statusLinePresets.ts',
  'packages/cli/src/ui/hooks/useStatusLine.ts',
];
const sumTags = (files) => files.reduce((n, f) => n + tagCount(f), 0);
// §1.5's guard lives in core/config.ts, which is NOT part of §14's tally.
check('§14 tag total is 13', sumTags(S14) === 13, `found ${sumTags(S14)}`);
check('§15 tag total is 12', sumTags(S15) === 12, `found ${sumTags(S15)}`);

// ── Fork README protected by git, not by memory ─────────────────────────────
check(
  'README.md is declared merge=ours (§2/§6 mandate)',
  /(^|\n)README\.md\s+merge=ours/.test(read('.gitattributes')),
);

// ── No committed build output shadowing a .ts/.tsx source ───────────────────
// Node resolves .js before .ts, so a tracked build artifact beside its source
// hijacks the real file — the class that hijacked vite and masked typecheck
// errors before the v0.23.0 purge.
const tracked = execFileSync('git', ['ls-files', '--', 'packages/'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);
const shadowing = tracked.filter(
  (f) =>
    f.includes('/src/') &&
    ((f.endsWith('.js') &&
      (existsSync(f.replace(/\.js$/, '.ts')) ||
        existsSync(f.replace(/\.js$/, '.tsx')))) ||
      (f.endsWith('.d.ts') && existsSync(f.replace(/\.d\.ts$/, '.tsx')))),
);
check(
  'no tracked .js/.d.ts shadows a .ts/.tsx sibling',
  shadowing.length === 0,
  shadowing.join(', '),
);

// ── Fork-deleted OTLP exporters must stay deleted ───────────────────────────
// Present at the merge base, absent from HEAD: these are fork deletions, not
// sync debt. A merge that re-adds them restores real OTLP endpoint/exporter
// construction, and every other gate still reports clean.
const DELETED = [
  'packages/core/src/telemetry/otlp-urls.ts',
  'packages/core/src/telemetry/sdk-exporters-grpc.ts',
  'packages/core/src/telemetry/sdk-exporters-http.ts',
];
const resurrected = DELETED.filter((f) => existsSync(f));
check(
  'fork-deleted OTLP exporters stay deleted',
  resurrected.length === 0,
  `re-added by a merge: ${resurrected.join(', ')}`,
);

// ── No dangling relative import in telemetry code that would actually run ───
// telemetry/sdk.test.ts imports the deleted ./otlp-urls.js. It is inert only
// because vitest.config.ts excludes it — so scope the check to what runs, and
// fail loudly the moment someone un-excludes a test with a missing module.
const vitestCfg = read('packages/core/vitest.config.ts');
const excluded = new Set(
  (vitestCfg.match(/'[^']*\.test\.ts'/g) ?? []).map((s) => s.slice(1, -1)),
);
const dangling = [];
for (const f of tracked.filter(
  (f) => f.startsWith('packages/core/src/telemetry/') && f.endsWith('.ts'),
)) {
  if (excluded.has(f.replace('packages/core/', ''))) continue;
  const dir = f.slice(0, f.lastIndexOf('/'));
  for (const m of read(f).matchAll(/from '\.\/([^']+)\.js'/g)) {
    const base = `${dir}/${m[1]}`;
    const resolves = [
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      `${base}/index.ts`,
    ].some(existsSync);
    if (!resolves) dangling.push(`${f} -> ./${m[1]}.js`);
  }
}
check(
  'no dangling relative import in runnable telemetry code',
  dangling.length === 0,
  dangling.join(', '),
);

if (failures.length > 0) {
  console.error(`check:context FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('check:context OK — docs and fork invariants verified');
