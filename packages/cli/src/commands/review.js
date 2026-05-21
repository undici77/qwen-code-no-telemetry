/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { fetchPrCommand } from './review/fetch-pr.js';
import { prContextCommand } from './review/pr-context.js';
import { loadRulesCommand } from './review/load-rules.js';
import { deterministicCommand } from './review/deterministic.js';
import { presubmitCommand } from './review/presubmit.js';
import { cleanupCommand } from './review/cleanup.js';
export const reviewCommand = {
    command: 'review',
    describe: 'Internal helpers used by the /review skill (PR worktree setup, context fetch, rules loading, deterministic analysis, presubmit checks, cleanup)',
    builder: (yargs) => yargs
        .command(fetchPrCommand)
        .command(prContextCommand)
        .command(loadRulesCommand)
        .command(deterministicCommand)
        .command(presubmitCommand)
        .command(cleanupCommand)
        .demandCommand(1, 'Specify a subcommand: fetch-pr, pr-context, load-rules, deterministic, presubmit, or cleanup.')
        .version(false),
    handler: () => {
        // yargs handles this via demandCommand(1) above.
    },
};
//# sourceMappingURL=review.js.map