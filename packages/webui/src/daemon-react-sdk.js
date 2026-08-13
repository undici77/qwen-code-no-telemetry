/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * `@qwen-code/webui/daemon-react-sdk`
 *
 * React bindings for the Qwen Code daemon process.
 * Provides context Providers, hooks, types, and constants
 * for building UIs that connect to and interact with the daemon.
 *
 * @example
 * ```tsx
 * import {
 *   DaemonSessionProvider,
 *   DaemonWorkspaceProvider,
 *   useConnection,
 *   useStreamingState,
 * } from '@qwen-code/webui/daemon-react-sdk';
 * ```
 */
// ── Providers ─────────────────────────────────────────────────────
/**
 * Wraps children with session-level daemon context.
 * Manages a single conversation session: transcript, streaming state,
 * prompt submission, and permission handling.
 */
export { DaemonSessionProvider } from './daemon/index.js';
/**
 * Wraps children with workspace-level daemon context.
 * Provides access to cross-session resources: tools, skills, MCP servers,
 * memory, agents, and file system operations.
 */
export { DaemonWorkspaceProvider } from './daemon/index.js';
// ── Core Hooks ────────────────────────────────────────────────────
/** Send prompts, cancel requests, and submit permission responses. */
export { useDaemonActions as useActions } from './daemon/index.js';
/** Connection status, capabilities, and model info. */
export { useDaemonConnection as useConnection } from './daemon/index.js';
export { useDaemonSessionOwnerGuard } from './daemon/session/DaemonSessionProvider.js';
/** Current session metadata (id, model, approval mode). */
export { useDaemonSession as useSession } from './daemon/index.js';
/** Classified session notices for host-owned UI such as toast or banners. */
export { useDaemonSessionNotices as useSessionNotices } from './daemon/index.js';
/** Streaming state: `'idle' | 'thinking' | 'responding'`. */
export { useDaemonStreamingState as useStreamingState } from './daemon/index.js';
// ── Permission Hooks ──────────────────────────────────────────────
/** All unresolved permission requests in the current transcript. */
export { useDaemonPendingPermissions as usePendingPermissions } from './daemon/index.js';
// ── Todo Hooks ────────────────────────────────────────────────────
/** The currently active (most relevant) todo list. */
export { useDaemonActiveTodoList as useActiveTodoList } from './daemon/index.js';
// ── Resource Hooks ────────────────────────────────────────────────
/** List and inspect configured agents. */
export { useDaemonAgents as useAgents } from './daemon/index.js';
/** Authentication state for the daemon connection. */
export { useDaemonAuth as useAuth } from './daemon/index.js';
/** Channel catalog, configuration, lifecycle, and pairing management. */
export { useDaemonChannels as useChannels } from './daemon/index.js';
/** Language diagnostics (errors, warnings) from the workspace. */
export { useDaemonDiagnostics as useDiagnostics } from './daemon/index.js';
/** Workspace file operations: glob, read, write, edit, stat, listDirectory. */
export { useDaemonFiles as useFiles } from './daemon/index.js';
/** Run glob queries against the workspace file system. */
export { useDaemonGlob as useGlob } from './daemon/index.js';
/** MCP server status, tools, and management operations. */
export { useDaemonMcp as useMcp } from './daemon/index.js';
/** Memory files (CLAUDE.md etc.) stored in the workspace. */
export { useDaemonMemory as useMemory } from './daemon/index.js';
/** Generic SWR-style resource fetcher for daemon REST endpoints. */
export { useDaemonResource as useResource } from './daemon/index.js';
/**
 * List daemon sessions (workspace-level). Switch/new/release actions require
 * a nested `DaemonSessionProvider` — they are `undefined` without one.
 */
export { useDaemonSessions as useSessions } from './daemon/index.js';
/** Available slash-command skills. */
export { useDaemonSkills as useSkills } from './daemon/index.js';
/** Consolidated daemon status report (`GET /daemon/status`). */
export { useDaemonStatusReport as useStatusReport } from './daemon/index.js';
/** Aggregate token-usage dashboard (`GET /usage/dashboard`). */
export { useDaemonUsageDashboard as useUsageDashboard } from './daemon/index.js';
/** Registered tools and their configuration. */
export { useDaemonTools as useTools } from './daemon/index.js';
/** Workspace settings (read/write). */
export { useDaemonSettings as useSettings } from './daemon/index.js';
export { useDaemonProviders as useProviders } from './daemon/index.js';
// ── Workspace Hooks ───────────────────────────────────────────────
/** Workspace context value (file ops, directory listing). */
export { useDaemonWorkspace as useWorkspace } from './daemon/index.js';
/** Workspace-level actions (create session, switch model, etc.). */
export { useDaemonWorkspaceActions as useWorkspaceActions } from './daemon/index.js';
/** Like `useWorkspace()` but returns null when outside a WorkspaceProvider. */
export { useOptionalDaemonWorkspace as useOptionalWorkspace } from './daemon/index.js';
/** Workspace-level event signals (memory/agents/tools/settings/mcp/extensions version counters). */
export { useDaemonWorkspaceEventSignals as useWorkspaceEventSignals } from './daemon/index.js';
// ── Transcript Hooks (low-level) ──────────────────────────────────
/** Raw transcript blocks from the SSE stream. For custom message conversion. */
export { useDaemonTranscriptBlocks as useTranscriptBlocks } from './daemon/session/index.js';
/** Load older persisted transcript pages for the active session. */
export { useDaemonTranscriptHistory as useTranscriptHistory } from './daemon/session/index.js';
/** Full transcript state including block index and progress tracking. */
export { useDaemonTranscriptState as useTranscriptState } from './daemon/session/index.js';
/** Direct access to the transcript store (subscribe, getSnapshot). */
export { useDaemonTranscriptStore as useTranscriptStore } from './daemon/session/index.js';
/** Low-level prompt lifecycle status (queued, streaming, idle). */
export { useDaemonPromptStatus as usePromptStatus } from './daemon/session/index.js';
/** Server-pushed prompt follow-up suggestions for daemon-backed UIs. */
export { useDaemonFollowupSuggestion } from './daemon/index.js';
/** Notifies when the daemon drains browser-queued messages into the running turn. */
export { useDaemonMidTurnInjected } from './daemon/index.js';
/** Notifies when the daemon's pending prompt queue changes (added/started/completed). */
export { getPendingPromptVersion, getPendingPromptEvents, consumePendingPromptEvents, subscribePendingPromptEvents, subscribePendingPromptVersion, } from './daemon/index.js';
// ── Constants ─────────────────────────────────────────────────────
/** Ordered list of approval modes for cycling: `['auto', 'suggest', 'ask']`. */
export { DAEMON_APPROVAL_MODES } from './daemon/index.js';
/** HTTP statuses that mean the requested daemon session no longer exists. */
export { isMissingSessionHttpStatus } from './daemon/index.js';
/** Canonical Agent (sub-agent) tool name + predicate for permission UIs. */
export { AGENT_TOOL_NAME, isAgentTool } from './constants/toolNames.js';
//# sourceMappingURL=daemon-react-sdk.js.map