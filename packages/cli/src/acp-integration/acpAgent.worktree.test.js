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
vi.mock('@agentclientprotocol/sdk', () => ({
    AgentSideConnection: vi.fn().mockImplementation(() => ({
        get closed() {
            return mockConnectionState.promise;
        },
    })),
    ndJsonStream: vi.fn().mockReturnValue({}),
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
vi.mock('node:stream', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        Writable: { ...actual.Writable, toWeb: vi.fn().mockReturnValue({}) },
        Readable: { ...actual.Readable, toWeb: vi.fn().mockReturnValue({}) },
    };
});
// Core mock — includes restoreWorktreeContext controllable per-test.
const { mockRestoreWorktreeContext } = vi.hoisted(() => ({
    mockRestoreWorktreeContext: vi
        .fn()
        .mockResolvedValue({ contextMessage: null, session: null }),
}));
vi.mock('@qwen-code/qwen-code-core', () => ({
    createDebugLogger: () => ({
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    }),
    APPROVAL_MODE_INFO: {},
    APPROVAL_MODES: [],
    AuthType: {},
    clearCachedCredentialFile: vi.fn(),
    QwenOAuth2Event: {},
    qwenOAuth2Events: { on: vi.fn(), off: vi.fn() },
    MCPServerConfig: vi.fn().mockImplementation((...args) => ({
        _args: args,
    })),
    SessionService: vi.fn(),
    SESSION_TITLE_MAX_LENGTH: 200,
    tokenLimit: vi.fn(),
    SessionStartSource: { Startup: 'startup', Resume: 'resume' },
    SessionEndReason: { PromptInputExit: 'prompt_input_exit', Other: 'other' },
    restoreWorktreeContext: mockRestoreWorktreeContext,
}));
vi.mock('./runtimeOutputDirContext.js', () => ({
    runWithAcpRuntimeOutputDir: vi.fn(async (_settings, _cwd, fn) => fn()),
}));
vi.mock('./authMethods.js', () => ({ buildAuthMethods: vi.fn() }));
vi.mock('./service/filesystem.js', () => ({
    AcpFileSystemService: vi.fn(),
}));
vi.mock('../config/settings.js', () => ({
    SettingScope: {},
    loadSettings: vi.fn(),
}));
vi.mock('../config/config.js', () => ({ loadCliConfig: vi.fn() }));
vi.mock('./session/Session.js', () => ({ Session: vi.fn() }));
vi.mock('../utils/acpModelUtils.js', () => ({
    formatAcpModelId: vi.fn(),
}));
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
            getSessionService: vi.fn().mockReturnValue(mockSessionService),
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