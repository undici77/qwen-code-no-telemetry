/**
 * Test utilities for agent tests
 *
 * Provides mock factories and helpers for testing agent implementations.
 */
import { AbortReason } from '../backend/types.ts';
import { BaseAgent } from '../base-agent.ts';
// ============================================================
// Mock Workspace Factory
// ============================================================
/**
 * Create a mock Workspace object for testing.
 */
export function createMockWorkspace(overrides = {}) {
    return {
        id: 'test-workspace-id',
        name: 'Test Workspace',
        slug: 'workspace',
        rootPath: '/test/workspace',
        createdAt: Date.now(),
        ...overrides,
    };
}
// ============================================================
// Mock Session Factory
// ============================================================
/**
 * Create a mock Session object for testing.
 */
export function createMockSession(overrides = {}) {
    return {
        id: 'test-session-id',
        name: 'Test Session',
        workspaceRootPath: '/test/workspace',
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        permissionMode: 'ask',
        ...overrides,
    };
}
// ============================================================
// Mock Source Factory
// ============================================================
/**
 * Create a mock LoadedSource object for testing.
 */
export function createMockSource(overrides = {}) {
    return {
        config: {
            id: 'test-source-id',
            name: 'Test Source',
            slug: 'test-source',
            enabled: true,
            provider: 'test',
            type: 'mcp',
            ...overrides,
        },
        guide: null,
        folderPath: '/test/source',
        workspaceRootPath: '/test/workspace',
        workspaceId: 'test-workspace-id',
    };
}
// ============================================================
// Mock BackendConfig Factory
// ============================================================
/**
 * Create a mock BackendConfig for testing.
 */
export function createMockBackendConfig(overrides = {}) {
    return {
        provider: 'qwen',
        workspace: createMockWorkspace(),
        session: createMockSession(),
        model: 'test-model',
        thinkingLevel: 'medium',
        isHeadless: true, // Headless mode to avoid config watcher
        ...overrides,
    };
}
// ============================================================
// TestAgent - Concrete BaseAgent for Testing
// ============================================================
/**
 * Concrete implementation of BaseAgent for testing.
 * Provides minimal implementations of abstract methods.
 */
export class TestAgent extends BaseAgent {
    backendName = 'Test';
    // Track calls for verification
    chatCalls = [];
    abortCalls = [];
    forceAbortCalls = [];
    respondToPermissionCalls = [];
    _isProcessing = false;
    constructor(config) {
        super(config, 'test-model', 100_000);
    }
    async *chatImpl(message, attachments, options) {
        this.chatCalls.push({ message, attachments, options });
        this._isProcessing = true;
        try {
            yield { type: 'complete' };
        }
        finally {
            this._isProcessing = false;
        }
    }
    async abort(reason) {
        this.abortCalls.push({ reason });
        this._isProcessing = false;
    }
    forceAbort(reason = AbortReason.UserStop) {
        this.forceAbortCalls.push({ reason });
        this._isProcessing = false;
    }
    isProcessing() {
        return this._isProcessing;
    }
    respondToPermission(requestId, allowed, alwaysAllow) {
        this.respondToPermissionCalls.push({ requestId, allowed, alwaysAllow });
    }
    async runMiniCompletion(_prompt) {
        return 'Test Response';
    }
    async queryLlm(_request) {
        return { text: 'Test LLM Response' };
    }
    // Expose protected state for testing
    getConfigWatcherManager() { return this.configWatcherManager; }
    // Helper to reset tracking
    resetTracking() {
        this.chatCalls = [];
        this.abortCalls = [];
        this.forceAbortCalls = [];
        this.respondToPermissionCalls = [];
    }
}
// ============================================================
// Event Collector Utility
// ============================================================
/**
 * Collect all events from an AsyncGenerator.
 */
export async function collectEvents(generator) {
    const events = [];
    for await (const event of generator) {
        events.push(event);
    }
    return events;
}
// ============================================================
// Callback Spy Utility
// ============================================================
/**
 * Create a callback spy that records all calls.
 */
export function createCallbackSpy() {
    const calls = [];
    const spy = ((...args) => {
        calls.push(args);
    });
    return { spy, calls };
}
//# sourceMappingURL=test-utils.js.map