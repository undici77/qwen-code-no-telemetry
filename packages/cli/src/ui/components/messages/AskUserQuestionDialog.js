import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { ToolConfirmationOutcome, } from '@qwen-code/qwen-code-core';
import { theme } from '../../semantic-colors.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { keyMatchers, Command } from '../../keyMatchers.js';
import { TextInput } from '../shared/TextInput.js';
import { t } from '../../../i18n/index.js';
export const AskUserQuestionDialog = ({ confirmationDetails, isFocused = true, onConfirm, }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [customInputValues, setCustomInputValues] = useState({});
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
    const currentCustomInputValue = customInputValues[currentQuestionIndex] ?? '';
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
            const customValue = (customInputValues[idx] ?? '').trim();
            if (customInputChecked[idx] && customValue) {
                selections.push(customValue);
            }
            return selections.length > 0 ? selections.join(', ') : undefined;
        }
        return selectedOptions[idx];
    };
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
    const handleMultiSelectSubmit = () => {
        if (!currentQuestion)
            return;
        const selections = [...(multiSelectedOptions[currentQuestionIndex] ?? [])];
        const customValue = currentCustomInputValue.trim();
        if (customInputChecked[currentQuestionIndex] && customValue) {
            selections.push(customValue);
        }
        if (selections.length === 0)
            return;
        selectAndAdvance(selections.join(', '));
    };
    const handleCustomInputSubmit = () => {
        const trimmedValue = currentCustomInputValue.trim();
        if (isMultiSelect) {
            // Toggle custom input checked state
            if (!trimmedValue)
                return;
            setCustomInputChecked((prev) => ({
                ...prev,
                [currentQuestionIndex]: !prev[currentQuestionIndex],
            }));
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
        const numKey = parseInt(input || '', 10);
        if (!isNaN(numKey) && numKey >= 1 && numKey <= totalOptions) {
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
                            return (_jsx(Box, { children: _jsxs(Text, { dimColor: true, children: [isAnswered ? '  ' : '  ', q.header, isAnswered ? ' ✓' : ''] }) }, idx));
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
                                    : theme.text.primary, bold: idx === currentQuestionIndex, dimColor: idx !== currentQuestionIndex, children: [idx === currentQuestionIndex ? '▸ ' : '  ', q.header, isAnswered ? ' ✓' : ''] }) }, idx));
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
                    }), _jsx(Box, { flexDirection: "column", children: isCustomInputSelected ? (_jsxs(Box, { children: [_jsxs(Text, { color: theme.text.accent, bold: true, children: ["\u276F", ' ', isMultiSelect
                                            ? customInputChecked[currentQuestionIndex]
                                                ? '[✓] '
                                                : '[ ] '
                                            : '', currentQuestion.options.length + 1, ".", ' '] }), _jsx(TextInput, { value: currentCustomInputValue, initialCursorOffset: currentCustomInputValue.length, onChange: (value) => {
                                        const oldValue = customInputValues[currentQuestionIndex] ?? '';
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
                                    }, onSubmit: handleCustomInputSubmit, placeholder: t('Type something...'), isActive: true, inputWidth: 50 })] })) : (_jsx(Box, { children: _jsxs(Text, { color: isCustomInputAnswer ||
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