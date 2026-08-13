/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CallToolResult, ListToolsResult } from '@modelcontextprotocol/sdk/types.js';
export declare const DEFAULT_COMPUTER_USE_IDLE_TIMEOUT_MS: number;
export declare const MAX_COMPUTER_USE_IDLE_TIMEOUT_MS = 2147483647;
/**
 * Singleton stdio MCP client for the cua-driver binary.
 *
 * Spawned via `<binary> mcp`, where `<binary>` is the pinned cua-driver
 * downloaded under `~/.qwen/computer-use/` (the bootstrap state machine
 * downloads + verifies it before the first spawn). Spawns are sub-second
 * — there is no npx/download cost on this path anymore.
 *
 * Lifecycle: lazy spawn on first `callTool` invocation. The process is
 * stopped by `stop()`, qwen-code exit, or the idle timeout after the last
 * tool call. State (element_index map per window) lives in the process — if
 * the process restarts, the model must call `get_window_state` again before
 * any element-targeted action.
 */
export interface ComputerUseClientOptions {
    /** Absolute path to the spawnable `cua-driver` binary. */
    binary: string;
    /** Streaming hook for progress messages during slow operations. */
    onProgress?: (message: string) => void;
    /**
     * Longest-edge pixel cap applied to cua-driver screenshots via `set_config`
     * after every (re)connect. `undefined` leaves cua-driver's built-in default
     * (1568) untouched; `0` disables resizing. See {@link resolveMaxImageDimension}.
     */
    maxImageDimension?: number;
    /**
     * How long an idle cua-driver client stays alive after the last tool call.
     * `0` disables automatic idle shutdown.
     */
    idleTimeoutMs?: number;
}
export declare class ComputerUseClient {
    private static singleton;
    private readonly binary;
    private readonly onProgress;
    private maxImageDimension;
    private idleTimeoutMs;
    private client;
    private startPromise;
    private activeCalls;
    private idleStopTimer;
    constructor(options: ComputerUseClientOptions);
    /**
     * Set the screenshot longest-edge cap applied on the next (re)connect via
     * `set_config`. Cheap to call before every `start()`; the value is only
     * pushed to cua-driver inside `doStart` (once per spawn, re-applied after a
     * reconnect). `undefined` means "don't override".
     */
    setMaxImageDimension(value: number | undefined): void;
    setIdleTimeoutMs(value: number | undefined): void;
    /**
     * Shared singleton instance, created with default options on first
     * access. Tests can replace it via `setSharedForTest()`.
     *
     * The binary path is derived from the pinned `CUA_DRIVER_VERSION` in
     * constants.ts, the single source of truth the downloaded binary +
     * generated `schemas.ts` agree on.
     */
    static shared(): ComputerUseClient;
    /** Test-only: replace the singleton. */
    static setSharedForTest(replacement: ComputerUseClient | undefined): void;
    isStarted(): boolean;
    /**
     * Start the upstream MCP server. Idempotent: concurrent callers share
     * the same in-flight start promise.
     *
     * An optional `onProgress` callback can be supplied to receive download
     * and startup messages during this call. It overrides the instance-level
     * callback for the duration of the start operation only.
     *
     * Throws on spawn failure (binary missing / not executable, daemon
     * launch failure, etc.). The caller (bootstrap state machine) is
     * responsible for mapping the throw into user-facing UX.
     */
    start(onProgress?: (message: string) => void): Promise<void>;
    private doStart;
    /**
     * Push session-level runtime config to a freshly connected daemon. Today
     * that is just `max_image_dimension` (the screenshot longest-edge cap),
     * applied via the `set_config` tool when an override is configured.
     *
     * Runs once per spawn — including after the reconnect in `callTool`, since a
     * daemon restart resets runtime config to its persisted default. Best-effort:
     * a failed `set_config` must NOT abort startup (the driver is still usable at
     * its default dimension), so the error is surfaced via `progress` and
     * swallowed. Calls the inner client directly to avoid recursing through
     * `callTool`'s reconnect path.
     */
    private applyRuntimeConfig;
    /**
     * List the tools exposed by the upstream server. Used by the schema
     * sync script and bootstrap diagnostics.
     */
    listTools(): Promise<ListToolsResult>;
    /**
     * Call a tool by upstream name (NOT the qwen-code-facing
     * `computer_use__` prefixed name). Returns the raw MCP result so the
     * caller can inspect `isError` and parse text content.
     *
     * On transport-closed errors (e.g. macOS kills the upstream binary after
     * the user grants Screen Recording permission), this method transparently
     * tears down the stale connection, reconnects, and retries with a bounded
     * backoff loop. If the retries also fail, the last error is re-thrown.
     */
    callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult>;
    /** Tear down the child process. Safe to call multiple times. */
    stop(): Promise<void>;
    private scheduleIdleStop;
    private clearIdleStopTimer;
}
/**
 * Returns true when `err` indicates a recoverable connection failure — either
 * the stdio transport to the `cua-driver mcp` proxy closed, OR the proxy's
 * Unix-socket link to the CuaDriver daemon died (daemon restart). Both are
 * fixed by respawning the proxy. Observed SDK / cua-driver messages:
 *
 *   "Connection closed"            – StdioClientTransport stream closed
 *   "Not connected"                – Client guard before transport is open
 *   "daemon transport error …"     – proxy → daemon Unix socket forward failed
 *   "Connection refused (os error 61)" – daemon not listening (restarted/down)
 *   "MCP error -32603 / -32000: …" – JSON-RPC wrapper around the above
 */
export declare function isTransportClosedError(err: unknown): boolean;
