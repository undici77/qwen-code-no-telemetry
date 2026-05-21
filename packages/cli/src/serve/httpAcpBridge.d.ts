/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { canonicalizeWorkspace } from './fs/paths.js';
/**
 * Stage 1 HTTP→ACP bridge.
 *
 * Per #3803 §02 (architectural revision) and design §08 (Roadmap, Stage 1):
 *   - **1 daemon = 1 workspace**: every bridge instance is bound to a
 *     single canonical workspace path at construction
 *     (`BridgeOptions.boundWorkspace`). All `spawnOrAttach` calls must
 *     target that workspace; cross-workspace requests throw
 *     `WorkspaceMismatchError`. Multi-workspace deployments use multiple
 *     daemon processes (one per workspace, supervised externally).
 *   - One `qwen --acp` child total; multiple sessions multiplex onto it
 *     via `connection.newSession()` (the agent's native
 *     `sessions: Map<string, Session>` — see `acp-integration/acpAgent.ts:194`).
 *     Sessions share the child's process / OAuth state / `FileReadCache` /
 *     hierarchy-memory parse.
 *   - HTTP request bodies are forwarded as ACP NDJSON over the child's stdin.
 *   - Child stdout NDJSON notifications publish onto each session's
 *     `EventBus`; HTTP SSE subscribers (`GET /session/:id/events`) drain
 *     it. Cross-client fan-out + `Last-Event-ID` reconnect supported.
 *   - Multi-client requests against the same session serialize through this
 *     bridge (FIFO; honors ACP's "one active prompt per session" invariant).
 *     Different sessions on the same channel can prompt concurrently —
 *     the ACP layer demultiplexes by sessionId.
 *
 * Stage 2 replaces the spawn step with an in-process call into core's
 * ACP-equivalent API. The `HttpAcpBridge` interface stays the same so HTTP
 * route handlers don't need to change.
 */
import type { BridgeSpawnRequest, BridgeSession, BridgeRestoreSessionRequest, BridgeSessionState, BridgeRestoredSession, BridgeSessionSummary, SessionMetadataUpdate, BridgeClientRequestContext, BridgeHeartbeatResult, BridgeHeartbeatState, HttpAcpBridge } from '@qwen-code/acp-bridge/bridgeTypes';
export type { BridgeSpawnRequest, BridgeSession, BridgeRestoreSessionRequest, BridgeSessionState, BridgeRestoredSession, BridgeSessionSummary, SessionMetadataUpdate, BridgeClientRequestContext, BridgeHeartbeatResult, BridgeHeartbeatState, HttpAcpBridge, };
import { SessionNotFoundError, RestoreInProgressError, InvalidSessionScopeError, SessionLimitExceededError, WorkspaceMismatchError, InvalidClientIdError, InvalidPermissionOptionError, InvalidSessionMetadataError, WorkspaceInitConflictError, McpServerNotFoundError, McpServerRestartFailedError } from '@qwen-code/acp-bridge/bridgeErrors';
import { MAX_WORKSPACE_PATH_LENGTH } from '@qwen-code/acp-bridge/workspacePaths';
export { SessionNotFoundError, RestoreInProgressError, InvalidSessionScopeError, SessionLimitExceededError, WorkspaceMismatchError, InvalidClientIdError, InvalidPermissionOptionError, InvalidSessionMetadataError, WorkspaceInitConflictError, McpServerNotFoundError, McpServerRestartFailedError, MAX_WORKSPACE_PATH_LENGTH, };
import type { AcpChannel, AcpChannelExitInfo, ChannelFactory } from '@qwen-code/acp-bridge';
export type { AcpChannel, AcpChannelExitInfo, ChannelFactory };
import type { BridgeOptions, DaemonStatusProvider } from '@qwen-code/acp-bridge/bridgeOptions';
export type { BridgeOptions, DaemonStatusProvider };
export declare function createHttpAcpBridge(opts: BridgeOptions): HttpAcpBridge;
/**
 * Re-export of the workspace canonicalizer for callers that historically
 * imported it from `httpAcpBridge.ts`. The implementation was extracted
 * to `./fs/paths.ts` in #4175 PR 18 (commit 1) so the forthcoming
 * `WorkspaceFileSystem` boundary can reuse the same primitive without
 * pulling in the 3.6k-line bridge module. See `./fs/paths.ts` for the
 * cross-module contract that governs this function.
 */
export { canonicalizeWorkspace };
/**
 * Default channel factory: spawn the current Node executable running this
 * CLI's entry script in `--acp` mode. `process.argv[1]` resolves to the qwen
 * entry script when launched via the `qwen` bin shim.
 *
 * Note on `cwd`: CodeQL flags the `workspaceCwd` flow into `spawn({cwd})`
 * as an "uncontrolled data used in path expression" finding. That's the
 * Stage 1 trust model speaking — the caller (a token-authenticated HTTP
 * client) is treated as an extension of the operator. The agent already
 * runs as the same UID with shell-tool access, so restricting the spawn
 * cwd to a sandbox here would be theatre. Stage 4+ remote-sandbox swaps
 * this factory for a sandbox-aware variant; see issue #3803 §11.
 */
export declare const defaultSpawnChannelFactory: ChannelFactory;
