import { jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Spinner } from "@craft-agent/ui";
import { CraftAgentsSymbol } from "@/components/icons/CraftAgentsSymbol";
import { StepFormLayout } from "./primitives";
/**
 * CompletionStep - Success screen after onboarding
 *
 * Shows:
 * - saving: Spinner while saving configuration
 * - complete: Success message with option to start
 */
export function CompletionStep({ status, spaceName, onFinish }) {
    const { t } = useTranslation();
    const isSaving = status === 'saving';
    return (_jsx(StepFormLayout, { iconElement: isSaving ? (_jsx("div", { className: "flex size-16 items-center justify-center", children: _jsx(Spinner, { className: "text-2xl text-foreground" }) })) : (_jsx("div", { className: "flex size-16 items-center justify-center", children: _jsx(CraftAgentsSymbol, { className: "size-10 text-accent" }) })), title: isSaving ? t("onboarding.completion.settingUp") : t("onboarding.completion.allSet"), description: isSaving ? (t("onboarding.completion.savingConfig")) : (t("onboarding.completion.startChat")), actions: status === 'complete' ? (_jsx(Button, { onClick: onFinish, className: "w-full max-w-[320px] bg-background shadow-minimal text-foreground hover:bg-foreground/5 rounded-lg", size: "lg", children: t("onboarding.welcome.getStarted") })) : undefined }));
}
//# sourceMappingURL=CompletionStep.js.map