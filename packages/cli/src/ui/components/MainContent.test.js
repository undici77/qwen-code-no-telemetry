import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { describe, expect, it, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { MainContent } from './MainContent.js';
import { UIStateContext } from '../contexts/UIStateContext.js';
import { UIActionsContext, } from '../contexts/UIActionsContext.js';
import { AppContext } from '../contexts/AppContext.js';
import { CompactModeProvider } from '../contexts/CompactModeContext.js';
import { OverflowProvider } from '../contexts/OverflowContext.js';
const staticPropsSpy = vi.fn();
const staticItemsSpy = vi.fn();
const historyItemDisplayPropsSpy = vi.fn();
const appHeaderSpy = vi.fn();
vi.mock('ink', async () => {
    const actual = await vi.importActual('ink');
    return {
        ...actual,
        Static: ({ children, items, ...props }) => {
            staticPropsSpy(props);
            staticItemsSpy(items);
            return _jsx(_Fragment, { children: items.map((item, index) => children(item, index)) });
        },
    };
});
vi.mock('./AppHeader.js', () => ({
    AppHeader: ({ version }) => {
        appHeaderSpy(version);
        return _jsx(Text, { children: `APP_HEADER:${version}` });
    },
}));
vi.mock('./HistoryItemDisplay.js', () => ({
    HistoryItemDisplay: (props) => {
        historyItemDisplayPropsSpy(props);
        return _jsx(Text, { children: `HISTORY:${props.item.id}` });
    },
}));
vi.mock('./ShowMoreLines.js', () => ({
    ShowMoreLines: () => _jsx(Text, { children: "SHOW_MORE" }),
}));
vi.mock('./Notifications.js', () => ({
    Notifications: () => _jsx(Text, { children: "NOTIFICATIONS" }),
}));
vi.mock('./DebugModeNotification.js', () => ({
    DebugModeNotification: () => _jsx(Text, { children: "DEBUG_NOTIFICATION" }),
}));
const createUIState = (overrides = {}) => ({
    history: [],
    historyManager: {},
    isThemeDialogOpen: false,
    themeError: null,
    auth: {
        authError: null,
        isAuthDialogOpen: false,
        isAuthenticating: false,
        pendingAuthType: undefined,
        externalAuthState: null,
        qwenAuthState: {
            deviceAuth: null,
            authStatus: 'idle',
            authMessage: null,
        },
    },
    isConfigInitialized: true,
    editorError: null,
    isEditorDialogOpen: false,
    debugMessage: '',
    quittingMessages: null,
    isSettingsDialogOpen: false,
    isStatusLineDialogOpen: false,
    isMemoryDialogOpen: false,
    isModelDialogOpen: false,
    isFastModelMode: false,
    isTrustDialogOpen: false,
    activeArenaDialog: null,
    isPermissionsDialogOpen: false,
    isApprovalModeDialogOpen: false,
    isResumeDialogOpen: false,
    resumeMatchedSessions: undefined,
    isDeleteDialogOpen: false,
    slashCommands: [],
    pendingSlashCommandHistoryItems: [],
    commandContext: {},
    shellConfirmationRequest: null,
    confirmationRequest: null,
    confirmUpdateExtensionRequests: [],
    providerUpdateRequest: undefined,
    settingInputRequests: [],
    pluginChoiceRequests: [],
    loopDetectionConfirmationRequest: null,
    geminiMdFileCount: 0,
    streamingState: {},
    initError: null,
    pendingGeminiHistoryItems: [],
    thought: null,
    shellModeActive: false,
    userMessages: [],
    buffer: {},
    inputWidth: 80,
    suggestionsWidth: 80,
    isInputActive: true,
    shouldShowIdePrompt: false,
    shouldShowCommandMigrationNudge: false,
    commandMigrationTomlFiles: [],
    isFolderTrustDialogOpen: false,
    isTrustedFolder: true,
    constrainHeight: false,
    ideContextState: undefined,
    showToolDescriptions: false,
    ctrlCPressedOnce: false,
    ctrlDPressedOnce: false,
    showEscapePrompt: false,
    elapsedTime: 0,
    currentLoadingPhrase: '',
    historyRemountKey: 1,
    messageQueue: [],
    showAutoAcceptIndicator: {},
    currentModel: 'gpt-5.5',
    contextFileNames: [],
    availableTerminalHeight: undefined,
    mainAreaWidth: 100,
    staticAreaMaxItemHeight: 100,
    staticExtraHeight: 0,
    dialogsVisible: false,
    pendingHistoryItems: [],
    stickyTodos: null,
    btwItem: null,
    setBtwItem: vi.fn(),
    cancelBtw: vi.fn(),
    nightly: false,
    branchName: 'main',
    sessionStats: { lastPromptTokenCount: 0 },
    terminalWidth: 120,
    terminalHeight: 40,
    mainControlsRef: { current: null },
    currentIDE: null,
    updateInfo: null,
    showIdeRestartPrompt: false,
    ideTrustRestartReason: {},
    isRestarting: false,
    extensionsUpdateState: new Map(),
    activePtyId: undefined,
    embeddedShellFocused: false,
    showWelcomeBackDialog: false,
    welcomeBackInfo: null,
    welcomeBackChoice: null,
    isSubagentCreateDialogOpen: false,
    isAgentsManagerDialogOpen: false,
    isExtensionsManagerDialogOpen: false,
    isMcpDialogOpen: false,
    isHooksDialogOpen: false,
    isFeedbackDialogOpen: false,
    taskStartTokens: 0,
    streamingResponseLengthRef: { current: 0 },
    isReceivingContent: false,
    sessionName: null,
    setSessionName: vi.fn(),
    promptSuggestion: null,
    dismissPromptSuggestion: vi.fn(),
    isRewindSelectorOpen: false,
    rewindEscPending: false,
    ...overrides,
});
const createUIActions = () => ({
    refreshStatic: vi.fn(),
});
const renderMainContent = (uiState) => render(_jsx(AppContext.Provider, { value: { version: '1.2.3', startupWarnings: [] }, children: _jsx(CompactModeProvider, { value: { compactMode: false }, children: _jsx(UIActionsContext.Provider, { value: createUIActions(), children: _jsx(UIStateContext.Provider, { value: uiState, children: _jsx(OverflowProvider, { children: _jsx(MainContent, {}) }) }) }) }) }));
describe('<MainContent />', () => {
    it('renders AppHeader inside Static at the top of the static content', () => {
        staticPropsSpy.mockClear();
        staticItemsSpy.mockClear();
        historyItemDisplayPropsSpy.mockClear();
        appHeaderSpy.mockClear();
        const { lastFrame, rerender } = renderMainContent(createUIState({ currentModel: 'gpt-5.5', historyRemountKey: 7 }));
        expect(lastFrame()).toContain('APP_HEADER:1.2.3');
        expect(lastFrame()).toContain('DEBUG_NOTIFICATION');
        expect(lastFrame()).toContain('NOTIFICATIONS');
        expect(staticPropsSpy).toHaveBeenCalled();
        expect(staticItemsSpy).toHaveBeenLastCalledWith(expect.arrayContaining([
            expect.objectContaining({ key: 'app-header' }),
            expect.objectContaining({ key: 'debug-notification' }),
            expect.objectContaining({ key: 'notifications' }),
        ]));
        expect(staticItemsSpy.mock.calls.at(-1)?.[0]).toHaveLength(3);
        expect(appHeaderSpy).toHaveBeenCalledTimes(1);
        rerender(_jsx(AppContext.Provider, { value: { version: '1.2.3', startupWarnings: [] }, children: _jsx(CompactModeProvider, { value: { compactMode: false }, children: _jsx(UIActionsContext.Provider, { value: createUIActions(), children: _jsx(UIStateContext.Provider, { value: createUIState({
                            currentModel: 'gpt-5.4',
                            historyRemountKey: 7,
                        }), children: _jsx(OverflowProvider, { children: _jsx(MainContent, {}) }) }) }) }) }));
        expect(staticItemsSpy.mock.calls.at(-1)?.[0]).toHaveLength(3);
        expect(appHeaderSpy).toHaveBeenCalledTimes(2);
    });
    it('continues source copy numbering from static history into pending chunks', () => {
        historyItemDisplayPropsSpy.mockClear();
        renderMainContent(createUIState({
            history: [
                {
                    id: 1,
                    type: 'gemini_content',
                    text: [
                        '```mermaid',
                        'flowchart TD',
                        '  A --> B',
                        '```',
                        '$$',
                        '\\alpha',
                        '$$',
                    ].join('\n'),
                },
            ],
            pendingHistoryItems: [
                {
                    type: 'gemini_content',
                    text: [
                        '```mermaid',
                        'sequenceDiagram',
                        '  A->>B: hi',
                        '```',
                        '$$',
                        '\\beta',
                        '$$',
                    ].join('\n'),
                },
            ],
        }));
        const pendingProps = historyItemDisplayPropsSpy.mock.calls
            .map((call) => call[0])
            .find((props) => props.isPending);
        expect(pendingProps?.sourceCopyIndexOffsets).toMatchObject({
            mathBlockCount: 1,
        });
        expect(pendingProps?.sourceCopyIndexOffsets?.codeBlockLanguageCounts.get('mermaid')).toBe(1);
    });
    it('passes the full history to Static in one render when below the progressive replay threshold', () => {
        staticItemsSpy.mockClear();
        const history = Array.from({ length: 50 }, (_, i) => ({
            type: 'user',
            id: i,
            text: `msg ${i}`,
        }));
        renderMainContent(createUIState({ history }));
        // 3 prefix items (header / debug / notifications) + 50 history items
        expect(staticItemsSpy.mock.calls.at(-1)?.[0]).toHaveLength(53);
    });
    it('progressively replays Static items when history exceeds the threshold (issue #3899)', async () => {
        staticItemsSpy.mockClear();
        const history = Array.from({ length: 200 }, (_, i) => ({
            type: 'user',
            id: i,
            text: `msg ${i}`,
        }));
        renderMainContent(createUIState({ history }));
        const lengthAtLastCall = () => staticItemsSpy.mock.calls.at(-1)?.[0].length ?? 0;
        // Initial render: only the first chunk (50) plus the 3 prefix items
        // should be in Static — long history must not block the input thread.
        const TOTAL = 203; // 200 history + 3 prefix items
        expect(lengthAtLastCall()).toBe(53);
        expect(lengthAtLastCall()).toBeLessThan(TOTAL);
        // Drain setImmediate ticks. Each iteration must not regress the visible
        // count (monotonic) and we must reach TOTAL inside the loop budget — a
        // silent regression that stops advancing will fail the final assert
        // rather than spuriously time out.
        let prev = lengthAtLastCall();
        for (let i = 0; i < 50; i++) {
            await new Promise((resolve) => setImmediate(resolve));
            const curr = lengthAtLastCall();
            expect(curr).toBeGreaterThanOrEqual(prev); // never shrinks mid-replay
            prev = curr;
            if (curr === TOTAL)
                break;
        }
        // After catch-up the full history must be present.
        expect(lengthAtLastCall()).toBe(TOTAL);
    });
    it('renders newly finalized item without a disappear frame when gap is within CHUNK_SIZE (issue #3899)', () => {
        // Regression: when a pending item finalizes, it is removed from
        // pendingHistoryItems immediately. If replayCount still lags behind
        // mergedHistory.length by ≤ PROGRESSIVE_REPLAY_CHUNK_SIZE, the item
        // would be absent from BOTH areas for one render frame. The gap-based
        // condition must render the full list synchronously in that case.
        //
        // Setup: 100 items = exactly the replay threshold, so initialReplayCount
        // returns 100 (fully shown, no chunking). The component state is stable
        // at replayCount=100 with no pending effects.
        staticItemsSpy.mockClear();
        const history = Array.from({ length: 100 }, (_, i) => ({
            type: 'user',
            id: i,
            text: `msg ${i}`,
        }));
        const { rerender } = renderMainContent(createUIState({ history, historyRemountKey: 1 }));
        // All 100 + 3 prefix items rendered immediately (below/at threshold).
        expect(staticItemsSpy.mock.calls.at(-1)?.[0]).toHaveLength(103);
        // Simulate a pending item finalizing: history grows by 1, same remount key.
        // replayCount is 100; new length is 101; gap = 1 ≤ PROGRESSIVE_REPLAY_CHUNK_SIZE (50).
        staticItemsSpy.mockClear();
        rerender(_jsx(AppContext.Provider, { value: { version: '1.2.3', startupWarnings: [] }, children: _jsx(CompactModeProvider, { value: { compactMode: false }, children: _jsx(UIActionsContext.Provider, { value: createUIActions(), children: _jsx(UIStateContext.Provider, { value: createUIState({
                            history: [
                                ...history,
                                { type: 'user', id: 100, text: 'new msg' },
                            ],
                            historyRemountKey: 1,
                        }), children: _jsx(OverflowProvider, { children: _jsx(MainContent, {}) }) }) }) }) }));
        // The first render after the append must show all 104 items — no frame
        // where the 101st item disappears (which would register as 103 here).
        expect(staticItemsSpy.mock.calls[0]?.[0]).toHaveLength(104);
    });
    it('synchronously resets to the first chunk on historyRemountKey change after a full catch-up (Ctrl+O regression, issue #3899)', async () => {
        // Wenshao's review: with the previous useEffect-based reset, the FIRST
        // render after a Ctrl+O-induced historyRemountKey bump would still feed
        // <Static> the full (pre-reset) replayCount, causing the synchronous
        // remount blocking the input thread that the PR is trying to fix. This
        // test pins the synchronous-reset behavior.
        staticItemsSpy.mockClear();
        const history = Array.from({ length: 200 }, (_, i) => ({
            type: 'user',
            id: i,
            text: `msg ${i}`,
        }));
        const TOTAL = 203;
        const { rerender } = renderMainContent(createUIState({ history, historyRemountKey: 1 }));
        // Drive the chunked replay to completion.
        for (let i = 0; i < 50; i++) {
            const len = staticItemsSpy.mock.calls.at(-1)?.[0].length ?? 0;
            if (len === TOTAL)
                break;
            await new Promise((resolve) => setImmediate(resolve));
        }
        expect(staticItemsSpy.mock.calls.at(-1)?.[0]).toHaveLength(TOTAL);
        // Re-render with a bumped key — analogous to refreshStatic() firing.
        // The very next render must immediately drop back to the first chunk;
        // if reset were deferred to useEffect, <Static> would receive 203 items
        // first and Ink would do the synchronous full-history layout the PR is
        // meant to avoid.
        rerender(_jsx(AppContext.Provider, { value: { version: '1.2.3', startupWarnings: [] }, children: _jsx(CompactModeProvider, { value: { compactMode: false }, children: _jsx(UIActionsContext.Provider, { value: createUIActions(), children: _jsx(UIStateContext.Provider, { value: createUIState({ history, historyRemountKey: 2 }), children: _jsx(OverflowProvider, { children: _jsx(MainContent, {}) }) }) }) }) }));
        expect(staticItemsSpy.mock.calls.at(-1)?.[0]).toHaveLength(53);
    });
    it('does NOT reset progressive replay when only currentModel changes (PR #4119 regression guard)', async () => {
        // Wenshao's review on PR #4119: if AppContainer splits the model-change
        // wiring into two separate effects (setCurrentModel first, refreshStatic
        // -> historyRemountKey bump second), there is a render where currentModel
        // is new but historyRemountKey is still the old value. <Static>'s key is
        // `${historyRemountKey}-${currentModel}`, so the key changes (Ink remounts
        // Static), but the render-phase reset (lastRemountKey !== historyRemountKey)
        // does NOT fire — so the new <Static> is mounted with the full pre-catch-up
        // replayCount, and Ink does the synchronous full-history layout the PR is
        // meant to avoid.
        //
        // This test reproduces only the dangerous half of that interleaving:
        // currentModel flips while historyRemountKey is held constant. Under the
        // correct (single-batch) AppContainer wiring this combination never
        // appears in practice, but the test pins the MainContent invariant —
        // currentModel alone must not trigger progressive-replay reset, which
        // makes any future "two-effect" regression visible here as a freeze.
        staticItemsSpy.mockClear();
        const history = Array.from({ length: 200 }, (_, i) => ({
            type: 'user',
            id: i,
            text: `msg ${i}`,
        }));
        const TOTAL = 203;
        const { rerender } = renderMainContent(createUIState({
            history,
            historyRemountKey: 1,
            currentModel: 'model-a',
        }));
        // Drive the chunked replay to completion (replayCount === TOTAL).
        for (let i = 0; i < 50; i++) {
            const len = staticItemsSpy.mock.calls.at(-1)?.[0].length ?? 0;
            if (len === TOTAL)
                break;
            await new Promise((resolve) => setImmediate(resolve));
        }
        expect(staticItemsSpy.mock.calls.at(-1)?.[0]).toHaveLength(TOTAL);
        // Re-render with a NEW currentModel but the SAME historyRemountKey.
        // <Static>'s key will change (Ink remounts), but replayCount must stay
        // at TOTAL — i.e. progressive replay must NOT re-trigger. Any future
        // refactor that re-introduces a one-render gap between setCurrentModel
        // and the historyRemountKey bump will trip this assertion the moment
        // someone correctly drives the reset off the model dimension instead.
        rerender(_jsx(AppContext.Provider, { value: { version: '1.2.3', startupWarnings: [] }, children: _jsx(CompactModeProvider, { value: { compactMode: false }, children: _jsx(UIActionsContext.Provider, { value: createUIActions(), children: _jsx(UIStateContext.Provider, { value: createUIState({
                            history,
                            historyRemountKey: 1,
                            currentModel: 'model-b',
                        }), children: _jsx(OverflowProvider, { children: _jsx(MainContent, {}) }) }) }) }) }));
        // No reset means the LAST staticItemsSpy call still received TOTAL.
        expect(staticItemsSpy.mock.calls.at(-1)?.[0]).toHaveLength(TOTAL);
    });
});
//# sourceMappingURL=MainContent.test.js.map