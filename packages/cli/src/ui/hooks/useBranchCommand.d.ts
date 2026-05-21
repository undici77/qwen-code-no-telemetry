/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import type { UseHistoryManagerReturn } from './useHistoryManager.js';
export interface UseBranchCommandOptions {
    config: Config | null;
    historyManager: Pick<UseHistoryManagerReturn, 'clearItems' | 'loadHistory' | 'addItem'>;
    startNewSession: (sessionId: string) => void;
    setSessionName?: (name: string | null) => void;
    remount?: () => void;
}
export interface UseBranchCommandResult {
    handleBranch: (name?: string) => Promise<void>;
}
/**
 * Orchestrates `/branch`:
 *   1. Capture the current (soon-to-be-parent) sessionId for the resume hint.
 *   2. Finalize the outgoing ChatRecordingService so the last metadata is on disk.
 *   3. Call `SessionService.forkSession` to write a new JSONL under a new id.
 *   4. Load the fork back via `loadSession` and switch the UI + core config.
 *   5. Compute the customTitle — user-provided name OR `deriveFirstPrompt` —
 *      always suffixed with ` (Branch)` (bumping to `(Branch N)` on collision).
 *   6. Fire the SessionStart hook.
 *   7. Announce the fork with Claude-style two-line info item:
 *        `Branched conversation "foo". You are now in the branch.`
 *        `To resume the original: /resume <oldSessionId>`
 *
 * Mirrors claude-code/src/commands/branch/branch.ts.
 */
export declare function useBranchCommand(options: UseBranchCommandOptions): UseBranchCommandResult;
