import type { WebShellLanguage } from '../i18n';
interface RootErrorFallbackProps {
  error: Error;
  onRetry: () => void;
  /** Selects the fallback copy. Defaults to English when omitted. */
  language?: WebShellLanguage;
}
/**
 * Last-resort surface for the top-level boundary. Self-contained (no provider,
 * theme-token, or i18n dependency) so it survives even when the whole App tree
 * fails to mount. Offers a retry instead of forcing a host-page reload, which
 * would be hostile in embedded integrations.
 */
export declare function RootErrorFallback({
  error,
  onRetry,
  language,
}: RootErrorFallbackProps): import('react/jsx-runtime').JSX.Element;
export {};
