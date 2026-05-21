import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
export const AskUserQuestionDialog = ({ questions, onSubmit, onCancel, }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showCustomInput, setShowCustomInput] = useState(false);
    const containerRef = useRef(null);
    const customInputRef = useRef(null);
    const hasMultipleQuestions = questions.length > 1;
    const totalTabs = hasMultipleQuestions
        ? questions.length + 1
        : questions.length;
    const isSubmitTab = hasMultipleQuestions && currentQuestionIndex === totalTabs - 1;
    const currentQuestion = isSubmitTab ? null : questions[currentQuestionIndex];
    const isMultiSelect = currentQuestion?.multiSelect ?? false;
    // Get current answer state
    const currentAnswer = answers[currentQuestionIndex] || {};
    // Get answer for a specific question
    const getAnswerForQuestion = useCallback((idx) => {
        const q = questions[idx];
        const answerState = answers[idx];
        if (!answerState) {
            return undefined;
        }
        if (q?.multiSelect) {
            const selections = [...(answerState.multiSelectedOptions || [])];
            const customValue = (answerState.customInput || '').trim();
            if (answerState.customInputChecked && customValue) {
                selections.push(customValue);
            }
            return selections.length > 0 ? selections.join(', ') : undefined;
        }
        // Check if custom input was used (value doesn't match any option)
        if (answerState.customInput && answerState.customInput.trim()) {
            const matchesOption = q?.options.some((opt) => opt.label === answerState.customInput?.trim());
            if (!matchesOption) {
                return answerState.customInput.trim();
            }
        }
        return answerState.selectedOption;
    }, [questions, answers]);
    // Handle submitting all answers
    const handleSubmit = useCallback(() => {
        const answersRecord = {};
        questions.forEach((_, idx) => {
            const answer = getAnswerForQuestion(idx);
            if (answer !== undefined) {
                answersRecord[idx] = answer;
            }
        });
        onSubmit(answersRecord);
    }, [questions, onSubmit, getAnswerForQuestion]);
    // Handle confirming multi-select for current question
    const handleMultiSelectConfirm = useCallback(() => {
        if (!currentQuestion) {
            return;
        }
        const answerState = answers[currentQuestionIndex] || {};
        const selections = [...(answerState.multiSelectedOptions || [])];
        const customValue = (answerState.customInput || '').trim();
        if (answerState.customInputChecked && customValue) {
            selections.push(customValue);
        }
        if (selections.length === 0) {
            return;
        }
        const value = selections.join(', ');
        const updatedAnswers = {
            ...answers,
            [currentQuestionIndex]: {
                ...answerState,
                selectedOption: value,
            },
        };
        setAnswers(updatedAnswers);
        if (!hasMultipleQuestions) {
            onSubmit({ [currentQuestionIndex]: value });
        }
        else if (currentQuestionIndex < totalTabs - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setShowCustomInput(false);
        }
    }, [
        currentQuestion,
        answers,
        currentQuestionIndex,
        hasMultipleQuestions,
        totalTabs,
        onSubmit,
    ]);
    // Handle option selection
    const handleOptionSelect = useCallback((optionIndex) => {
        if (!currentQuestion) {
            return;
        }
        if (isMultiSelect) {
            const answerState = answers[currentQuestionIndex] || {};
            const current = answerState.multiSelectedOptions || [];
            const option = currentQuestion.options[optionIndex];
            const isChecked = current.includes(option.label);
            const updated = isChecked
                ? current.filter((l) => l !== option.label)
                : [...current, option.label];
            setAnswers({
                ...answers,
                [currentQuestionIndex]: {
                    ...answerState,
                    multiSelectedOptions: updated,
                },
            });
        }
        else {
            const option = currentQuestion.options[optionIndex];
            const answerState = answers[currentQuestionIndex] || {};
            const updated = {
                ...answerState,
                selectedOption: option.label,
                customInput: undefined,
            };
            setAnswers({ ...answers, [currentQuestionIndex]: updated });
            if (!hasMultipleQuestions) {
                onSubmit({ [currentQuestionIndex]: option.label });
            }
            else if (currentQuestionIndex < totalTabs - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setShowCustomInput(false);
            }
        }
    }, [
        currentQuestion,
        isMultiSelect,
        answers,
        currentQuestionIndex,
        hasMultipleQuestions,
        totalTabs,
        onSubmit,
    ]);
    // Handle custom input change
    const handleCustomInputChange = (value) => {
        const answerState = answers[currentQuestionIndex] || {};
        setAnswers({
            ...answers,
            [currentQuestionIndex]: {
                ...answerState,
                customInput: value,
                customInputChecked: isMultiSelect && value.trim().length > 0,
            },
        });
    };
    // Handle custom input submit
    const handleCustomInputSubmit = () => {
        const value = currentAnswer.customInput?.trim() || '';
        if (!value) {
            return;
        }
        if (isMultiSelect) {
            const answerState = answers[currentQuestionIndex] || {};
            setAnswers({
                ...answers,
                [currentQuestionIndex]: {
                    ...answerState,
                    customInputChecked: !answerState.customInputChecked,
                },
            });
        }
        else {
            const answerState = answers[currentQuestionIndex] || {};
            const updated = {
                ...answerState,
                selectedOption: value,
            };
            setAnswers({ ...answers, [currentQuestionIndex]: updated });
            if (!hasMultipleQuestions) {
                onSubmit({ [currentQuestionIndex]: value });
            }
            else if (currentQuestionIndex < totalTabs - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setShowCustomInput(false);
            }
        }
    };
    // Escape to cancel
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);
    // Focus custom input when shown
    useEffect(() => {
        if (showCustomInput && customInputRef.current) {
            customInputRef.current.focus();
        }
    }, [showCustomInput]);
    // Reset custom input visibility when switching tabs
    useEffect(() => {
        setShowCustomInput(false);
    }, [currentQuestionIndex]);
    // Shared tab bar renderer
    const renderTabs = () => (_jsxs("div", { className: "flex gap-2 mb-4 overflow-x-auto", children: [questions.map((q, idx) => {
                const isAnswered = getAnswerForQuestion(idx) !== undefined;
                const isActive = idx === currentQuestionIndex;
                return (_jsxs("button", { className: `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap cursor-pointer transition-colors border-none ${isActive
                        ? 'bg-[var(--app-button-background)] text-[var(--app-button-foreground)] font-bold'
                        : 'bg-[var(--app-button-secondary-background)] text-[var(--app-secondary-foreground)] hover:opacity-80'}`, onClick: () => setCurrentQuestionIndex(idx), children: [_jsx("span", { children: q.header }), isAnswered && _jsx("span", { className: "text-green-500", children: "\u2713" })] }, idx));
            }), _jsx("button", { className: `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap cursor-pointer transition-colors border-none ${isSubmitTab
                    ? 'bg-[var(--app-button-background)] text-[var(--app-button-foreground)] font-bold'
                    : 'bg-[var(--app-button-secondary-background)] text-[var(--app-secondary-foreground)] opacity-60 hover:opacity-80'}`, onClick: () => setCurrentQuestionIndex(totalTabs - 1), children: _jsx("span", { children: "Submit" }) })] }));
    // Container style
    const containerStyle = {
        backgroundColor: 'var(--app-input-secondary-background)',
        borderColor: 'var(--app-input-border)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    };
    // Render submit tab
    if (isSubmitTab) {
        return (_jsxs("div", { ref: containerRef, className: "fixed inset-x-4 bottom-4 z-[1000] rounded-lg border p-4 outline-none animate-slide-up", style: containerStyle, children: [renderTabs(), _jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "font-bold text-[var(--app-primary-foreground)] mb-2", children: "Your answers:" }), questions.map((q, idx) => {
                            const answer = getAnswerForQuestion(idx);
                            return (_jsxs("div", { className: "ml-2 mb-1 text-[var(--app-secondary-foreground)]", children: [_jsxs("span", { className: "font-semibold", children: [q.header, ":"] }), ' ', answer ? (_jsx("span", { style: { color: 'var(--app-link-color)' }, children: answer })) : (_jsx("span", { className: "opacity-60", children: "(not answered)" }))] }, idx));
                        })] }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx("button", { className: "px-4 py-2 rounded-md font-medium transition-colors cursor-pointer border-none", style: {
                                backgroundColor: 'var(--app-button-background)',
                                color: 'var(--app-button-foreground)',
                            }, onClick: handleSubmit, children: "Submit" }), _jsx("button", { className: "px-4 py-2 rounded-md font-medium transition-colors cursor-pointer border-none hover:opacity-80", style: {
                                backgroundColor: 'var(--app-button-secondary-background)',
                                color: 'var(--app-primary-foreground)',
                            }, onClick: onCancel, children: "Cancel" })] })] }));
    }
    // Render question tab
    return (_jsxs("div", { ref: containerRef, className: "fixed inset-x-4 bottom-4 z-[1000] rounded-lg border p-4 outline-none animate-slide-up", style: containerStyle, children: [hasMultipleQuestions && renderTabs(), _jsxs("div", { className: "mb-4", children: [!hasMultipleQuestions && (_jsx("div", { className: "mb-2", children: _jsx("span", { className: "font-bold text-lg", style: { color: 'var(--app-link-color)' }, children: currentQuestion.header }) })), _jsx("div", { className: "text-[var(--app-primary-foreground)] text-base", children: currentQuestion.question })] }), _jsxs("div", { className: "flex flex-col gap-2 mb-3", children: [currentQuestion.options.map((opt, index) => {
                        const isSelected = !isMultiSelect && currentAnswer.selectedOption === opt.label;
                        const isMultiChecked = isMultiSelect &&
                            currentAnswer.multiSelectedOptions?.includes(opt.label);
                        return (_jsxs("div", { className: "flex flex-col", children: [_jsxs("button", { className: `flex items-center gap-2 px-3 py-2 text-left w-full rounded-md border transition-colors duration-150 cursor-pointer ${isSelected || isMultiChecked
                                        ? 'bg-[var(--app-list-active-background)] text-[var(--app-list-active-foreground)]'
                                        : 'bg-[var(--app-button-secondary-background)] text-[var(--app-primary-foreground)] hover:bg-[var(--app-list-active-background)] hover:text-[var(--app-list-active-foreground)]'}`, onClick: () => handleOptionSelect(index), children: [isMultiSelect ? (_jsx("span", { className: "min-w-[18px]", children: isMultiChecked ? '☑' : '☐' })) : (_jsx("span", { className: "min-w-[18px]", children: isSelected ? '●' : '○' })), _jsx("span", { className: "flex-1", children: opt.label })] }), opt.description && (_jsx("div", { className: "ml-8 mt-1 text-sm opacity-70", style: { color: 'var(--app-secondary-foreground)' }, children: opt.description }))] }, index));
                    }), _jsx("div", { className: "flex flex-col", children: showCustomInput ? (_jsxs("div", { className: "flex items-center gap-2", children: [isMultiSelect && (_jsx("span", { className: "min-w-[18px] cursor-pointer", onClick: () => {
                                        const answerState = answers[currentQuestionIndex] || {};
                                        setAnswers({
                                            ...answers,
                                            [currentQuestionIndex]: {
                                                ...answerState,
                                                customInputChecked: !answerState.customInputChecked,
                                            },
                                        });
                                    }, children: currentAnswer.customInputChecked ? '☑' : '☐' })), _jsx("input", { ref: customInputRef, type: "text", className: "flex-1 px-3 py-2 rounded-md border focus:outline-none focus:ring-1", style: {
                                        backgroundColor: 'var(--app-input-background)',
                                        borderColor: 'var(--app-input-border)',
                                        color: 'var(--app-primary-foreground)',
                                    }, value: currentAnswer.customInput || '', onChange: (e) => handleCustomInputChange(e.target.value), onKeyDown: (e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleCustomInputSubmit();
                                        }
                                    }, placeholder: "Type your answer..." })] })) : (_jsxs("button", { className: "flex items-center gap-2 px-3 py-2 text-left w-full rounded-md border transition-colors duration-150 cursor-pointer\n                bg-[var(--app-button-secondary-background)] text-[var(--app-secondary-foreground)] hover:bg-[var(--app-list-active-background)] hover:text-[var(--app-list-active-foreground)]", onClick: () => setShowCustomInput(true), children: [_jsx("span", { className: "min-w-[18px]", children: "\u270E" }), _jsx("span", { className: "flex-1 opacity-70", children: currentAnswer.customInput || 'Other...' })] })) })] }), _jsxs("div", { className: "flex gap-2 mt-3", children: [isMultiSelect && (_jsx("button", { className: "px-4 py-2 rounded-md font-medium transition-colors cursor-pointer border-none", style: {
                            backgroundColor: 'var(--app-button-background)',
                            color: 'var(--app-button-foreground)',
                        }, onClick: handleMultiSelectConfirm, children: "Confirm" })), _jsx("button", { className: "px-4 py-2 rounded-md font-medium transition-colors cursor-pointer border-none hover:opacity-80", style: {
                            backgroundColor: 'var(--app-button-secondary-background)',
                            color: 'var(--app-primary-foreground)',
                        }, onClick: onCancel, children: "Cancel" })] })] }));
};
//# sourceMappingURL=AskUserQuestionDialog.js.map