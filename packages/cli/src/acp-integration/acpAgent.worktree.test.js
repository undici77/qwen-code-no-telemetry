/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase C ACP worktree context restore — agent-level integration tests.
 *
 * Coverage (this file):
 *   VP1: loadSession with a stale sidecar — pendingWorktreeNotice stays null.
 *   VP2: loadSession with a live sidecar — pendingWorktreeNotice is set to
 *        the contextMessage from restoreWorktreeContext.
 *   VP2b: restoreWorktreeContext throws — session still loads, notice null.
 *
 * VP3 / VP4 (Session.prompt consumption) are in Session.worktree.test.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach, afterAll, } from 'vitest';
// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockRunExitCleanup } = vi.hoisted(() => ({
    mockRunExitCleanup: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../utils/cleanup.js', () => ({
    runExitCleanup: mockRunExitCleanup,
}));
const { mockConnectionState } = vi.hoisted(() => {
    const state = {
        resolve: () => { },
        promise: null,
        reset() {
            state.promise = new Promise((r) => {
                state.resolve = r;
            });
        },
    };
    state.reset();
    return { mockConnectionState: state };
});
vi.mock('@agentclientprotocol/sdk', async (importOriginal) => ({
    ...(await importOriginal()),
    AgentSideConnection: vi.fn().mockImplementation(() => ({
        get closed() {
            return mockConnectionState.promise;
        },
    })),
    RequestError: class RequestError extends Error {
        static authRequired = vi
            .fn()
            .mockImplementation((data, msg) => {
            const err = new Error(msg);
            Object.assign(err, data);
            return err;
        });
        static invalidParams = vi
            .fn()
            .mockImplementation((data, msg) => {
            const err = new Error(msg);
            Object.assign(err, data);
            return err;
        });
    },
    PROTOCOL_VERSION: '1.0.0',
}));
vi.mock('@qwen-code/acp-bridge/ndJsonStream', () => ({
    ndJsonStream: vi.fn().mockReturnValue({}),
}));
vi.mock('node:stream', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        Writable: { ...actual.Writable, toWeb: vi.fn().mockReturnValue({}) },
        Readable: { ...actual.Readable, toWeb: vi.fn().mockReturnValue({}) },
    };
});
// Core mock — includes restoreWorktreeContext controllable per-test.
const { mockRestoreWorktreeContext, mockWithDaemonSpan } = vi.hoisted(() => {
    const daemonSpan = { setAttribute: vi.fn() };
    return {
        mockRestoreWorktreeContext: vi
            .fn()
            .mockResolvedValue({ contextMessage: null, session: null }),
        mockWithDaemonSpan: vi.fn(async (_name, _attributes, fn) => await fn(daemonSpan)),
    };
});
vi.mock('@qwen-code/qwen-code-core', () => ({
    createDebugLogger: () => ({
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    }),
    extractDaemonTraceContext: vi.fn(),
    withDaemonSpan: mockWithDaemonSpan,
    registerAcpEventLoopLagGauge: vi.fn(),
    startEventLoopLagMonitor: vi.fn(() => ({
        snapshot: vi.fn(() => ({
            meanMs: 0,
            p50Ms: 0,
            p99Ms: 0,
            maxMs: 0,
        })),
        dispose: vi.fn(),
    })),
    APPROVAL_MODE_INFO: {},
    APPROVAL_MODES: [],
    applyReasoningEffort: (config, effort) => {
        config.setReasoningEffort(effort);
        return config.getReasoningEffort() === effort;
    },
    REASONING_EFFORT_TIERS: ['low', 'medium', 'high', 'xhigh', 'max'],
    DEFAULT_STOP_HOOK_BLOCK_CAP: 8,
    DEFAULT_MAX_SUBAGENT_DEPTH: 5,
    DEFAULT_MAX_TOOL_CALLS_PER_TURN: 100,
    DEFAULT_SENSITIVE_SPAN_ATTRIBUTE_MAX_LENGTH: 1024 * 1024,
    SENSITIVE_SPAN_ATTRIBUTE_MAX_LENGTH_LIMIT: 100 * 1024 * 1024,
    DEFAULT_TOOL_RESULTS_TOTAL_CHARS_THRESHOLD: 500_000,
    DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES: 1000,
    DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD: 25_000,
    PRIVATE_ACP_CAPABILITY_ENV: 'QWEN_CODE_PRIVATE_ACP_CAPABILITY',
    ApprovalMode: {
        DEFAULT: 'default',
        AUTO_EDIT: 'auto-edit',
        YOLO: 'yolo',
        PLAN: 'plan',
    },
    Kind: {
        Read: 'read',
        Edit: 'edit',
        Delete: 'delete',
        Move: 'move',
        Search: 'search',
        Execute: 'execute',
        Think: 'think',
        Fetch: 'fetch',
        Other: 'other',
    },
    AuthType: {},
    DEFAULT_QWEN_CUSTOM_IGNORE_FILE_NAMES: ['.agentignore', '.aiignore'],
    clearCachedCredentialFile: vi.fn(),
    QwenOAuth2Event: {},
    qwenOAuth2Events: { on: vi.fn(), off: vi.fn() },
    MCP_BUDGET_WARN_FRACTION: 0.75,
    MCPServerConfig: vi.fn().mockImplementation((...args) => ({
        _args: args,
    })),
    SessionService: vi.fn(),
    Storage: {
        getRuntimeBaseDir: vi.fn(() => '/tmp/qwen-runtime-test'),
    },
    SESSION_TITLE_MAX_LENGTH: 200,
    DEFAULT_TOOL_OUTPUT_BATCH_BUDGET: 200_000,
    tokenLimit: vi.fn(),
    getMCPDiscoveryState: vi.fn(() => 'not_started'),
    getMCPServerStatus: vi.fn(() => 'disconnected'),
    MCPDiscoveryState: {
        NOT_STARTED: 'not_started',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
    },
    MCPServerStatus: {
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting',
        CONNECTED: 'connected',
    },
    McpTransportPool: vi.fn().mockImplementation(() => ({
        acquire: vi.fn(),
        release: vi.fn(),
        shutdown: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        off: vi.fn(),
    })),
    POOLED_TRANSPORTS_DEFAULT: new Set(),
    SessionStartSource: { Startup: 'startup', Resume: 'resume' },
    SessionEndReason: { PromptInputExit: 'prompt_input_exit', Other: 'other' },
    WorkspaceMcpBudget: vi.fn().mockImplementation(() => ({
        register: vi.fn(),
        unregister: vi.fn(),
        snapshot: vi.fn(() => ({})),
    })),
    restoreWorktreeContext: mockRestoreWorktreeContext,
    HookEventName: {
        PreToolUse: 'PreToolUse',
        PostToolUse: 'PostToolUse',
        PostToolUseFailure: 'PostToolUseFailure',
        PostToolBatch: 'PostToolBatch',
        Notification: 'Notification',
        UserPromptSubmit: 'UserPromptSubmit',
        UserPromptExpansion: 'UserPromptExpansion',
        SessionStart: 'SessionStart',
        Stop: 'Stop',
        SubagentStart: 'SubagentStart',
        SubagentStop: 'SubagentStop',
        PreCompact: 'PreCompact',
        PostCompact: 'PostCompact',
        SessionEnd: 'SessionEnd',
        PermissionRequest: 'PermissionRequest',
        PermissionDenied: 'PermissionDenied',
        StopFailure: 'StopFailure',
        TodoCreated: 'TodoCreated',
        TodoCompleted: 'TodoCompleted',
    },
}));
vi.mock('./runtimeOutputDirContext.js', () => ({
    runWithAcpRuntimeOutputDir: vi.fn(async (_settings, _cwd, fn) => fn()),
}));
vi.mock('./authMethods.js', () => {
    const buildAuthMethods = vi.fn();
    return {
        buildAuthMethods,
        pickAuthMethodsForAuthRequired: vi.fn((selectedType) => {
            const authMethods = buildAuthMethods();
            if (!selectedType)
                return authMethods;
            const matched = authMethods.filter((method) => method.id === selectedType);
            return matched.length ? matched : authMethods;
        }),
    };
});
vi.mock('./service/filesystem.js', () => ({
    AcpFileSystemService: vi.fn(),
}));
vi.mock('../config/settings.js', () => ({
    SettingScope: {},
    loadSettings: vi.fn(),
}));
// Passthrough: the real cache would serve the first mockReturnValue to every
// later same-cwd call, breaking tests that re-point loadSettings per call.
vi.mock('../config/settings-cache.js', async () => {
    const settings = await import('../config/settings.js');
    return {
        loadSettingsCached: (cwd) => settings.loadSettings(cwd),
    };
});
vi.mock('../config/config.js', () => ({
    loadCliConfig: vi.fn(),
    buildDisabledSkillNamesProvider: vi.fn(() => () => new Set()),
}));
vi.mock('./session/Session.js', () => ({ Session: vi.fn() }));
// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { runAcpAgent } from './acpAgent.js';
import { SessionService } from '@qwen-code/qwen-code-core';
import { AgentSideConnection } from '@agentclientprotocol/sdk';
import { loadSettings } from '../config/settings.js';
import { loadCliConfig } from '../config/config.js';
import { Session } from './session/Session.js';
// ---------------------------------------------------------------------------
// Test suite — VP1, VP2, VP2b
// ---------------------------------------------------------------------------
describe('QwenAgent loadSession — Phase C worktree context restore', () => {
    let capturedAgentFactory;
    let mockConfig;
    let lastSessionMock;
    // Use `any` for these spies because vitest's MockInstance<T> doesn't
    // accept the heterogeneous Node.js prototype signatures (process.exit:
    // never, stdin.destroy: ReadStream, stdout.destroy: WriteStream) under
    // a single covariant type. We only call .mockRestore() on them.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let processExitSpy;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stdinDestroySpy;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stdoutDestroySpy;
    const mockArgv = {};
    const SESSION_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const SIDECAR_PATH = `/fake/chats/${SESSION_ID}.worktree.json`;
    function makeInnerConfig() {
        const mockSessionService = {
            sessionExists: vi.fn().mockResolvedValue(true),
            getWorktreeSessionPath: vi.fn().mockReturnValue(SIDECAR_PATH),
        };
        vi.mocked(SessionService).mockImplementation(() => mockSessionService);
        return {
            initialize: vi.fn().mockResolvedValue(undefined),
            waitForMcpReady: vi.fn().mockResolvedValue(undefined),
            getModelsConfig: vi.fn().mockReturnValue({
                getCurrentAuthType: vi.fn().mockReturnValue('api-key'),
            }),
            refreshAuth: vi.fn().mockResolvedValue(undefined),
            getModel: vi.fn().mockReturnValue('m'),
            getContentGeneratorConfig: vi.fn().mockReturnValue({}),
            getApprovalMode: vi.fn().mockReturnValue('default'),
            getSessionId: vi.fn().mockReturnValue(SESSION_ID),
            getAuthType: vi.fn().mockReturnValue('api-key'),
            getAllConfiguredModels: vi.fn().mockReturnValue([]),
            getGeminiClient: vi.fn().mockReturnValue({
                isInitialized: vi.fn().mockReturnValue(true),
                initialize: vi.fn().mockResolvedValue(undefined),
                waitForMcpReady: vi.fn().mockResolvedValue(undefined),
            }),
            getFileSystemService: vi.fn().mockReturnValue(undefined),
            setFileSystemService: vi.fn(),
            getHookSystem: vi.fn().mockReturnValue(undefined),
            getDisableAllHooks: vi.fn().mockReturnValue(true),
            hasHooksForEvent: vi.fn().mockReturnValue(false),
            getResumedSessionData: vi.fn().mockReturnValue(undefined),
            loadPausedBackgroundAgents: vi.fn().mockResolvedValue(undefined),
            consumePendingRecoveredAgentsNotice: vi.fn().mockReturnValue(null),
            getSessionService: vi.fn().mockReturnValue(mockSessionService),
            getWorkspaceContext: vi.fn().mockReturnValue({
                getDirectories: vi.fn().mockReturnValue([]),
                addDirectory: vi.fn(),
            }),
            getDebugMode: vi.fn().mockReturnValue(false),
            getMcpServers: vi.fn().mockReturnValue({}),
            setMcpBudgetEventCallback: vi.fn(),
        };
    }
    function makeSessionSettings() {
        return {
            merged: { mcpServers: {} },
            getUserHooks: vi.fn().mockReturnValue({}),
            getProjectHooks: vi.fn().mockReturnValue({}),
        };
    }
    beforeEach(() => {
        vi.clearAllMocks();
        mockConnectionState.reset();
        capturedAgentFactory = undefined;
        lastSessionMock = undefined;
        vi.mocked(AgentSideConnection).mockImplementation((factory) => {
            capturedAgentFactory = factory;
            return {
                get closed() {
                    return mockConnectionState.promise;
                },
            };
        });
        mockConfig = {
            initialize: vi.fn().mockResolvedValue(undefined),
            waitForMcpReady: vi.fn().mockResolvedValue(undefined),
            getHookSystem: vi.fn().mockReturnValue(undefined),
            getDisableAllHooks: vi.fn().mockReturnValue(false),
            hasHooksForEvent: vi.fn().mockReturnValue(false),
            getModel: vi.fn().mockReturnValue('test-model'),
            getModelsConfig: vi.fn().mockReturnValue({
                getCurrentAuthType: vi.fn().mockReturnValue('api-key'),
            }),
            refreshAuth: vi.fn().mockResolvedValue(undefined),
            getWorkspaceContext: vi.fn().mockReturnValue({
                getDirectories: vi.fn().mockReturnValue([]),
                addDirectory: vi.fn(),
            }),
            getDebugMode: vi.fn().mockReturnValue(false),
            getMcpServers: vi.fn().mockReturnValue({}),
            setMcpBudgetEventCallback: vi.fn(),
        };
        processExitSpy = vi
            .spyOn(process, 'exit')
            .mockImplementation((() => undefined));
        stdinDestroySpy = vi
            .spyOn(process.stdin, 'destroy')
            .mockImplementation(() => process.stdin);
        stdoutDestroySpy = vi
            .spyOn(process.stdout, 'destroy')
            .mockImplementation(() => process.stdout);
    });
    afterEach(() => {
        processExitSpy.mockRestore();
        stdinDestroySpy.mockRestore();
        stdoutDestroySpy.mockRestore();
        vi.clearAllMocks();
    });
    afterAll(() => {
        mockConnectionState.resolve();
    });
    async function bootAgentWithLoadSession(innerConfig) {
        vi.mocked(loadSettings).mockReturnValue(makeSessionSettings());
        vi.mocked(loadCliConfig).mockResolvedValue(innerConfig);
        vi.mocked(Session).mockImplementation(() => {
            const mock = {
                getId: vi.fn().mockReturnValue(SESSION_ID),
                getConfig: vi.fn().mockReturnValue(innerConfig),
                sendAvailableCommandsUpdate: vi.fn().mockResolvedValue(undefined),
                replayHistory: vi.fn().mockResolvedValue(undefined),
                installRewriter: vi.fn(),
                installGoalTerminalObserver: vi.fn(),
                startCronScheduler: vi.fn(),
                dispose: vi.fn(),
                pendingWorktreeNotice: null,
            };
            lastSessionMock = mock;
            return mock;
        });
        const agentPromise = runAcpAgent(mockConfig, makeSessionSettings(), mockArgv);
        await vi.waitFor(() => expect(capturedAgentFactory).toBeDefined());
        const agent = capturedAgentFactory({
            get closed() {
                return mockConnectionState.promise;
            },
        });
        return { agent, agentPromise };
    }
    it('VP1: stale sidecar — pendingWorktreeNotice stays null', async () => {
        // mockRestoreWorktreeContext defaults to { contextMessage: null, session: null }
        const innerConfig = makeInnerConfig();
        const { agent, agentPromise } = await bootAgentWithLoadSession(innerConfig);
        await agent.loadSession({
            sessionId: SESSION_ID,
            cwd: '/fake/project',
            mcpServers: [],
        });
        expect(mockRestoreWorktreeContext).toHaveBeenCalledWith(SIDECAR_PATH);
        expect(lastSessionMock?.pendingWorktreeNotice).toBeNull();
        mockConnectionState.resolve();
        await agentPromise;
    });
    it('VP2: live sidecar — pendingWorktreeNotice is set to contextMessage', async () => {
        const contextMessage = '[Resumed] Active worktree: "my-feature" at /repo/.qwen/worktrees/my-feature ' +
            '(branch: worktree-my-feature). Continue using this path for all file operations.';
        mockRestoreWorktreeContext.mockResolvedValueOnce({
            contextMessage,
            session: {
                slug: 'my-feature',
                worktreePath: '/repo/.qwen/worktrees/my-feature',
                worktreeBranch: 'worktree-my-feature',
                originalCwd: '/repo',
                originalBranch: 'main',
                originalHeadCommit: 'abc1234',
            },
        });
        const innerConfig = makeInnerConfig();
        const { agent, agentPromise } = await bootAgentWithLoadSession(innerConfig);
        await agent.loadSession({
            sessionId: SESSION_ID,
            cwd: '/fake/project',
            mcpServers: [],
        });
        expect(mockRestoreWorktreeContext).toHaveBeenCalledWith(SIDECAR_PATH);
        expect(lastSessionMock?.pendingWorktreeNotice).toBe(contextMessage);
        mockConnectionState.resolve();
        await agentPromise;
    });
    it('VP2b: restoreWorktreeContext throws — loadSession succeeds and notice stays null', async () => {
        mockRestoreWorktreeContext.mockRejectedValueOnce(new Error('disk I/O error'));
        const innerConfig = makeInnerConfig();
        const { agent, agentPromise } = await bootAgentWithLoadSession(innerConfig);
        await expect(agent.loadSession({
            sessionId: SESSION_ID,
            cwd: '/fake/project',
            mcpServers: [],
        })).resolves.not.toThrow();
        expect(lastSessionMock?.pendingWorktreeNotice).toBeNull();
        mockConnectionState.resolve();
        await agentPromise;
    });
});
//# sourceMappingURL=acpAgent.worktree.test.js.map