import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SquareTerminal } from "lucide-react";
import { useTranslation } from "react-i18next";
export function ApiKeyInput({ status, errorMessage, onSubmit, formId = "api-key-form", disabled, }) {
    const { t } = useTranslation();
    return (_jsxs("form", { id: formId, onSubmit: (event) => {
            event.preventDefault();
            onSubmit({ apiKey: '' });
        }, className: "space-y-3", children: [_jsxs("div", { className: "flex items-start gap-3 rounded-xl bg-foreground-2 p-4 text-sm text-muted-foreground", children: [_jsx(SquareTerminal, { className: "mt-0.5 size-4 shrink-0" }), _jsx("p", { children: t("apiSetup.localAuthNotice") })] }), status === 'error' && errorMessage && (_jsx("div", { className: "rounded-lg bg-destructive/10 text-destructive text-sm p-3", children: errorMessage })), _jsx("button", { type: "submit", disabled: disabled || status === 'validating', className: "hidden" })] }));
}
//# sourceMappingURL=ApiKeyInput.js.map