import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { WorktreeExitDialog } from './WorktreeExitDialog.js';
// Stub `node:child_process.execFile` so a render here doesn't actually
// spawn `git` against the synthetic worktreePath in props. The default
// vi.fn() never invokes the callback, which keeps the dialog in its
// loading state — perfect for asserting the initial render frame
// without depending on async useEffect resolution (which is brittle
// under ink-testing-library; see PR #4174 reviewer notes on dialog
// dirty-state coverage).
vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, execFile: vi.fn() };
});
// useKeypress only matters for the Escape handler, which we don't
// exercise in unit tests (it's covered by the E2E Group E suite).
vi.mock('../hooks/useKeypress.js', () => ({
    useKeypress: vi.fn(),
}));
const baseProps = {
    slug: 'test-feature',
    branch: 'worktree-test-feature',
    worktreePath: '/tmp/repo/.qwen/worktrees/test-feature',
    originalHeadCommit: 'a'.repeat(40),
    onKeep: vi.fn(),
    onRemove: vi.fn(),
    onCancel: vi.fn(),
};
describe('WorktreeExitDialog', () => {
    it('renders the loading frame before git probes resolve', () => {
        const { lastFrame } = render(_jsx(WorktreeExitDialog, { ...baseProps }));
        expect(lastFrame()).toContain('Checking worktree status');
    });
});
//# sourceMappingURL=WorktreeExitDialog.test.js.map