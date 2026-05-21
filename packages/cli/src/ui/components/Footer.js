import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { ContextUsageDisplay } from './ContextUsageDisplay.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { AutoAcceptIndicator } from './AutoAcceptIndicator.js';
import { ShellModeIndicator } from './ShellModeIndicator.js';
import { BackgroundTasksPill } from './background-view/BackgroundTasksPill.js';
import { MCPHealthPill } from './mcp/MCPHealthPill.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { useStatusLine } from '../hooks/useStatusLine.js';
import { useConfigInitMessage } from '../hooks/useConfigInitMessage.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { useVimMode } from '../contexts/VimModeContext.js';
import { ApprovalMode } from '@qwen-code/qwen-code-core';
import { GeminiSpinner } from './GeminiRespondingSpinner.js';
import { GoalPill, useFooterGoalState } from './GoalPill.js';
import { t } from '../../i18n/index.js';
export const Footer = () => {
    const uiState = useUIState();
    const config = useConfig();
    const settings = useSettings();
    const { vimEnabled, vimMode } = useVimMode();
    const { lines: statusLineLines, useThemeColors } = useStatusLine();
    const configInitMessage = useConfigInitMessage(uiState.isConfigInitialized);
    const { promptTokenCount, showAutoAcceptIndicator } = {
        promptTokenCount: uiState.sessionStats.lastPromptTokenCount,
        showAutoAcceptIndicator: uiState.showAutoAcceptIndicator,
    };
    const { columns: terminalWidth } = useTerminalSize();
    const isNarrow = isNarrowWidth(terminalWidth);
    // Determine sandbox info from environment
    const sandboxEnv = process.env['SANDBOX'];
    const sandboxInfo = sandboxEnv
        ? sandboxEnv === 'sandbox-exec'
            ? 'seatbelt'
            : sandboxEnv.startsWith('qwen-code')
                ? 'docker'
                : sandboxEnv
        : null;
    // Check if debug mode is enabled
    const debugMode = config.getDebugMode();
    const contextWindowSize = config.getContentGeneratorConfig()?.contextWindowSize;
    // Hide "? for shortcuts" when a custom status line is active (it already
    // occupies the footer, so the hint is redundant). Matches upstream behavior.
    const suppressHint = statusLineLines.length > 0;
    // MCP init progress lives in this row (not a standalone component above the
    // input) so the live area's height is constant in the default case, avoiding
    // the residual-blank-line artifact left behind when a separate block unmounts.
    // When a custom status line is active, the row shrinks by 1 on transition to
    // ready — a one-time, small regression preferred over hiding init progress.
    //
    // `configInitMessage` is placed ahead of `showAutoAcceptIndicator` so users
    // launched with YOLO / auto-accept-edits still see the ~1s startup progress;
    // the approval-mode indicator takes over as soon as init finishes.
    const leftBottomContent = uiState.ctrlCPressedOnce ? (_jsx(Text, { color: theme.status.warning, children: t('Press Ctrl+C again to exit.') })) : uiState.ctrlDPressedOnce ? (_jsx(Text, { color: theme.status.warning, children: t('Press Ctrl+D again to exit.') })) : uiState.showEscapePrompt ? (_jsx(Text, { color: theme.text.secondary, children: t('Press Esc again to clear.') })) : uiState.rewindEscPending ? (_jsx(Text, { color: theme.text.secondary, children: t('Press Esc again to rewind conversation.') })) : vimEnabled && vimMode === 'INSERT' ? (_jsx(Text, { color: theme.text.secondary, children: "-- INSERT --" })) : uiState.shellModeActive ? (_jsx(ShellModeIndicator, {})) : configInitMessage ? (_jsxs(Text, { color: theme.text.secondary, children: [_jsx(GeminiSpinner, {}), " ", configInitMessage] })) : showAutoAcceptIndicator !== undefined &&
        showAutoAcceptIndicator !== ApprovalMode.DEFAULT ? (_jsx(AutoAcceptIndicator, { approvalMode: showAutoAcceptIndicator })) : suppressHint ? null : (_jsx(Text, { color: theme.text.secondary, children: t('? for shortcuts') }));
    const rightItems = [];
    if (sandboxInfo) {
        rightItems.push({
            key: 'sandbox',
            node: _jsxs(Text, { color: theme.status.success, children: ["\uD83D\uDD12 ", sandboxInfo] }),
        });
    }
    if (debugMode) {
        rightItems.push({
            key: 'debug',
            node: _jsx(Text, { color: theme.status.warning, children: "Debug Mode" }),
        });
    }
    // Dream tasks now surface via the BackgroundTasksPill (e.g. "1 dream")
    // alongside the other background-task kinds. The previous `✦ dreaming`
    // right-column indicator was removed to avoid two simultaneous signals
    // for the same underlying state.
    if (promptTokenCount > 0 && contextWindowSize) {
        rightItems.push({
            key: 'context',
            node: (_jsx(Text, { color: theme.text.accent, children: _jsx(ContextUsageDisplay, { promptTokenCount: promptTokenCount, terminalWidth: terminalWidth, contextWindowSize: contextWindowSize }) })),
        });
    }
    // Goal pill: only present in `rightItems` when a goal is active so the
    // divider chain stays tight; the pill itself does the live elapsed-time
    // refresh internally.
    const goalActive = useFooterGoalState() !== undefined;
    if (goalActive) {
        rightItems.push({ key: 'goal', node: _jsx(GoalPill, {}) });
    }
    // Layout matches upstream: left column has status line (top) + hints/mode
    // (bottom), right section has indicators. Status line and hints coexist.
    return (_jsxs(Box, { flexDirection: isNarrow ? 'column' : 'row', justifyContent: isNarrow ? 'flex-start' : 'space-between', width: "100%", paddingX: 2, gap: isNarrow ? 0 : 1, children: [_jsxs(Box, { flexDirection: "column", flexShrink: isNarrow ? 0 : 1, children: [statusLineLines.length > 0 &&
                        !uiState.ctrlCPressedOnce &&
                        !uiState.ctrlDPressedOnce &&
                        statusLineLines.map((line, i) => (_jsx(Text, { color: useThemeColors ? theme.text.accent : undefined, dimColor: !useThemeColors, wrap: "truncate", children: line }, `status-line-${i}`))), uiState.activeWorktree &&
                        !settings.merged.ui?.hideBuiltinWorktreeIndicator &&
                        !uiState.ctrlCPressedOnce &&
                        !uiState.ctrlDPressedOnce && (_jsx(Text, { dimColor: true, wrap: "truncate", children: `⎇ ${uiState.activeWorktree.branch} (${uiState.activeWorktree.slug})` })), _jsxs(Box, { flexDirection: "row", flexShrink: 1, children: [_jsx(Text, { wrap: "truncate", children: leftBottomContent }), _jsx(BackgroundTasksPill, {}), _jsx(MCPHealthPill, {})] })] }), _jsx(Box, { flexShrink: 0, gap: 1, alignItems: "flex-start", children: rightItems.map(({ key, node }, index) => (_jsxs(Box, { alignItems: "center", children: [index > 0 && _jsx(Text, { color: theme.text.secondary, children: " | " }), node] }, key))) })] }));
};
//# sourceMappingURL=Footer.js.map