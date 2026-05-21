import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EditPencilIcon, AutoEditIcon, PlanModeIcon, } from '../icons/EditIcons.js';
import { CodeBracketsIcon, HideContextIcon } from '../icons/EditIcons.js';
import { SlashCommandIcon, LinkIcon } from '../icons/EditIcons.js';
import { ArrowUpIcon } from '../icons/NavigationIcons.js';
import { StopIcon } from '../icons/StopIcon.js';
import { CompletionMenu } from './CompletionMenu.js';
import { ContextIndicator } from './ContextIndicator.js';
import { stripZeroWidthSpaces } from '../../utils/inputPlaceholder.js';
/**
 * Get icon component for edit mode type
 */
export const getEditModeIcon = (iconType) => {
    switch (iconType) {
        case 'edit':
            return _jsx(EditPencilIcon, {});
        case 'auto':
        case 'yolo':
            return _jsx(AutoEditIcon, {});
        case 'plan':
            return _jsx(PlanModeIcon, {});
        default:
            return null;
    }
};
/**
 * InputForm component
 *
 * Features:
 * - ContentEditable input with placeholder
 * - Edit mode toggle with customizable icons
 * - Active file/selection indicator
 * - Context usage display
 * - Command and attach buttons
 * - Send/Stop button based on state
 * - Completion menu integration
 *
 * @example
 * ```tsx
 * <InputForm
 *   inputText={text}
 *   inputFieldRef={inputRef}
 *   isStreaming={false}
 *   isWaitingForResponse={false}
 *   isComposing={false}
 *   editModeInfo={{ label: 'Auto', title: 'Auto mode', icon: <AutoEditIcon /> }}
 *   // ... other props
 * />
 * ```
 */
export const InputForm = ({ inputText, inputFieldRef, isStreaming, isWaitingForResponse, isComposing, editModeInfo, 
// thinkingEnabled,  // Temporarily disabled
activeFileName, activeSelection, skipAutoActiveContext, contextUsage, onInputChange, onCompositionStart, onCompositionEnd, onKeyDown, onSubmit, onCancel, onToggleEditMode, 
// onToggleThinking,  // Temporarily disabled
onToggleSkipAutoActiveContext, onShowCommandMenu, onAttachContext, completionIsOpen, completionItems, onCompletionSelect, onCompletionFill, onCompletionClose, onPaste, extraContent, placeholder = 'Ask Qwen Code …', canSubmit, followupState, onAcceptFollowup, onDismissFollowup, }) => {
    const composerDisabled = isStreaming || isWaitingForResponse;
    const hasDraftContent = canSubmit ?? stripZeroWidthSpaces(inputText).trim().length > 0;
    const completionItemsResolved = completionItems ?? [];
    const completionActive = completionIsOpen &&
        completionItemsResolved.length > 0 &&
        !!onCompletionSelect &&
        !!onCompletionClose;
    // Prompt suggestion handling
    const followupSuggestion = followupState?.isVisible && followupState.suggestion
        ? followupState.suggestion
        : null;
    const hasFollowup = !!followupSuggestion;
    // Compute actual placeholder
    const actualPlaceholder = hasFollowup && !inputText ? followupSuggestion : placeholder;
    const handleKeyDown = (e) => {
        // Let the completion menu handle Escape when it's active.
        if (completionActive && e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onCompletionClose?.();
            return;
        }
        // ESC should cancel the current interaction (stop generation)
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
            return;
        }
        // Tab to accept prompt suggestion (only when callback is wired)
        if (e.key === 'Tab' &&
            hasFollowup &&
            onAcceptFollowup &&
            !inputText &&
            !completionActive) {
            e.preventDefault();
            e.stopPropagation();
            onAcceptFollowup('tab');
            return;
        }
        // Right arrow to accept prompt suggestion (only when callback is wired)
        if (e.key === 'ArrowRight' &&
            hasFollowup &&
            onAcceptFollowup &&
            !inputText &&
            !completionActive) {
            e.preventDefault();
            onAcceptFollowup?.('right');
            return;
        }
        // If composing (Chinese IME input), don't process Enter key
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            // If CompletionMenu is open, let it handle Enter key
            if (completionActive) {
                return;
            }
            // Accept and submit prompt suggestion on Enter when input is empty
            if (hasFollowup && !inputText && followupSuggestion) {
                e.preventDefault();
                // Skip onAccept callback — we pass the text directly to onSubmit.
                // Without skipOnAccept the microtask in accept() would re-insert
                // the suggestion into the input after it was already cleared.
                onAcceptFollowup?.('enter', { skipOnAccept: true });
                onSubmit(e, followupSuggestion);
                return;
            }
            e.preventDefault();
            onSubmit(e);
        }
        onKeyDown(e);
    };
    // Selection label like "6 lines selected"; no line numbers
    const selectedLinesCount = activeSelection
        ? Math.max(1, activeSelection.endLine - activeSelection.startLine + 1)
        : 0;
    const selectedLinesText = selectedLinesCount > 0
        ? `${selectedLinesCount} ${selectedLinesCount === 1 ? 'line' : 'lines'} selected`
        : '';
    // Pre-compute active file title for accessibility
    const activeFileTitle = activeFileName
        ? skipAutoActiveContext
            ? selectedLinesText
                ? `Active selection will NOT be auto-loaded into context: ${selectedLinesText}`
                : `Active file will NOT be auto-loaded into context: ${activeFileName}`
            : selectedLinesText
                ? `Showing your current selection: ${selectedLinesText}`
                : `Showing your current file: ${activeFileName}`
        : '';
    return (_jsx("div", { className: "p-1 px-4 pb-4 absolute bottom-0 left-0 right-0 bg-gradient-to-b from-transparent to-[var(--app-primary-background)] pointer-events-none", children: _jsx("div", { className: "block pointer-events-auto", children: _jsxs("form", { className: "composer-form", onSubmit: onSubmit, children: [_jsx("div", { className: "composer-overlay" }), _jsx("div", { className: "input-banner" }), _jsxs("div", { className: "relative flex z-[1]", children: [completionActive && onCompletionSelect && onCompletionClose && (_jsx(CompletionMenu, { items: completionItemsResolved, onSelect: onCompletionSelect, onFill: onCompletionFill, onClose: onCompletionClose, title: undefined })), _jsx("div", { ref: inputFieldRef, contentEditable: "plaintext-only", className: "composer-input", role: "textbox", "aria-label": "Message input", "aria-multiline": "true", "data-placeholder": actualPlaceholder, "data-has-suggestion": hasFollowup ? 'true' : 'false', "data-empty": stripZeroWidthSpaces(inputText).trim().length === 0
                                    ? 'true'
                                    : 'false', onInput: (e) => {
                                    const target = e.target;
                                    // Filter out zero-width space that we use to maintain height
                                    const text = stripZeroWidthSpaces(target.textContent ?? '');
                                    onInputChange(text);
                                    // Dismiss follow-up suggestion when user starts typing
                                    if (hasFollowup && !inputText && text) {
                                        onDismissFollowup?.();
                                    }
                                }, onCompositionStart: onCompositionStart, onCompositionEnd: onCompositionEnd, onKeyDown: handleKeyDown, onPaste: onPaste, suppressContentEditableWarning: true })] }), extraContent ? (_jsx("div", { className: "relative z-[1]", children: extraContent })) : null, _jsxs("div", { className: "composer-actions", children: [_jsxs("button", { type: "button", className: "btn-text-compact btn-text-compact--primary", title: editModeInfo.title, "aria-label": editModeInfo.label, onClick: onToggleEditMode, children: [editModeInfo.icon, _jsx("span", { className: "hidden sm:inline", children: editModeInfo.label })] }), activeFileName && (_jsxs("button", { type: "button", className: "btn-text-compact btn-text-compact--primary", title: activeFileTitle, "aria-label": activeFileTitle, onClick: onToggleSkipAutoActiveContext, children: [skipAutoActiveContext ? (_jsx(HideContextIcon, {})) : (_jsx(CodeBracketsIcon, {})), _jsx("span", { className: "hidden sm:inline", children: selectedLinesText || activeFileName })] })), _jsx("div", { className: "flex-1 min-w-0" }), _jsx(ContextIndicator, { contextUsage: contextUsage }), _jsx("button", { type: "button", className: "btn-icon-compact hover:text-[var(--app-primary-foreground)]", title: "Show command menu (/)", "aria-label": "Show command menu", onClick: onShowCommandMenu, children: _jsx(SlashCommandIcon, {}) }), _jsx("button", { type: "button", className: "btn-icon-compact hover:text-[var(--app-primary-foreground)]", title: "Attach context (Cmd/Ctrl + /)", "aria-label": "Attach context", onClick: onAttachContext, children: _jsx(LinkIcon, {}) }), isStreaming || isWaitingForResponse ? (_jsx("button", { type: "button", className: "btn-send-compact [&>svg]:w-5 [&>svg]:h-5", onClick: onCancel, title: "Stop generation", "aria-label": "Stop generation", children: _jsx(StopIcon, {}) })) : (_jsx("button", { type: "submit", className: "btn-send-compact [&>svg]:w-5 [&>svg]:h-5", disabled: composerDisabled || !hasDraftContent, "aria-label": "Send message", children: _jsx(ArrowUpIcon, {}) }))] })] }) }) }));
};
//# sourceMappingURL=InputForm.js.map