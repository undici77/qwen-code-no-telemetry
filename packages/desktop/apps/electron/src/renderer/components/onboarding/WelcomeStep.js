import { jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { CraftAgentsSymbol } from "@/components/icons/CraftAgentsSymbol";
import { StepFormLayout, ContinueButton } from "./primitives";
/**
 * WelcomeStep - Initial welcome screen for onboarding
 *
 * Shows different messaging for new vs existing users:
 * - New users: Welcome to the app
 * - Existing users: Update your API connection settings
 */
export function WelcomeStep({ onContinue, isExistingUser = false, isLoading = false }) {
    const { t } = useTranslation();
    return (_jsx(StepFormLayout, { iconElement: _jsx("div", { className: "flex size-16 items-center justify-center", children: _jsx(CraftAgentsSymbol, { className: "size-10 text-accent" }) }), title: isExistingUser ? t("onboarding.welcome.updateTitle") : t("onboarding.welcome.title"), description: isExistingUser
            ? t("onboarding.welcome.updateDescription")
            : t("onboarding.welcome.description"), actions: _jsx(ContinueButton, { onClick: onContinue, className: "w-full", loading: isLoading, loadingText: t("common.checking"), children: isExistingUser ? t("onboarding.welcome.continue") : t("onboarding.welcome.getStarted") }) }));
}
//# sourceMappingURL=WelcomeStep.js.map