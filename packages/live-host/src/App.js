import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Qwen Code Session Viewer
 *
 * A minimal web app for viewing Qwen Code session transcripts.
 * Users can upload session JSON files or view shared sessions via URL.
 *
 * Routes:
 * - / - Upload interface
 * - /s/{id} - View shared session
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { SessionViewer, GenericOverlay, CodePreviewOverlay, MultiDiffPreviewOverlay, TerminalPreviewOverlay, JSONPreviewOverlay, DocumentFormattedMarkdownOverlay, TooltipProvider, extractOverlayData, detectLanguage, openExternalUrl, } from '@craft-agent/ui';
import { SessionUpload } from './components/SessionUpload';
import { Header } from './components/Header';
/** Default session ID for development */
const DEV_SESSION_ID = 'tz5-13I84pwK_he';
/** Extract session ID from URL path /s/{id} */
function getSessionIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/^\/s\/([a-zA-Z0-9_-]+)$/);
    if (match)
        return match[1];
    // In development, redirect root to default session
    if (import.meta.env.DEV && path === '/') {
        window.history.replaceState({}, '', `/s/${DEV_SESSION_ID}`);
        return DEV_SESSION_ID;
    }
    return null;
}
export function App() {
    const { t } = useTranslation();
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(() => getSessionIdFromUrl());
    const [isDark, setIsDark] = useState(() => {
        // Check system preference on mount
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    // Fetch session from API when we have a session ID
    useEffect(() => {
        if (!sessionId)
            return;
        const fetchSession = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/s/api/${sessionId}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        setError(t('errors.sessionNotFound'));
                    }
                    else {
                        setError(t('errors.failedToLoadSession'));
                    }
                    return;
                }
                const data = await response.json();
                setSession(data);
            }
            catch (err) {
                console.error('Failed to fetch session:', err);
                setError(t('errors.failedToLoadSession'));
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchSession();
    }, [sessionId]);
    // Handle browser navigation
    useEffect(() => {
        const handlePopState = () => {
            const newId = getSessionIdFromUrl();
            setSessionId(newId);
            if (!newId) {
                setSession(null);
                setError(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);
    // Apply dark mode class to html element
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);
    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => setIsDark(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);
    const handleSessionLoad = useCallback((loadedSession) => {
        setSession(loadedSession);
    }, []);
    const handleClear = useCallback(() => {
        setSession(null);
        setSessionId(null);
        setError(null);
        // Update URL to root
        window.history.pushState({}, '', '/');
    }, []);
    const toggleTheme = useCallback(() => {
        setIsDark(prev => !prev);
    }, []);
    // State for overlay
    const [overlayActivity, setOverlayActivity] = useState(null);
    // State for multi-diff overlay (Edit/Write activities shown as diffs)
    const [multiDiffState, setMultiDiffState] = useState(null);
    // Handle activity click - Edit/Write opens multi-diff, others use extractOverlayData
    const handleActivityClick = useCallback((activity) => {
        if (activity.toolName === 'Edit' || activity.toolName === 'Write') {
            const input = activity.toolInput;
            // Canonical fields are primary; structured edit fields are additive fallbacks.
            const filePath = input?.file_path || input?.path || 'unknown';
            const change = {
                id: activity.id,
                filePath,
                toolType: activity.toolName,
                original: activity.toolName === 'Edit'
                    ? (input?.old_string || input?.oldText || '')
                    : '',
                modified: activity.toolName === 'Edit'
                    ? (input?.new_string || input?.newText || '')
                    : (input?.content || ''),
                error: activity.error || undefined,
            };
            setMultiDiffState({ changes: [change] });
        }
        else {
            setOverlayActivity(activity);
        }
    }, []);
    const handleCloseOverlay = useCallback(() => {
        setOverlayActivity(null);
        setMultiDiffState(null);
    }, []);
    // Extract overlay data using shared parser (non-Edit/Write tools only)
    const overlayData = useMemo(() => {
        if (!overlayActivity)
            return null;
        return extractOverlayData(overlayActivity);
    }, [overlayActivity]);
    // Platform actions for the viewer (limited functionality)
    const platformActions = {
        onOpenUrl: (url) => {
            const result = openExternalUrl(url);
            if (!result.opened) {
                const detail = result.reason === 'dangerous' ? result.detail : result.reason;
                console.warn('[viewer:onOpenUrl] blocked URL:', detail, url);
            }
        },
        onCopyToClipboard: async (text) => {
            await navigator.clipboard.writeText(text);
        },
    };
    const theme = isDark ? 'dark' : 'light';
    return (_jsx(TooltipProvider, { children: _jsxs("div", { className: "h-full flex flex-col bg-foreground-2 text-foreground", children: [_jsx(Header, { hasSession: !!session, sessionTitle: session?.name, isDark: isDark, onToggleTheme: toggleTheme, onClear: handleClear }), isLoading ? (_jsx("div", { className: "flex-1 flex items-center justify-center p-8", children: _jsx("div", { className: "text-center text-muted-foreground", children: _jsx("div", { className: "animate-pulse", children: "Loading session..." }) }) })) : error ? (_jsx("div", { className: "flex-1 flex items-center justify-center p-8", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-destructive mb-4", children: error }), _jsx("button", { onClick: handleClear, className: "px-4 py-2 rounded-md bg-background text-foreground shadow-sm border border-border hover:bg-foreground/5 transition-colors", children: "Go back" })] }) })) : session ? (_jsx(SessionViewer, { session: session, mode: "readonly", platformActions: platformActions, defaultExpanded: false, className: "flex-1 min-h-0", onActivityClick: handleActivityClick })) : (_jsx("div", { className: "flex-1 flex items-center justify-center p-8", children: _jsx(SessionUpload, { onSessionLoad: handleSessionLoad }) })), overlayData?.type === 'code' && (_jsx(CodePreviewOverlay, { isOpen: !!overlayActivity, onClose: handleCloseOverlay, content: overlayData.content, filePath: overlayData.filePath, mode: overlayData.mode, startLine: overlayData.startLine, totalLines: overlayData.totalLines, numLines: overlayData.numLines, theme: theme, error: overlayData.error, command: overlayData.command })), multiDiffState && (_jsx(MultiDiffPreviewOverlay, { isOpen: true, onClose: handleCloseOverlay, changes: multiDiffState.changes, consolidated: false, theme: theme })), overlayData?.type === 'terminal' && (_jsx(TerminalPreviewOverlay, { isOpen: !!overlayActivity, onClose: handleCloseOverlay, command: overlayData.command, output: overlayData.output, exitCode: overlayData.exitCode, toolType: overlayData.toolType, description: overlayData.description, theme: theme })), overlayData?.type === 'json' && (_jsx(JSONPreviewOverlay, { isOpen: !!overlayActivity, onClose: handleCloseOverlay, data: overlayData.data, title: overlayData.title, theme: theme, error: overlayData.error })), overlayData?.type === 'document' && (_jsx(DocumentFormattedMarkdownOverlay, { isOpen: !!overlayActivity, onClose: handleCloseOverlay, content: overlayData.content, filePath: overlayData.filePath, typeBadge: { icon: FileText, label: overlayData.toolName, variant: 'default' }, onOpenUrl: platformActions.onOpenUrl, error: overlayData.error })), overlayData?.type === 'generic' && (detectLanguage(overlayData.content) === 'markdown' ? (_jsx(DocumentFormattedMarkdownOverlay, { isOpen: !!overlayActivity, onClose: handleCloseOverlay, content: overlayData.content, onOpenUrl: platformActions.onOpenUrl, error: overlayData.error })) : (_jsx(GenericOverlay, { isOpen: !!overlayActivity, onClose: handleCloseOverlay, content: overlayData.content, title: overlayData.title, theme: theme })))] }) }));
}
//# sourceMappingURL=App.js.map