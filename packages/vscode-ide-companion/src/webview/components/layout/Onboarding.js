import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// eslint-disable-next-line import/no-internal-modules -- bundle the webview logo as a data URL
import iconUrl from '../../../../assets/icon.png';
import { ProviderSetupForm } from './ProviderSetupForm.js';
/**
 * VSCode Onboarding page.
 */
export const Onboarding = () => (_jsxs("div", { className: "flex flex-col flex-1 min-h-0 px-6", style: {
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
    }, children: [_jsxs("div", { className: "flex flex-col items-center gap-3 mb-6", children: [_jsx("img", { src: iconUrl, alt: "Qwen Code", className: "w-12 h-12 object-contain" }), _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-base font-semibold", style: { color: 'var(--app-primary-foreground)' }, children: "Qwen Code" }), _jsx("p", { className: "text-xs mt-1", style: { color: 'var(--app-secondary-foreground)' }, children: "AI-powered coding assistant for your editor" })] })] }), _jsxs("div", { className: "w-full max-w-[300px] rounded-lg border p-4", style: {
                backgroundColor: 'var(--app-input-secondary-background)',
                borderColor: 'var(--app-input-border)',
            }, children: [_jsx("p", { className: "text-xs mb-3 text-center", style: { color: 'var(--app-secondary-foreground)' }, children: "Connect a model provider to get started" }), _jsx(ProviderSetupForm, {})] }), _jsx("p", { className: "text-[10px] mt-4 text-center max-w-[260px]", style: { color: 'var(--app-secondary-foreground)', opacity: 0.6 }, children: "Supports Alibaba Cloud Coding Plan, ModelStudio API Key, and OpenAI-compatible endpoints" })] }));
//# sourceMappingURL=Onboarding.js.map