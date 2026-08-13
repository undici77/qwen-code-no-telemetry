import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useStreamingContext } from '../contexts/StreamingContext.js';
import { StreamingState } from '../types.js';
import { GeminiRespondingSpinner } from './GeminiRespondingSpinner.js';
import { formatDuration, formatTokenCount } from '../utils/formatters.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { useAnimationFrame } from '../hooks/useAnimationFrame.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { t } from '../../i18n/index.js';
export const LoadingIndicator = ({ currentLoadingPhrase, elapsedTime, rightContent, candidatesTokens, taskStartTokens = 0, taskStartStreamingChars = 0, streamingCharsRef, isStreaming, showResponseTokensPerSecond = false, isReceivingContent = true, }) => {
    const streamingState = useStreamingContext();
    const { columns: terminalWidth } = useTerminalSize();
    const isNarrow = isNarrowWidth(terminalWidth);
    // Animate the streaming-chars counter locally so only this component
    // re-renders on each animation frame (100ms ≈ spinner cadence). Siblings
    // like InputPrompt / Footer stay static, which eliminates terminal flicker
    // during streaming output.
    const fallbackRef = useRef(0);
    const animatedChars = useAnimationFrame(streamingCharsRef ?? fallbackRef, streamingCharsRef && isStreaming ? 100 : null);
    if (streamingState === StreamingState.Idle) {
        return null;
    }
    // The spinner row shows status only: phrase, timer, token estimate, and the
    // cancel affordance. Model reasoning lives in the collapsible thinking block
    // in history, not here.
    const primaryText = currentLoadingPhrase;
    const streamingTokens = streamingCharsRef ? Math.round(animatedChars / 4) : 0;
    const outputTokens = (candidatesTokens ?? 0) + streamingTokens;
    const taskStartStreamingTokens = streamingCharsRef
        ? Math.round(taskStartStreamingChars / 4)
        : 0;
    const outputTokensSinceTimerStart = Math.max(0, outputTokens - taskStartTokens - taskStartStreamingTokens);
    const showTokens = !isNarrow && outputTokens > 0;
    const tokenArrow = isReceivingContent ? '↓' : '↑';
    // Keep the timer's sub-second precision for rate calculations, but display
    // only completed whole seconds in the status line.
    const timeStr = elapsedTime < 60
        ? `${Math.floor(Math.max(0, elapsedTime))}s`
        : formatDuration(elapsedTime * 1000);
    const tokenStr = showTokens
        ? ` · ${tokenArrow} ${formatTokenCount(outputTokens)} tokens`
        : '';
    const tokenRateStr = showTokens &&
        showResponseTokensPerSecond &&
        isReceivingContent &&
        elapsedTime > 0
        ? ` · ${formatTokensPerSecond(outputTokensSinceTimerStart / elapsedTime)}`
        : '';
    const cancelAndTimerContent = streamingState !== StreamingState.WaitingForConfirmation
        ? t('({{time}}{{tokens}} · esc to cancel)', {
            time: timeStr,
            tokens: `${tokenStr}${tokenRateStr}`,
        })
        : null;
    return (_jsxs(Box, { paddingLeft: 2, flexDirection: "column", children: [_jsxs(Box, { width: "100%", flexDirection: isNarrow ? 'column' : 'row', alignItems: isNarrow ? 'flex-start' : 'center', children: [_jsxs(Box, { children: [_jsx(Box, { marginRight: 1, children: _jsx(GeminiRespondingSpinner, { nonRespondingDisplay: streamingState === StreamingState.WaitingForConfirmation
                                        ? '⠏'
                                        : '' }) }), primaryText && (_jsx(Text, { color: theme.text.accent, wrap: "truncate-end", children: primaryText })), !isNarrow && cancelAndTimerContent && (_jsxs(Text, { color: theme.text.secondary, children: [" ", cancelAndTimerContent] }))] }), !isNarrow && _jsx(Box, { flexGrow: 1 }), !isNarrow && rightContent && _jsx(Box, { children: rightContent })] }), isNarrow && cancelAndTimerContent && (_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: cancelAndTimerContent }) })), isNarrow && rightContent && _jsx(Box, { children: rightContent })] }));
};
function formatTokensPerSecond(tokensPerSecond) {
    if (!Number.isFinite(tokensPerSecond) || tokensPerSecond <= 0) {
        return '0 t/s';
    }
    const rounded = tokensPerSecond >= 10
        ? Math.round(tokensPerSecond).toString()
        : tokensPerSecond.toFixed(1);
    return `${rounded} t/s`;
}
//# sourceMappingURL=LoadingIndicator.js.map