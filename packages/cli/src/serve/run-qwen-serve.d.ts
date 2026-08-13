/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Server } from 'node:http';
import type { BridgeEvent } from '@qwen-code/acp-bridge/eventBus';
import { type ServeFastPathSettings } from './fast-path-settings.js';
import type { AcpSessionBridge } from '@qwen-code/acp-bridge/bridgeTypes';
import { type DaemonLogger } from './daemon-logger.js';
import { type ServeOptions } from './types.js';
import type { WorkspaceFileSystemFactory } from './fs/index.js';
import { LiveConversationWorkspace } from './live/conversation-workspace.js';
import { type WorkspaceRegistrationStore } from './workspace-registration-store.js';
import type { PermissionPolicy } from '@qwen-code/acp-bridge';
import type { ChannelDeliveryHandler } from '@qwen-code/acp-bridge/bridgeOptions';
import type { ChannelWorkerSupervisor, CreateChannelWorkerSupervisorOptions } from './channel-worker-supervisor.js';
import { ChannelDeliveryAuthorizationStore } from './channel-delivery-authorization.js';
import { type WorkerDiagnosticRedactionOptions } from './channel-worker-diagnostics.js';
import type { ChannelWorkerManager } from './channel-worker-manager.js';
import type { ServiceInfo, ServiceInfoWorker } from '../commands/channel/pidfile.js';
export declare function createBoundChannelDeliveryHandler(boundWorkspace: string, getManager: () => ChannelWorkerManager | undefined, authorizations: ChannelDeliveryAuthorizationStore, daemonLog?: Pick<DaemonLogger, 'warn'>, diagnosticRedaction?: WorkerDiagnosticRedactionOptions): ChannelDeliveryHandler;
type RunQwenServeOptions = Omit<ServeOptions, 'token' | 'workspace'> & {
    token?: string;
    workspace?: string | string[];
};
/**
 * Boot-time policy validation error. The catch block in `runQwenServe`
 * matches with `instanceof InvalidPolicyConfigError` to distinguish
 * operator-misconfiguration (rethrow → fail boot loudly) from
 * settings-read failures (fall back to defaults).
 */
export declare class InvalidPolicyConfigError extends Error {
    readonly name = "InvalidPolicyConfigError";
    constructor(message: string);
}
/**
 * Parse + validate the `policy.*` section of merged daemon settings.
 * Returns the resolved `permissionPolicy` /
 * `permissionConsensusQuorum` for `BridgeOptions`, or throws
 * `InvalidPolicyConfigError` for operator misconfiguration.
 *
 * - `permissionStrategy` must be one of the four `PermissionPolicy`
 *   literals if present.
 * - `consensusQuorum` must be a positive integer if present.
 * - When `consensusQuorum` is set but `permissionStrategy` is not
 *   `'consensus'`, the override is silently ignored — emit a
 *   stderr warning so the operator notices.
 *
 * The mismatch warning runs through `onWarning` so tests can
 * capture it; production passes `writeStderrLine`.
 *
 * The runtime valid-policy set is derived from
 * `SERVE_CAPABILITY_REGISTRY.permission_mediation.modes` (single
 * source of truth) instead of repeating the four literals.
 */
export declare function validatePolicyConfig(policyConfig?: {
    permissionStrategy?: unknown;
    consensusQuorum?: unknown;
}, onWarning?: (message: string) => void): {
    permissionPolicy: PermissionPolicy | undefined;
    permissionConsensusQuorum: number | undefined;
};
export declare function formatChannelWorkerDaemonUrl(host: string, port: number): string;
/**
 * Pull the `context.fileName` snapshot out of merged settings into a
 * typed string, falling back to `undefined` when the value is missing
 * or malformed.
 *
 * Validation contract:
 *   - non-empty string after trim → returned trimmed
 *   - array → first non-empty string element after trim, or undefined
 *   - anything else (object, number, boolean, undefined) → undefined
 *
 * Returning `undefined` is the bridge's signal to use its own
 * `getCurrentGeminiMdFilename()` default — so a malformed value
 * keeps the daemon alive rather than producing a garbage filename.
 */
export declare function extractContextFilename(value: unknown): string | undefined;
/**
 * Reads the optional `serve.maxConcurrentSubSessions*` overrides. Only
 * positive integers are honored; anything else falls back to the launcher's
 * built-in defaults. A present-but-invalid value is reported through
 * `onWarning` (matching the other settings-load fallback sites in this file)
 * so an operator who mistypes a cap sees the fallback instead of silently
 * running on the default. Caps are a daemon-resource control, so an untrusted
 * workspace's settings (skipped at load time) must not raise them — the
 * caller passes the already trust-filtered merged settings.
 */
export declare function subSessionConcurrencyCapsFromSettings(serve: {
    maxConcurrentSubSessionsPerCaller?: unknown;
    maxConcurrentSubSessionsTotal?: unknown;
}, onWarning?: (message: string) => void): {
    maxConcurrentPerCaller?: number;
    maxConcurrentTotal?: number;
};
export interface RunHandle {
    server: Server;
    url: string;
    bridge: AcpSessionBridge;
    /**
     * Whether the Web Shell UI was actually mounted (assets resolved and
     * `serveWebShell !== false`). The `--open` launcher checks this so it never
     * points a browser at an API-only daemon.
     */
    webShellMounted: boolean;
    /**
     * The bearer token the daemon actually authenticates against (already
     * trimmed), or undefined when none is configured. `--open` reads this so the
     * URL it hands the browser always matches the server's value instead of
     * re-deriving it from argv/env.
     */
    resolvedToken?: string;
    /** Resolves when the full REST/Web/ACP runtime has been mounted. */
    runtimeReady: Promise<void>;
    /** Resolves when the listener has fully closed and the bridge is drained. */
    close(): Promise<void>;
}
type ChannelServicePidfile = {
    readServiceInfo(): ServiceInfo | null;
    writeServeServiceInfo(opts: {
        channels: string[];
        servePid?: number;
        workerPid?: number;
        workers?: ServiceInfoWorker[];
    }): void;
    reserveServeServiceInfo(opts: {
        channels: string[];
        servePid?: number;
    }): void;
    removeServiceInfo(): void;
    removeServeServiceInfo?(servePid?: number): boolean;
};
export declare function createDisabledChannelWorkerSupervisor(): ChannelWorkerSupervisor;
export interface RunQwenServeDeps {
    /** Bridge instance; tests inject a fake. Defaults to a fresh real one. */
    bridge?: AcpSessionBridge;
    /**
     * Whether to start the real ACP child eagerly after listen. Production
     * keeps this on; tests can disable it so boot-path assertions do not wait
     * on a real child bridge.
     */
    preheatBridge?: boolean;
    /**
     * Workspace filesystem factory. When omitted, `runQwenServe`
     * constructs one using `boundWorkspace`, `trustedWorkspace`, and a
     * default warning-emit hook. Tests inject a real factory + custom
     * emit to capture audit events.
     */
    fsFactory?: WorkspaceFileSystemFactory;
    /**
     * Trust snapshot for the bound workspace at boot. Drives the
     * `WorkspaceFileSystem`'s `assertTrustedForIntent` gate — read
     * intents always pass; mutating intents (`write`, `edit`) throw
     * `untrusted_workspace` when this is false. Defaults to true:
     * the daemon binds at boot to a workspace the operator
     * explicitly chose, and the trust dialog flow that ungates write
     * permissions in the interactive CLI is not used by the daemon.
     * When omitted, the daemon evaluates the current trust policy and
     * hot-reloads runtime generations as that policy changes. Tests can pin
     * this value to disable hot reload and assert a fixed trust state.
     */
    trustedWorkspace?: boolean;
    /**
     * Audit-emit hook for `fs.access` / `fs.denied`. Defaults to a
     * stderr warning every 100 events so a regression that drops
     * audit emission stays visible in the operator log.
     */
    fsAuditEmit?: (event: BridgeEvent) => void;
    /**
     * Lightweight settings summary already loaded by the serve fast path.
     * Reusing it avoids a second pre-listen settings/env scan.
     */
    bootSettings?: ServeFastPathSettings;
    /**
     * Pre-resolved daemon debug directory. The full CLI/exported API can pass
     * Storage.getGlobalDebugDir(); the serve fast path intentionally avoids
     * importing core before listen and instead derives this from bootSettings.
     */
    daemonLogBaseDir?: string;
    /**
     * Internal CLI fast-path mode: resolve once the TCP listener is ready.
     * The default preserves the embedded API contract by resolving only after
     * the runtime bridge and routes are mounted.
     */
    resolveOnListen?: boolean;
    /**
     * Internal serve fast-path mode: keep bootstrap /health responsive before
     * starting the heavier runtime graph. A fallback timer still starts runtime
     * when no health probe arrives. Only applies with resolveOnListen.
     */
    deferRuntimeUntilFirstHealth?: boolean;
    /**
     * Bounds background runtime mounting after the listener is ready. Defaults to
     * QWEN_SERVE_RUNTIME_STARTUP_TIMEOUT_MS, then 120s. Use 0 to disable.
     */
    runtimeStartupTimeoutMs?: number;
    channelWorkerSupervisorFactory?: (opts: CreateChannelWorkerSupervisorOptions) => ChannelWorkerSupervisor;
    channelServicePidfile?: ChannelServicePidfile;
    workspaceRegistrationStore?: WorkspaceRegistrationStore;
    /** Test/embed override; production uses the private user Conversations root. */
    liveConversationWorkspace?: LiveConversationWorkspace;
    /** Test/embed override; production uses ~/.qwen for the Live Host locator. */
    liveDiscoveryStableBaseDir?: string;
    /** Test/embed override for stable Live locator ownership handoff. */
    liveDiscoveryRetryDelayMs?: number;
    /** Test/embed override; production uses process.platform. */
    runtimePlatform?: NodeJS.Platform;
}
export declare function createLazyBridgeProxy(getBridge: () => AcpSessionBridge | undefined, getStartupError?: () => string | undefined): AcpSessionBridge;
export declare function resolveRuntimeStartupTimeoutMs(override: number | undefined): number;
export declare function waitForRuntimeStartingForShutdown(runtimeStarting: Promise<void> | undefined, daemonLog: Pick<DaemonLogger, 'warn'>, timeoutMs?: number): Promise<void>;
/**
 * Validates and canonicalizes a `--workspace` boot argument. Extracted to
 * module scope (from the runQwenServe closure) so the #7139 sandbox path
 * translation ahead of the absolute-path guard is testable — this is the
 * primary reproduction path of that issue.
 */
export declare function validateAndCanonicalizeWorkspaceInput(rawWorkspace: string): string;
export declare function runQwenServe(optsIn: RunQwenServeOptions, deps?: RunQwenServeDeps): Promise<RunHandle>;
export {};
