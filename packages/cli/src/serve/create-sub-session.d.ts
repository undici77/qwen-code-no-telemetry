/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AcpSessionBridge } from '@qwen-code/acp-bridge/bridgeTypes';
import type { CreateSubSessionInfo, CreateSubSessionResult } from '@qwen-code/acp-bridge/bridgeOptions';
/** Default per-caller ceiling on concurrent in-flight sub-sessions. A
 * `first-turn` request holds a slot until its turn finishes; parallel tool
 * calls from one caller must not spawn unbounded sub-sessions. Over the cap
 * the request is rejected (surfaced as the tool's error), never silently
 * dropped. Overridable via `serve.maxConcurrentSubSessionsPerCaller`. */
export declare const MAX_CONCURRENT_SUB_SESSIONS_PER_CALLER = 16;
/**
 * Default ceiling on concurrent in-flight sub-sessions across ALL callers of
 * this workspace's launcher.
 *
 * The per-caller cap is keyed on `callerSessionId`, and the daemon can only
 * authenticate that id as "a session on this channel" — every session of a
 * workspace shares ONE child process, so nothing at the transport can prove
 * *which* of them issued the call. A child running attacker code could rotate
 * ids to open a fresh bucket per launch, or charge them to a sibling. This
 * bound does not depend on the id being honest: it holds whichever bucket the
 * launch is charged to. Overridable via
 * `serve.maxConcurrentSubSessionsTotal`.
 *
 * The default is kept below the bridge's default `maxSessions` (32): a finished sub-session
 * stays registered (idle) for up to `sessionIdleTimeoutMs`, so a total cap at
 * the session-table limit would make the next fan-out wave fail at bridge
 * admission instead of this cap, and starve interactive sessions of slots.
 */
export declare const MAX_CONCURRENT_SUB_SESSIONS_TOTAL = 24;
/** How many spawned sub-session ids the depth-1 gate remembers. Far above any
 * plausible live sub-session count (`maxSessions` defaults to 32), so eviction
 * only ever discards long-reaped sessions. */
export declare const MAX_TRACKED_SPAWNED_SESSIONS = 1024;
export interface SubSessionLauncher {
    /** The `onCreateSubSession` callback wired into the bridge. Returns a Promise
     * the child's tool awaits. */
    launch(info: CreateSubSessionInfo): Promise<CreateSubSessionResult>;
    /** Stop accepting new sub-sessions (daemon shutdown). Idempotent. */
    stop(): void;
}
export interface CreateSubSessionLauncherOptions {
    getBridge: () => AcpSessionBridge | undefined;
    boundWorkspace: string;
    /** Return sent-mode completions to the parent as automatic follow-up turns.
     * Enabled only for the Live conversation runtime. */
    notifySentCompletion?: boolean;
    isolatedWorkspace?: {
        materializeDirectory(sessionId: string): Promise<string>;
        discardEmptyDirectory(sessionId: string): Promise<unknown>;
    };
    /** Per-request `first-turn` wall-clock timeout; defaults to
     * {@link FIRST_TURN_TIMEOUT_MS}. Exposed for tests. */
    firstTurnTimeoutMs?: number;
    /** Sent-mode background-drain ceiling; defaults to
     * {@link SENT_MODE_DRAIN_TIMEOUT_MS}. Exposed for tests. */
    sentModeDrainTimeoutMs?: number;
    /** Per-caller concurrency cap; defaults to
     * {@link MAX_CONCURRENT_SUB_SESSIONS_PER_CALLER}. */
    maxConcurrentPerCaller?: number;
    /** Workspace-wide concurrency cap; defaults to
     * {@link MAX_CONCURRENT_SUB_SESSIONS_TOTAL}. */
    maxConcurrentTotal?: number;
}
export declare function createSubSessionLauncher(opts: CreateSubSessionLauncherOptions): SubSessionLauncher;
