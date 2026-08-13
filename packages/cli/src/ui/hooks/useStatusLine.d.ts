/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type StatusLinePresetConfig } from '../statusLinePresets.js';
/**
 * Structured JSON input passed to the status line command via stdin.
 * This allows status line commands to display context-aware information
 * (model, token usage, session, etc.) without running extra queries.
 */
export interface StatusLineCommandInput {
    session_id: string;
    version: string;
    model: {
        display_name: string;
    };
    context_window: {
        context_window_size: number;
        used_percentage: number;
        remaining_percentage: number;
        current_usage: number;
        total_input_tokens: number;
        total_output_tokens: number;
    };
    workspace: {
        current_dir: string;
    };
    git?: {
        branch: string;
    };
    /**
     * Present when the session is inside an active worktree (created by
     * `enter_worktree`). Field names mirror claude-code's StatusLine payload
     * so users can share statusline scripts across both CLIs.
     */
    worktree?: {
        name: string;
        path: string;
        branch: string;
        original_cwd: string;
        original_branch: string;
    };
    metrics: {
        models: Record<string, {
            api: {
                total_requests: number;
                total_errors: number;
                total_latency_ms: number;
            };
            tokens: {
                prompt: number;
                completion: number;
                total: number;
                cached: number;
                thoughts: number;
            };
        }>;
        files: {
            total_lines_added: number;
            total_lines_removed: number;
        };
    };
    vim?: {
        mode: string;
    };
}
interface StatusLineCommandConfig {
    type: 'command';
    command: string;
    refreshInterval?: number;
    respectUserColors?: boolean;
    hideContextIndicator?: boolean;
}
/**
 * Resolves the tri-state `hideContextIndicator` setting:
 * - explicit `true`/`false` always wins, so users can force either behavior;
 * - when unset, a preset status line that already shows context usage hides
 *   the footer indicator to avoid duplicating it;
 * - callers can keep the automatic indicator when their layout may clip it;
 * - when unset for a `command` status line, the indicator stays visible — the
 *   command output is opaque, so we never guess what it contains.
 */
export declare function resolveHideContextIndicator(config: StatusLineConfig | undefined, isContextOverLimit?: boolean, keepAutomaticIndicator?: boolean): boolean;
type StatusLineConfig = StatusLineCommandConfig | StatusLinePresetConfig;
export declare const MAX_STATUS_LINES = 2;
/**
 * Hook that executes a user-configured shell command and returns its output
 * for display in the status line. The command receives structured JSON context
 * via stdin.
 *
 * Updates are debounced (300ms) and triggered by state changes (model switch,
 * new messages, vim mode toggle) rather than blind polling. When the config
 * sets `refreshInterval` (seconds, >= 1), the command is additionally re-run
 * on a timer so external data (git branch, quota, clock) stays fresh even
 * when no Agent state has changed.
 */
export declare function useStatusLine(keepAutomaticContextIndicator?: boolean, availableWidth?: number): {
    lines: string[];
    useThemeColors: boolean;
    respectUserColors: boolean;
    hideContextIndicator: boolean;
};
export {};
