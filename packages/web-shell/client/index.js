import { jsx as _jsx } from 'react/jsx-runtime';
import {} from 'react';
import { DaemonWorkspaceProvider } from '@qwen-code/webui/daemon-react-sdk';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RootErrorFallback } from './components/RootErrorFallback';
import { WorkspaceSessionProvider } from './components/WorkspaceSessionProvider';
import { normalizeLanguage } from './i18n';
export { WebShellTranscript } from './components/WebShellTranscript';
function resolveBaseUrl(baseUrl) {
  if (baseUrl) return baseUrl;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
/**
 * Top-level boundary so a catastrophic render failure degrades to a recoverable
 * fallback instead of taking down the host page. Place it at the outermost point
 * each entry owns: a boundary nested *inside* the daemon providers can't catch a
 * throw from the providers themselves, so the batteries-included paths wrap the
 * providers too.
 */
function RootBoundary({ language, children }) {
  return _jsx(ErrorBoundary, {
    label: 'web-shell-root',
    fallback: (error, reset) =>
      _jsx(RootErrorFallback, {
        error: error,
        onRetry: reset,
        language: language,
      }),
    children: children,
  });
}
/**
 * Low-level UI component. Requires ancestor `DaemonWorkspaceProvider` and
 * `DaemonSessionProvider` from `@qwen-code/webui/daemon-react-sdk`. The consumer
 * owns those providers, so this boundary covers only what we render (`App`).
 */
export function WebShell(props) {
  return _jsx(RootBoundary, {
    language: props.language ? normalizeLanguage(props.language) : undefined,
    children: _jsx(App, { ...props }),
  });
}
/**
 * Batteries-included component for product integrations. It wraps WebShell
 * with both daemon providers, so MCP/tools/skills/memory/agents/session APIs
 * are available without extra setup.
 */
export function WebShellWithProviders(props) {
  const {
    baseUrl,
    token,
    sessionId,
    workspaceId,
    workspaceCwd,
    lockWorkspaceCwd,
    clientId,
    restartSseOnPrompt,
    historyPageSize,
    ...webShellProps
  } = props;
  const resolvedBaseUrl = resolveBaseUrl(baseUrl);
  return _jsx(RootBoundary, {
    language: webShellProps.language
      ? normalizeLanguage(webShellProps.language)
      : undefined,
    children: _jsx(DaemonWorkspaceProvider, {
      baseUrl: resolvedBaseUrl,
      token: token,
      children: _jsx(WorkspaceSessionProvider, {
        sessionId: sessionId,
        workspaceId: workspaceId,
        workspaceCwd: workspaceCwd,
        lockWorkspaceCwd: lockWorkspaceCwd,
        clientId: clientId,
        restartSseOnPrompt: restartSseOnPrompt,
        historyPageSize: historyPageSize,
        webShellProps: webShellProps,
      }),
    }),
  });
}
/** Alias for consumers who prefer a standalone naming style. */
export const StandaloneWebShell = WebShellWithProviders;
export {
  ECHARTS_FULLDATA_LANGUAGE,
  EchartsFullDataBlock,
  createMarkdownChartRegistry,
  createEchartsFullDataRenderer,
} from './components/messages/MarkdownChartRenderer';
//# sourceMappingURL=index.js.map
