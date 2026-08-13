/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';
import { buildRunEnv, spawnTimedOut, trimOutput, } from './build-test.js';
// eslint-disable-next-line no-control-regex -- ESC is the character under test
const ANSI_SGR_RE = /\x1b\[[0-9;]*m/g;
/**
 * The exact shapes `build-test` emits for a test command — and the only ones
 * this command will hand to a shell.
 *
 * The report is a FILE this reads and then executes from, with `shell: true`,
 * in the base worktree. Nothing else in the pipeline re-executes a string it
 * read back off disk, so nothing else has to care where that string came from;
 * this does. The workspace token is a directory, and a directory is a name a
 * pull request can choose: `packages/x";curl …|sh;"` is a legal path in git
 * and on Linux, and it round-trips through the report into a shell.
 *
 * Restricting to the emitter's own grammar costs nothing real — `build-test`
 * produces `npm test` and `npm test --workspace="<dir>"`, both matched here —
 * and anything outside it is skipped and disclosed rather than run, which is
 * the same treatment every other thing this command cannot do gets.
 */
const RERUNNABLE_COMMAND_RE = /^npm test(?: --workspace="[\w@./-]+")?$/;
/** `trimOutput`'s own marker — the one signal that a stored output is partial. */
const TRIM_MARKER_RE = /\.\.\. \[\d+ characters omitted/;
/**
 * Test files a runner named as failing, out of one command's output.
 *
 * Two shapes cover vitest and jest, the runners build-test drives:
 * `FAIL  src/x.test.ts > name` (both, in the failure section) and vitest's
 * per-file `❯ src/x.test.ts (12 tests | 3 failed)` progress line. Matching is
 * on the path token, so a `FAIL` line whose path was truncated mid-token by
 * output trimming simply does not match — an unparsed failure surfaces as a
 * count mismatch in the caller's disclosure, never as an invented path.
 */
export function failingFilesOf(output, root = '') {
    const text = output.replace(ANSI_SGR_RE, '');
    const files = new Set();
    const re = 
    // `\\` and `:` in the path class: a Windows runner prints
    // `FAIL  C:\\repo\\src\\x.test.ts`, which the POSIX-only class missed —
    // and a missed parse is an unattributed failure, not a loud error.
    /(?:^|\s)(?:FAIL\s+|❯\s+)(?:\|([^|]+)\|\s+)?([\w@.:\\/-]+\.(?:test|spec)\.[cm]?[jt]sx?)\b([^\n]*)/gm;
    let m;
    while ((m = re.exec(text))) {
        // The `❯` progress line lists every file; only a failing one counts.
        if (m[0].trimStart().startsWith('❯') && !/failed/.test(m[3] ?? ''))
            continue;
        // ROOT-RELATIVE, and keyed by project. The two sides run in DIFFERENT
        // roots (the PR worktree and the base tree), so comparing absolute paths
        // verbatim made every pre-existing failure a fabricated netNew. The vitest
        // project token is part of the identity too: dropping it collapsed
        // same-named files across workspaces, suppressing a real Critical as a
        // "measurement" — the worse of the two failure directions.
        files.add(`${m[1] ? `${m[1].trim()}::` : ''}${relativeToRoot(m[2], root)}`);
    }
    return [...files].sort();
}
/** Strip the run's own root (and any leading `./`) so the two sides compare. */
export function relativeToRoot(file, root) {
    const norm = (v) => v.replace(/\\/g, '/').replace(/\/+$/, '');
    const f = norm(file);
    const r = root ? norm(root) : '';
    const rel = r && f.startsWith(`${r}/`) ? f.slice(r.length + 1) : f;
    return rel.replace(/^\.\//, '');
}
// Mirrors build-test's run() on the three properties its comments call out as
// deliberate — reviewed live when this reimplementation diverged on all three:
// stdin ignored (a rerun that asks a question hangs to the deadline), timeout
// read from error.code with the SIGTERM/null-status fallback (the substring
// form misses a maxBuffer kill, which would flow into the base-green Critical
// path), and trimmed output (a failing monorepo suite is hundreds of KB that
// would otherwise land verbatim in the report Agent 7 reads).
function run(command, cwd, timeoutMs) {
    const started = Date.now();
    const r = spawnSync(command, {
        shell: true,
        cwd,
        encoding: 'utf8',
        timeout: timeoutMs,
        env: buildRunEnv(process.env),
        maxBuffer: 64 * 1024 * 1024,
        // build-test's, deliberately: "a build that asks a question is a build that
        // hangs until the deadline" — and this reruns those same commands.
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    // The sibling's predicate, not a weaker re-derivation: an external SIGTERM
    // (container stop, cancelled CI job) sets neither an ETIMEDOUT message nor
    // an exit code, so the substring form reported timedOut:false with empty
    // output and fed straight into the base-green path.
    const timedOut = spawnTimedOut(r);
    const raw = `${r.stdout ?? ''}${r.stderr ?? ''}`;
    return {
        command,
        exitCode: timedOut ? null : (r.status ?? null),
        seconds: Math.round((Date.now() - started) / 1000),
        timedOut,
        failingFiles: timedOut ? [] : failingFilesOf(raw, cwd),
        // Bounded like build-test's: this lands in `entries[].base.output`, which
        // is JSON.stringify'd to --out, and the verdict fields sit AFTER it — an
        // untrimmed megabyte pushes exactly what the command produces past any
        // reader's truncation.
        output: trimOutput(raw),
    };
}
/**
 * Whole-command budget, mirroring test-efficacy's. `--timeout` is PER COMMAND,
 * so three failed commands at the 300s default is 900s against the 600s tool
 * ceiling — killed with NO report written, discarding the base-tree install and
 * build just paid for. Commands the budget cannot fit are disclosed, never
 * silently dropped.
 */
const TOTAL_BUDGET_MS = 540_000;
/** The CLI default, reused when a programmatic caller omits `--timeout`. */
const DEFAULT_TIMEOUT_S = 300;
export function runTestDelta(args) {
    const exec = args.exec ?? run;
    const baseline = resolve(args.baseline);
    const empty = (note) => ({
        entries: [],
        netNew: [],
        shared: [],
        skippedForBudget: [],
        note,
    });
    let report;
    try {
        report = JSON.parse(readFileSync(args.report, 'utf8'));
    }
    catch (err) {
        return empty(`cannot read the build-test report ${args.report}: ${err.message}`);
    }
    if (!existsSync(baseline)) {
        return empty(`the base tree ${baseline} does not exist — run \`qwen review base-tree\` first`);
    }
    // Failed for real: a timeout is an infrastructure result and reruns as one.
    const failed = (report.test ?? []).filter((t) => !t.timedOut && t.exitCode !== 0);
    if (failed.length === 0) {
        return empty('no PR-side test command failed — there is nothing to attribute, and the base run would measure nothing');
    }
    // A programmatic caller may omit `timeout`; `NaN * 1000` reaches spawnSync as
    // an invalid deadline. Fall back to the CLI's own default.
    const perCommandMs = (Number.isFinite(args.timeout) ? args.timeout : DEFAULT_TIMEOUT_S) * 1000;
    const now = args.now ?? Date.now;
    const startedAt = now();
    const skippedForBudget = [];
    /** Reruns killed by a deadline the BUDGET shortened, not by their own. */
    const budgetClamped = [];
    const entries = [];
    /** Commands that did not match the emitter's grammar, so were never run. */
    const skippedUnrecognised = [];
    for (const t of failed) {
        if (!RERUNNABLE_COMMAND_RE.test(t.command)) {
            skippedUnrecognised.push(t.command);
            continue;
        }
        const remaining = TOTAL_BUDGET_MS - (now() - startedAt);
        // PRICE the slot against how long the command actually took on the PR
        // side, the way test-efficacy prices a mutant run against the measured
        // baseline. A flat 5s floor admits a command with six seconds left, whose
        // guaranteed timeout `budgetClamped` below then has to explain after the
        // fact — cheaper, and honester, not to start a rerun the window cannot
        // hold. `seconds` is the PR side's own duration; the base tree is built
        // and warm, so it is the closest estimate available. Floored so a
        // sub-second command still gets a usable window, and capped by the
        // per-command deadline so a slow command is not skipped for wanting more
        // than it would ever be given.
        const estimateMs = Math.max((t.seconds ?? 0) * 1000, 30_000);
        if (remaining < Math.min(estimateMs, perCommandMs)) {
            skippedForBudget.push(t.command);
            continue;
        }
        const prFailingFiles = failingFilesOf(t.output ?? '', args.prWorktree ?? '');
        // A clamped deadline is not the same fact as a slow command: if the
        // budget cut this rerun short, "timed out — infrastructure" would send the
        // reader hunting a hang that is really an exhausted budget. Record which.
        const clamped = remaining < perCommandMs;
        const base = exec(t.command, baseline, Math.min(perCommandMs, remaining));
        if (base.timedOut && clamped)
            budgetClamped.push(t.command);
        // Prefer what the run itself measured off the untrimmed text; fall back to
        // re-parsing the bounded output only for a seam that supplies neither.
        const baseFailingFiles = base.timedOut
            ? []
            : (base.failingFiles ?? failingFilesOf(base.output, baseline));
        // The PR side is what netNew/shared are derived from, so a PR side that
        // parsed NOTHING attributes nothing — regardless of what the base rerun
        // managed to parse. Requiring both sides to be empty silently dropped a
        // failed command whose FAIL lines the trim had scattered.
        const unparsed = prFailingFiles.length === 0;
        // The PR side is read out of build-test's STORED output, which that command
        // trimmed on the same rules. The base side is parsed raw (see BaseRunResult)
        // so it can never be the short one, but nothing here can un-trim the report:
        // a PR-side set missing files makes `shared` — not `netNew` — too small, so
        // the loss is silence, and silence still gets said out loud.
        const prTruncated = TRIM_MARKER_RE.test(t.output ?? '');
        // A base run that never finished attributes NOTHING: with its failing set
        // unknowable, promoting the PR side's failures to net-new would
        // manufacture the strongest evidence this command produces out of an
        // infrastructure timeout. The files stay unattributed (neither list), and
        // the note says why.
        // ...and so does a base rerun that FAILED without naming a single failing
        // file. An unbuilt base tree, a missing node_modules, a workspace the PR
        // ADDED (so `npm test --workspace=…` cannot resolve on base), an ENOBUFS
        // truncation: each exits non-zero with zero FAIL lines, indistinguishable
        // here from a green base. Reading it as green promotes every PR-side
        // failure to netNew — the strongest evidence this command emits,
        // manufactured from a base that never ran a test.
        const baseUnusable = base.timedOut || (base.exitCode !== 0 && baseFailingFiles.length === 0);
        entries.push({
            command: t.command,
            prFailingFiles,
            baseFailingFiles,
            netNew: baseUnusable
                ? []
                : prFailingFiles.filter((f) => !baseFailingFiles.includes(f)),
            shared: baseUnusable
                ? []
                : prFailingFiles.filter((f) => baseFailingFiles.includes(f)),
            base,
            unparsed,
            prTruncated,
        });
    }
    const netNew = [...new Set(entries.flatMap((e) => e.netNew))].sort();
    const shared = [...new Set(entries.flatMap((e) => e.shared))].sort();
    const unparsed = entries.filter((e) => e.unparsed).length;
    const timedOut = entries.filter((e) => e.base.timedOut).length;
    const truncated = entries.filter((e) => e.prTruncated).length;
    const parts = [];
    if (netNew.length) {
        parts.push(`${netNew.length} failing file(s) do NOT fail on base — the PR's own by measurement: ${netNew.join(', ')}`);
    }
    if (shared.length) {
        parts.push(`${shared.length} failing file(s) also fail on base — pre-existing, whatever files the diff touches: ${shared.join(', ')}`);
    }
    if (unparsed) {
        parts.push(`${unparsed} command(s) failed but named no parseable failing file — no delta for those; judge them by the diff as before`);
    }
    if (skippedUnrecognised.length) {
        parts.push(`${skippedUnrecognised.length} failed command(s) were not rerun because they are not the shape \`build-test\` emits (${skippedUnrecognised.join(', ')}) — this command executes what the report names, so it executes only that grammar; their failures stay unattributed, judge them by the diff`);
    }
    if (truncated) {
        parts.push(`${truncated} command(s) had their PR-side output trimmed before this ran, so their failing-file list may be partial — a file missing there is one this delta could not call pre-existing, never one it invented`);
    }
    const unusable = entries.filter((e) => !e.unparsed &&
        e.prFailingFiles.length > 0 &&
        e.netNew.length === 0 &&
        e.shared.length === 0 &&
        !e.base.timedOut);
    if (unusable.length) {
        parts.push(`${unusable.length} command(s) could not be attributed — the base rerun ${unusable
            .map((e) => `\`${e.command}\` failed (exit ${e.base.exitCode}) without naming a failing file, so it did not measure the base (an unbuilt tree, a missing install, a workspace absent at base)`)
            .join('; ')}; judge those failures by the diff as before`);
    }
    if (timedOut) {
        parts.push(`${timedOut} base-side rerun(s) timed out — infrastructure, not evidence` +
            (budgetClamped.length
                ? ` (${budgetClamped.length} of them on a deadline the whole-command budget shortened, not their own: ${budgetClamped.join(', ')} — a rerun with budget to spare may still measure them)`
                : ''));
    }
    if (skippedForBudget.length) {
        parts.push(`${skippedForBudget.length} failed command(s) not rerun — the whole-command budget was exhausted (${skippedForBudget.join(', ')}); their failures stay unattributed, judge them by the diff`);
    }
    return {
        entries,
        netNew,
        shared,
        skippedForBudget,
        note: parts.join('. ') || 'nothing to report',
    };
}
export const testDeltaCommand = {
    command: 'test-delta',
    describe: "Rerun the PR side's failed test commands on the base tree and report which failing files are the PR's own (net-new) vs pre-existing (shared)",
    builder: (yargs) => yargs
        .option('report', {
        type: 'string',
        demandOption: true,
        describe: "Agent 7's build-test report (its failed commands and outputs)",
    })
        .option('baseline', {
        type: 'string',
        demandOption: true,
        describe: 'The BUILT base tree from `qwen review base-tree`',
    })
        .option('pr-worktree', {
        type: 'string',
        describe: "The PR worktree the report's failures were produced in — its root " +
            'is stripped so both sides compare as repo-relative paths',
    })
        .option('out', { type: 'string', describe: 'Write the JSON report here' })
        .option('timeout', {
        type: 'number',
        default: 300,
        describe: 'Per-command deadline in seconds, as build-test',
    }),
    handler: (argv) => {
        const args = argv;
        const report = runTestDelta(args);
        if (args.out) {
            mkdirSync(dirname(resolve(args.out)), { recursive: true });
            writeFileSync(resolve(args.out), JSON.stringify(report, null, 2));
        }
        writeStdoutLine(JSON.stringify(report, null, 2));
        writeStderrLine(`test-delta: ${report.note}`);
    },
};
//# sourceMappingURL=test-delta.js.map