import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * OAuthConnect - Reusable OAuth connection control
 *
 * Renders content for two flow states:
 * 1. Waiting for code: Auth code input form (form ID binds to external submit button)
 * 2. Non-waiting: Error message display (if any)
 *
 * Does NOT include layout wrappers or action buttons — the parent controls
 * button placement and loading states. Error display follows the same pattern
 * as ApiKeyInput (shown below the content area).
 *
 * Used in: Onboarding CredentialsStep, Settings OAuth dialog
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
export function OAuthConnect({ status, errorMessage, isWaitingForCode, onSubmitAuthCode, formId = "auth-code-form", }) {
    const { t } = useTranslation();
    const [authCode, setAuthCode] = useState('');
    const handleAuthCodeSubmit = (e) => {
        e.preventDefault();
        if (authCode.trim() && onSubmitAuthCode) {
            onSubmitAuthCode(authCode.trim());
        }
    };
    // Auth code entry form — shown when waiting for the user to paste the code
    if (isWaitingForCode) {
        return (_jsx("form", { id: formId, onSubmit: handleAuthCodeSubmit, children: _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "auth-code", children: t("apiSetup.authorizationCode") }), _jsx("div", { className: cn("relative rounded-md shadow-minimal transition-colors", "bg-foreground-2 focus-within:bg-background"), children: _jsx(Input, { id: "auth-code", type: "text", value: authCode, onChange: (e) => setAuthCode(e.target.value), placeholder: t("apiSetup.pasteAuthCode"), className: cn("border-0 bg-transparent shadow-none font-mono text-sm", status === 'error' && "focus-visible:ring-destructive"), disabled: status === 'validating', autoFocus: true }) }), status === 'error' && errorMessage && (_jsx("p", { className: "text-sm text-destructive", children: errorMessage }))] }) }));
    }
    // Non-waiting states: show error message if present
    const showError = status === 'error' && !!errorMessage;
    // Nothing to render — avoid empty wrapper div
    if (!showError)
        return null;
    return (_jsx("div", { className: "space-y-3", children: _jsx("div", { className: "rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center", children: errorMessage }) }));
}
//# sourceMappingURL=OAuthConnect.js.map