/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';
import { refExists } from './lib/git.js';
import { worktreePath, reviewBranch, REVIEW_TMP_DIR, tmpPrefix, } from './lib/paths.js';
function runCleanup(target) {
    let removedAny = false;
    // --- Worktree + branch (only for PR targets) -------------------------
    const prMatch = /^pr-(\d+)$/.exec(target);
    if (prMatch) {
        const prNumber = prMatch[1];
        const wt = worktreePath(prNumber);
        if (existsSync(wt)) {
            try {
                execFileSync('git', ['worktree', 'remove', wt, '--force'], {
                    stdio: 'pipe',
                });
                writeStdoutLine(`Removed worktree: ${wt}`);
                removedAny = true;
            }
            catch (err) {
                writeStderrLine(`Failed to remove worktree ${wt}: ${err.message}`);
            }
        }
        const branch = reviewBranch(prNumber);
        if (refExists(branch)) {
            try {
                execFileSync('git', ['branch', '-D', branch], { stdio: 'pipe' });
                writeStdoutLine(`Deleted ref: ${branch}`);
                removedAny = true;
            }
            catch (err) {
                writeStderrLine(`Failed to delete branch ${branch}: ${err.message}`);
            }
        }
    }
    // --- Per-target side files (under .qwen/tmp/) -------------------------
    const prefix = tmpPrefix(target);
    let tmpEntries = [];
    try {
        tmpEntries = existsSync(REVIEW_TMP_DIR) ? readdirSync(REVIEW_TMP_DIR) : [];
    }
    catch (err) {
        writeStderrLine(`Failed to read ${REVIEW_TMP_DIR}: ${err.message}`);
    }
    for (const file of tmpEntries) {
        if (!file.startsWith(prefix))
            continue;
        const full = join(REVIEW_TMP_DIR, file);
        try {
            unlinkSync(full);
            writeStdoutLine(`Removed temp file: ${full}`);
            removedAny = true;
        }
        catch (err) {
            writeStderrLine(`Failed to remove ${full}: ${err.message}`);
        }
    }
    if (!removedAny) {
        writeStdoutLine(`Nothing to clean for target "${target}".`);
    }
}
export const cleanupCommand = {
    command: 'cleanup <target>',
    describe: 'Post-review cleanup: remove worktree, branch ref, and per-target temp files',
    builder: (yargs) => yargs.positional('target', {
        type: 'string',
        demandOption: true,
        describe: 'Review target — "pr-<n>" for a PR review, "local" for an uncommitted review, or a filename for a file review',
    }),
    handler: (argv) => {
        runCleanup(argv.target);
    },
};
//# sourceMappingURL=cleanup.js.map