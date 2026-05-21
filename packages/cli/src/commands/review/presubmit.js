/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { writeStdoutLine } from '../../utils/stdioHelpers.js';
import { gh, ghApi, ghApiAll, currentUser, ensureAuthenticated, } from './lib/gh.js';
const FAIL_CONCLUSIONS = new Set([
    'failure',
    'cancelled',
    'timed_out',
    'action_required',
]);
const FAIL_STATUS_STATES = new Set(['failure', 'error']);
const PENDING_STATES = new Set(['queued', 'in_progress', 'pending']);
function classifyCi(checkRuns, statuses) {
    const failedCheckNames = [];
    let hasPending = false;
    for (const run of checkRuns) {
        if (run.status === 'completed') {
            if (run.conclusion && FAIL_CONCLUSIONS.has(run.conclusion)) {
                failedCheckNames.push(run.name);
            }
        }
        else if (PENDING_STATES.has(run.status)) {
            hasPending = true;
        }
    }
    for (const s of statuses) {
        if (FAIL_STATUS_STATES.has(s.state)) {
            failedCheckNames.push(s.context);
        }
        else if (PENDING_STATES.has(s.state)) {
            hasPending = true;
        }
    }
    let cls;
    if (failedCheckNames.length > 0) {
        cls = 'any_failure';
    }
    else if (checkRuns.length === 0 && statuses.length === 0) {
        cls = 'no_checks';
    }
    else if (hasPending) {
        cls = 'all_pending';
    }
    else {
        cls = 'all_pass';
    }
    return {
        class: cls,
        failedCheckNames,
        totalChecks: checkRuns.length + statuses.length,
    };
}
function classifyExistingComments(qwenComments, repliedToIds, newFindingKeys, commitSha) {
    const buckets = { stale: [], resolved: [], overlap: [], noConflict: [] };
    for (const c of qwenComments) {
        const summary = {
            id: c.id,
            path: c.path ?? '',
            line: c.line ?? 0,
            commit_id: c.commit_id ?? '',
            body: (c.body || '').slice(0, 80),
        };
        // Priority: Stale > Resolved > Overlap > NoConflict.
        if (c.commit_id !== commitSha) {
            buckets.stale.push(summary);
        }
        else if (repliedToIds.has(c.id)) {
            buckets.resolved.push(summary);
        }
        else if (newFindingKeys.has(`${c.path}:${c.line}`)) {
            buckets.overlap.push(summary);
        }
        else {
            buckets.noConflict.push(summary);
        }
    }
    return buckets;
}
async function runPresubmit(args) {
    const { pr_number: prNumber, commit_sha: commitSha, owner_repo: ownerRepo, out_path: outPath, } = args;
    const newFindingsPath = args['new-findings'];
    const slash = ownerRepo.indexOf('/');
    if (slash < 0) {
        throw new Error('owner_repo must look like "owner/repo"');
    }
    const owner = ownerRepo.slice(0, slash);
    const repo = ownerRepo.slice(slash + 1);
    ensureAuthenticated();
    // --- Self-PR detection -------------------------------------------------
    const author = gh('api', `repos/${owner}/${repo}/pulls/${prNumber}`, '--jq', '.user.login');
    const me = currentUser();
    const isSelfPr = author.toLowerCase() === me.toLowerCase();
    // --- CI status ---------------------------------------------------------
    const checkRunsResp = ghApi(`repos/${owner}/${repo}/commits/${commitSha}/check-runs`);
    const checkRuns = checkRunsResp?.check_runs ?? [];
    const statusResp = ghApi(`repos/${owner}/${repo}/commits/${commitSha}/status`);
    const statuses = statusResp?.statuses ?? [];
    const ciStatus = classifyCi(checkRuns, statuses);
    // --- Existing Qwen Code comments --------------------------------------
    // Paginate: PRs can have >30 inline comments and the latest pages carry
    // the most recent (and most likely to overlap with new findings).
    const allComments = ghApiAll(`repos/${owner}/${repo}/pulls/${prNumber}/comments`);
    const qwenComments = allComments.filter((c) => /via Qwen Code \/review/.test(c.body ?? ''));
    const repliedToIds = new Set();
    for (const c of allComments) {
        if (c.in_reply_to_id)
            repliedToIds.add(c.in_reply_to_id);
    }
    let newFindings = [];
    if (newFindingsPath) {
        newFindings = JSON.parse(readFileSync(newFindingsPath, 'utf8'));
    }
    const newFindingKeys = new Set(newFindings.map((f) => `${f.path}:${f.line}`));
    const buckets = classifyExistingComments(qwenComments, repliedToIds, newFindingKeys, commitSha);
    // --- Downgrade decisions ----------------------------------------------
    const downgradeReasons = [];
    if (isSelfPr)
        downgradeReasons.push('self-PR');
    if (ciStatus.class === 'any_failure') {
        downgradeReasons.push(`CI failing: ${ciStatus.failedCheckNames.join(', ')}`);
    }
    if (ciStatus.class === 'all_pending') {
        downgradeReasons.push('CI still running');
    }
    const result = {
        prNumber,
        commitSha,
        ownerRepo,
        isSelfPr,
        ciStatus,
        existingComments: {
            total: qwenComments.length,
            byBucket: {
                stale: buckets.stale.length,
                resolved: buckets.resolved.length,
                overlap: buckets.overlap.length,
                noConflict: buckets.noConflict.length,
            },
            overlap: buckets.overlap,
            stale: buckets.stale,
            resolved: buckets.resolved,
            noConflict: buckets.noConflict,
        },
        downgradeApprove: isSelfPr ||
            ciStatus.class === 'any_failure' ||
            ciStatus.class === 'all_pending',
        downgradeRequestChanges: isSelfPr,
        downgradeReasons,
        blockOnExistingComments: buckets.overlap.length > 0,
    };
    writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
    writeStdoutLine(`Wrote presubmit report to ${outPath}`);
}
export const presubmitCommand = {
    command: 'presubmit <pr_number> <commit_sha> <owner_repo> <out_path>',
    describe: 'Pre-submission checks for /review Step 9 (self-PR detection, CI status, existing-comments classification)',
    builder: (yargs) => yargs
        .positional('pr_number', {
        type: 'string',
        demandOption: true,
        describe: 'PR number',
    })
        .positional('commit_sha', {
        type: 'string',
        demandOption: true,
        describe: 'PR HEAD commit SHA',
    })
        .positional('owner_repo', {
        type: 'string',
        demandOption: true,
        describe: 'GitHub "owner/repo"',
    })
        .positional('out_path', {
        type: 'string',
        demandOption: true,
        describe: 'Output JSON path (will be overwritten)',
    })
        .option('new-findings', {
        type: 'string',
        describe: 'Path to a JSON file shaped as [{path, line}, ...] — when provided, existing comments are checked for same-(path, line) overlap with the new findings.',
    }),
    handler: async (argv) => {
        await runPresubmit(argv);
    },
};
//# sourceMappingURL=presubmit.js.map