/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { vi } from 'vitest';
import { ToolCallDecision } from '../ui/contexts/SessionContext.js';
/**
 * Creates a deep, fully-typed mock of the CommandContext for use in tests.
 * All functions are pre-mocked with `vi.fn()`.
 *
 * @param overrides - A deep partial object to override any default mock values.
 * @returns A complete, mocked CommandContext object.
 */
export const createMockCommandContext = (overrides = {}) => {
    const defaultMocks = {
        executionMode: 'interactive',
        invocation: {
            raw: '',
            name: '',
            args: '',
        },
        services: {
            config: null,
            settings: {
                merged: {},
                setValue: vi.fn(),
                isTrusted: true,
            },
            logger: {
                log: vi.fn(),
                logMessage: vi.fn(),
                saveCheckpoint: vi.fn(),
                loadCheckpoint: vi.fn().mockResolvedValue([]),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }, // Cast because Logger is a class.
        },
        ui: {
            history: [],
            addItem: vi.fn(),
            clear: vi.fn(),
            setDebugMessage: vi.fn(),
            pendingItem: null,
            setPendingItem: vi.fn(),
            btwItem: null,
            setBtwItem: vi.fn(),
            cancelBtw: vi.fn(),
            btwAbortControllerRef: { current: null },
            isIdleRef: { current: true },
            loadHistory: vi.fn(),
            refreshStatic: vi.fn(),
            toggleVimEnabled: vi.fn(),
            extensionsUpdateState: new Map(),
            setExtensionsUpdateState: vi.fn(),
            reloadCommands: vi.fn(),
            setSessionName: vi.fn(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        },
        session: {
            sessionShellAllowlist: new Set(),
            startNewSession: vi.fn(),
            stats: {
                sessionId: '',
                sessionStartTime: new Date(),
                lastPromptTokenCount: 0,
                metrics: {
                    models: {},
                    tools: {
                        totalCalls: 0,
                        totalSuccess: 0,
                        totalFail: 0,
                        totalDurationMs: 0,
                        totalDecisions: {
                            [ToolCallDecision.ACCEPT]: 0,
                            [ToolCallDecision.REJECT]: 0,
                            [ToolCallDecision.MODIFY]: 0,
                            [ToolCallDecision.AUTO_ACCEPT]: 0,
                        },
                        byName: {},
                    },
                    files: { totalLinesAdded: 0, totalLinesRemoved: 0 },
                    skills: {
                        totalCalls: 0,
                        totalSuccess: 0,
                        totalFail: 0,
                        byName: {},
                    },
                },
                promptCount: 0,
            },
        },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const merge = (target, source) => {
        const output = { ...target };
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                const sourceValue = source[key];
                const targetValue = output[key];
                if (
                // We only want to recursivlty merge plain objects
                Object.prototype.toString.call(sourceValue) === '[object Object]' &&
                    Object.prototype.toString.call(targetValue) === '[object Object]') {
                    output[key] = merge(targetValue, sourceValue);
                }
                else {
                    // If not, we do a direct assignment. This preserves Date objects and others.
                    output[key] = sourceValue;
                }
            }
        }
        return output;
    };
    return merge(defaultMocks, overrides);
};
//# sourceMappingURL=mockCommandContext.js.map