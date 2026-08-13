/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect } from 'vitest';
import { reviewCommand } from './review.js';
// Guards the `qwen review` subcommand surface. The `deterministic` subcommand
// was the internal backend for the /review skill's old Step 3; when that step
// was removed it became orphaned and was deleted. This test ensures it stays
// gone and the remaining internal helpers stay registered, so a future edit
// can't silently re-add `deterministic`, drop one of the others, or let the
// `describe` / demand text drift.
describe('reviewCommand', () => {
    function inspectBuilder() {
        const names = [];
        let demandMessage = '';
        const stub = {
            command: (m) => {
                names.push(String(m.command).split(' ')[0]);
                return stub;
            },
            demandCommand: (_min, msg) => {
                demandMessage = msg;
                return stub;
            },
            version: () => stub,
        };
        reviewCommand.builder(stub);
        return { names, demandMessage };
    }
    function registeredSubcommands() {
        return inspectBuilder().names;
    }
    it('registers exactly the expected internal helper subcommands', () => {
        expect(registeredSubcommands()).toEqual([
            'run',
            'parse-args',
            'match-remote',
            'fetch-pr',
            'capture-local',
            'plan-diff',
            'repo-context',
            'pr-context',
            'comment-status',
            'load-rules',
            'agent-prompt',
            'build-test',
            'base-tree',
            'test-delta',
            'drive',
            'mock-provider',
            'extract-step',
            'script-lint',
            'resolve-anchors',
            'check-coverage',
            'cost-ledger',
            'presubmit',
            'test-efficacy',
            'test-plan',
            'findings',
            'publish-assets',
            'compose-review',
            'save-artifact',
            'submit',
            'cleanup',
        ]);
    });
    it('the demandCommand message names every registered subcommand', () => {
        // The error message is the one place that enumerates the interface for
        // a user who typed `qwen review` bare; it once omitted plan-diff.
        const { names, demandMessage } = inspectBuilder();
        for (const name of names) {
            expect(demandMessage).toContain(name);
        }
    });
    it('does not register the removed `post-suggestions` subcommand', () => {
        expect(registeredSubcommands()).not.toContain('post-suggestions');
    });
    it('does not register the removed `deterministic` subcommand', () => {
        expect(registeredSubcommands()).not.toContain('deterministic');
    });
    it('describe no longer mentions deterministic analysis', () => {
        expect(reviewCommand.describe).not.toMatch(/deterministic/i);
    });
});
//# sourceMappingURL=review.test.js.map