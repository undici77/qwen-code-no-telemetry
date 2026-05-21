import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from 'ink-testing-library';
import { describe, it, expect, vi } from 'vitest';
import { SessionSummaryDisplay } from './SessionSummaryDisplay.js';
import * as SessionContext from '../contexts/SessionContext.js';
import { MAIN_SOURCE } from '@qwen-code/qwen-code-core';
import { ConfigContext } from '../contexts/ConfigContext.js';
const mainOnly = (core) => ({
    ...core,
    bySource: { [MAIN_SOURCE]: core },
});
vi.mock('../contexts/SessionContext.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useSessionStats: vi.fn(),
    };
});
const useSessionStatsMock = vi.mocked(SessionContext.useSessionStats);
const renderWithMockedStats = (metrics, sessionId = 'test-session-id-12345', promptCount = 5, chatRecordingEnabled = true) => {
    useSessionStatsMock.mockReturnValue({
        stats: {
            sessionId,
            sessionStartTime: new Date(),
            metrics,
            lastPromptTokenCount: 0,
            promptCount,
        },
        getPromptCount: () => promptCount,
        startNewPrompt: vi.fn(),
    });
    const mockConfig = {
        getChatRecordingService: vi.fn(() => chatRecordingEnabled ? {} : undefined),
    };
    return render(_jsx(ConfigContext.Provider, { value: mockConfig, children: _jsx(SessionSummaryDisplay, { duration: "1h 23m 45s" }) }));
};
describe('<SessionSummaryDisplay />', () => {
    it('renders the summary display with a title', () => {
        const metrics = {
            models: {
                'gemini-2.5-pro': mainOnly({
                    api: { totalRequests: 10, totalErrors: 1, totalLatencyMs: 50234 },
                    tokens: {
                        prompt: 1000,
                        candidates: 2000,
                        total: 3500,
                        cached: 500,
                        thoughts: 300,
                    },
                }),
            },
            tools: {
                totalCalls: 0,
                totalSuccess: 0,
                totalFail: 0,
                totalDurationMs: 0,
                totalDecisions: { accept: 0, reject: 0, modify: 0 },
                byName: {},
            },
            files: {
                totalLinesAdded: 42,
                totalLinesRemoved: 15,
            },
        };
        const { lastFrame } = renderWithMockedStats(metrics);
        const output = lastFrame();
        expect(output).toContain('Agent powering down. Goodbye!');
        expect(output).toContain('To continue this session, run');
        expect(output).toContain('qwen --resume test-session-id-12345');
        expect(output).toMatchSnapshot();
    });
    it('does not show resume message when there are no messages', () => {
        const metrics = {
            models: {},
            tools: {
                totalCalls: 0,
                totalSuccess: 0,
                totalFail: 0,
                totalDurationMs: 0,
                totalDecisions: { accept: 0, reject: 0, modify: 0 },
                byName: {},
            },
            files: {
                totalLinesAdded: 0,
                totalLinesRemoved: 0,
            },
        };
        // Pass promptCount = 0 to simulate no messages
        const { lastFrame } = renderWithMockedStats(metrics, 'test-session-id-12345', 0);
        const output = lastFrame();
        expect(output).toContain('Agent powering down. Goodbye!');
        expect(output).not.toContain('To continue this session, run');
        expect(output).not.toContain('qwen --resume');
    });
    it('does not show resume message when chat recording is disabled', () => {
        const metrics = {
            models: {},
            tools: {
                totalCalls: 0,
                totalSuccess: 0,
                totalFail: 0,
                totalDurationMs: 0,
                totalDecisions: { accept: 0, reject: 0, modify: 0 },
                byName: {},
            },
            files: {
                totalLinesAdded: 0,
                totalLinesRemoved: 0,
            },
        };
        const { lastFrame } = renderWithMockedStats(metrics, 'test-session-id-12345', 5, false);
        const output = lastFrame();
        expect(output).toContain('Agent powering down. Goodbye!');
        expect(output).not.toContain('To continue this session, run');
        expect(output).not.toContain('qwen --resume');
    });
});
//# sourceMappingURL=SessionSummaryDisplay.test.js.map