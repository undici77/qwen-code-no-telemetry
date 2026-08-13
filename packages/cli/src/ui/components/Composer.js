import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text, useIsScreenReaderEnabled } from 'ink';
import { useCallback, useRef, useState } from 'react';
import { LoadingIndicator } from './LoadingIndicator.js';
import { InputPrompt } from './InputPrompt.js';
import { Footer } from './Footer.js';
import { QueuedMessageDisplay } from './QueuedMessageDisplay.js';
import { KeyboardShortcuts } from './KeyboardShortcuts.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useUIActions } from '../contexts/UIActionsContext.js';
import { useVimModeState } from '../contexts/VimModeContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { theme } from '../semantic-colors.js';
import { StreamingState } from '../types.js';
import { FeedbackDialog } from '../FeedbackDialog.js';
import { t } from '../../i18n/index.js';
export const Composer = ({ footerRef }) => {
    const config = useConfig();
    const isScreenReaderEnabled = useIsScreenReaderEnabled();
    const uiState = useUIState();
    const uiActions = useUIActions();
    const { vimEnabled } = useVimModeState();
    const { showAutoAcceptIndicator, streamingResponseLengthRef, isReceivingContent, responseCandidateTokens, taskStartTokens, taskStartStreamingChars, } = uiState;
    // Real-time token animation is performed inside LoadingIndicator itself, so
    // the 100ms polling only re-renders that one component — keeping InputPrompt
    // and Footer static avoids terminal flicker during streaming.
    const isStreaming = uiState.streamingState === StreamingState.Responding ||
        uiState.streamingState === StreamingState.WaitingForConfirmation;
    // `isStreaming` covers Responding|WaitingForConfirmation, but we only
    // suppress during Responding (active token output). A confirmation prompt
    // must remain visible regardless of width. Drop the redundant `isStreaming`
    // guard so future expansions of `isStreaming` don't silently widen suppression.
    const suppressBottomLoadingIndicator = uiState.streamingState === StreamingState.Responding &&
        uiState.terminalWidth <= 30;
    // State for keyboard shortcuts display toggle
    const [showShortcuts, setShowShortcuts] = useState(false);
    const handleToggleShortcuts = useCallback(() => {
        setShowShortcuts((prev) => !prev);
    }, []);
    // State for autocomplete-dropdown visibility (narrow signal). Drives the
    // Footer / KeyboardShortcuts hide-when-dropdown-visible logic below; kept
    // local to Composer because nothing outside this component needs the
    // narrow signal.
    const [showSuggestions, setShowSuggestions] = useState(false);
    const clipboardUnavailableShownRef = useRef(false);
    // Broad signal — any input-area Tab consumer. Forwarded to AppContainer
    // via UIActionsContext so useAutoAcceptIndicator's `shouldBlockTab` can
    // suppress the Windows-only bare-Tab approval-mode fallback. See #4171.
    const handleTabConsumerChange = useCallback((active) => {
        uiActions.onTabConsumerChange(active);
    }, [uiActions]);
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [!uiState.embeddedShellFocused && !suppressBottomLoadingIndicator && (_jsx(LoadingIndicator
            // Hide loading phrases when enableLoadingPhrases is explicitly false.
            // Using === false ensures phrases show by default when undefined.
            , { 
                // Hide loading phrases when enableLoadingPhrases is explicitly false.
                // Using === false ensures phrases show by default when undefined.
                currentLoadingPhrase: config.getAccessibility()?.enableLoadingPhrases === false
                    ? undefined
                    : uiState.currentLoadingPhrase, elapsedTime: uiState.elapsedTime, candidatesTokens: responseCandidateTokens, taskStartTokens: taskStartTokens, taskStartStreamingChars: taskStartStreamingChars, streamingCharsRef: streamingResponseLengthRef, isStreaming: isStreaming, showResponseTokensPerSecond: config.getShowResponseTokensPerSecond(), isReceivingContent: isReceivingContent })), !uiState.embeddedShellFocused && suppressBottomLoadingIndicator && (_jsx(Box, { paddingLeft: 2, children: _jsxs(Text, { color: theme.text.secondary, children: ["(", t('Esc to cancel'), ")"] }) })), _jsx(QueuedMessageDisplay, { messageQueue: uiState.messageQueue }), uiState.isFeedbackDialogOpen && _jsx(FeedbackDialog, {}), uiState.isInputActive && (_jsx(InputPrompt, { buffer: uiState.buffer, inputWidth: uiState.inputWidth, suggestionsWidth: uiState.suggestionsWidth, onSubmit: uiActions.handleFinalSubmit, userMessages: uiState.userMessages, onClearScreen: uiActions.handleClearScreen, config: config, slashCommands: uiState.slashCommands, commandContext: uiState.commandContext, recentSlashCommands: uiState.recentSlashCommands, shellModeActive: uiState.shellModeActive, setShellModeActive: uiActions.setShellModeActive, approvalMode: showAutoAcceptIndicator, onEscapePromptChange: uiActions.onEscapePromptChange, onToggleShortcuts: handleToggleShortcuts, showShortcuts: showShortcuts, onSuggestionsVisibilityChange: setShowSuggestions, onTabConsumerChange: handleTabConsumerChange, focus: true, vimHandleInput: uiActions.vimHandleInput, isEmbeddedShellFocused: uiState.embeddedShellFocused, placeholder: vimEnabled
                    ? '  ' + t("Press 'i' for INSERT mode and 'Esc' for NORMAL mode.")
                    : '  ' + t('Type your message or @path/to/file'), promptSuggestion: uiState.promptSuggestion, onPromptSuggestionDismiss: uiState.abortPromptSuggestion, clipboardUnavailableShownRef: clipboardUnavailableShownRef })), uiState.isInputActive &&
                !showSuggestions &&
                (showShortcuts ? (_jsx(KeyboardShortcuts, {})) : (!isScreenReaderEnabled && _jsx(Footer, { containerRef: footerRef })))] }));
};
//# sourceMappingURL=Composer.js.map