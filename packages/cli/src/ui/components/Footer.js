import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from 'react';
import { Box, Text, useBoxMetrics } from 'ink';
import { theme } from '../semantic-colors.js';
import { ContextUsageDisplay } from './ContextUsageDisplay.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { AutoAcceptIndicator } from './AutoAcceptIndicator.js';
import { ShellModeIndicator } from './ShellModeIndicator.js';
import { BackgroundTasksPill } from './background-view/BackgroundTasksPill.js';
import { MCPHealthPill } from './mcp/MCPHealthPill.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { MAX_STATUS_LINES, useStatusLine } from '../hooks/useStatusLine.js';
import { useConfigInitMessage } from '../hooks/useConfigInitMessage.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { useVimModeState } from '../contexts/VimModeContext.js';
import { GeminiSpinner } from './GeminiRespondingSpinner.js';
import { GoalPill, isLiveGoalSnapshot, useFooterGoalState, } from './GoalPill.js';
import { CronPill, useFooterCronTaskCount } from './CronPill.js';
import { t } from '../../i18n/index.js';
import { useKeypressContext } from '../contexts/KeypressContext.js';
import { StreamingState } from '../types.js';
const PasteProgressBar = ({ progress, }) => {
    const { receivedBytes } = progress;
    const kb = receivedBytes / 1024;
    const label = kb >= 1 ? `${kb.toFixed(0)} KB` : `${receivedBytes} B`;
    return (_jsxs(Text, { dimColor: true, children: [t('Pasting…'), " ", label] }));
};
export const Footer = ({ containerRef }) => {
    const uiState = useUIState();
    const config = useConfig();
    const settings = useSettings();
    const { vimEnabled, vimMode } = useVimModeState();
    const { columns: terminalWidth } = useTerminalSize();
    const isNarrow = isNarrowWidth(terminalWidth);
    const statusLineRef = useRef(null);
    const { width: statusLineWidth, hasMeasured: hasMeasuredStatusLine } = useBoxMetrics(statusLineRef);
    const { pasteProgress } = useKeypressContext();
    const { lines: statusLineLines, useThemeColors, respectUserColors, hideContextIndicator, } = useStatusLine(isNarrow, hasMeasuredStatusLine ? statusLineWidth : undefined);
    const configInitMessage = useConfigInitMessage(uiState.isConfigInitialized);
    const { promptTokenCount, showAutoAcceptIndicator } = {
        promptTokenCount: uiState.sessionStats.lastPromptTokenCount,
        showAutoAcceptIndicator: uiState.showAutoAcceptIndicator,
    };
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
    const leftBottomContent = uiState.ctrlCPressedOnce ? (_jsx(Text, { color: theme.status.warning, children: t('Press Ctrl+C again to exit.') })) : uiState.ctrlDPressedOnce ? (_jsx(Text, { color: theme.status.warning, children: t('Press Ctrl+D again to exit.') })) : uiState.showEscapePrompt ? (_jsx(Text, { color: theme.text.secondary, children: t('Press Esc again to clear.') })) : pasteProgress.active ? (_jsx(PasteProgressBar, { progress: pasteProgress })) : uiState.rewindEscPending ? (_jsx(Text, { color: theme.text.secondary, children: t('Press Esc again to rewind conversation.') })) : vimEnabled && vimMode === 'INSERT' ? (_jsx(Text, { color: theme.text.secondary, children: "-- INSERT --" })) : vimEnabled && vimMode === 'NORMAL' ? (_jsx(Text, { color: theme.text.secondary, children: "-- NORMAL --" })) : uiState.shellModeActive ? (_jsx(ShellModeIndicator, {})) : configInitMessage ? (_jsxs(Text, { color: theme.text.secondary, children: [_jsx(GeminiSpinner, {}), " ", configInitMessage] })) : uiState.startupIdeConnectionStatus.state === 'connecting' ? (_jsxs(Text, { color: theme.text.secondary, children: [_jsx(GeminiSpinner, {}), " ", t('IDE connecting... context may be unavailable')] })) : uiState.startupIdeConnectionStatus.state === 'failed' ? (_jsx(Text, { color: theme.status.warning, children: t('IDE connection unavailable: {{message}}', {
            message: uiState.startupIdeConnectionStatus.message,
        }) })) : uiState.streamingState === StreamingState.Responding ? (_jsxs(Text, { color: theme.text.secondary, children: [t('Enter to steer · Ctrl+Q to queue'), showAutoAcceptIndicator !== undefined && (_jsxs(_Fragment, { children: [' · ', _jsx(AutoAcceptIndicator, { approvalMode: showAutoAcceptIndicator })] }))] })) : showAutoAcceptIndicator !== undefined ? (_jsx(AutoAcceptIndicator, { approvalMode: showAutoAcceptIndicator })) : suppressHint ? null : (_jsx(Text, { color: theme.text.secondary, children: t('? for shortcuts') }));
    const rightItems = [];
    if (sandboxInfo) {
        rightItems.push({
            key: 'sandbox',
            node: _jsx(Text, { color: theme.status.success, children: sandboxInfo }),
        });
    }
    if (config.isSafeMode()) {
        rightItems.push({
            key: 'safe-mode',
            node: _jsx(Text, { color: theme.status.warning, children: "\u26A0 Safe Mode" }),
        });
    }
    if (debugMode) {
        rightItems.push({
            key: 'debug',
            node: _jsx(Text, { color: theme.status.warning, children: "Debug Mode" }),
        });
    }
    // Dream tasks now surface via the BackgroundTasksPill (e.g. "1 dream")
    // alongside the other background-task kinds. The previous `◆ dreaming`
    // right-column indicator was removed to avoid two simultaneous signals
    // for the same underlying state.
    if (promptTokenCount > 0 && contextWindowSize && !hideContextIndicator) {
        rightItems.push({
            key: 'context',
            node: (_jsx(Text, { color: theme.text.accent, children: _jsx(ContextUsageDisplay, { promptTokenCount: promptTokenCount, terminalWidth: terminalWidth, contextWindowSize: contextWindowSize }) })),
        });
    }
    // Goal pill: only present in `rightItems` when a goal is active so the
    // divider chain stays tight; the pill itself does the live elapsed-time
    // refresh internally.
    const goalState = useFooterGoalState();
    if (isLiveGoalSnapshot(goalState)) {
        rightItems.push({
            key: 'goal',
            node: _jsx(GoalPill, { snapshot: goalState }),
        });
    }
    const cronTaskCount = useFooterCronTaskCount();
    if (cronTaskCount > 0) {
        rightItems.push({ key: 'cron', node: _jsx(CronPill, { count: cronTaskCount }) });
    }
    // Layout matches upstream: left column has status line (top) + hints/mode
    // (bottom), right section has indicators. Status line and hints coexist.
    return (_jsxs(Box, { ref: containerRef, flexDirection: isNarrow ? 'column' : 'row', justifyContent: isNarrow ? 'flex-start' : 'space-between', width: "100%", paddingX: 2, gap: isNarrow ? 0 : 1, children: [_jsxs(Box, { ref: statusLineRef, flexDirection: "column", flexGrow: 1, flexShrink: isNarrow ? 0 : 1, minWidth: 0, children: [statusLineLines.length > 0 &&
                        !uiState.ctrlCPressedOnce &&
                        !uiState.ctrlDPressedOnce && (_jsx(Box, { flexDirection: "column", maxHeight: MAX_STATUS_LINES, overflow: "hidden", width: "100%", children: _jsx(Text, { color: respectUserColors
                                ? undefined
                                : useThemeColors
                                    ? theme.text.accent
                                    : undefined, dimColor: respectUserColors ? false : !useThemeColors, wrap: "wrap", children: statusLineLines.join('\n') }) })), uiState.activeWorktree &&
                        !settings.merged.ui?.hideBuiltinWorktreeIndicator &&
                        !uiState.ctrlCPressedOnce &&
                        !uiState.ctrlDPressedOnce && (_jsx(Text, { dimColor: true, wrap: "truncate", children: `⎇ ${uiState.activeWorktree.branch} (${uiState.activeWorktree.slug})` })), uiState.workflowKeywordActive &&
                        !uiState.ctrlCPressedOnce &&
                        !uiState.ctrlDPressedOnce && (_jsx(Text, { color: theme.text.accent, wrap: "truncate", children: `▷ ${t('workflow active')}` })), _jsxs(Box, { flexDirection: "row", flexShrink: 1, children: [_jsx(Text, { wrap: "truncate", children: leftBottomContent }), _jsx(BackgroundTasksPill, {}), _jsx(MCPHealthPill, {}), uiState.messageQueue.length > 0 && (_jsx(Text, { color: theme.text.secondary, wrap: "truncate", children: ` ⏳ ${t('{{count}} queued', {
                                    count: String(uiState.messageQueue.length),
                                })}` })), !uiState.isSkillReviewDialogOpen &&
                                (uiState.skillReviewPending?.skills.length ?? 0) > 0 && (_jsx(Text, { color: theme.status.warning, wrap: "truncate", children: ` ⚠ ${t('{{count}} skill(s) pending review', {
                                    count: String(uiState.skillReviewPending.skills.length),
                                })}` }))] })] }), _jsx(Box, { flexShrink: 0, gap: 1, alignItems: "flex-start", children: rightItems.map(({ key, node }, index) => (_jsxs(Box, { alignItems: "center", children: [index > 0 && _jsx(Text, { color: theme.text.secondary, children: " | " }), node] }, key))) })] }));
};
//# sourceMappingURL=Footer.js.map