/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AnsiOutput } from '../utils/terminalSerializer.js';
/**
 * Read the `kind` discriminator off `abortSignal.reason` defensively:
 *   - Reject non-object reasons (DOMException, strings, numbers).
 *   - Read the `kind` property as an OWN property only — without
 *     `hasOwnProperty`, a polluted `Object.prototype.kind = 'background'`
 *     would force the kill path through the promote branch on any plain
 *     `abortController.abort({})`. Lifecycle/safety branches deserve the
 *     extra check.
 *   - Wrap the property read in try/catch — an own getter or a `Proxy`
 *     trap may throw during inspection. A throw here would propagate up
 *     past the abort handler (which is dispatched async and not awaited
 *     by AbortSignal), leaving the shell process alive instead of being
 *     killed on cancel. We swallow the throw and fall back to 'cancel'.
 *   - Whitelist the value against the known union — anything else (typos,
 *     future-untyped variants) defaults to `'cancel'` so the historical
 *     kill behavior is preserved as the safe fallback.
 *
 * Exported for direct unit testing of all eight cases (null /
 * undefined / non-object / `{}` no own kind / prototype-only kind /
 * unknown kind / throwing-accessor / Proxy trap, plus the two
 * happy-path inputs) — the integration tests only exercise the three
 * happy-path scenarios.
 */
export declare function getShellAbortReasonKind(reason: unknown): ShellAbortReason['kind'];
/**
 * Discriminated reason attached to the AbortSignal that drives execute().
 * Default behavior (no reason set, or `{ kind: 'cancel' }`) is the historical
 * tree-kill on abort. `{ kind: 'background' }` is a takeover signal: the
 * caller has accepted ownership of the child process and wants execute() to
 * relinquish it without killing — used by the foreground-shell → background
 * promote path so the in-flight child keeps running.
 *
 * Callers MUST attach their own listeners (data / exit / error) to the live
 * child *before* calling `abortController.abort({ kind: 'background', ... })`,
 * since execute() drops the child from its active set on background-abort and
 * will no longer route events to its own handlers' downstream consumers.
 */
export type ShellAbortReason = {
    kind: 'cancel';
} | {
    kind: 'background';
    shellId?: string;
};
/**
 * Returns true only for a real process-signal termination.
 * node-pty reports signal 0 for a clean exit; the service normalizes that
 * value to null at its boundary, while this predicate remains defensive for
 * legacy or mocked result objects.
 */
export declare function isSignalTermination(signal: number | NodeJS.Signals | null): boolean;
/** A structured result from a shell command execution. */
export interface ShellExecutionResult {
    /**
     * Buffered raw output captured for callers that need bytes instead of the
     * decoded display string. This buffer is bounded by maxBufferedOutputBytes,
     * so it may contain only the retained prefix when the capture limit is
     * exceeded.
     */
    rawOutput: Buffer;
    /** The combined, decoded output as a string. */
    output: string;
    /**
     * The process exit code. Child-process signal termination reports null;
     * PTY signal termination may still carry a numeric exit code.
     */
    exitCode: number | null;
    /**
     * The non-zero signal that terminated the process, if any. A node-pty
     * clean-exit signal of 0 is normalized to null at the service boundary.
     */
    signal: number | null;
    /** An error object if the process failed to spawn. */
    error: Error | null;
    /** A boolean indicating if the command was aborted by the user. */
    aborted: boolean;
    /**
     * True iff execute() returned because of a background-promote abort
     * (`signal.reason.kind === 'background'`) — the child process is still
     * alive and the caller has taken over its lifecycle. Callers receiving
     * `promoted: true` must NOT treat exitCode/signal as terminal — the
     * underlying process has not exited.
     *
     * Note on the result shape: when `promoted: true`, `aborted` is set to
     * `false` even though the AbortSignal fired. The contract is that
     * `aborted` answers "should the caller emit a cancel/timeout
     * message?" — and a promoted shell is neither cancelled nor timed
     * out (the child kept running, ownership simply transferred). This
     * lets existing `if (result.aborted)` branches stay unchanged; new
     * promote handling lives in a separate `if (result.promoted)` arm.
     * Settled in #3831 design question 7 / @tanzhenxin's PR-1 review note.
     */
    promoted?: boolean;
    /** The process ID of the spawned shell. */
    pid: number | undefined;
    /** The method used to execute the shell command. */
    executionMethod: 'lydell-node-pty' | 'node-pty' | 'child_process' | 'none';
}
/** A handle for an ongoing shell execution. */
export interface ShellExecutionHandle {
    /** The process ID of the spawned shell. */
    pid: number | undefined;
    /** A promise that resolves with the complete execution result. */
    result: Promise<ShellExecutionResult>;
}
export interface ShellExecutionConfig {
    terminalWidth?: number;
    terminalHeight?: number;
    pager?: string;
    showColor?: boolean;
    defaultFg?: string;
    defaultBg?: string;
    /**
     * Upper bound for foreground output retained in memory for the final
     * ShellExecutionResult. The process stream is still drained after this
     * limit, but additional bytes are discarded instead of decoded into one
     * giant JavaScript string.
     */
    maxBufferedOutputBytes?: number;
    disableDynamicLineTrimming?: boolean;
}
/**
 * Optional caller-side handlers for the *post-promote* lifetime of a
 * background-promoted child process. PR-2 (#3894) detached every
 * service-side listener at promote time and froze `result.output` at
 * the snapshot; without these hooks the still-running child's bytes
 * are lost and the registry entry stays `'running'` until `task_stop`
 * / session-end cleanup. PR-2.5 (#3831 follow-up) wires shell.ts to
 * pass these so promoted shells behave like regular background shells:
 * bytes append to `bg_xxx.output` and the entry transitions to
 * `'completed'` / `'failed'` on natural child exit.
 *
 * Backwards compat: if `postPromote` is unset on the options bag the
 * service falls back to the PR-2 detach-everything contract — no
 * regressions for callers that don't opt in.
 */
export interface ShellPostPromoteHandlers {
    /**
     * Fired for each output chunk the still-running child produces
     * AFTER `result.promoted` resolves. Same `ShellOutputEvent` shape
     * the foreground stream uses so callers can reuse rendering logic;
     * `binary_detected` / `binary_progress` are NOT re-emitted (those
     * decisions were made pre-promote against the same byte stream).
     */
    onData?: (event: ShellOutputEvent) => void;
    /**
     * Fired exactly once when the post-promote child settles — natural
     * child-process exit (`exitCode` set, `signal: null`), natural PTY
     * exit (`exitCode` set, clean-exit signal normalized to `null`), signal kill (which may carry
     * `exitCode: 0` with a non-zero signal on PTY, or `exitCode: null`
     * with a string signal from `child_process`), or spawn-side error
     * (`error` set). NOT
     * fired for the promote-time resolve itself (that's the
     * `result.promoted` Promise resolution). Callers wire this to the
     * registry's `complete` / `fail` transitions.
     */
    onSettle?: (info: ShellPostPromoteSettleInfo) => void;
}
export interface ShellPostPromoteSettleInfo {
    exitCode: number | null;
    signal: number | NodeJS.Signals | null;
    error?: Error;
    /** `Date.now()` at the moment the service observed the exit/error. */
    endTime: number;
}
/**
 * Options bag for `ShellExecutionService.execute()`. Kept as an
 * interface (rather than the prior inline shape) so future additions
 * land without breaking signatures.
 */
export interface ShellExecuteOptions {
    streamStdout?: boolean;
    /**
     * Post-promote callback hooks. See {@link ShellPostPromoteHandlers}.
     * Optional; omit to preserve the PR-2 detach-everything contract.
     */
    postPromote?: ShellPostPromoteHandlers;
}
/**
 * Describes a structured event emitted during shell command execution.
 */
export type ShellOutputEvent = {
    /** The event contains a chunk of output data. */
    type: 'data';
    /** The decoded string chunk. */
    chunk: string | AnsiOutput;
} | {
    /** Signals that the output stream has been identified as binary. */
    type: 'binary_detected';
} | {
    /** Provides progress updates for a binary stream. */
    type: 'binary_progress';
    /** The total number of bytes received so far. */
    bytesReceived: number;
};
/**
 * A centralized service for executing shell commands with robust process
 * management, cross-platform compatibility, and streaming output capabilities.
 *
 */
export declare class ShellExecutionService {
    private static activePtys;
    private static activeChildProcesses;
    static cleanup(): void;
    /**
     * Executes a shell command using `node-pty`, capturing all output and lifecycle events.
     *
     * @param commandToExecute The exact command string to run.
     * @param cwd The working directory to execute the command in.
     * @param onOutputEvent A callback for streaming structured events about the execution, including data chunks and status updates.
     * @param abortSignal An AbortSignal to terminate the process and its children.
     * @returns An object containing the process ID (pid) and a promise that
     *          resolves with the complete execution result.
     */
    static execute(commandToExecute: string, cwd: string, onOutputEvent: (event: ShellOutputEvent) => void, abortSignal: AbortSignal, shouldUseNodePty: boolean, shellExecutionConfig: ShellExecutionConfig, options?: ShellExecuteOptions): Promise<ShellExecutionHandle>;
    private static childProcessFallback;
    private static executeWithPty;
    /**
     * Writes a string to the pseudo-terminal (PTY) of a running process.
     *
     * @param pid The process ID of the target PTY.
     * @param input The string to write to the terminal.
     */
    static writeToPty(pid: number, input: string): void;
    static isPtyActive(pid: number): boolean;
    /**
     * Resizes the pseudo-terminal (PTY) of a running process.
     *
     * @param pid The process ID of the target PTY.
     * @param cols The new number of columns.
     * @param rows The new number of rows.
     */
    static resizePty(pid: number, cols: number, rows: number): void;
    /**
     * Scrolls the pseudo-terminal (PTY) of a running process.
     *
     * @param pid The process ID of the target PTY.
     * @param lines The number of lines to scroll.
     */
    static scrollPty(pid: number, lines: number): void;
}
