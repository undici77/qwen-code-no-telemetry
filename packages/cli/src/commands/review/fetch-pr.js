/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';
import { ensureAuthenticated, gh } from './lib/gh.js';
import { git, refExists } from './lib/git.js';
import { REVIEW_TMP_DIR, reviewBranch, worktreePath } from './lib/paths.js';
function tryRemove(action) {
    try {
        action();
    }
    catch {
        /* idempotent — silent on missing target */
    }
}
function cleanStale(prNumber) {
    const wt = worktreePath(prNumber);
    if (existsSync(wt)) {
        tryRemove(() => execFileSync('git', ['worktree', 'remove', wt, '--force'], {
            stdio: 'pipe',
        }));
    }
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
    // 1. Clean any stale worktree / branch from an earlier run.
    cleanStale(prNumber);
    // 2. Fetch PR HEAD into a unique local ref.
    const ref = reviewBranch(prNumber);
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
        const json = gh('pr', 'view', prNumber, '--repo', ownerRepo, '--json', 'headRefName,headRefOid,baseRefName,additions,deletions,changedFiles,isCrossRepository');
        meta = JSON.parse(json);
    }
    catch (err) {
        // Roll back the fetched ref so the next run starts clean.
        tryRemove(() => execFileSync('git', ['branch', '-D', ref], { stdio: 'pipe' }));
        throw new Error(`Failed to fetch PR #${prNumber} metadata: ${err.message}`);
    }
    // 4. Create the ephemeral worktree.
    const wt = worktreePath(prNumber);
    try {
        mkdirSync(dirname(wt), { recursive: true });
        git('worktree', 'add', wt, ref);
    }
    catch (err) {
        tryRemove(() => execFileSync('git', ['branch', '-D', ref], { stdio: 'pipe' }));
        throw new Error(`Failed to create worktree at ${wt}: ${err.message}`);
    }
    // 5. Emit the report.
    const result = {
        prNumber,
        ownerRepo,
        remote,
        ref,
        fetchedSha,
        worktreePath: wt,
        baseRefName: meta.baseRefName,
        headRefName: meta.headRefName,
        isCrossRepository: meta.isCrossRepository,
        diffStat: {
            files: meta.changedFiles,
            additions: meta.additions,
            deletions: meta.deletions,
        },
    };
    mkdirSync(REVIEW_TMP_DIR, { recursive: true });
    writeFileSync(out, JSON.stringify(result, null, 2) + '\n', 'utf8');
    writeStdoutLine(`Wrote fetch-pr report to ${out}`);
    // Surface diff stats to stderr so a human running the command interactively
    // sees something useful even without inspecting the JSON.
    writeStderrLine(`PR #${prNumber} (${ownerRepo}): ${meta.changedFiles} files, +${meta.additions}/-${meta.deletions}, base=${meta.baseRefName}, head=${meta.headRefName}`);
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
    }),
    handler: async (argv) => {
        await runFetchPr(argv);
    },
};
//# sourceMappingURL=fetch-pr.js.map