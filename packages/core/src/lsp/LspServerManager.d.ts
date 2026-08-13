/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config as CoreConfig } from '../config/config.js';
import type { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import type { WorkspaceContext } from '../utils/workspaceContext.js';
import type { LspReconcileResult, LspServerConfig, LspServerHandle, LspServerStatus } from './types.js';
export interface LspServerManagerOptions {
    requireTrustedWorkspace: boolean;
    workspaceRoot: string;
}
/**
 * Owns the per-session lifecycle of configured LSP servers.
 *
 * The manager is deliberately session-local: it stores one handle per server
 * name, starts/stops subprocess or socket-backed connections, and reconciles
 * config changes without replacing unchanged handles. Callers must pass only
 * configs that have already passed service-level admission checks.
 */
export declare class LspServerManager {
    private readonly config;
    private readonly workspaceContext;
    private readonly fileDiscoveryService;
    private serverHandles;
    private serverConfigHashes;
    /** Serializes hot-reload reconcile calls so stop/start operations do not race. */
    private reconcileQueue;
    private stoppingAll;
    private requireTrustedWorkspace;
    private workspaceRoot;
    constructor(config: CoreConfig, workspaceContext: WorkspaceContext, fileDiscoveryService: FileDiscoveryService, options: LspServerManagerOptions);
    setServerConfigs(configs: LspServerConfig[]): void;
    /** Drops all prepared handles without attempting process shutdown. */
    clearServerHandles(): void;
    getHandles(): ReadonlyMap<string, LspServerHandle>;
    getStatus(): Map<string, LspServerStatus>;
    startAll(): Promise<void>;
    /**
     * Stops every server after any in-flight reconcile has drained.
     *
     * This prevents shutdown from clearing handles while a queued reconcile is
     * still able to start a new process.
     */
    stopAll(): Promise<void>;
    reconcileServerConfigs(configs: LspServerConfig[]): Promise<LspReconcileResult>;
    /**
     * Applies a desired config set incrementally.
     *
     * Hashes identify semantic config changes. Unchanged servers keep their
     * existing connection and warm state; removed or changed servers are stopped
     * before their handles are deleted or replaced.
     */
    private doReconcileServerConfigs;
    /**
     * Ensure tsserver has at least one file open so navto/navtree requests succeed.
     * Sets warmedUp flag only after successful warm-up to allow retry on failure.
     *
     * @param handle - The LSP server handle
     * @param force - Force re-warmup even if already warmed up
     * @returns The URI of the file opened during warmup, or undefined if no file was opened
     */
    warmupTypescriptServer(handle: LspServerHandle, force?: boolean): Promise<string | undefined>;
    /**
     * Check if the given handle is a TypeScript language server.
     *
     * @param handle - The LSP server handle
     * @returns true if it's a TypeScript server
     */
    isTypescriptServer(handle: LspServerHandle): boolean;
    /**
     * Start individual LSP server with lock to prevent concurrent startup attempts.
     *
     * @param name - The name of the LSP server
     * @param handle - The LSP server handle
     */
    private startServer;
    /**
     * Performs startup after the per-handle startup lock is installed.
     *
     * All admission and command safety checks happen before process creation.
     * If creation or initialize fails after resources exist, the catch path tears
     * them down and leaves a FAILED handle for status reporting.
     *
     * @param name - The name of the LSP server
     * @param handle - The LSP server handle
     */
    private doStartServer;
    /**
     * Stops a server and resets runtime-only handle state.
     */
    private stopServer;
    private abortAndWaitForStartup;
    /**
     * Releases runtime resources for a handle without changing its logical config.
     *
     * Connection shutdown and process termination are intentionally isolated so a
     * broken JSON-RPC stream cannot prevent killing an owned server process.
     */
    private releaseServerResources;
    /**
     * Performs graceful LSP shutdown with a bounded wait, then always closes the
     * underlying JSON-RPC connection to avoid retaining streams or sockets.
     */
    private shutdownConnection;
    private attachRestartHandler;
    private createStartupExitWatcher;
    private enqueueCrashRestart;
    private resetHandle;
    private buildProcessEnv;
    /**
     * Builds the environment used only for the pre-start command probe.
     *
     * The probe runs `command --version`, so a workspace-controlled PATH could
     * redirect a bare command such as `clangd` to an unintended executable before
     * the real LSP server startup path is reached. Keep regular env values that
     * probes may need, but always resolve commands through the current process
     * PATH instead of `.lsp.json`.
     */
    private buildCommandProbeEnv;
    private connectSocketWithRetry;
    private throwIfStartupAborted;
    private delayWithAbort;
    private raceStartupAbort;
    /**
     * Creates a transport-specific LSP connection.
     *
     * For stdio, the spawned process is always owned by this manager. For
     * tcp/socket, the process is owned only when a command was provided; otherwise
     * the connection is to an externally managed daemon.
     */
    private createLspConnection;
    private waitForSocketConnectionOrProcessExit;
    /**
     * Waits for the LSP server child process to successfully spawn.
     *
     * Resolves when the 'spawn' event fires, rejects if an error occurs during
     * spawning or if the provided abort signal is triggered. Ensures all event
     * listeners are cleaned up regardless of outcome to prevent memory leaks.
     *
     * @param process - The child process to monitor for successful spawn
     * @param signal - Optional AbortSignal to cancel the wait; if already aborted,
     *                 the process is killed immediately and the promise rejects
     */
    private waitForSocketProcessSpawn;
    private watchSocketProcessEarlyExit;
    /**
     * Initialize LSP server
     */
    private initializeLspServer;
    /**
     * Check if command exists by spawning it with --version.
     * Only returns false when the spawn itself fails (e.g. ENOENT).
     * A timeout means the process started successfully (command exists)
     * but didn't exit in time — common for servers like jdtls that
     * don't support --version and start their full runtime instead.
     *
     * @param command - The command to check
     * @param env - Optional environment variables
     * @param cwd - Optional working directory
     * @returns true if the command can be spawned, false if not found
     */
    private commandExists;
    /**
     * Check path safety.
     *
     * Allows:
     * - Bare command names (resolved via PATH, e.g. "clangd")
     * - Absolute paths (explicit user intent, e.g. "/usr/bin/clangd")
     *
     * Blocks:
     * - Relative paths that escape the workspace (e.g. "../../bin/evil")
     */
    private isPathSafe;
    /**
     * Check whether the workspace trust level allows starting an LSP server.
     *
     * Auto-allows in trusted workspaces. In untrusted workspaces, blocks
     * servers that require trust (`trustRequired` or global
     * `requireTrustedWorkspace`), and cautiously allows the rest.
     */
    private checkWorkspaceTrust;
    /**
     * Find a representative TypeScript/JavaScript file to warm up tsserver.
     */
    private findFirstTypescriptFile;
}
