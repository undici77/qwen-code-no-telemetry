import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider as JotaiProvider, useAtomValue } from 'jotai';
import App from './App';
import { ThemeProvider } from '@/context/ThemeContext';
import { windowWorkspaceIdAtom } from '@/atoms/sessions';
import { Toaster } from '@/components/ui/sonner';
import { setupI18n } from '@craft-agent/shared/i18n';
import { BRAND } from '@craft-agent/shared/branding';
import { initReactI18next } from 'react-i18next';
import { useTranslation } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import './index.css';
// Initialize i18n before any React rendering
setupI18n([LanguageDetector, initReactI18next]);
// Set document title from brand config
document.title = BRAND.appName;
function CrashFallback() {
    const { t } = useTranslation();
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen font-sans text-foreground/50 gap-3", children: [_jsx("p", { className: "text-base font-medium", children: t("auth.somethingWentWrong") }), _jsx("p", { className: "text-[13px]", children: t("errors.pleaseReload") }), _jsx("button", { onClick: () => window.location.reload(), className: "mt-2 px-4 py-1.5 rounded-md bg-background shadow-minimal text-[13px] text-foreground/70 cursor-pointer", children: t("common.reload") })] }));
}
function ErrorBoundary({ children }) {
    return (_jsx(React.Suspense, { fallback: _jsx(CrashFallback, {}), children: children }));
}
function Root() {
    const workspaceId = useAtomValue(windowWorkspaceIdAtom);
    return (_jsxs(ThemeProvider, { activeWorkspaceId: workspaceId, children: [_jsx(App, {}), _jsx(Toaster, {})] }));
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(ErrorBoundary, { children: _jsx(JotaiProvider, { children: _jsx(Root, {}) }) }) }));
//# sourceMappingURL=main.js.map