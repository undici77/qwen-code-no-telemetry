/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Server } from 'node:http';
import type { BridgeEvent } from './eventBus.js';
import { type HttpAcpBridge } from './httpAcpBridge.js';
import type { ServeOptions } from './types.js';
import { type WorkspaceFileSystemFactory } from './fs/index.js';
export interface RunHandle {
    server: Server;
    url: string;
    bridge: HttpAcpBridge;
    /** Resolves when the listener has fully closed and the bridge is drained. */
    close(): Promise<void>;
}
export interface RunQwenServeDeps {
    /** Bridge instance; tests inject a fake. Defaults to a fresh real one. */
    bridge?: HttpAcpBridge;
    /**
     * Workspace filesystem factory (#4175 PR 19). When omitted,
     * `runQwenServe` constructs one using `boundWorkspace`,
     * `trustedWorkspace`, and a default warning-emit hook. Tests
     * inject a real factory + custom emit to capture audit events,
     * or override `trustedWorkspace` to flip the trust snapshot
     * without re-routing through the OS-level trustedFolders config
     * file.
     */
    fsFactory?: WorkspaceFileSystemFactory;
    /**
     * Trust snapshot for the bound workspace at boot. Drives the
     * `WorkspaceFileSystem`'s `assertTrustedForIntent` gate — read
     * intents always pass; mutating intents (`write`, `edit`) throw
     * `untrusted_workspace` when this is false. Defaults to true:
     * the daemon binds at boot to a workspace the operator
     * explicitly chose, and the trust dialog flow that ungates write
     * permissions in the interactive CLI is not yet replicated for
     * the daemon. Tests pin this to false to assert the gate is
     * actually wired through `runQwenServe → createServeApp →
     * fsFactory`.
     */
    trustedWorkspace?: boolean;
    /**
     * Audit-emit hook for `fs.access` / `fs.denied`. Defaults to a
     * stderr warning every 100 events so a regression that drops
     * audit emission stays visible in the operator log. PR 21's SSE
     * fan-out will replace the default with a workspace-scoped event
     * channel; for now tests inject a recording array to assert the
     * audit pipeline.
     */
    fsAuditEmit?: (event: BridgeEvent) => void;
}
/**
 * Validate options + start the listener. Resolves once the server is ready
 * to accept connections.
 *
 * Token resolution order:
 *   1. explicit `opts.token`
 *   2. `QWEN_SERVER_TOKEN` env var
 *
 * Boot refuses to start when bound beyond loopback without a token; this is a
 * hard rule, not a warning, per the threat model in the design issue.
 */
export declare function runQwenServe(optsIn: Omit<ServeOptions, 'token'> & {
    token?: string;
}, deps?: RunQwenServeDeps): Promise<RunHandle>;
