import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Check, SquareTerminal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { StepFormLayout, BackButton, ContinueButton } from "./primitives";
export function apiSetupMethodToConnectionTypes(_method) {
    return { providerType: 'qwen', authType: 'none' };
}
export function APISetupStep({ selectedMethod, onSelect, onContinue, onBack, }) {
    const { t } = useTranslation();
    const isSelected = selectedMethod === 'qwen_code';
    return (_jsx(StepFormLayout, { title: t("onboarding.apiSetup.title"), description: t("onboarding.apiSetup.qwenCodeDescription"), actions: _jsxs(_Fragment, { children: [_jsx(BackButton, { onClick: onBack }), _jsx(ContinueButton, { onClick: onContinue, disabled: !selectedMethod })] }), children: _jsxs("button", { onClick: () => onSelect('qwen_code'), className: cn("flex w-full items-start gap-4 rounded-xl p-4 text-left transition-all", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", "hover:bg-foreground/[0.02] shadow-minimal", isSelected ? "bg-background" : "bg-foreground-2"), children: [_jsx("div", { className: cn("flex size-10 shrink-0 items-center justify-center rounded-lg", isSelected ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground"), children: _jsx(SquareTerminal, { className: "size-4" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "font-medium text-sm", children: t("onboarding.apiSetup.qwenCodeName") }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("onboarding.apiSetup.qwenCodeDetail") })] }), _jsx("div", { className: cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors", isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-muted-foreground/20"), children: isSelected && _jsx(Check, { className: "size-3", strokeWidth: 3 }) })] }) }));
}
//# sourceMappingURL=APISetupStep.js.map