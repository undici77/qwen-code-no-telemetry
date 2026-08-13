/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';
import { createReviewWorktreeLease } from '../../services/review-worktree-lease.js';
import { ensureAuthenticated, gh, setGhHost } from './lib/gh.js';
import { git, gitOpt, gitRaw, refExists, releaseWorktree } from './lib/git.js';
import { PINNED_DIFF_CONFIG, PINNED_DIFF_FLAGS } from './lib/diff-flags.js';
import { REVIEW_TMP_DIR, reviewBranch, tmpFile, worktreePath, } from './lib/paths.js';
import { planEffortField } from './lib/effort.js';
import { buildDiffPlan, DEFAULT_MAX_CHUNK_LINES, READ_FILE_CHAR_CAP, } from './lib/diff-plan.js';
import { buildPlanReport, warnOnReportSize, stringifyPlanReport, } from './lib/report.js';
import { resolveMergeBase } from './lib/merge-base.js';
/** Count lines of `<ref>:<path>`, or 0 if it does not exist there. */
function fileLineCount(ref, path) {
    try {
        const buf = gitRaw('show', `${ref}:${path}`);
        if (buf.length === 0)
            return 0;
        let n = 0;
        for (const b of buf)
            if (b === 0x0a)
                n++;
        // A final line without a trailing newline still counts.
        return buf[buf.length - 1] === 0x0a ? n : n + 1;
    }
    catch {
        return 0; // absent at this ref: created by the PR, or deleted by it
    }
}
/** The real git surface `resolveMergeBase` runs against. */
const gitProbe = {
    fetch: (remote, ref) => gitOpt('fetch', remote, ref) !== null,
    refExists,
    mergeBase: (a, b) => gitOpt('merge-base', a, b),
};
function tryRemove(action) {
    try {
        action();
    }
    catch {
        /* idempotent — silent on missing target */
    }
}
function cleanStale(prNumber) {
    releaseWorktree(worktreePath(prNumber));
    const ref = reviewBranch(prNumber);
    if (refExists(ref)) {
        tryRemove(() => execFileSync('git', ['branch', '-D', ref], { stdio: 'pipe' }));
    }
}
async function runFetchPr(args) {
    const { pr_number: prNumber, owner_repo: ownerRepo, remote, out } = args;
    if (ownerRepo.indexOf('/') < 0) {
        throw new Error('owner_repo must look like "owner/repo"');
    }
    ensureAuthenticated();
    const ref = reviewBranch(prNumber);
    const wt = worktreePath(prNumber);
    createReviewWorktreeLease({
        sessionId: process.env['QWEN_CODE_SESSION_ID'],
        promptId: process.env['QWEN_CODE_PROMPT_ID'],
        target: `pr-${prNumber}`,
        repositoryRoot: process.cwd(),
        worktreePath: wt,
        branch: ref,
    });
    // 1. Clean any stale worktree / branch from an earlier run.
    cleanStale(prNumber);
    // 2. Fetch PR HEAD into a unique local ref.
    try {
        git('fetch', remote, `pull/${prNumber}/head:${ref}`);
    }
    catch (err) {
        throw new Error(`Failed to fetch PR #${prNumber} from remote "${remote}": ${err.message}`);
    }
    const fetchedSha = git('rev-parse', ref);
    // 3. Fetch PR metadata via gh CLI. Cross-repo flag tells the LLM whether
    //    to switch into lightweight mode.
    let meta;
    try {
        const json = gh('pr', 'view', prNumber, '--repo', ownerRepo, '--json', 'headRefName,headRefOid,baseRefName,additions,deletions,changedFiles,isCrossRepository,body');
        meta = JSON.parse(json);
    }
    catch (err) {
        // Roll back the fetched ref so the next run starts clean.
        tryRemove(() => execFileSync('git', ['branch', '-D', ref], { stdio: 'pipe' }));
        throw new Error(`Failed to fetch PR #${prNumber} metadata: ${err.message}`);
    }
    // 4. Create the ephemeral worktree.
    try {
        mkdirSync(dirname(wt), { recursive: true });
        git('worktree', 'add', wt, ref);
    }
    catch (err) {
        tryRemove(() => execFileSync('git', ['branch', '-D', ref], { stdio: 'pipe' }));
        throw new Error(`Failed to create worktree at ${wt}: ${err.message}`);
    }
    mkdirSync(REVIEW_TMP_DIR, { recursive: true });
    // 5. Capture the diff to a file and partition it. Written as raw bytes:
    //    CRLF normalisation would rewrite every hunk of a CRLF file, and the
    //    diff must keep its trailing newline to stay a valid patch.
    const { sha: mergeBaseSha, baseFetchFailed } = resolveMergeBase(remote, meta.baseRefName, ref, gitProbe);
    if (baseFetchFailed) {
        writeStderrLine(`WARNING: could not fetch ${remote}/${meta.baseRefName}. The merge-base ` +
            `is resolved from a possibly stale local ref, so the diff may not be ` +
            `the one under review.`);
    }
    const diffRel = tmpFile(`pr-${prNumber}`, 'diff.txt');
    let diffPath = null;
    let diffPathAbsolute = null;
    let diffText = '';
    if (mergeBaseSha) {
        try {
            // Every knob user config could turn is pinned in `lib/diff-flags.ts`,
            // shared with `capture-local` so the two capture paths cannot drift into
            // producing diffs that parse differently.
            const buf = gitRaw(...PINNED_DIFF_CONFIG, 'diff', ...PINNED_DIFF_FLAGS, `${mergeBaseSha}..${fetchedSha}`);
            writeFileSync(diffRel, buf);
            diffText = buf.toString('utf8');
            diffPath = diffRel;
            diffPathAbsolute = resolve(diffRel);
        }
        catch (err) {
            writeStderrLine(`Failed to capture diff: ${err.message}`);
        }
    }
    else {
        writeStderrLine(`Could not resolve merge-base of ${meta.baseRefName} and ${ref}; ` +
            `agents will have to fall back to running \`git diff\` themselves.`);
    }
    // `buildDiffPlan` throws when the chunks do not tile the diff — a coverage
    // hole. That must be loud, but it must not take the whole review with it: the
    // throw would fire after the worktree exists and before any report is
    // written. Degrade to the documented `diffPath: null` path instead, which
    // tells the skill to fall back and warn the user that coverage is partial.
    let plan;
    try {
        plan = buildDiffPlan(diffText, args.maxChunkLines);
    }
    catch (err) {
        writeStderrLine(`WARNING: could not partition the diff (${err.message}). ` +
            `Falling back to a diff-less report; coverage will be partial.`);
        diffPath = null;
        diffPathAbsolute = null;
        plan = buildDiffPlan('', args.maxChunkLines);
    }
    // 6. Emit the report. The window opening survives drift restarts: this
    // command overwrites its own report, and a reset boundary would hide any
    // bypass write made during the abandoned attempt from cleanup's audit.
    const fetchedAt = new Date().toISOString();
    let auditSince = fetchedAt;
    let prevRaw = null;
    try {
        prevRaw = readFileSync(out, 'utf8');
    }
    catch (err) {
        // ENOENT is the normal first attempt for this target — silent. Any other
        // read failure (EACCES, EISDIR, I/O) is NOT "no previous report"; name it
        // so an operator is not sent toward the wrong cause.
        const code = err.code;
        if (code !== 'ENOENT') {
            writeStderrLine(`WARNING: could not read the previous fetch report at ${out} (${code ?? err.message}); ` +
                `the audit window starts at this fetch and may not reach an earlier abandoned attempt.`);
        }
    }
    if (prevRaw !== null) {
        try {
            const prev = JSON.parse(prevRaw);
            const prevSince = typeof prev.auditSince === 'string'
                ? prev.auditSince
                : typeof prev.fetchedAt === 'string'
                    ? prev.fetchedAt
                    : null;
            if (prev.prNumber === prNumber &&
                prevSince !== null &&
                !Number.isNaN(Date.parse(prevSince)) &&
                // `< auditSince` (which is `fetchedAt`, i.e. now) is also the upper
                // bound: the window opening only ever moves BACKWARD to an earlier
                // attempt, never forward. A corrupted far-future `auditSince`
                // (`"2099-…"`) is therefore rejected here — it would push the window
                // ahead of every real comment and silently report a clean audit.
                // (ISO-8601 strings from `toISOString()` compare chronologically.)
                prevSince < auditSince) {
                auditSince = prevSince;
            }
        }
        catch {
            // The file exists but is unparseable — a crash mid-write leaves
            // truncated JSON. Silently resetting the window to this fetch would let
            // a bypass write from the abandoned attempt escape the audit, so warn:
            // the window may not reach it.
            writeStderrLine(`WARNING: the previous fetch report at ${out} is not valid JSON (a crash mid-write?); ` +
                `the audit window starts at this fetch and may not reach an earlier abandoned attempt.`);
        }
    }
    const result = {
        prNumber,
        ownerRepo,
        remote,
        ref,
        fetchedSha,
        fetchedAt,
        auditSince,
        host: args.host ?? null,
        worktreePath: wt,
        baseRefName: meta.baseRefName,
        headRefName: meta.headRefName,
        isCrossRepository: meta.isCrossRepository,
        // Two gates, because the SKILL acts on this by recommending the PR be
        // closed as superseded — the one ruling here that is expensive to get
        // wrong. `diffPath` (set only on a SUCCESSFUL capture): a capture that
        // threw also leaves diffText empty, and closing off that would close a
        // live PR on an infrastructure error. `baseFetchFailed`: the merge base is
        // then "resolved from a possibly stale local ref" (the warning above says
        // so), and a stale base ref that already contains the head commits diffs
        // to empty — the same wrong recommendation, one cause further out.
        ...(isEmptyDiff({ diffPath, baseFetchFailed, diffText })
            ? { emptyDiff: true }
            : {}),
        // Collapse detection compares recomputed reality against GitHub's
        // advertised stat: a 4x shrink past a 200-line floor is a rebase-lag
        // signature, not rounding. Both thresholds are deliberately coarse — this
        // is a disclosure, never a gate.
        //
        // The two sides are produced by different tools, so the ratio has floors
        // under it for a reason. Rename detection is the divergence that matters:
        // `--find-renames` is pinned here and GitHub applies its own, and a move
        // whose similarity lands on opposite sides of the two thresholds shrinks
        // one side and not the other. That is what the 4x buys — a threshold
        // disagreement moves the ratio by the size of one file, a genuine
        // upstream collapse moves it by the size of the PR. Kept as a disclosure
        // precisely because the ratio is not a measurement of the same quantity
        // twice.
        ...(isCollapsedFromUpstream({
            diffText,
            baseFetchFailed,
            additions: meta.additions,
            deletions: meta.deletions,
        })
            ? { collapsedFromUpstream: true }
            : {}),
        diffStat: {
            files: meta.changedFiles,
            additions: meta.additions,
            deletions: meta.deletions,
        },
        mergeBaseSha,
        baseFetchFailed,
        diffPath,
        diffPathAbsolute,
        prDescriptionHasHan: /\p{Script=Han}/u.test(meta.body ?? ''),
        ...buildPlanReport(plan, (path) => fileLineCount(fetchedSha, path)),
        ...planEffortField(args.effort),
    };
    writeFileSync(out, stringifyPlanReport(result), 'utf8');
    writeStdoutLine(`Wrote fetch-pr report to ${out}`);
    if (diffPath)
        writeStdoutLine(`Wrote review diff to ${diffPath}`);
    // Surface diff stats to stderr so a human running the command interactively
    // sees something useful even without inspecting the JSON.
    writeStderrLine(`PR #${prNumber} (${ownerRepo}): ${meta.changedFiles} files, +${meta.additions}/-${meta.deletions}, base=${meta.baseRefName}, head=${meta.headRefName}`);
    warnOnReportSize(out, READ_FILE_CHAR_CAP);
    writeStderrLine(`Diff: ${plan.diffLines} lines (${plan.srcDiffLines} source, ` +
        `${plan.testDiffLines} test, ${plan.docsDiffLines} docs, ` +
        `${plan.generatedDiffLines} generated) ` +
        `/ ${plan.diffChars} chars -> ${plan.chunks.length} review chunk(s)`);
    const heavy = result.files.filter((f) => f.heavy);
    if (heavy.length > 0) {
        writeStderrLine(`Heavily rewritten (whole-file invariant review): ${heavy
            .map((f) => `${f.path} (${f.changedLines}L, ${f.rewriteRatio})`)
            .join(', ')}`);
    }
}
/**
 * Whether the capture found nothing to review.
 *
 * Extracted and pure because the SKILL ACTS on it — it recommends the PR be
 * closed as superseded — which makes it the one disclosure here that is
 * expensive to get wrong, and it was the one with no test. Both guards are
 * load-bearing and neither is about the diff: a capture that THREW also leaves
 * `diffText` empty (`diffPath` is set only on success), and a merge base
 * resolved from a stale local ref can already contain the head commits and so
 * diff to empty. Either would close a live PR on an infrastructure error.
 */
export function isEmptyDiff(i) {
    return i.diffPath !== null && !i.baseFetchFailed && i.diffText.trim() === '';
}
/**
 * Whether the recomputed diff has collapsed against GitHub's advertised stat —
 * the rebase-lag signature.
 *
 * Both thresholds are coarse on purpose, and the reason is that the two sides
 * are produced by DIFFERENT tools: `--find-renames` is pinned locally while
 * GitHub applies its own, so a move whose similarity lands on opposite sides of
 * the two thresholds shrinks one side and not the other. The 4x is what buys
 * past that — a threshold disagreement moves the ratio by one file, a genuine
 * upstream collapse moves it by the size of the PR — and the 200-line floor
 * keeps small PRs, where one file IS the ratio, out of it entirely. A
 * disclosure, never a gate, precisely because it is not the same quantity
 * measured twice.
 */
export function isCollapsedFromUpstream(i) {
    // The sibling guard, for the sibling reason — and it is the guard, not the
    // ratio, that was missing here. `isEmptyDiff` refuses to rule when the merge
    // base came from a possibly stale local ref because such a base can already
    // contain the head commits and diff to empty. The PARTIAL form of the same
    // cause lands here instead: a stale ref holding most of the head commits
    // shrinks the recomputed diff past the 4x ratio, and this flag then tells
    // Agent 0 a story — "overlapping merged PRs collapsed this one, read the
    // body as description-of-history" — that is wrong in the way that matters,
    // because the body's claims may be perfectly current and the real cause is
    // an infrastructure failure. A disclosure that steers how the body is read
    // has to be as sure of its base as a gate does.
    const advertised = i.additions + i.deletions;
    return (!i.baseFetchFailed &&
        i.diffText.trim() !== '' &&
        advertised >= 200 &&
        countDiffChangedLines(i.diffText) * 4 <= advertised);
}
/** Changed (+/-) lines in a unified diff — headers excluded. */
export function countDiffChangedLines(diffText) {
    // POSITION, not prefix shape. Guessing by prefix (`^-(?!--)`) has to exclude
    // every line starting `--`, and a DELETED line whose own content starts `--`
    // arrives as `--- …`: markdown rules and YAML document markers, SQL and Lua
    // comments, a `--flag` in a script. Each one silently dropped a real changed
    // line, and every drop pushes the ratio toward a false `collapsedFromUpstream`
    // (the disclosure fires when the recomputed count comes in LOW).
    //
    // Inside a hunk the position is unambiguous — `---`/`+++` cannot be file
    // headers there — so track hunk state and count every `+`/`-` line in it.
    let n = 0;
    let inHunk = false;
    for (const line of diffText.split('\n')) {
        if (line.startsWith('@@')) {
            inHunk = true;
            continue;
        }
        // `diff --git` opens the next file's header block; `\ No newline at end of
        // file` is a marker, not content, and git emits it inside the hunk.
        if (line.startsWith('diff --git')) {
            inHunk = false;
            continue;
        }
        if (!inHunk || line.startsWith('\\'))
            continue;
        if (line.startsWith('+') || line.startsWith('-'))
            n++;
    }
    return n;
}
export const fetchPrCommand = {
    command: 'fetch-pr <pr_number> <owner_repo>',
    describe: 'Prepare a PR review worktree: clean stale state, fetch the PR HEAD, create a worktree, and write a JSON state report',
    builder: (yargs) => yargs
        .positional('pr_number', {
        type: 'string',
        demandOption: true,
        describe: 'PR number',
    })
        .positional('owner_repo', {
        type: 'string',
        demandOption: true,
        describe: 'GitHub "owner/repo"',
    })
        .option('remote', {
        type: 'string',
        default: 'origin',
        describe: 'Git remote to fetch from (use "upstream" for fork-based workflows)',
    })
        .option('out', {
        type: 'string',
        demandOption: true,
        describe: 'Output JSON path (will be overwritten)',
    })
        .option('host', {
        type: 'string',
        describe: 'GitHub host for this PR (GitHub Enterprise). Routes every gh call in this command via GH_HOST; omit for github.com.',
    })
        .option('max-chunk-lines', {
        type: 'number',
        default: DEFAULT_MAX_CHUNK_LINES,
        describe: 'Target size, in diff lines, of each review chunk. A chunk boundary falls on a hunk boundary; a hunk larger than this is split only at a top-level declaration, never inside a function.',
    })
        .option('effort', {
        type: 'string',
        choices: ['low', 'medium', 'high'],
        describe: 'The review effort. `medium` (balanced) drops the adversarial ' +
            'personas from the required roster; recorded in the plan so ' +
            'check-coverage, agent-prompt --roster and compose-review all read ' +
            'one value. Omit for the full (high) roster.',
    }),
    handler: async (argv) => {
        setGhHost(argv.host);
        await runFetchPr(argv);
    },
};
//# sourceMappingURL=fetch-pr.js.map