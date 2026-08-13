import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
function answerForQuestion(question, index, selectedOptions, customInputs) {
    if (!question)
        return undefined;
    const selected = selectedOptions[index] ?? [];
    const custom = customInputs[index]?.trim();
    if (!question.multiSelect)
        return custom || selected[0];
    const answers = custom ? [...selected, custom] : selected;
    return answers.length > 0 ? answers.join(', ') : undefined;
}
export function AskUserQuestionRequest({ request, onSubmit, onCancel, unstyled = false }) {
    const { t } = useTranslation();
    const questions = request.questions ?? [];
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [selectedOptions, setSelectedOptions] = React.useState({});
    const [customInputs, setCustomInputs] = React.useState({});
    const activeQuestion = questions[activeIndex];
    const hasMultipleQuestions = questions.length > 1;
    const allAnswered = questions.every((question, index) => answerForQuestion(question, index, selectedOptions, customInputs));
    const toggleOption = (label) => {
        if (!activeQuestion)
            return;
        if (!activeQuestion.multiSelect) {
            setCustomInputs((prev) => {
                if (!prev[activeIndex])
                    return prev;
                return { ...prev, [activeIndex]: '' };
            });
        }
        setSelectedOptions((prev) => {
            const current = prev[activeIndex] ?? [];
            if (activeQuestion.multiSelect) {
                const next = current.includes(label) ? current.filter((item) => item !== label) : [...current, label];
                return { ...prev, [activeIndex]: next };
            }
            const next = current.includes(label) ? [] : [label];
            return { ...prev, [activeIndex]: next };
        });
    };
    const updateCustomInput = (value) => {
        if (!activeQuestion)
            return;
        setCustomInputs((prev) => ({
            ...prev,
            [activeIndex]: value
        }));
        if (!activeQuestion.multiSelect && value.length > 0) {
            setSelectedOptions((prev) => {
                if (!(prev[activeIndex] ?? []).length)
                    return prev;
                return { ...prev, [activeIndex]: [] };
            });
        }
    };
    const handleSubmit = () => {
        const answers = {};
        questions.forEach((question, index) => {
            const answer = answerForQuestion(question, index, selectedOptions, customInputs);
            if (answer) {
                answers[String(index)] = answer;
            }
        });
        onSubmit(answers);
    };
    if (!activeQuestion) {
        return (_jsxs("div", { className: cn('overflow-hidden h-full flex flex-col bg-info/5', unstyled ? 'border-0' : 'border border-info/30 rounded-[8px] shadow-middle'), children: [_jsx("div", { className: "p-4 text-xs text-muted-foreground", children: request.description || 'The agent is asking for input.' }), _jsx("div", { className: "flex items-center gap-2 px-3 py-2 border-t border-border/50", children: _jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 gap-1.5", onClick: onCancel, children: [_jsx(X, { className: "h-3.5 w-3.5" }), "Cancel"] }) })] }));
    }
    return (_jsxs("div", { className: cn('overflow-hidden h-full flex flex-col bg-info/5', unstyled ? 'border-0' : 'border border-info/30 rounded-[8px] shadow-middle'), children: [_jsxs("div", { className: "p-4 space-y-3 flex-1 min-h-0 flex flex-col", children: [_jsxs("div", { className: "space-y-2 pb-1", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-sm font-medium text-foreground", children: [_jsx(HelpCircle, { className: "h-3.5 w-3.5 text-info" }), _jsx("span", { children: request.description || 'Please answer the question' })] }), hasMultipleQuestions && (_jsx("div", { className: "flex flex-wrap items-center gap-1.5", children: questions.map((question, index) => {
                                    const answered = !!answerForQuestion(question, index, selectedOptions, customInputs);
                                    const active = index === activeIndex;
                                    return (_jsxs("button", { type: "button", onClick: () => setActiveIndex(index), className: cn('h-6 rounded-[5px] px-2 text-[11px] transition-colors', 'border border-foreground/10 hover:bg-foreground/5', active && 'bg-foreground/8 text-foreground', !active && 'text-muted-foreground'), children: [question.header, answered ? ' done' : ''] }, `${question.header}-${index}`));
                                }) }))] }), _jsxs("div", { className: "space-y-3 min-h-0 overflow-y-auto pr-1", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm leading-5 text-foreground", children: activeQuestion.question }), activeQuestion.multiSelect && _jsx("div", { className: "mt-1 text-[11px] text-muted-foreground", children: "Select one or more options." })] }), _jsx("div", { className: "space-y-1.5", children: activeQuestion.options.map((option) => {
                                    const selected = (selectedOptions[activeIndex] ?? []).includes(option.label);
                                    return (_jsx("button", { type: "button", onClick: () => toggleOption(option.label), className: cn('w-full rounded-[6px] border px-3 py-2 text-left transition-colors', selected ? 'border-info/40 bg-info/10 text-foreground' : 'border-foreground/10 bg-background/40 hover:bg-foreground/5'), children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border text-[10px]', selected ? 'border-info bg-info text-info-foreground' : 'border-foreground/20'), children: selected ? _jsx(Check, { className: "h-3 w-3" }) : null }), _jsxs("span", { className: "min-w-0", children: [_jsx("span", { className: "block text-xs font-medium leading-4", children: option.label }), option.description && _jsx("span", { className: "mt-0.5 block text-[11px] leading-4 text-muted-foreground", children: option.description })] })] }) }, option.label));
                                }) }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "mb-1 block text-[11px] text-muted-foreground", children: "Other" }), _jsx("textarea", { value: customInputs[activeIndex] ?? '', onChange: (event) => updateCustomInput(event.target.value), placeholder: t('Type something...'), className: cn('min-h-16 w-full resize-none rounded-[6px] border border-foreground/10', 'bg-background/60 px-3 py-2 text-xs leading-5 text-foreground outline-none', 'placeholder:text-muted-foreground focus:border-info/50 focus:ring-1 focus:ring-info/30') })] })] })] }), _jsxs("div", { className: "flex items-center gap-2 px-3 py-2 border-t border-border/50", children: [_jsxs(Button, { size: "sm", variant: "default", className: "h-7 gap-1.5", onClick: handleSubmit, disabled: !allAnswered, children: [_jsx(Check, { className: "h-3.5 w-3.5" }), "Submit"] }), _jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 gap-1.5 text-destructive hover:text-destructive border border-dashed border-destructive/50 hover:bg-destructive/10 hover:border-destructive/70 active:bg-destructive/20", onClick: onCancel, children: [_jsx(X, { className: "h-3.5 w-3.5" }), "Cancel"] }), hasMultipleQuestions && (_jsxs("span", { className: "ml-auto text-[10px] text-muted-foreground", children: [activeIndex + 1, " / ", questions.length] }))] })] }));
}
//# sourceMappingURL=AskUserQuestionRequest.js.map