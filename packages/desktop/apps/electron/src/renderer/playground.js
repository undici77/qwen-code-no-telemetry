import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// IMPORTANT: keep `mock-utils` as the FIRST local import. It installs the
// mock `window.electronAPI` as a top-level side effect on import, so that
// any renderer module that reads `window.electronAPI.*` at module-load time
// (e.g. `SessionFilesSection.tsx`'s top-level `getRuntimeEnvironment()`
// call) finds the mock in place before its own module is evaluated.
import './playground/mock-utils';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider as JotaiProvider } from 'jotai';
import { setupI18n } from '@craft-agent/shared/i18n';
import { initReactI18next } from 'react-i18next';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from './components/ui/sonner';
import { PlaygroundApp } from './playground/PlaygroundApp';
import { EscapeInterruptProvider } from './context/EscapeInterruptContext';
import { PlaygroundAppShellProvider } from './playground/PlaygroundAppShellProvider';
import './index.css';
// Initialize i18n before any React rendering. `useTranslation()` reads from
// the shared global instance, so we don't need an <I18nextProvider>.
setupI18n([initReactI18next]);
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(JotaiProvider, { children: _jsx(ThemeProvider, { children: _jsx(EscapeInterruptProvider, { children: _jsxs(PlaygroundAppShellProvider, { children: [_jsx(PlaygroundApp, {}), _jsx(Toaster, {})] }) }) }) }) }));
//# sourceMappingURL=playground.js.map