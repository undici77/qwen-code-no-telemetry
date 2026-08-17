import { jsx as _jsx } from 'react/jsx-runtime';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { useCallback, useEffect, useState } from 'react';
import { DaemonWorkspaceProvider } from '@qwen-code/webui/daemon-react-sdk';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RootErrorFallback } from './components/RootErrorFallback';
import { WorkspaceSessionProvider } from './components/WorkspaceSessionProvider';
import {
  getDaemonBaseUrl,
  getDaemonToken,
  removeDaemonTokenFromUrl,
  waitForDaemonTokenMessage,
} from './config/daemon';
import { normalizeLanguage } from './i18n';
import { WebShellThemeId } from './themeContext';
import { buildSessionPathname, parseSessionId } from './utils/sessionPath';
import 'katex/dist/katex.min.css';
import './styles/standalone.css';
const DAEMON_BASE_URL = getDaemonBaseUrl();
const LANGUAGE_STORAGE_KEY = 'qwen-code-web-shell-language';
const THEME_STORAGE_KEY = 'qwen-code-web-shell-theme';
function parseTheme(value) {
  if (value === WebShellThemeId.Dark || value === WebShellThemeId.Light) {
    return value;
  }
  return undefined;
}
function getThemeFromUrl() {
  const theme = new URLSearchParams(window.location.search).get('theme');
  return parseTheme(theme);
}
function readStoredTheme() {
  try {
    return parseTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return undefined;
  }
}
function storeTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures in private browsing or locked-down browsers.
  }
}
function getInitialTheme() {
  return getThemeFromUrl() ?? readStoredTheme() ?? WebShellThemeId.Dark;
}
function readStoredLanguage() {
  try {
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return raw ? normalizeLanguage(raw) : undefined;
  } catch {
    return undefined;
  }
}
function storeLanguage(language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore storage failures in private browsing or locked-down browsers.
  }
}
function getInitialLanguage() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('language') ?? params.get('lang');
  if (raw) return normalizeLanguage(raw);
  return normalizeLanguage(readStoredLanguage() ?? navigator.language);
}
function getSessionIdFromUrl() {
  return parseSessionId(window.location.pathname);
}
function getWorkspaceIdFromUrl() {
  return (
    new URLSearchParams(window.location.search).get('workspace') || undefined
  );
}
function replaceStandaloneSessionUrl(sessionId, workspaceId) {
  const url = new URL(window.location.href);
  url.pathname = buildSessionPathname(url.pathname, sessionId);
  if (sessionId && workspaceId) {
    url.searchParams.set('workspace', workspaceId);
  } else {
    url.searchParams.delete('workspace');
  }
  // Strip one-shot query params so bookmarked / shared URLs do not
  // permanently override stored preferences on every page load.
  url.searchParams.delete('theme');
  url.searchParams.delete('language');
  url.searchParams.delete('lang');
  if (!import.meta.env.DEV) {
    url.searchParams.delete('token');
    url.searchParams.delete('daemon');
  }
  window.history.replaceState(null, '', url);
}
export function StandaloneApp({ daemonToken }) {
  const [theme, setTheme] = useState(() => getInitialTheme());
  const [language, setLanguage] = useState(() => getInitialLanguage());
  const [sessionId, setSessionId] = useState(() => getSessionIdFromUrl());
  const [workspaceId, setWorkspaceId] = useState(() => getWorkspaceIdFromUrl());
  const baseUrl = DAEMON_BASE_URL || window.location.origin;
  // Keep the <html> theme class and <meta name="theme-color"> in sync with
  // the React theme so mobile status bars / overscroll backgrounds stay
  // consistent when the user toggles or when ?theme= lands via URL.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'dark');
    root.classList.add(`theme-${theme}`);
    root.classList.toggle('dark', theme === WebShellThemeId.Dark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'light' ? '#ffffff' : '#0d0d0d');
    }
  }, [theme]);
  const handleThemeChange = useCallback((nextTheme) => {
    setTheme(nextTheme);
    storeTheme(nextTheme);
  }, []);
  const handleLanguageChange = useCallback((nextLanguage) => {
    setLanguage(nextLanguage);
    storeLanguage(nextLanguage);
  }, []);
  const handleSessionIdChange = useCallback(
    (nextSessionId, nextWorkspaceId) => {
      setSessionId(nextSessionId);
      setWorkspaceId(nextWorkspaceId);
      replaceStandaloneSessionUrl(nextSessionId, nextWorkspaceId);
    },
    [],
  );
  return _jsx(ErrorBoundary, {
    label: 'web-shell-root',
    fallback: (error, reset) =>
      _jsx(RootErrorFallback, {
        error: error,
        onRetry: reset,
        language: language,
      }),
    children: _jsx(DaemonWorkspaceProvider, {
      baseUrl: baseUrl,
      token: daemonToken,
      children: _jsx(WorkspaceSessionProvider, {
        sessionId: sessionId,
        workspaceId: workspaceId,
        webShellProps: {
          theme,
          onThemeChange: handleThemeChange,
          language,
          onLanguageChange: handleLanguageChange,
          onSessionIdChange: handleSessionIdChange,
          sidebar: true,
          header: {
            items: ['title', 'environment', 'rightPanel'],
          },
          rightPanel: {
            items: ['review', 'sideTask'],
          },
          environmentPanel: {
            items: ['environment', 'subagents', 'backgroundTasks'],
          },
          compactThinking: true,
          markdownTableMode: 'advanced',
        },
      }),
    }),
  });
}
async function main() {
  const daemonToken = getDaemonToken() ?? (await waitForDaemonTokenMessage());
  removeDaemonTokenFromUrl();
  ReactDOM.createRoot(document.getElementById('root')).render(
    _jsx(React.StrictMode, {
      children: _jsx(StandaloneApp, { daemonToken: daemonToken }),
    }),
  );
}
void main();
//# sourceMappingURL=main.js.map
