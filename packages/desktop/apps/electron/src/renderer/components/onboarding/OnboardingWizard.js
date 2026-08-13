import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { WelcomeStep } from "./WelcomeStep";
import { ProviderSelectStep } from "./ProviderSelectStep";
import { CredentialsStep } from "./CredentialsStep";
import { CompletionStep } from "./CompletionStep";
import { GitBashWarning } from "./GitBashWarning";
/**
 * OnboardingWizard - Full-screen onboarding flow container
 *
 * Manages the step-by-step flow for setting up the local ACP backend:
 * 1. Welcome
 * 2. Provider Select
 * 3. Connection check
 * 4. Completion
 */
export function OnboardingWizard({ state, onContinue, onBack, onSubmitCredential, onFinish, 
// Git Bash (Windows)
onBrowseGitBash, onUseGitBashPath, onRecheckGitBash, onClearError, 
// Provider select (new flow)
onSelectProvider, onSkipSetup, 
// Edit mode
editInitialValues, className }) {
    const renderStep = () => {
        switch (state.step) {
            case 'welcome':
                return (_jsx(WelcomeStep, { isExistingUser: state.isExistingUser, onContinue: onContinue, isLoading: state.isCheckingGitBash }));
            case 'git-bash':
                return (_jsx(GitBashWarning, { status: state.gitBashStatus, onBrowse: onBrowseGitBash, onUsePath: onUseGitBashPath, onRecheck: onRecheckGitBash, onBack: onBack, isRechecking: state.isRecheckingGitBash, errorMessage: state.errorMessage, onClearError: onClearError }));
            case 'provider-select':
                return (_jsx(ProviderSelectStep, { onSelect: onSelectProvider, onSkip: onSkipSetup }));
            case 'credentials':
                return (_jsx(CredentialsStep, { apiSetupMethod: state.apiSetupMethod, status: state.credentialStatus, errorMessage: state.errorMessage, onSubmit: onSubmitCredential, onBack: onBack, editInitialValues: editInitialValues }));
            case 'complete':
                return (_jsx(CompletionStep, { status: state.completionStatus, onFinish: onFinish }));
            default:
                return null;
        }
    };
    return (_jsxs("div", { className: cn("flex flex-col bg-foreground-2", !className?.includes('h-full') && "min-h-screen", className), children: [_jsx("div", { className: "titlebar-drag-region fixed top-0 left-0 right-0 h-[50px] z-titlebar" }), _jsx("main", { className: "flex flex-1 items-center justify-center p-8", children: renderStep() })] }));
}
//# sourceMappingURL=OnboardingWizard.js.map