import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
const AUTH_LABELS = {
    'qwen-oauth': 'Qwen OAuth',
    openai: 'OpenAI-compatible',
    gemini: 'Gemini',
    anthropic: 'Anthropic',
    'vertex-ai': 'Vertex AI',
};
export const AccountInfoDialog = ({ info, onClose, }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    const rows = [];
    if (info.error) {
        rows.push({ label: 'Error', value: info.error });
    }
    else {
        const authLabel = AUTH_LABELS[info.authType ?? ''] ?? info.authType ?? 'Unknown';
        rows.push({ label: 'Auth Method', value: authLabel });
        if (info.envKey) {
            rows.push({ label: 'API Key Env', value: info.envKey });
        }
        if (info.baseUrl) {
            rows.push({ label: 'Base URL', value: info.baseUrl });
        }
        if (info.modelId) {
            rows.push({ label: 'Current Model', value: info.modelId });
        }
    }
    return (_jsx("div", { className: "fixed inset-0 z-[1000] flex items-center justify-center", style: { backgroundColor: 'rgba(0,0,0,0.45)' }, onClick: onClose, children: _jsxs("div", { className: "relative w-[480px] rounded-lg border p-5 shadow-xl", style: {
                backgroundColor: 'var(--app-input-secondary-background)',
                borderColor: 'var(--app-input-border)',
            }, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("span", { className: "font-semibold text-base", style: { color: 'var(--app-primary-foreground)' }, children: "Account Information" }), _jsx("button", { className: "flex items-center justify-center w-6 h-6 rounded cursor-pointer border-none text-lg leading-none hover:opacity-70", style: {
                                backgroundColor: 'transparent',
                                color: 'var(--app-secondary-foreground)',
                            }, onClick: onClose, "aria-label": "Close", children: "\u00D7" })] }), _jsx("div", { className: "flex flex-col gap-2", children: rows.map(({ label, value, accent }) => (_jsxs("div", { className: "flex justify-between items-start gap-3", children: [_jsx("span", { className: "text-sm shrink-0", style: { color: 'var(--app-secondary-foreground)' }, children: label }), _jsx("span", { className: "text-sm text-right break-all", style: {
                                    color: accent
                                        ? 'var(--app-link-color)'
                                        : 'var(--app-primary-foreground)',
                                }, children: value })] }, label))) })] }) }));
};
//# sourceMappingURL=AccountInfoDialog.js.map