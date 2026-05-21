/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
interface WorktreeExitDialogProps {
    slug: string;
    branch: string;
    worktreePath: string;
    originalHeadCommit: string;
    onKeep: () => void;
    onRemove: () => void;
    onCancel: () => void;
}
/**
 * Dialog shown when the user attempts to exit a session that has an active
 * worktree. Loads dirty-state info (uncommitted files + new commits since
 * worktree creation) on mount so the user has full context before choosing
 * keep / remove / cancel.
 *
 * The dialog does NOT auto-remove on a clean worktree (unlike claude-code) —
 * the user explicitly requested a confirmation prompt in every case so they
 * stay aware of which worktree is active.
 */
export declare function WorktreeExitDialog({ slug, branch, worktreePath, originalHeadCommit, onKeep, onRemove, onCancel, }: WorktreeExitDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
