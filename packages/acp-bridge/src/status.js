/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { SkillError } from '@qwen-code/qwen-code-core';
export const STATUS_SCHEMA_VERSION = 1;
/**
 * Closed enumeration of structured error categories surfaced on diagnostic
 * status cells. Cells produced by `/workspace/preflight`, `/workspace/env`,
 * and (eventually) the MCP guardrails route share this taxonomy so SDK
 * consumers can branch on a known set rather than parsing free-form strings.
 */
export const SERVE_ERROR_KINDS = [
    'missing_binary',
    'blocked_egress',
    'auth_env_error',
    'init_timeout',
    'restore_timeout',
    'protocol_error',
    'missing_file',
    'parse_error',
    'stat_failed',
    // Budget refusal under `--mcp-budget-mode=enforce`.
    // Surfaced on per-server `mcp_server` cells (refused at discovery)
    // and on the workspace-level `mcp_budget` cell (any refusal this pass).
    'budget_exhausted',
    // Runtime MCP mutation routes
    'mcp_budget_would_exceed',
    'mcp_server_spawn_failed',
    'invalid_config',
    // Prompt deadline + writer idle timeout
    'prompt_deadline_exceeded',
    'writer_idle_timeout',
];
/**
 * Typed timeout raised by `withTimeout` in the bridge. Lets the diagnostic
 * mapping helper recognize init/heartbeat/extMethod timeouts via `instanceof`
 * instead of regex-matching message strings.
 */
export class BridgeTimeoutError extends Error {
    label;
    timeoutMs;
    constructor(label, timeoutMs) {
        super(`AcpSessionBridge ${label} timed out after ${timeoutMs}ms`);
        this.name = 'BridgeTimeoutError';
        this.label = label;
        this.timeoutMs = timeoutMs;
    }
}
export class SessionRestoreTimeoutError extends BridgeTimeoutError {
    sessionId;
    action;
    constructor(sessionId, action, timeoutMs) {
        super(`session/${action}`, timeoutMs);
        this.name = 'SessionRestoreTimeoutError';
        this.sessionId = sessionId;
        this.action = action;
    }
}
/**
 * Raised when the bridge observes its ACP child's transport closing while
 * a request is in flight (workspace status, session/* restore, or
 * mid-prompt). Replaces three `new Error('agent channel closed …')` sites
 * so `mapDomainErrorToErrorKind` can recognize the failure via
 * `instanceof` rather than regex-matching `.message`. The `context` suffix
 * preserves the legacy message wording so log greps and existing
 * diagnostic surfaces keep working.
 */
export class BridgeChannelClosedError extends Error {
    context;
    constructor(context) {
        super(`agent channel closed ${context}`);
        this.name = 'BridgeChannelClosedError';
        this.context = context;
    }
}
/**
 * Raised by `defaultSpawnChannelFactory` when neither `QWEN_CLI_ENTRY` nor
 * `process.argv[1]` resolves to a path that can be re-spawned for the ACP
 * child. Replaces a generic `new Error(...)` so `mapDomainErrorToErrorKind`
 * can return `'missing_binary'` via `instanceof` rather than regex-matching
 * `.message`. The constructor message is preserved verbatim so existing
 * operator-facing diagnostics stay byte-for-byte compatible.
 */
export class MissingCliEntryError extends Error {
    constructor() {
        super('Cannot determine CLI entry path for spawning the ACP child: ' +
            'process.argv[1] is empty and QWEN_CLI_ENTRY is unset. ' +
            'Set QWEN_CLI_ENTRY to the absolute path of the qwen entry ' +
            'script (e.g. `export QWEN_CLI_ENTRY=$(which qwen)`) to override.');
        this.name = 'MissingCliEntryError';
    }
}
export const SERVE_STATUS_EXT_METHODS = {
    workspaceMcp: 'qwen/status/workspace/mcp',
    workspaceMcpTools: 'qwen/status/workspace/mcp/tools',
    workspaceMcpResources: 'qwen/status/workspace/mcp/resources',
    workspaceSkills: 'qwen/status/workspace/skills',
    workspaceTools: 'qwen/status/workspace/tools',
    workspaceProviders: 'qwen/status/workspace/providers',
    workspaceMemory: 'qwen/status/workspace/memory',
    workspaceAgents: 'qwen/status/workspace/agents',
    workspacePreflight: 'qwen/status/workspace/preflight',
    sessionContext: 'qwen/status/session/context',
    sessionContextUsage: 'qwen/status/session/context_usage',
    sessionSupportedCommands: 'qwen/status/session/supported_commands',
    sessionTasks: 'qwen/status/session/tasks',
    sessionStats: 'qwen/status/session/stats',
    sessionLspStatus: 'qwen/status/session/lsp',
    sessionTranscript: 'qwen/status/session/transcript',
    sessionRewindSnapshots: 'qwen/status/session/rewind_snapshots',
    workspaceHooks: 'qwen/status/workspace/hooks',
    sessionHooks: 'qwen/status/session/hooks',
    workspaceExtensions: 'qwen/status/workspace/extensions',
    // Process-wide rss/cpu of this ACP child, self-reported to the daemon for
    // the Daemon Status resource charts (workspace-scoped; no sessionId).
    workspaceResource: 'qwen/status/workspace/resource',
};
/**
 * Control-plane (mutation) ACP extMethods introduced in Mutation control.
 * Distinct from `SERVE_STATUS_EXT_METHODS` so reviewers can grep mutation
 * surface independently from read-only diagnostics. Each route in
 * `server.ts` forwards through the matching extMethod into `acpAgent.ts`
 * which then mutates Config / ToolRegistry / McpClientManager state.
 */
export const SERVE_CONTROL_EXT_METHODS = {
    sessionClose: 'qwen/control/session/close',
    sessionApprovalMode: 'qwen/control/session/approval_mode',
    sessionBranch: 'qwen/control/session/branch',
    sessionSideTask: 'qwen/control/session/side_task',
    sessionForkAgent: 'qwen/control/session/fork_agent',
    sessionRecap: 'qwen/control/session/recap',
    sessionGenerationStart: 'qwen/control/session/generation/start',
    sessionGenerationCancel: 'qwen/control/session/generation/cancel',
    sessionBtw: 'qwen/control/session/btw',
    sessionShellHistory: 'qwen/control/session/shell_history',
    sessionLanguage: 'qwen/control/session/language',
    sessionRewind: 'qwen/control/session/rewind',
    sessionContinue: 'qwen/control/session/continue',
    sessionTitle: 'qwen/control/session/title',
    sessionParent: 'qwen/control/session/parent',
    sessionSource: 'qwen/control/session/source',
    sessionLiveConversation: 'qwen/control/session/live-conversation',
    sessionLiveTranscript: 'qwen/control/session/live-transcript',
    sessionBackgroundNotification: 'qwen/control/session/background_notification',
    sessionArtifactsPersist: 'qwen/control/session/artifacts/persist',
    workspaceMcpRestart: 'qwen/control/workspace/mcp/restart',
    workspaceMcpManage: 'qwen/control/workspace/mcp/manage',
    workspaceMcpInitialize: 'qwen/control/workspace/mcp/initialize',
    workspaceMcpReload: 'qwen/control/workspace/mcp/reload',
    workspaceAgentGenerate: 'qwen/control/workspace/agents/generate',
    workspaceGenerationStart: 'qwen/control/workspace/generation/start',
    workspaceGenerationCancel: 'qwen/control/workspace/generation/cancel',
    workspaceMemoryRememberAvailability: 'qwen/control/workspace/memory/remember/availability',
    workspaceMemoryRemember: 'qwen/control/workspace/memory/remember',
    workspaceMemoryForget: 'qwen/control/workspace/memory/forget',
    workspaceMemoryDream: 'qwen/control/workspace/memory/dream',
    // Runtime MCP server mutation ext-methods
    sessionTaskCancel: 'qwen/control/session/task/cancel',
    sessionGoalClear: 'qwen/control/session/goal/clear',
    /**
     * Read a live session's `/goal` state. The active goal lives only in the
     * child's in-memory store, so this is the sole authoritative source for the
     * condition, its running turn count and the judge's last verdict. Params:
     * `{ sessionId }`; result: `{ active: ActiveGoalView | null }`.
     */
    sessionGoalGet: 'qwen/control/session/goal/get',
    sessionMcpRuntimeAdd: 'qwen/control/session/mcp/runtime-add',
    sessionMcpRuntimeRemove: 'qwen/control/session/mcp/runtime-remove',
    workspaceMcpRuntimeAdd: 'qwen/control/workspace/mcp/runtime-add',
    workspaceMcpRuntimeRemove: 'qwen/control/workspace/mcp/runtime-remove',
    workspaceReload: 'qwen/control/workspace/reload',
    workspaceSkillsRefresh: 'qwen/control/workspace/skills/refresh',
    workspaceExtensionsRefresh: 'qwen/control/workspace/extensions/refresh',
    /**
     * Reverse tool channel (issue #5626, Phase 2). Unlike every other entry
     * here — which the PARENT serve process calls DOWN into the `qwen --acp`
     * child — this one is called by the CHILD UP into the parent: a
     * client-hosted (extension) MCP server's `sendSdkMcpMessage` round-trips a
     * JSON-RPC `mcp_message` from the child's `McpClientManager` back to the
     * parent's `ClientMcpRegistrar`, which pushes it down the daemon WS to the
     * client and returns the correlated response. Params: `{ server, payload }`;
     * result: `{ payload }`.
     */
    clientMcpMessage: 'qwen/control/client_mcp/message',
    /**
     * Called by a private ACP CHILD immediately before a tool executor. The
     * parent validates the runtime-owned session/prompt identity, invokes its
     * configured external provider once, and returns allow/deny. Unavailable
     * unless the daemon explicitly enabled required external guarding.
     */
    externalToolGuardPrepare: 'qwen/control/external_tool_guard/prepare',
    sessionCd: 'qwen/control/session/cd',
    /**
     * Also called by the CHILD UP into the parent (like `clientMcpMessage`): the
     * `create_sub_session` tool, running inside a child's agent turn, asks the
     * daemon to spawn a fresh top-level sub-session and run a prompt in it. Params:
     * `{ prompt, completion:'sent'|'first-turn', model?, name?, callerSessionId? }`;
     * result: `{ sessionId, result?, stopReason? }` (result present only for the
     * `first-turn` mode, which waits for the sub-session's first turn to finish).
     */
    createSubSession: 'qwen/control/create-sub-session',
    liveCaptureScreenContext: 'qwen/control/live/capture-screen-context',
    liveTaskTool: 'qwen/control/live/task-tool',
    liveSpeakToUser: 'qwen/control/live/speak-to-user',
    channelDelivery: 'qwen/control/channel-delivery',
};
export const IDLE_HOOK_EVENTS = {
    PreToolUse: { description: 'Before tool execution', matcherKind: 'toolName' },
    PostToolUse: { description: 'After tool execution', matcherKind: 'toolName' },
    PostToolUseFailure: {
        description: 'After tool execution fails',
        matcherKind: 'toolName',
    },
    PostToolBatch: { description: 'After a batch of tool calls resolves' },
    Notification: {
        description: 'When notifications are sent',
        matcherKind: 'notificationType',
    },
    UserPromptSubmit: { description: 'When the user submits a prompt' },
    UserPromptExpansion: {
        description: 'When a slash command expands into a prompt',
        matcherKind: 'commandName',
    },
    SessionStart: {
        description: 'When a new session is started',
        matcherKind: 'sessionTrigger',
    },
    MessageDisplay: {
        description: 'Repeatedly, as the assistant reply streams',
    },
    Stop: { description: 'Right before Qwen Code concludes its response' },
    SubagentStart: {
        description: 'When a subagent is started',
        matcherKind: 'agentType',
    },
    SubagentStop: {
        description: 'Right before a subagent concludes its response',
        matcherKind: 'agentType',
    },
    PreCompact: {
        description: 'Before conversation compaction',
        matcherKind: 'trigger',
    },
    PostCompact: {
        description: 'After conversation compaction',
        matcherKind: 'trigger',
    },
    SessionEnd: {
        description: 'When a session is ending',
        matcherKind: 'sessionTrigger',
    },
    SessionDelete: {
        description: 'After an explicitly selected session is deleted',
    },
    PermissionRequest: {
        description: 'When a permission dialog is displayed',
        matcherKind: 'toolName',
    },
    PermissionDenied: {
        description: 'When a tool call is denied',
        matcherKind: 'toolName',
    },
    StopFailure: {
        description: 'When the turn ends due to an API error',
        matcherKind: 'error',
    },
    TodoCreated: { description: 'When a new todo item is created' },
    TodoCompleted: { description: 'When a todo item is marked as completed' },
    InstructionsLoaded: {
        description: 'When an instruction or context file is loaded',
        matcherKind: 'filePath',
    },
};
export function createIdleWorkspaceExtensionsStatus(workspaceCwd) {
    return {
        v: STATUS_SCHEMA_VERSION,
        workspaceCwd,
        initialized: false,
        extensions: [],
    };
}
export function createIdleWorkspaceHooksStatus(workspaceCwd) {
    return {
        v: STATUS_SCHEMA_VERSION,
        workspaceCwd,
        initialized: false,
        disabled: false,
        hooks: [],
        events: IDLE_HOOK_EVENTS,
    };
}
export function createIdleWorkspaceMemoryStatus(workspaceCwd) {
    return {
        v: STATUS_SCHEMA_VERSION,
        workspaceCwd,
        initialized: false,
        files: [],
        totalBytes: 0,
        fileCount: 0,
        ruleCount: 0,
    };
}
export function createIdleWorkspaceAgentsStatus(workspaceCwd) {
    return {
        v: STATUS_SCHEMA_VERSION,
        workspaceCwd,
        agents: [],
    };
}
export function createIdleWorkspaceMcpStatus(workspaceCwd) {
    // The budget feature: an idle workspace has zero live clients and no enforcement
    // pressure. `budgetMode` is `'off'` (regardless of how the operator
    // configured it) because no discovery has run, so no reservation
    // could have happened. `budgets` is an empty array, not absent —
    // the daemon DOES support the surface, the snapshot just has
    // nothing to report yet. Older daemons omitting the array entirely
    // are still spec-compliant; consumers default-coalesce to `[]`.
    return {
        v: STATUS_SCHEMA_VERSION,
        workspaceCwd,
        initialized: false,
        discoveryState: 'not_started',
        servers: [],
        clientCount: 0,
        budgetMode: 'off',
        budgets: [],
    };
}
export function createIdleWorkspaceSkillsStatus(workspaceCwd) {
    return {
        v: STATUS_SCHEMA_VERSION,
        workspaceCwd,
        initialized: false,
        skills: [],
    };
}
export function createIdleWorkspaceProvidersStatus(workspaceCwd) {
    return {
        v: STATUS_SCHEMA_VERSION,
        workspaceCwd,
        initialized: false,
        providers: [],
    };
}
/**
 * Idle envelope for `/workspace/env` when the bridge
 * has no `DaemonStatusProvider` injected (Mode A in-process consumers,
 * tests, embedded callers that don't need daemon-host cells). Single
 * construction site so future optional-field additions to
 * `ServeWorkspaceEnvStatus` only need updating in one place — the
 * production builder in `cli/src/serve/env-snapshot.ts buildEnvStatusFromProcess`
 * and this helper would otherwise diverge silently (TS won't flag a
 * missing optional field).
 *
 * Note: `initialized: true` matches `buildEnvStatusFromProcess` —
 * the daemon answers env from `process.*` state without consulting
 * ACP, so even an "empty" envelope is initialized.
 */
export function createIdleEnvStatus(workspaceCwd, acpChannelLive) {
    return {
        v: STATUS_SCHEMA_VERSION,
        workspaceCwd,
        initialized: true,
        acpChannelLive,
        cells: [],
    };
}
/**
 * The six preflight kinds that require a live ACP child to populate. Shared
 * between `createIdleAcpPreflightCells` (idle placeholder) and the
 * ACP-side `buildAcpPreflightCells` builder so the two sides cannot drift
 * — a future contributor adding a new ACP kind in one place sees the
 * other surface immediately.
 */
export const ACP_PREFLIGHT_KINDS = [
    'auth',
    'mcp_discovery',
    'skills',
    'providers',
    'tool_registry',
    'egress',
];
/**
 * Idle ACP cells: emitted when the daemon has no live ACP child. The bridge
 * stitches these in alongside its daemon-level cells so `/workspace/preflight`
 * always returns a complete cell set without spawning a child.
 */
export function createIdleAcpPreflightCells() {
    return ACP_PREFLIGHT_KINDS.map((kind) => ({
        kind,
        status: 'not_started',
        locality: 'acp',
        hint: 'spawn a session to populate',
    }));
}
const SKILL_PARSE_CODES = new Set([
    'PARSE_ERROR',
    'INVALID_CONFIG',
    'INVALID_NAME',
]);
const SKILL_FILE_CODES = new Set([
    'FILE_ERROR',
    'NOT_FOUND',
]);
const FS_MISSING_CODES = new Set([
    'ENOENT',
    'EACCES',
    'EPERM',
]);
// `ModelConfigError` subclasses live inside core's models module and are not
// re-exported on the public package surface. We classify them by the `name`
// field that each subclass sets via `this.name = new.target.name`.
const MODEL_CONFIG_ERROR_NAMES = new Set([
    'StrictMissingCredentialsError',
    'StrictMissingModelIdError',
    'MissingApiKeyError',
    'MissingModelError',
    'MissingBaseUrlError',
    'MissingAnthropicBaseUrlEnvError',
]);
/**
 * Map a thrown domain error onto one of the closed `ServeErrorKind` literals
 * so diagnostic cells can render structured remediation. Recognition is
 * `instanceof`-based for bridge-owned errors; cross-package classes
 * (`SkillError`, `TrustGateError`, model-config) are matched by `.code` or
 * `.name` because bundle duplication can break `instanceof` symmetry.
 *
 * Returns `undefined` when no rule matches; callers should leave `errorKind`
 * unset rather than coercing an unrelated error into a misleading category.
 */
export function mapDomainErrorToErrorKind(err) {
    if (err instanceof SessionRestoreTimeoutError)
        return 'restore_timeout';
    if (err instanceof BridgeTimeoutError)
        return 'init_timeout';
    if (err instanceof BridgeChannelClosedError)
        return 'protocol_error';
    if (err instanceof MissingCliEntryError)
        return 'missing_binary';
    // `SkillError` is defined in `@qwen-code/qwen-code-core/skills`; same
    // cross-package bundling concern as `TrustGateError` below — when this
    // function is consumed from outside the monorepo (or under a bundler
    // that doesn't dedupe `file:` workspace deps), the `SkillError` class
    // identity at the throw site (cli's `SkillManager`) can diverge from
    // the one resolved here through acp-bridge's `@qwen-code/qwen-code-core`
    // dependency, silently making `instanceof` return `false` and
    // dropping the skill `errorKind` classification on diagnostic cells.
    // The `OR .name === 'SkillError'` branch keeps classification working
    // regardless of which copy of the class the value carries.
    if (err instanceof SkillError ||
        err?.name === 'SkillError') {
        const code = err.code;
        if (code && SKILL_PARSE_CODES.has(code))
            return 'parse_error';
        if (code && SKILL_FILE_CODES.has(code))
            return 'missing_file';
        return undefined;
    }
    if (err instanceof SyntaxError)
        return 'parse_error';
    if (!(err instanceof Error))
        return undefined;
    // `TrustGateError` is defined in `@qwen-code/qwen-code-core/config`; we
    // match by `.name` rather than `instanceof` because cross-package bundling
    // can produce duplicate class instances where `instanceof` returns false.
    if (err.name === 'TrustGateError')
        return 'auth_env_error';
    if (MODEL_CONFIG_ERROR_NAMES.has(err.name))
        return 'auth_env_error';
    const code = err.code;
    if (typeof code === 'string' && FS_MISSING_CODES.has(code)) {
        return 'missing_file';
    }
    return undefined;
}
//# sourceMappingURL=status.js.map