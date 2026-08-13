import { jsx as _jsx } from "react/jsx-runtime";
import '../styles/globals.css';
import { useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { CompactModeContext, TodoDetailContext, TodoTimelineContext, } from '../App';
import { WebShellCustomizationProvider, } from '../customization';
import { ErrorBoundary } from './ErrorBoundary';
import { MessageList } from './MessageList';
import { RootErrorFallback } from './RootErrorFallback';
import { getTranslator, I18nProvider, normalizeLanguage, } from '../i18n';
import { transcriptBlocksToLocalizedMessages } from '../hooks/useMessages';
import { WebShellPortalRootContext } from '../portalRoot';
import { computeTodoDetails, computeTodoTimeline } from '../utils/todos';
import { ThemeProvider, WebShellThemeId, } from '../themeContext';
import { TranscriptRenderModeProvider } from '../transcriptRenderMode';
import styles from '../App.module.css';
const DEFAULT_CHAT_MAX_WIDTH = 1000;
const CHAT_SHELL_HORIZONTAL_PADDING = 40;
function resolveLanguage(language) {
    if (language !== undefined)
        return normalizeLanguage(language);
    if (typeof window === 'undefined')
        return 'en';
    const params = new URLSearchParams(window.location.search);
    return normalizeLanguage(params.get('language') ?? params.get('lang') ?? navigator.language);
}
function getChatWidthStyle(chatMaxWidth) {
    const width = typeof chatMaxWidth === 'number' &&
        Number.isFinite(chatMaxWidth) &&
        chatMaxWidth > 0
        ? chatMaxWidth
        : DEFAULT_CHAT_MAX_WIDTH;
    const contentWidth = `${width}px`;
    const shellWidth = `calc(${contentWidth} + ${CHAT_SHELL_HORIZONTAL_PADDING}px)`;
    return {
        '--chat-regular-content-width': contentWidth,
        '--chat-regular-shell-width': shellWidth,
        '--chat-content-width': contentWidth,
        '--chat-shell-width': shellWidth,
    };
}
function WebShellTranscriptContent({ blocks, theme = WebShellThemeId.Dark, language, className, style, chatMaxWidth, workspaceCwd = '', compactThinking = false, collapseCompletedTurns = true, markdownTableMode = 'basic', virtualScrollThreshold, markdown, composerTagIcons, renderToolHeaderExtra, parseUserMessageContent, renderUserMessageContent, renderComposerTag, renderComposerTagTooltip, renderAssistantTurnFooter, }) {
    const resolvedLanguage = resolveLanguage(language);
    const t = useMemo(() => getTranslator(resolvedLanguage), [resolvedLanguage]);
    const messages = useMemo(() => transcriptBlocksToLocalizedMessages(blocks, t), [blocks, t]);
    const todoDetails = useMemo(() => computeTodoDetails(messages), [messages]);
    const todoTimeline = useMemo(() => computeTodoTimeline(messages), [messages]);
    const customization = useMemo(() => ({
        composerTagIcons,
        renderToolHeaderExtra,
        parseUserMessageContent,
        renderUserMessageContent,
        renderComposerTag,
        renderComposerTagTooltip,
        renderAssistantTurnFooter,
        compactThinking,
        collapseCompletedTurns,
        markdownTableMode,
        markdown,
    }), [
        collapseCompletedTurns,
        compactThinking,
        composerTagIcons,
        markdown,
        markdownTableMode,
        parseUserMessageContent,
        renderAssistantTurnFooter,
        renderComposerTag,
        renderComposerTagTooltip,
        renderToolHeaderExtra,
        renderUserMessageContent,
    ]);
    const rootRef = useRef(null);
    const [portalRoot, setPortalRoot] = useState(null);
    const portalVariableNamesRef = useRef(new Set());
    const rootClassName = [
        styles.app,
        styles.appChat,
        theme === WebShellThemeId.Light ? styles.themeLight : styles.themeDark,
        theme === WebShellThemeId.Dark ? 'dark' : undefined,
        className,
    ]
        .filter(Boolean)
        .join(' ');
    const rootStyle = useMemo(() => ({ ...style, ...getChatWidthStyle(chatMaxWidth) }), [chatMaxWidth, style]);
    useLayoutEffect(() => {
        if (typeof document === 'undefined')
            return;
        const root = document.createElement('div');
        root.dataset.webShellPortalRoot = '';
        root.dataset.webShellShadcn = '';
        document.body.appendChild(root);
        setPortalRoot(root);
        return () => {
            root.remove();
            setPortalRoot(null);
        };
    }, []);
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root || !portalRoot)
            return;
        let frameId = null;
        const syncVariables = () => {
            frameId = null;
            const computedStyle = getComputedStyle(root);
            const nextNames = new Set();
            portalRoot.dataset.webShellShadcn = '';
            portalRoot.classList.toggle('dark', theme === WebShellThemeId.Dark);
            portalRoot.lang = resolvedLanguage;
            for (let index = 0; index < computedStyle.length; index += 1) {
                const name = computedStyle[index];
                if (!name.startsWith('--'))
                    continue;
                nextNames.add(name);
                portalRoot.style.setProperty(name, computedStyle.getPropertyValue(name));
            }
            for (const name of portalVariableNamesRef.current) {
                if (!nextNames.has(name))
                    portalRoot.style.removeProperty(name);
            }
            portalVariableNamesRef.current = nextNames;
        };
        const scheduleSync = () => {
            if (frameId === null)
                frameId = requestAnimationFrame(syncVariables);
        };
        syncVariables();
        const observer = new MutationObserver(scheduleSync);
        let element = root;
        while (element) {
            observer.observe(element, {
                attributes: true,
                attributeFilter: ['class', 'style', 'data-theme', 'lang'],
            });
            element = element.parentElement;
        }
        window.addEventListener('resize', scheduleSync);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', scheduleSync);
            if (frameId !== null)
                cancelAnimationFrame(frameId);
        };
    }, [portalRoot, resolvedLanguage, rootClassName, rootStyle, theme]);
    return (_jsx(ThemeProvider, { value: theme, children: _jsx(I18nProvider, { language: resolvedLanguage, children: _jsx(WebShellPortalRootContext.Provider, { value: portalRoot, children: _jsx(TranscriptRenderModeProvider, { value: "readonly", children: _jsx(WebShellCustomizationProvider, { value: customization, children: _jsx(TodoTimelineContext.Provider, { value: todoTimeline, children: _jsx(TodoDetailContext.Provider, { value: todoDetails, children: _jsx(CompactModeContext.Provider, { value: false, children: _jsx("div", { ref: rootRef, className: rootClassName, style: rootStyle, "data-web-shell-root": true, "data-web-shell-shadcn": true, lang: resolvedLanguage, children: _jsx("div", { className: `${styles.content} ${styles.contentHasMessages}`, children: _jsx(MessageList, { messages: messages, pendingApproval: null, isResponding: false, workspaceCwd: workspaceCwd, virtualScrollThreshold: virtualScrollThreshold }) }) }) }) }) }) }) }) }) }) }));
}
export function WebShellTranscript(props) {
    const language = resolveLanguage(props.language);
    return (_jsx(ErrorBoundary, { label: "web-shell-transcript-root", resetKeys: [props.blocks, language], fallback: (error, reset) => (_jsx(RootErrorFallback, { error: error, onRetry: reset, language: language })), children: _jsx(WebShellTranscriptContent, { ...props }) }));
}
//# sourceMappingURL=WebShellTranscript.js.map