import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { Box, Text } from 'ink';
import { ToolConfirmationOutcome, } from '@qwen-code/qwen-code-core';
import { theme } from '../../semantic-colors.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { keyMatchers, Command } from '../../keyMatchers.js';
import { TextInput } from '../shared/TextInput.js';
import { getCachedStringWidth, truncateToWidth, } from '../../utils/textUtils.js';
import { t } from '../../../i18n/index.js';
// Largest per-chip display width (cells) such that every header, clipped to it,
// lets the tab row fit within `available`. Headers narrower than the cap keep
// their full width and their slack is reclaimed for the longer ones (water-
// filling), so a header is clipped only when the row genuinely cannot fit it.
// Returns a very large number when every header already fits at natural width.
export function computeHeaderCap(headerWidths, available) {
    const ascending = [...headerWidths].sort((a, b) => a - b);
    let remaining = available;
    for (let i = 0; i < ascending.length; i++) {
        const cap = Math.floor(remaining / (ascending.length - i));
        if (ascending[i] > cap) {
            return Math.max(0, cap);
        }
        remaining -= ascending[i];
    }
    return Number.MAX_SAFE_INTEGER;
}
export const AskUserQuestionDialog = ({ confirmationDetails, isFocused = true, availableWidth, onConfirm, }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [customInputValues, setCustomInputValues] = useState({});
    const customInputValuesRef = useRef({});
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [multiSelectedOptions, setMultiSelectedOptions] = useState({});
    const [customInputChecked, setCustomInputChecked] = useState({});
    const hasMultipleQuestions = confirmationDetails.questions.length > 1;
    const totalTabs = hasMultipleQuestions
        ? confirmationDetails.questions.length + 1
        : confirmationDetails.questions.length; // +1 for Submit tab
    const isSubmitTab = hasMultipleQuestions && currentQuestionIndex === totalTabs - 1;
    const currentQuestion = isSubmitTab
        ? null
        : confirmationDetails.questions[currentQuestionIndex];
    const isMultiSelect = currentQuestion?.multiSelect ?? false;
    // Options + custom input ("Other")
    const totalOptions = currentQuestion ? currentQuestion.options.length + 1 : 2;
    // Check if the custom input option is selected
    const isCustomInputSelected = !isSubmitTab &&
        currentQuestion &&
        selectedIndex === currentQuestion.options.length;
    const getCustomInputValue = (idx) => customInputValuesRef.current[idx] ?? customInputValues[idx] ?? '';
    const currentCustomInputValue = getCustomInputValue(currentQuestionIndex);
    const isCustomInputAnswer = !isSubmitTab &&
        currentQuestion &&
        !isMultiSelect &&
        selectedOptions[currentQuestionIndex] !== undefined &&
        !currentQuestion.options.some((opt) => opt.label === selectedOptions[currentQuestionIndex]);
    // Compute the current answer for a question, considering multi-select state
    const getAnswerForQuestion = (idx) => {
        const q = confirmationDetails.questions[idx];
        if (q?.multiSelect) {
            const selections = [...(multiSelectedOptions[idx] ?? [])];
            const customValue = getCustomInputValue(idx).trim();
            if (customInputChecked[idx] && customValue) {
                selections.push(customValue);
            }
            return selections.length > 0 ? selections.join(', ') : undefined;
        }
        return selectedOptions[idx];
    };
    // Headers render as chips in a horizontal tab row. The 12-char schema limit is
    // only guidance to the model, so at display time each header is shown in full
    // whenever the row has room and clipped with an ellipsis only when the headers
    // would otherwise overflow.
    const numHeaders = confirmationDetails.questions.length;
    const answeredHeaders = confirmationDetails.questions.filter((_, idx) => getAnswerForQuestion(idx) !== undefined).length;
    // Cells the row spends outside the header text, matching what it renders.
    // Recomputed each render, so answering a question re-fits the row.
    const dialogPadding = 2;
    // "▸ " when the Submit tab is active, a single leading space otherwise, plus
    // the (locale-dependent) label.
    const submitChipWidth = (isSubmitTab ? 2 : 1) + getCachedStringWidth(t('Submit'));
    const chipGaps = numHeaders; // gap={1} between each chip and the Submit chip
    const headerPrefixes = 2 * numHeaders; // "▸ " or "  " before each header
    const answeredMarks = 2 * answeredHeaders; // " ✓" after answered headers
    const rowOverhead = dialogPadding + submitChipWidth + chipGaps + headerPrefixes + answeredMarks;
    const headerCap = computeHeaderCap(confirmationDetails.questions.map((q) => getCachedStringWidth(q.header)), availableWidth - rowOverhead);
    const handleSubmit = async () => {
        const answers = {};
        confirmationDetails.questions.forEach((_, idx) => {
            const answer = getAnswerForQuestion(idx);
            if (answer !== undefined) {
                answers[idx] = answer;
            }
        });
        await onConfirm(ToolConfirmationOutcome.ProceedOnce, { answers });
    };
    // Select a value for the current question, then submit (single question) or advance to the next tab (multi-question).
    const selectAndAdvance = (value) => {
        setSelectedOptions((prev) => ({ ...prev, [currentQuestionIndex]: value }));
        if (!hasMultipleQuestions) {
            void onConfirm(ToolConfirmationOutcome.ProceedOnce, {
                answers: { [currentQuestionIndex]: value },
            });
        }
        else if (currentQuestionIndex < totalTabs - 1) {
            setTimeout(() => {
                setCurrentQuestionIndex((prev) => Math.min(prev + 1, totalTabs - 1));
                setSelectedIndex(0);
            }, 150);
        }
    };
    const getCurrentMultiSelectAnswer = (includeCustomInput = customInputChecked[currentQuestionIndex], inputValue = currentCustomInputValue) => {
        if (!currentQuestion)
            return;
        const selections = [...(multiSelectedOptions[currentQuestionIndex] ?? [])];
        const customValue = inputValue.trim();
        if (includeCustomInput && customValue) {
            selections.push(customValue);
        }
        return selections.length > 0 ? selections.join(', ') : undefined;
    };
    const handleMultiSelectSubmit = () => {
        const answer = getCurrentMultiSelectAnswer();
        if (!answer)
            return;
        selectAndAdvance(answer);
    };
    const handleCustomInputSubmit = (inputValue = currentCustomInputValue) => {
        const trimmedValue = inputValue.trim();
        if (isMultiSelect) {
            // Toggle custom input checked state, then submit/advance if non-empty
            setCustomInputChecked((prev) => ({
                ...prev,
                [currentQuestionIndex]: trimmedValue.length > 0,
            }));
            if (trimmedValue) {
                selectAndAdvance(getCurrentMultiSelectAnswer(true, inputValue));
            }
            return;
        }
        if (!trimmedValue)
            return;
        selectAndAdvance(trimmedValue);
    };
    // Handle navigation and selection
    useKeypress((key) => {
        // When the custom-input TextInput is focused, we must NOT match bare
        // letter keys (k/j) for option navigation — those characters are being
        // typed into the input. Only honor unambiguous shortcuts: arrow keys
        // and the readline-style Ctrl+P/Ctrl+N. TextInput itself doesn't bind
        // those, so there's no double-fire.
        if (isCustomInputSelected) {
            const isOptionUp = key.name === 'up' || (key.ctrl && key.name === 'p');
            const isOptionDown = key.name === 'down' || (key.ctrl && key.name === 'n');
            if (isOptionUp) {
                setSelectedIndex(Math.max(0, selectedIndex - 1));
                return;
            }
            if (isOptionDown) {
                setSelectedIndex(Math.min(totalOptions - 1, selectedIndex + 1));
                return;
            }
            if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
                void onConfirm(ToolConfirmationOutcome.Cancel);
                return;
            }
            if (key.name === 'return') {
                handleCustomInputSubmit();
                return;
            }
            return;
        }
        const input = key.sequence;
        // Tab navigation (left/right arrows)
        if (key.name === 'left' && hasMultipleQuestions) {
            if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
                setSelectedIndex(0);
            }
            return;
        }
        if (key.name === 'right' && hasMultipleQuestions) {
            if (currentQuestionIndex < totalTabs - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setSelectedIndex(0);
            }
            return;
        }
        // Option navigation (up/down arrows and Ctrl+P/N)
        if (keyMatchers[Command.SELECTION_UP](key)) {
            setSelectedIndex(Math.max(0, selectedIndex - 1));
            return;
        }
        if (keyMatchers[Command.SELECTION_DOWN](key)) {
            setSelectedIndex(Math.min(totalOptions - 1, selectedIndex + 1));
            return;
        }
        // Number key selection
        const numKey = input && /^[1-9]\d*$/.test(input) ? Number(input) : NaN;
        if (Number.isSafeInteger(numKey) && numKey <= totalOptions) {
            const targetIndex = numKey - 1;
            setSelectedIndex(targetIndex);
            // For single-select, auto-submit when selecting a predefined option (not "Other")
            if (!isMultiSelect &&
                !isSubmitTab &&
                currentQuestion &&
                targetIndex < currentQuestion.options.length) {
                const option = currentQuestion.options[targetIndex];
                if (option) {
                    selectAndAdvance(option.label);
                }
            }
            return;
        }
        // Space to toggle multi-select
        if (key.name === 'space' && isMultiSelect && currentQuestion) {
            if (selectedIndex < currentQuestion.options.length) {
                const option = currentQuestion.options[selectedIndex];
                if (option) {
                    const current = multiSelectedOptions[currentQuestionIndex] ?? [];
                    const isChecked = current.includes(option.label);
                    const updated = isChecked
                        ? current.filter((l) => l !== option.label)
                        : [...current, option.label];
                    setMultiSelectedOptions((prev) => ({
                        ...prev,
                        [currentQuestionIndex]: updated,
                    }));
                }
            }
            return;
        }
        // Enter to select
        if (key.name === 'return') {
            // Handle Submit tab
            if (isSubmitTab) {
                if (selectedIndex === 0) {
                    // Submit
                    void handleSubmit();
                }
                else {
                    // Cancel
                    void onConfirm(ToolConfirmationOutcome.Cancel);
                }
                return;
            }
            // Handle multi-select: Enter advances to next question / submits
            if (isMultiSelect && currentQuestion) {
                // Custom input is handled by TextInput's onSubmit
                if (selectedIndex === currentQuestion.options.length) {
                    return;
                }
                handleMultiSelectSubmit();
                return;
            }
            // Handle question options (not custom input - that's handled by TextInput)
            if (currentQuestion && selectedIndex < currentQuestion.options.length) {
                const option = currentQuestion.options[selectedIndex];
                if (option) {
                    selectAndAdvance(option.label);
                }
            }
            return;
        }
        // Cancel
        if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
            void onConfirm(ToolConfirmationOutcome.Cancel);
            return;
        }
    }, { isActive: isFocused });
    // Submit tab (for multiple questions)
    if (isSubmitTab) {
        return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsxs(Box, { marginBottom: 1, flexDirection: "row", gap: 1, children: [confirmationDetails.questions.map((q, idx) => {
                            const isAnswered = getAnswerForQuestion(idx) !== undefined;
                            return (_jsx(Box, { children: _jsxs(Text, { dimColor: true, children: ['  ', truncateToWidth(q.header, headerCap), isAnswered ? ' ✓' : ''] }) }, idx));
                        }), _jsx(Box, { children: _jsxs(Text, { color: theme.text.accent, bold: true, children: ["\u25B8 ", t('Submit')] }) })] }), _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, children: t('Your answers:') }), confirmationDetails.questions.map((q, idx) => {
                            const answer = getAnswerForQuestion(idx);
                            return (_jsx(Box, { marginLeft: 2, children: _jsxs(Text, { children: [q.header, ":", ' ', answer ? (_jsx(Text, { color: theme.text.accent, children: answer })) : (_jsx(Text, { dimColor: true, children: t('(not answered)') }))] }) }, idx));
                        })] }), _jsx(Box, { marginTop: 1, marginBottom: 1, children: _jsx(Text, { children: t('Ready to submit your answers?') }) }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { children: _jsxs(Text, { color: selectedIndex === 0 ? theme.text.accent : theme.text.primary, bold: selectedIndex === 0, children: [selectedIndex === 0 ? '❯ ' : '  ', "1. ", t('Submit answers')] }) }), _jsx(Box, { children: _jsxs(Text, { color: selectedIndex === 1 ? theme.text.accent : theme.text.primary, bold: selectedIndex === 1, children: [selectedIndex === 1 ? '❯ ' : '  ', "2. ", t('Cancel')] }) })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: t('↑/↓: Navigate | ←/→: Switch tabs | Enter: Select') }) })] }));
    }
    // Question tab
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [hasMultipleQuestions && (_jsxs(Box, { marginBottom: 1, flexDirection: "row", gap: 1, children: [confirmationDetails.questions.map((q, idx) => {
                        const isAnswered = getAnswerForQuestion(idx) !== undefined;
                        return (_jsx(Box, { children: _jsxs(Text, { color: idx === currentQuestionIndex
                                    ? theme.text.accent
                                    : theme.text.primary, bold: idx === currentQuestionIndex, dimColor: idx !== currentQuestionIndex, children: [idx === currentQuestionIndex ? '▸ ' : '  ', truncateToWidth(q.header, headerCap), isAnswered ? ' ✓' : ''] }) }, idx));
                    }), _jsx(Box, { children: _jsxs(Text, { dimColor: true, children: [" ", t('Submit')] }) })] })), _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [!hasMultipleQuestions && (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.text.accent, bold: true, children: currentQuestion.header }) })), _jsx(Text, { children: currentQuestion.question })] }), _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [currentQuestion.options.map((opt, index) => {
                        const isSelected = selectedIndex === index;
                        const isMultiChecked = isMultiSelect &&
                            (multiSelectedOptions[currentQuestionIndex] ?? []).includes(opt.label);
                        const isAnswered = !isMultiSelect &&
                            selectedOptions[currentQuestionIndex] === opt.label;
                        const isHighlighted = isSelected || isAnswered || isMultiChecked;
                        // Calculate prefix width for description alignment:
                        // 2 (cursor) + checkbox (4 if multi) + number + ". " (2)
                        const prefixWidth = 2 + (isMultiSelect ? 4 : 0) + String(index + 1).length + 2;
                        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { children: _jsxs(Text, { color: isHighlighted ? theme.text.accent : theme.text.primary, bold: isHighlighted, children: [isSelected ? '❯ ' : '  ', isMultiSelect ? (isMultiChecked ? '[✓] ' : '[ ] ') : '', index + 1, ". ", opt.label, isAnswered ? ' ✓' : ''] }) }), opt.description && (_jsx(Box, { marginLeft: prefixWidth, children: _jsx(Text, { dimColor: true, children: opt.description }) }))] }, index));
                    }), _jsx(Box, { flexDirection: "column", children: isCustomInputSelected ? (
                        // Inline TextInput replaces the option text
                        _jsxs(Box, { children: [_jsxs(Text, { color: theme.text.accent, bold: true, children: ["\u276F", ' ', isMultiSelect
                                            ? customInputChecked[currentQuestionIndex]
                                                ? '[✓] '
                                                : '[ ] '
                                            : '', currentQuestion.options.length + 1, ".", ' '] }), _jsx(TextInput, { value: currentCustomInputValue, initialCursorOffset: currentCustomInputValue.length, onChange: (value) => {
                                        const oldValue = customInputValuesRef.current[currentQuestionIndex] ??
                                            customInputValues[currentQuestionIndex] ??
                                            '';
                                        customInputValuesRef.current = {
                                            ...customInputValuesRef.current,
                                            [currentQuestionIndex]: value,
                                        };
                                        if (isMultiSelect && value !== oldValue) {
                                            setCustomInputChecked((prevChecked) => ({
                                                ...prevChecked,
                                                [currentQuestionIndex]: value.trim().length > 0,
                                            }));
                                        }
                                        setCustomInputValues((prev) => ({
                                            ...prev,
                                            [currentQuestionIndex]: value,
                                        }));
                                    }, onSubmit: handleCustomInputSubmit, placeholder: t('Type something...'), isActive: true, inputWidth: 50 })] })) : (
                        // Show typed value or placeholder when not selected
                        _jsx(Box, { children: _jsxs(Text, { color: isCustomInputAnswer ||
                                    customInputChecked[currentQuestionIndex]
                                    ? theme.text.accent
                                    : theme.text.primary, bold: !!(isCustomInputAnswer ||
                                    customInputChecked[currentQuestionIndex]), dimColor: !currentCustomInputValue &&
                                    !isCustomInputAnswer &&
                                    !customInputChecked[currentQuestionIndex], children: ['  ', isMultiSelect
                                        ? customInputChecked[currentQuestionIndex]
                                            ? '[✓] '
                                            : '[ ] '
                                        : '', currentQuestion.options.length + 1, ".", ' ', currentCustomInputValue || t('Type something...'), isCustomInputAnswer ? ' ✓' : ''] }) })) })] }), _jsx(Box, { flexDirection: "column", marginTop: 1, children: _jsx(Box, { children: _jsx(Text, { dimColor: true, children: hasMultipleQuestions
                            ? isMultiSelect
                                ? t('↑/↓: Navigate | ←/→: Switch tabs | Space: Toggle | Enter: Confirm | Esc: Cancel')
                                : t('↑/↓: Navigate | ←/→: Switch tabs | Enter: Select | Esc: Cancel')
                            : isMultiSelect
                                ? t('↑/↓: Navigate | Space: Toggle | Enter: Confirm | Esc: Cancel')
                                : t('↑/↓: Navigate | Enter: Select | Esc: Cancel') }) }) })] }));
};
//# sourceMappingURL=AskUserQuestionDialog.js.map