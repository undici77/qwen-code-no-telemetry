/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { ToolInvocation, ToolResult, ToolResultDisplay, ToolCallConfirmationDetails } from './tools.js';
import type { PermissionDecision } from '../permissions/types.js';
import { BaseDeclarativeTool, BaseToolInvocation } from './tools.js';
import type { ShellExecutionConfig } from '../services/shellExecutionService.js';
/**
 * Parse `git diff --numstat` output into a `path → approximate change
 * size` map for attribution accounting. The result feeds in as the
 * denominator clamp for `aiChars`, so missing entries would silently
 * drop a file from attribution — every changed file must land in the
 * map.
 *
 * `--numstat` is preferred over `--stat` because the columns are exact
 * integers (no graphical bars to parse). Each line is:
 *   `<additions>\t<deletions>\t<path>`
 * For binary files, both counts are `-`; we fall back to a fixed
 * estimate so binary-only changes still get a non-zero entry.
 *
 * The `(adds + dels) * 40` figure remains a heuristic — git diff has no
 * cheap way to surface exact character counts. The clamp in
 * `generateNotePayload` keeps the math consistent (aiChars never
 * exceeds diffSize), so the heuristic drives the precision of the
 * percentage but cannot make `aiChars + humanChars` diverge from
 * `diffSize`.
 *
 * Rename notations (`{old => new}` and bare `old => new`) are
 * normalized to the new path so lookups match `--name-only` output.
 *
 * Exported for unit testing — the function is otherwise an
 * implementation detail of `attachCommitAttribution`.
 */
export declare function parseNumstat(numstatOutput: string): Map<string, number>;
export declare const OUTPUT_UPDATE_INTERVAL_MS = 1000;
/**
 * Format the long-run advisory appended to long foreground commands.
 * Exported so tests and any future consumer (e.g. an alternative
 * renderer) can render the same text without duplicating the threshold
 * logic.
 *
 * Wording deliberately keeps the dialog mention conditional ("when
 * running interactively") so the LLM doesn't relay misleading guidance
 * to non-TTY users (`-p` headless / ACP / SDK consumers, where no
 * dialog or footer pill exists). `/tasks` and the on-disk output file
 * work in every mode.
 */
export declare function buildLongRunningForegroundHint(elapsedMs: number): string;
/**
 * Detect standalone or leading `sleep N` patterns that should use Monitor
 * instead. Catches `sleep 5`, `sleep 2.5`, `sleep 2s`,
 * `sleep 5 && check`, `sleep 5; check`, `sleep 5 # wait` — but not sleep
 * inside pipelines, subshells, backgrounded commands, or scripts (those are
 * fine).
 */
export declare function detectBlockedSleepPattern(command: string): string | null;
export interface ShellToolParams {
    command: string;
    is_background: boolean;
    timeout?: number;
    description?: string;
    directory?: string;
}
export declare class ShellToolInvocation extends BaseToolInvocation<ShellToolParams, ToolResult> {
    private readonly config;
    constructor(config: Config, params: ShellToolParams);
    getDescription(): string;
    /**
     * AST-based permission check for the shell command.
     * - Read-only commands (via AST analysis) → 'allow'
     * - All other commands → 'ask'
     */
    getDefaultPermission(): Promise<PermissionDecision>;
    /**
     * Constructs confirmation dialog details for a shell command that needs
     * user approval.  For compound commands (e.g. `cd foo && npm run build`),
     * sub-commands that are already allowed (read-only) are excluded from both
     * the displayed root-command list and the suggested permission rules.
     */
    getConfirmationDetails(_abortSignal: AbortSignal): Promise<ToolCallConfirmationDetails>;
    execute(signal: AbortSignal, updateOutput?: (output: ToolResultDisplay) => void, shellExecutionConfig?: ShellExecutionConfig, setPidCallback?: (pid: number) => void, setPromoteAbortControllerCallback?: (ac: AbortController) => void): Promise<ToolResult>;
    /**
     * Foreground → background promote handler. Called when the foreground
     * execute path observes `result.promoted: true` (the user pressed
     * Ctrl+B mid-flight). Writes the initial snapshot + open the
     * post-promote append stream so subsequent child bytes land in
     * `bg_xxx.output`, registers a `BackgroundShellEntry` in the same
     * registry the `is_background: true` path uses, wires settle so
     * natural child exit transitions the entry to `'completed'` /
     * `'failed'`, and returns a model-facing `ToolResult` pointing at
     * `/tasks` / the dialog / `task_stop` for follow-up.
     *
     * PR-2.5: post-promote stream redirect + natural-exit registry
     * settle are now live via the `postPromote` callbacks wired in
     * `executeForeground`. The `promoteArtifacts` parameter carries the
     * pre-allocated buffer/stream slots that absorb the race between
     * service-side promote-time data flush and this finalizer running.
     */
    private handlePromotedForeground;
    /**
     * Background-execution path: spawn the command into a managed registry
     * entry instead of detaching with `&`. Output streams to a per-shell file
     * the agent can `Read`; cancellation flows through the entry's
     * AbortController; the registry's terminal status is set when the process
     * exits. Returns immediately so the agent's turn isn't blocked.
     */
    private executeBackground;
    /**
     * Count the commits between `preHead` (exclusive) and `postHead`
     * (inclusive). SHA-pinned on both ends so a post-commit hook moving
     * HEAD between this check and the note write can't change the
     * answer (`HEAD~1..HEAD` here would race the same TOCTOU window
     * the diff calls were just pinned against). Returns 0 if either
     * side is unreadable. Goes through `child_process.execFile` with
     * argv to stay independent of the mockable `ShellExecutionService`.
     */
    private countCommitsAfter;
    /**
     * Count commits reachable from `postHead` when the repo had no prior
     * HEAD before the user's command — i.e. the very first commit (or
     * compound `init && commit && commit ...`). Without this fallback
     * the multi-commit guard would be skipped on a brand-new repo and
     * mis-attribute combined data to the final commit. SHA-pinned for
     * the same reason as `countCommitsAfter`.
     */
    private countCommitsFromRoot;
    /** Shared helper for the two `rev-list --count` invocations. */
    private runGitCount;
    /**
     * Read the current HEAD SHA, or null if unavailable (no commits
     * yet, not a git repo, or git failed). Used to detect whether a
     * `git commit` actually created a new commit, independent of the
     * shell's exit code. Goes through `child_process.execFile` rather
     * than {@link ShellExecutionService} so the lookup is unaffected
     * by test mocks of the shell service and stays well clear of any
     * user-supplied shell wrapper.
     */
    private getGitHead;
    /**
     * Synchronous companion to {@link getGitHead}. Captured BEFORE the
     * user's shell command spawns so a fast `git commit` (hot-cached,
     * no hooks) cannot move HEAD before our async rev-parse has a chance
     * to read it — a real race seen on slow filesystems / heavy contention
     * where preHead would otherwise resolve to the new SHA, postHead would
     * match, and `attachCommitAttribution` would silently skip writing the
     * attribution note even though the commit succeeded.
     *
     * Worst case is ~10–50 ms of event-loop block per commit-shaped shell
     * command; acceptable trade for correctness of the post-command HEAD
     * comparison.
     */
    private getGitHeadSync;
    /**
     * After a successful git commit, attach per-file AI attribution metadata
     * as git notes. Analyzes staged files via `git diff` to calculate real
     * AI vs human contribution percentages.
     *
     * Detects commit creation by HEAD movement, not by shell exit code:
     * for compound commands like `git commit -m "x" && npm test`, the
     * commit can succeed and a later step can fail. Gating on `exitCode
     * !== 0` would skip attribution for the successful commit, so we
     * compare pre- and post-command HEAD instead.
     *
     * Respects the gitCoAuthor.commit setting: if the user disables commit
     * attribution, the per-file note is skipped too (same toggle governs
     * the Co-authored-by trailer and the git-notes payload).
     */
    private attachCommitAttribution;
    /**
     * Get information about files in the just-landed commit by diffing
     * the captured `postHead` against its parent (`${postHead}~1`), or
     * for amend against `preHead` (the captured pre-amend SHA). All
     * probes/diffs are SHA-pinned so a post-commit hook moving HEAD
     * between this call and the eventual `git notes` write can't make
     * the note describe a different commit than it attaches to.
     *
     * Returns:
     * - A populated `StagedFileInfo` when analysis succeeded.
     * - An empty `StagedFileInfo` when the commit truly has no files
     *   (e.g. `--allow-empty`). The caller does a no-op partial clear so
     *   pending AI attributions stay tracked for the next real commit.
     * - `null` when analysis itself failed (shallow clone with no parent
     *   object, --amend with `preHead === null` or unresolvable `preHead`,
     *   partial diff failure, exception).
     *   The caller treats this as "could not determine the committed
     *   set" and falls back to `noteCommitWithoutClearing()` — snapshots
     *   the prompt counter but leaves per-file attribution intact, so
     *   pending AI edits for files NOT in the just-committed set don't
     *   get wiped along with the analysis failure. (The just-committed
     *   file's stale entry may re-attribute on a later commit; that's
     *   the smaller evil compared to wholesale loss.)
     */
    private getCommittedFileInfo;
    /**
     * Append a configured `Co-authored-by:` trailer to `git commit`
     * commands when the commit co-author feature is enabled. No-op for
     * commands that don't carry an inline `-m`/`-am` message (those open
     * an editor, which we don't try to rewrite).
     */
    private addCoAuthorToGitCommit;
    /**
     * Detect `gh pr create` commands and append AI attribution text to the
     * PR body. Format: "🤖 Generated with Qwen Code (N-shotted by Qwen-Coder)"
     * when at least one user prompt has been recorded since the last commit;
     * otherwise just "🤖 Generated with Qwen Code".
     *
     * Skipped on Windows: the appended text relies on bash quote-escape
     * conventions (`\$`, `'\''`) that cmd.exe and PowerShell don't honor,
     * so on those shells our injection could either break the user-approved
     * `gh pr create` command or be evaluated as command substitution.
     * Losing PR attribution on Windows is an acceptable trade for safety.
     */
    private addAttributionToPR;
}
export declare class ShellTool extends BaseDeclarativeTool<ShellToolParams, ToolResult> {
    private readonly config;
    static Name: string;
    constructor(config: Config);
    protected validateToolParamValues(params: ShellToolParams): string | null;
    protected createInvocation(params: ShellToolParams): ToolInvocation<ShellToolParams, ToolResult>;
    toAutoClassifierInput(params: ShellToolParams): Record<string, unknown>;
}
