import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render } from 'ink-testing-library';
import { ToolMessage } from './ToolMessage.js';
import { StreamingState, ToolCallStatus } from '../../types.js';
import { Text } from 'ink';
import { StreamingContext } from '../../contexts/StreamingContext.js';
import { SettingsContext } from '../../contexts/SettingsContext.js';
import { CompactModeProvider } from '../../contexts/CompactModeContext.js';
vi.mock('../TerminalOutput.js', () => ({
    TerminalOutput: function MockTerminalOutput({ cursor, }) {
        return (_jsxs(Text, { children: ["MockCursor:(", cursor?.x, ",", cursor?.y, ")"] }));
    },
}));
vi.mock('../AnsiOutput.js', () => ({
    AnsiOutputText: function MockAnsiOutputText({ data, maxWidth, availableTerminalHeight, }) {
        // Simple serialization for snapshot stability
        const serialized = data
            .map((line) => line.map((token) => token.text || '').join(''))
            .join('\n');
        return (_jsxs(Text, { children: ["MockAnsiOutput:", serialized, ":width=", maxWidth, ":height=", availableTerminalHeight ?? 'undef'] }));
    },
    ShellStatsBar: function MockShellStatsBar({ displayHeight, }) {
        return (_jsxs(Text, { children: ["MockShellStatsBar:displayHeight=", displayHeight ?? 'undef'] }));
    },
}));
// Mock child components or utilities if they are complex or have side effects
vi.mock('../GeminiRespondingSpinner.js', () => ({
    GeminiRespondingSpinner: ({ nonRespondingDisplay, }) => {
        const streamingState = React.useContext(StreamingContext);
        if (streamingState === StreamingState.Responding) {
            return _jsx(Text, { children: "MockRespondingSpinner" });
        }
        return nonRespondingDisplay ? _jsx(Text, { children: nonRespondingDisplay }) : null;
    },
}));
vi.mock('./DiffRenderer.js', () => ({
    DiffRenderer: function MockDiffRenderer({ diffContent, settings, }) {
        return (_jsxs(Text, { children: ["MockDiff:", diffContent, settings ? ':withSettings' : ''] }));
    },
}));
vi.mock('../../utils/MarkdownDisplay.js', () => ({
    MarkdownDisplay: function MockMarkdownDisplay({ text }) {
        return _jsxs(Text, { children: ["MockMarkdown:", text] });
    },
}));
vi.mock('./ToolConfirmationMessage.js', () => ({
    ToolConfirmationMessage: function MockToolConfirmationMessage() {
        // Sentinel string lets the focus-routed approval tests assert
        // the banner renders (instead of being suppressed).
        return _jsx(Text, { children: "MockApprovalPrompt" });
    },
}));
// Mock settings
const mockSettings = {
    merged: {
        ui: {
            showLineNumbers: true,
        },
    },
};
// Helper to render with context (compactMode=false by default to show tool output)
const renderWithContext = (ui, streamingState, compactMode = false) => {
    const contextValue = streamingState;
    return render(_jsx(CompactModeProvider, { value: { compactMode }, children: _jsx(SettingsContext.Provider, { value: mockSettings, children: _jsx(StreamingContext.Provider, { value: contextValue, children: ui }) }) }));
};
describe('<ToolMessage />', () => {
    const mockConfig = {};
    const baseProps = {
        callId: 'tool-123',
        name: 'test-tool',
        description: 'A tool for testing',
        resultDisplay: 'Test result',
        status: ToolCallStatus.Success,
        contentWidth: 80,
        confirmationDetails: undefined,
        emphasis: 'medium',
        config: mockConfig,
    };
    it('renders basic tool information', () => {
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps }), StreamingState.Idle);
        const output = lastFrame();
        expect(output).toContain('✓'); // Success indicator
        expect(output).toContain('test-tool');
        expect(output).toContain('A tool for testing');
        expect(output).toContain('MockMarkdown:Test result');
    });
    it('hides result output in compact mode (compactMode=true)', () => {
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps }), StreamingState.Idle, true);
        const output = lastFrame();
        expect(output).toContain('✓'); // status indicator still visible
        expect(output).toContain('test-tool'); // tool name still visible
        expect(output).not.toContain('MockMarkdown:Test result'); // result hidden
    });
    describe('ToolStatusIndicator rendering', () => {
        it('shows ✓ for Success status', () => {
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, status: ToolCallStatus.Success }), StreamingState.Idle);
            expect(lastFrame()).toContain('✓');
        });
        it('shows o for Pending status', () => {
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, status: ToolCallStatus.Pending }), StreamingState.Idle);
            expect(lastFrame()).toContain('o');
        });
        it('shows ? for Confirming status', () => {
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, status: ToolCallStatus.Confirming }), StreamingState.Idle);
            expect(lastFrame()).toContain('?');
        });
        it('shows - for Canceled status', () => {
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, status: ToolCallStatus.Canceled }), StreamingState.Idle);
            expect(lastFrame()).toContain('-');
        });
        it('shows x for Error status', () => {
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, status: ToolCallStatus.Error }), StreamingState.Idle);
            expect(lastFrame()).toContain('x');
        });
        it('shows paused spinner for Executing status when streamingState is Idle', () => {
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, status: ToolCallStatus.Executing }), StreamingState.Idle);
            expect(lastFrame()).toContain('⊷');
            expect(lastFrame()).not.toContain('MockRespondingSpinner');
            expect(lastFrame()).not.toContain('✓');
        });
        it('shows paused spinner for Executing status when streamingState is WaitingForConfirmation', () => {
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, status: ToolCallStatus.Executing }), StreamingState.WaitingForConfirmation);
            expect(lastFrame()).toContain('⊷');
            expect(lastFrame()).not.toContain('MockRespondingSpinner');
            expect(lastFrame()).not.toContain('✓');
        });
        it('shows MockRespondingSpinner for Executing status when streamingState is Responding', () => {
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, status: ToolCallStatus.Executing }), StreamingState.Responding);
            expect(lastFrame()).toContain('MockRespondingSpinner');
            expect(lastFrame()).not.toContain('✓');
        });
    });
    it('renders DiffRenderer for diff results', () => {
        const diffResult = {
            fileDiff: '--- a/file.txt\n+++ b/file.txt\n@@ -1 +1 @@\n-old\n+new',
            fileName: 'file.txt',
            originalContent: 'old',
            newContent: 'new',
        };
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, resultDisplay: diffResult }), StreamingState.Idle);
        // Check that the output contains the MockDiff content as part of the whole message
        expect(lastFrame()).toMatch(/MockDiff:--- a\/file\.txt/);
    });
    it('renders a saved-session preview notice for truncated diff results', () => {
        const diffResult = {
            fileDiff: '--- file.txt\n+++ file.txt\n@@ -1 +1 @@\n-omitted\n+preview',
            fileName: 'file.txt',
            originalContent: 'old preview',
            newContent: 'new preview',
            truncatedForSession: true,
            fileDiffLength: 123456,
            fileDiffTruncated: true,
        };
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, resultDisplay: diffResult }), StreamingState.Idle);
        expect(lastFrame()).toContain('Saved session preview only; full diff omitted from JSONL (123456 chars).');
        expect(lastFrame()).toContain('MockDiff:--- file.txt');
    });
    it('renders emphasis correctly', () => {
        const { lastFrame: highEmphasisFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, emphasis: "high" }), StreamingState.Idle);
        // Check for trailing indicator or specific color if applicable (Colors are not easily testable here)
        expect(highEmphasisFrame()).toContain('←'); // Trailing indicator for high emphasis
        const { lastFrame: lowEmphasisFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, emphasis: "low" }), StreamingState.Idle);
        // For low emphasis, the name and description might be dimmed (check for dimColor if possible)
        // This is harder to assert directly in text output without color checks.
        // We can at least ensure it doesn't have the high emphasis indicator.
        expect(lowEmphasisFrame()).not.toContain('←');
    });
    describe('subagent inline rendering (approval-only surface)', () => {
        // The verbose inline AgentExecutionDisplay frame has been retired in
        // favour of the always-on LiveAgentPanel (live progress) and
        // BackgroundTasksDialog (history / detail). ToolMessage's only
        // remaining inline subagent surface is the focus-routed approval
        // prompt — both running and committed agent states render nothing
        // inline now.
        const buildProps = (overrides) => {
            const resultDisplay = {
                type: 'task_execution',
                ...overrides.data,
            };
            return {
                ...baseProps,
                name: 'task',
                description: 'Delegate task to subagent',
                resultDisplay,
                status: ToolCallStatus.Executing,
                callId: 'gated-task-call',
                forceShowResult: true, // mirror ToolGroupMessage's forceShowResult
                isFocused: overrides.isFocused,
                isPending: overrides.isPending,
            };
        };
        it('running subagent without confirmation → no inline frame', () => {
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...buildProps({
                    data: {
                        subagentName: 'fg-agent',
                        taskDescription: 'Search for files',
                        taskPrompt: 'Search',
                        status: 'running',
                    },
                }) }), StreamingState.Responding);
            const output = lastFrame() ?? '';
            // No approval surface; LiveAgentPanel + dialog handle the run.
            expect(output).not.toContain('MockApprovalPrompt');
            expect(output).not.toContain('Approval requested by');
            expect(output).not.toContain('Queued approval:');
        });
        it('committed (`!isPending`) terminal subagent → renders a one-line scrollback summary', () => {
            // The verbose 15-row inline frame is retired (it caused
            // scrollback flicker), but the conversation history needs to
            // keep a permanent record after the panel's 8s window expires
            // and the dialog closes. A single line preserves the history
            // without re-introducing the flicker.
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...buildProps({
                    data: {
                        subagentName: 'committed-agent',
                        taskDescription: 'Already done',
                        taskPrompt: 'Already done',
                        status: 'completed',
                    },
                    isPending: false,
                }) }), StreamingState.Idle);
            const output = lastFrame() ?? '';
            // One-line summary: success glyph + agent name + description.
            expect(output).toContain('✔');
            expect(output).toContain('committed-agent');
            expect(output).toContain('Already done');
            // No approval prompt — completed subagents don't sit on the
            // focus lock.
            expect(output).not.toContain('MockApprovalPrompt');
        });
        it('live (`isPending`) terminal subagent → renders summary inline (panel snapshot already dropped)', () => {
            // After `unregisterForeground`'s post-delete emit (#3921 swap-
            // order), the panel snapshot drops the foreground entry as soon
            // as the subagent finishes — even while the parent turn is
            // still in `pendingHistoryItems`. If the inline summary were
            // also gated on `!isPending`, a foreground subagent that
            // finishes mid-turn would simply disappear from screen until
            // commit. Render the summary in BOTH live and committed phases;
            // the live-phase filter in `ToolGroupMessage` already keeps
            // running entries from reaching this renderer.
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...buildProps({
                    data: {
                        subagentName: 'live-terminal',
                        taskDescription: 'Just finished mid-turn',
                        taskPrompt: 'Mid-turn',
                        status: 'completed',
                    },
                    isPending: true,
                }) }), StreamingState.Responding);
            const output = lastFrame() ?? '';
            expect(output).toContain('✔');
            expect(output).toContain('Just finished mid-turn');
        });
        it('failed subagent → renders summary with terminate reason', () => {
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...buildProps({
                    data: {
                        subagentName: 'failed-agent',
                        taskDescription: 'Crashed early',
                        taskPrompt: 'Crashed early',
                        status: 'failed',
                        terminateReason: 'Network timeout',
                    },
                }) }), StreamingState.Idle);
            const output = lastFrame() ?? '';
            expect(output).toContain('✖');
            expect(output).toContain('failed-agent');
            expect(output).toContain('Crashed early');
            expect(output).toContain('Network timeout');
        });
        it('pendingConfirmation && isFocused → renders banner with agent label', () => {
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...buildProps({
                    data: {
                        subagentName: 'fg-agent',
                        taskDescription: 'Search for files',
                        taskPrompt: 'Search',
                        status: 'running',
                        pendingConfirmation: {},
                    },
                    isFocused: true,
                }) }), StreamingState.Responding);
            const output = lastFrame() ?? '';
            expect(output).toContain('Approval requested by');
            expect(output).toContain('fg-agent');
            expect(output).toContain('MockApprovalPrompt');
        });
        it('pendingConfirmation && !isFocused → renders queued marker (one-line)', () => {
            // Without this marker, a subagent waiting on another subagent's
            // approval would be invisible in the main view — the user would
            // have no inline signal that an approval is queued and would have
            // to open the dialog to discover it.
            const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...buildProps({
                    data: {
                        subagentName: 'queued-agent',
                        taskDescription: 'Lint',
                        taskPrompt: 'Lint',
                        status: 'running',
                        pendingConfirmation: {},
                    },
                    isFocused: false,
                }) }), StreamingState.Responding);
            const output = lastFrame() ?? '';
            expect(output).toContain('Queued approval:');
            expect(output).toContain('queued-agent');
            expect(output).not.toContain('Approval requested by');
            expect(output).not.toContain('MockApprovalPrompt');
        });
    });
    it('renders AnsiOutputText for AnsiOutput results', () => {
        const ansiResult = [
            [
                {
                    text: 'hello',
                    fg: '#ffffff',
                    bg: '#000000',
                    bold: false,
                    italic: false,
                    underline: false,
                    dim: false,
                    inverse: false,
                },
            ],
        ];
        const ansiOutputDisplay = { ansiOutput: ansiResult };
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, resultDisplay: ansiOutputDisplay }), StreamingState.Idle);
        expect(lastFrame()).toContain('MockAnsiOutput:hello');
        expect(lastFrame()).toContain('width=');
    });
    it('caps shell ANSI output to default 5 lines when not forced', () => {
        const ansiOutputDisplay = {
            ansiOutput: [
                [
                    {
                        text: 'a',
                        fg: '',
                        bg: '',
                        bold: false,
                        italic: false,
                        underline: false,
                        dim: false,
                        inverse: false,
                    },
                ],
            ],
            totalLines: 50,
        };
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, name: "Shell", resultDisplay: ansiOutputDisplay, availableTerminalHeight: 100 }), StreamingState.Idle);
        const output = lastFrame();
        expect(output).toContain('height=5');
        expect(output).toContain('MockShellStatsBar:displayHeight=5');
    });
    it('does not cap non-shell ANSI output', () => {
        const ansiOutputDisplay = {
            ansiOutput: [
                [
                    {
                        text: 'a',
                        fg: '',
                        bg: '',
                        bold: false,
                        italic: false,
                        underline: false,
                        dim: false,
                        inverse: false,
                    },
                ],
            ],
            totalLines: 50,
        };
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, name: "some-other-tool", resultDisplay: ansiOutputDisplay, availableTerminalHeight: 100 }), StreamingState.Idle);
        const output = lastFrame();
        // availableHeight = 100 - STATIC_HEIGHT(1) - RESERVED_LINE_COUNT(5) = 94
        expect(output).toContain('height=94');
    });
    it('bypasses cap when forceShowResult is true', () => {
        const ansiOutputDisplay = {
            ansiOutput: [
                [
                    {
                        text: 'a',
                        fg: '',
                        bg: '',
                        bold: false,
                        italic: false,
                        underline: false,
                        dim: false,
                        inverse: false,
                    },
                ],
            ],
            totalLines: 50,
        };
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, name: "Shell", resultDisplay: ansiOutputDisplay, availableTerminalHeight: 100, forceShowResult: true }), StreamingState.Idle);
        const output = lastFrame();
        // availableHeight = 100 - STATIC_HEIGHT(1) - RESERVED_LINE_COUNT(5) = 94
        expect(output).toContain('height=94');
    });
    it('disables cap when ui.shellOutputMaxLines is 0', () => {
        const ansiOutputDisplay = {
            ansiOutput: [
                [
                    {
                        text: 'a',
                        fg: '',
                        bg: '',
                        bold: false,
                        italic: false,
                        underline: false,
                        dim: false,
                        inverse: false,
                    },
                ],
            ],
            totalLines: 50,
        };
        const settingsWithDisabledCap = {
            merged: { ui: { shellOutputMaxLines: 0 } },
        };
        const { lastFrame } = render(_jsx(CompactModeProvider, { value: { compactMode: false }, children: _jsx(SettingsContext.Provider, { value: settingsWithDisabledCap, children: _jsx(StreamingContext.Provider, { value: StreamingState.Idle, children: _jsx(ToolMessage, { ...baseProps, name: "Shell", resultDisplay: ansiOutputDisplay, availableTerminalHeight: 100 }) }) }) }));
        const output = lastFrame();
        expect(output).toContain('height=94');
    });
    it('respects user-configured cap value', () => {
        const ansiOutputDisplay = {
            ansiOutput: [
                [
                    {
                        text: 'a',
                        fg: '',
                        bg: '',
                        bold: false,
                        italic: false,
                        underline: false,
                        dim: false,
                        inverse: false,
                    },
                ],
            ],
            totalLines: 50,
        };
        const settingsWithCustomCap = {
            merged: { ui: { shellOutputMaxLines: 12 } },
        };
        const { lastFrame } = render(_jsx(CompactModeProvider, { value: { compactMode: false }, children: _jsx(SettingsContext.Provider, { value: settingsWithCustomCap, children: _jsx(StreamingContext.Provider, { value: StreamingState.Idle, children: _jsx(ToolMessage, { ...baseProps, name: "Shell", resultDisplay: ansiOutputDisplay, availableTerminalHeight: 100 }) }) }) }));
        const output = lastFrame();
        expect(output).toContain('height=12');
    });
    it('caps shell completed string output (returnDisplayMessage path)', () => {
        // shell.ts emits the final result as a plain string via
        // `returnDisplayMessage = result.output`, so the completed shell
        // tool flows through StringResultRenderer, not the ANSI branch.
        // The cap must still apply.
        const longString = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join('\n');
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, name: "Shell", resultDisplay: longString, status: ToolCallStatus.Success, availableTerminalHeight: 100 }), StreamingState.Idle);
        const output = lastFrame();
        // With cap=5, the string path should show the last 5 content rows
        // (the +1 height compensates for MaxSizedBox's overflow banner row,
        // matching the ANSI path's 5 content rows + stats bar).
        expect(output).not.toContain('line 1\n');
        expect(output).not.toContain('line 10');
        expect(output).toContain('line 26');
        expect(output).toContain('line 27');
        expect(output).toContain('line 28');
        expect(output).toContain('line 29');
        expect(output).toContain('line 30');
    });
    it('pre-slices large non-shell string output before MaxSizedBox layout', () => {
        const longString = Array.from({ length: 5000 }, (_, i) => `line ${i + 1}`).join('\n');
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, name: "some-other-tool", resultDisplay: longString, status: ToolCallStatus.Success, availableTerminalHeight: 12 }), StreamingState.Idle);
        const output = lastFrame();
        expect(output).toContain('... first 4995 lines hidden ...');
        expect(output).not.toContain('line 4995');
        expect(output).toContain('line 4996');
        expect(output).toContain('line 4997');
        expect(output).toContain('line 4998');
        expect(output).toContain('line 4999');
        expect(output).toContain('line 5000');
    });
    it('pre-slices single-line output by visual width before MaxSizedBox layout', () => {
        const longSingleLine = Array.from({ length: 1000 }, (_, i) => String(i % 10)).join('');
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, name: "some-other-tool", contentWidth: 20, resultDisplay: longSingleLine, status: ToolCallStatus.Success, availableTerminalHeight: 12 }), StreamingState.Idle);
        const output = lastFrame();
        expect(output).toMatch(/\.\.\. first \d+ lin/);
        expect(output).not.toContain(longSingleLine);
        expect(output).toContain(longSingleLine.slice(-10));
    });
    it('does not pre-slice string output that exactly fits available height', () => {
        const exactFitString = Array.from({ length: 6 }, (_, i) => `line ${i + 1}`).join('\n');
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, name: "some-other-tool", resultDisplay: exactFitString, status: ToolCallStatus.Success, availableTerminalHeight: 12 }), StreamingState.Idle);
        const output = lastFrame();
        expect(output).not.toContain('lines hidden');
        expect(output).toContain('line 1');
        expect(output).toContain('line 6');
    });
    it.each([
        ['negative', -1],
        ['fractional', 1.5],
        ['NaN-via-string', 'abc'],
    ])('clamps %s shellOutputMaxLines to a safe value', (_label, badValue) => {
        const ansiOutputDisplay = {
            ansiOutput: [
                [
                    {
                        text: 'a',
                        fg: '',
                        bg: '',
                        bold: false,
                        italic: false,
                        underline: false,
                        dim: false,
                        inverse: false,
                    },
                ],
            ],
            totalLines: 50,
        };
        const settingsWithBadCap = {
            merged: { ui: { shellOutputMaxLines: badValue } },
        };
        const { lastFrame } = render(_jsx(CompactModeProvider, { value: { compactMode: false }, children: _jsx(SettingsContext.Provider, { value: settingsWithBadCap, children: _jsx(StreamingContext.Provider, { value: StreamingState.Idle, children: _jsx(ToolMessage, { ...baseProps, name: "Shell", resultDisplay: ansiOutputDisplay, availableTerminalHeight: 100 }) }) }) }));
        const output = lastFrame();
        // -1 → 0 → cap disabled (height=94)
        // 1.5 → 1 → cap to 1 (height=1)
        // 'abc' → NaN → 0 → cap disabled (height=94)
        if (typeof badValue === 'number' &&
            Number.isFinite(badValue) &&
            badValue > 0) {
            expect(output).toContain(`height=${Math.floor(badValue)}`);
        }
        else {
            expect(output).toContain('height=94');
        }
    });
    it('does not cap non-shell string output', () => {
        const longString = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join('\n');
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, name: "some-other-tool", resultDisplay: longString, status: ToolCallStatus.Success, availableTerminalHeight: 100 }), StreamingState.Idle);
        const output = lastFrame();
        // availableHeight = 94, well above 30 lines → all visible
        expect(output).toContain('line 1');
        expect(output).toContain('line 30');
    });
    it('renders rejected plan content with plan text still visible', () => {
        const planResultDisplay = {
            type: 'plan_summary',
            message: 'Plan was rejected. Remaining in plan mode.',
            plan: '# My Plan\n- Step 1: Do something\n- Step 2: Do another thing',
            rejected: true,
        };
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, name: "ExitPlanMode", description: "Plan:", status: ToolCallStatus.Canceled, resultDisplay: planResultDisplay }), StreamingState.Idle);
        const output = lastFrame();
        expect(output).toContain('Plan was rejected. Remaining in plan mode.');
        expect(output).toContain('MockMarkdown:# My Plan');
        expect(output).toContain('- Step 1: Do something');
        expect(output).toContain('- Step 2: Do another thing');
    });
    it('renders approved plan content with approval message', () => {
        const planResultDisplay = {
            type: 'plan_summary',
            message: 'User approved the plan.',
            plan: '# My Plan\n- Step 1\n- Step 2',
        };
        const { lastFrame } = renderWithContext(_jsx(ToolMessage, { ...baseProps, name: "ExitPlanMode", description: "Plan:", status: ToolCallStatus.Success, resultDisplay: planResultDisplay }), StreamingState.Idle);
        const output = lastFrame();
        expect(output).toContain('User approved the plan.');
        expect(output).toContain('MockMarkdown:# My Plan');
        expect(output).toContain('- Step 1');
        expect(output).toContain('- Step 2');
    });
});
//# sourceMappingURL=ToolMessage.test.js.map