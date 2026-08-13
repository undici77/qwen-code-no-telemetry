import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@craft-agent/ui";
import { CraftAgentsSymbol } from "@/components/icons/CraftAgentsSymbol";
import { StepFormLayout } from "./primitives";
/**
 * ReauthScreen - Simple re-login screen for expired sessions
 *
 * Shown when the user has existing workspaces/config but the Craft token
 * is missing or expired. Much simpler than full onboarding - just re-authenticate.
 */
export function ReauthScreen({ onLogin, onReset }) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onLogin();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "flex min-h-screen flex-col bg-foreground-2", children: [_jsx("div", { className: "titlebar-drag-region fixed top-0 left-0 right-0 h-[50px] z-titlebar" }), _jsx("main", { className: "flex flex-1 items-center justify-center p-8", children: _jsx(StepFormLayout, { iconElement: _jsx("div", { className: "flex size-16 items-center justify-center rounded-full bg-info/10", children: _jsx(AlertCircle, { className: "size-8 text-info" }) }), title: t("onboarding.reauth.title"), description: _jsxs(_Fragment, { children: [t("onboarding.reauth.expired"), _jsx("br", {}), t("onboarding.reauth.loginAgain"), _jsx("br", {}), _jsx("span", { className: "text-muted-foreground/70 text-xs mt-2 block", children: t("onboarding.reauth.preserved") })] }), actions: _jsxs("div", { className: "flex flex-col gap-3 w-full", children: [_jsx(Button, { onClick: handleLogin, disabled: isLoading, className: "w-full max-w-[320px] bg-background shadow-minimal text-foreground hover:bg-foreground/5 rounded-lg", size: "lg", children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Spinner, { className: "mr-2" }), t("onboarding.reauth.loggingIn")] })) : (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "mr-2 size-4" }), t("onboarding.reauth.loginWithCraft")] })) }), _jsx(Button, { variant: "ghost", onClick: onReset, disabled: isLoading, className: "w-full max-w-[320px] bg-foreground-2 shadow-minimal text-foreground hover:bg-foreground/5 rounded-lg", size: "sm", children: t("onboarding.reauth.resetApp") })] }), children: error && (_jsx("div", { className: "mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20", children: _jsx("p", { className: "text-sm text-destructive", children: error }) })) }) })] }));
}
//# sourceMappingURL=ReauthScreen.js.map