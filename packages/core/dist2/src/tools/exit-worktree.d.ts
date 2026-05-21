/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ToolCallConfirmationDetails, ToolResult } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation } from './tools.js';
import type { Config } from '../config/config.js';
import type { PermissionDecision } from '../permissions/types.js';
export interface ExitWorktreeParams {
    /**
     * The name (slug) of the worktree to exit, as provided to or returned
     * by `enter_worktree`.
     */
    name: string;
    /**
     * What to do with the worktree:
     * - `'keep'` — leave the worktree directory and branch intact for later use.
     * - `'remove'` — delete the worktree directory and branch.
     */
    action: 'keep' | 'remove';
    /**
     * When `action='remove'`, must be `true` to delete a worktree that has
     * uncommitted changes (tracked or untracked).
     */
    discard_changes?: boolean;
}
declare class ExitWorktreeInvocation extends BaseToolInvocation<ExitWorktreeParams, ToolResult> {
    private readonly config;
    constructor(config: Config, params: ExitWorktreeParams);
    getDescription(): string;
    /**
     * `action: 'remove'` deletes a worktree directory and (when safe) its
     * branch. Other destructive tools (`edit`, `write_file`,
     * `run_shell_command`) prompt by default; this tool should too. The
     * `keep` action is non-destructive (it only restores the original
     * working directory) and falls back to the framework default.
     */
    getDefaultPermission(): Promise<PermissionDecision>;
    /**
     * Override the framework's default `type: 'info'` confirmation for
     * `action: 'remove'` so it is NOT silently auto-approved in
     * `AUTO_EDIT` mode.
     *
     * Background: `permissionFlow.ts:isAutoEditApproved` auto-approves
     * any tool whose `confirmationDetails.type` is `'edit'` or `'info'`
     * when the session is in `AUTO_EDIT`. The base `BaseToolInvocation`
     * returns `type: 'info'` by default, which means a `getDefaultPermission`
     * of `'ask'` still gets bypassed in AUTO_EDIT — the data-loss path
     * we explicitly closed for `DEFAULT` mode. Returning `type: 'exec'`
     * (the same bucket `run_shell_command` lives in) keeps the
     * confirmation prompt for AUTO_EDIT users too. `keep` falls through
     * to the base info-type since it is non-destructive.
     */
    getConfirmationDetails(_abortSignal: AbortSignal): Promise<ToolCallConfirmationDetails>;
    execute(_signal: AbortSignal): Promise<ToolResult>;
    /**
     * Clears the WorktreeSession sidecar file iff its `slug` matches the
     * worktree being exited. We skip the clear when the sidecar names a
     * different slug because the user might have multiple worktrees on
     * disk while the sidecar tracks only one — wiping it on every exit
     * would orphan the currently-tracked worktree from the CLI's view.
     *
     * Best-effort: failures are logged, never raised.
     */
    private maybeClearWorktreeSession;
}
export declare class ExitWorktreeTool extends BaseDeclarativeTool<ExitWorktreeParams, ToolResult> {
    private readonly config;
    static readonly Name: string;
    constructor(config: Config);
    validateToolParams(params: ExitWorktreeParams): string | null;
    protected createInvocation(params: ExitWorktreeParams): ExitWorktreeInvocation;
}
export {};
