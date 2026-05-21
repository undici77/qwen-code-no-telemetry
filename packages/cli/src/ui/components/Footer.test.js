import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from 'ink-testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Footer } from './Footer.js';
import * as useTerminalSize from '../hooks/useTerminalSize.js';
import * as useStatusLineModule from '../hooks/useStatusLine.js';
import { UIStateContext } from '../contexts/UIStateContext.js';
import { ConfigContext } from '../contexts/ConfigContext.js';
import { VimModeProvider } from '../contexts/VimModeContext.js';
import { SettingsContext } from '../contexts/SettingsContext.js';
import { KeypressProvider } from '../contexts/KeypressContext.js';
vi.mock('../hooks/useTerminalSize.js');
const useTerminalSizeMock = vi.mocked(useTerminalSize.useTerminalSize);
vi.mock('../hooks/useStatusLine.js');
const useStatusLineMock = vi.mocked(useStatusLineModule.useStatusLine);
vi.mock('@qwen-code/qwen-code-core', async (importOriginal) => {
    const actual = await importOriginal();
    const registry = {
        list: vi.fn(() => []),
        subscribe: vi.fn(() => () => { }),
    };
    return {
        ...actual,
        getManagedAutoMemoryDreamTaskRegistry: vi.fn(() => registry),
    };
});
const defaultProps = {
    model: 'gemini-pro',
};
const createMockMemoryManager = () => ({
    subscribe: vi.fn(() => () => { }),
    listTasksByType: vi.fn(() => []),
});
const createMockConfig = (overrides = {}) => ({
    getModel: vi.fn(() => defaultProps.model),
    getDebugMode: vi.fn(() => false),
    getContentGeneratorConfig: vi.fn(() => ({ contextWindowSize: 131072 })),
    getMcpServers: vi.fn(() => ({})),
    getBlockedMcpServers: vi.fn(() => []),
    getProjectRoot: vi.fn(() => '/test/project'),
    getSessionId: vi.fn(() => 'test-session'),
    getMemoryManager: vi.fn(createMockMemoryManager),
    ...overrides,
});
const createMockUIState = (overrides = {}) => ({
    sessionStats: {
        lastPromptTokenCount: 100,
        sessionId: 'test-session',
        metrics: {
            models: {},
            tools: {
                totalCalls: 0,
                totalSuccess: 0,
                totalFail: 0,
                totalDurationMs: 0,
                totalDecisions: { accept: 0, reject: 0, modify: 0, auto_accept: 0 },
                byName: {},
            },
            files: { totalLinesAdded: 0, totalLinesRemoved: 0 },
        },
    },
    currentModel: 'gemini-pro',
    branchName: undefined,
    geminiMdFileCount: 0,
    contextFileNames: [],
    showToolDescriptions: false,
    ideContextState: undefined,
    isConfigInitialized: true,
    ...overrides,
});
const createMockSettings = () => ({
    merged: {
        general: {
            vimMode: false,
        },
    },
});
const renderWithWidth = (width, uiState) => {
    useTerminalSizeMock.mockReturnValue({ columns: width, rows: 24 });
    const mockSettings = createMockSettings();
    return render(_jsx(SettingsContext.Provider, { value: mockSettings, children: _jsx(ConfigContext.Provider, { value: createMockConfig(), children: _jsx(KeypressProvider, { kittyProtocolEnabled: false, children: _jsx(VimModeProvider, { settings: mockSettings, children: _jsx(UIStateContext.Provider, { value: uiState, children: _jsx(Footer, {}) }) }) }) }) }));
};
describe('<Footer />', () => {
    beforeEach(() => {
        useStatusLineMock.mockReturnValue({ lines: [] });
    });
    it('renders the component', () => {
        const { lastFrame } = renderWithWidth(120, createMockUIState());
        expect(lastFrame()).toBeDefined();
    });
    it('does not display the working directory or branch name', () => {
        const { lastFrame } = renderWithWidth(120, createMockUIState());
        expect(lastFrame()).not.toMatch(/\(.*\*\)/);
    });
    it('displays the context percentage', () => {
        const { lastFrame } = renderWithWidth(120, createMockUIState());
        expect(lastFrame()).toMatch(/\d+(\.\d+)?% context used/);
    });
    it('displays the abbreviated context percentage on narrow terminal', () => {
        const { lastFrame } = renderWithWidth(99, createMockUIState());
        expect(lastFrame()).toMatch(/\d+%/);
    });
    describe('status line rendering', () => {
        it('renders multi-line status line output', () => {
            useStatusLineMock.mockReturnValue({
                lines: ['model-name (main) ctx:34%', '████░░░░ 34% context'],
            });
            const { lastFrame } = renderWithWidth(120, createMockUIState());
            const frame = lastFrame();
            expect(frame).toContain('model-name (main) ctx:34%');
            expect(frame).toContain('████░░░░ 34% context');
        });
        it('suppresses hint when status line is active', () => {
            useStatusLineMock.mockReturnValue({ lines: ['status info'] });
            const { lastFrame } = renderWithWidth(120, createMockUIState());
            expect(lastFrame()).not.toContain('? for shortcuts');
        });
    });
    describe('config init message', () => {
        it('shows init status in place of the hint while config is initializing', () => {
            const { lastFrame } = renderWithWidth(120, createMockUIState({ isConfigInitialized: false }));
            const frame = lastFrame();
            expect(frame).toContain('Initializing...');
            expect(frame).not.toContain('? for shortcuts');
        });
        it('falls back to the hint once config is initialized', () => {
            const { lastFrame } = renderWithWidth(120, createMockUIState({ isConfigInitialized: true }));
            const frame = lastFrame();
            expect(frame).not.toContain('Initializing...');
            expect(frame).toContain('? for shortcuts');
        });
        // Init progress is more useful than zero layout shift: we show it even
        // when a custom status line is active, accepting that the row shrinks
        // by one line once init completes. Still strictly better than the
        // original bug (a 2-row residual above the input in the default case).
        it('shows init status even when a custom status line is active', () => {
            useStatusLineMock.mockReturnValue({ lines: ['model-name ctx:34%'] });
            const { lastFrame } = renderWithWidth(120, createMockUIState({ isConfigInitialized: false }));
            const frame = lastFrame();
            expect(frame).toContain('model-name ctx:34%');
            expect(frame).toContain('Initializing...');
        });
    });
    describe('footer rendering (golden snapshots)', () => {
        it('renders complete footer on wide terminal', () => {
            const { lastFrame } = renderWithWidth(120, createMockUIState());
            expect(lastFrame()).toMatchSnapshot('complete-footer-wide');
        });
        it('renders complete footer on narrow terminal', () => {
            const { lastFrame } = renderWithWidth(79, createMockUIState());
            expect(lastFrame()).toMatchSnapshot('complete-footer-narrow');
        });
    });
});
//# sourceMappingURL=Footer.test.js.map