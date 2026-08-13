import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState, } from 'react';
import { Markdown } from './Markdown';
import { CompactModeContext } from '../../App';
import { useWebShellCustomization, } from '../../customization';
import { useI18n } from '../../i18n';
import { formatTimestamp } from '../MessageTimestamp';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import flashStyles from '../MessageLocateFlash.module.css';
import styles from './AssistantMessage.module.css';
export const AssistantMessage = memo(function AssistantMessage({ content, isStreaming, timestamp, onBranchSession, showFooterActions = false, showBranchAction = false, isLocateFlashing = false, customFooterInfo, }) {
    const { t } = useI18n();
    const { renderAssistantTurnFooter } = useWebShellCustomization();
    const [copied, setCopied] = useState(false);
    const showFooter = !!content && !isStreaming && showFooterActions;
    const customFooter = useMemo(() => customFooterInfo
        ? renderAssistantTurnFooter?.(customFooterInfo)
        : undefined, [customFooterInfo, renderAssistantTurnFooter]);
    const handleCopy = useCallback(() => {
        const write = navigator.clipboard?.writeText(content);
        if (!write) {
            return;
        }
        void write
            .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        })
            .catch(() => { });
    }, [content]);
    return (_jsxs("div", { className: styles.message, children: [content && (_jsx("div", { className: `${styles.content}${isLocateFlashing ? ` ${flashStyles.flash}` : ''}`, children: _jsx("div", { className: styles.contentBody, children: _jsx(Markdown, { content: content, source: "assistant", isStreaming: isStreaming }) }) })), customFooter && (_jsx("div", { className: styles.customFooter, children: customFooter })), showFooter && (_jsxs("div", { className: styles.messageFooter, children: [_jsx("button", { type: "button", className: styles.copyButton, title: t('assistant.copy'), "aria-label": t('assistant.copy'), onClick: handleCopy, children: copied ? _jsx(CheckIcon, {}) : _jsx(CopyIcon, {}) }), showBranchAction && onBranchSession && (_jsx("button", { type: "button", className: styles.copyButton, title: t('assistant.branch'), "aria-label": t('assistant.branch'), onClick: onBranchSession, children: _jsx(BranchIcon, {}) })), timestamp !== undefined && (_jsx("span", { className: styles.footerTime, "aria-hidden": "true", children: formatTimestamp(timestamp) }))] }))] }));
});
function CopyIcon() {
    return (_jsxs("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", children: [_jsx("path", { d: "M5.2 4.4V3.2c0-.7.5-1.2 1.2-1.2h5.4c.7 0 1.2.5 1.2 1.2v5.4c0 .7-.5 1.2-1.2 1.2h-1.2", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.3" }), _jsx("rect", { x: "3", y: "5.2", width: "7.8", height: "7.8", rx: "1.2", fill: "none", stroke: "currentColor", strokeWidth: "1.3" })] }));
}
function CheckIcon() {
    return (_jsx("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", children: _jsx("path", { d: "m3.5 8.3 3 3L12.8 5", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.6" }) }));
}
function BranchIcon() {
    return (_jsxs("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", children: [_jsx("path", { d: "M5 3.5v5.2c0 2.1 1.7 3.8 3.8 3.8H11", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.35" }), _jsx("path", { d: "M5 8.2h3.2c1.5 0 2.8-1.2 2.8-2.8V4", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.35" }), _jsx("circle", { cx: "5", cy: "3.5", r: "1.5", fill: "currentColor" }), _jsx("circle", { cx: "11", cy: "4", r: "1.5", fill: "currentColor" }), _jsx("circle", { cx: "11", cy: "12.5", r: "1.5", fill: "currentColor" })] }));
}
const thinkingTranslationCache = new Map();
const THINKING_TRANSLATION_CACHE_MAX_ENTRIES = 200;
function cacheThinkingTranslation(key, translation) {
    thinkingTranslationCache.delete(key);
    thinkingTranslationCache.set(key, translation);
    if (thinkingTranslationCache.size <= THINKING_TRANSLATION_CACHE_MAX_ENTRIES) {
        return;
    }
    const oldestKey = thinkingTranslationCache.keys().next().value;
    if (oldestKey !== undefined)
        thinkingTranslationCache.delete(oldestKey);
}
export const ThinkingMessage = memo(function ThinkingMessage({ messageId, content, isStreaming, timestamp, isLocateFlashing = false, generateContent, }) {
    const { language, t } = useI18n();
    const compactMode = useContext(CompactModeContext);
    const [thinkingExpanded, setThinkingExpanded] = useState(false);
    const thinkingActive = isStreaming === true;
    const startTimeRef = useRef(timestamp ?? Date.now());
    const sawActiveRef = useRef(thinkingActive);
    const [now, setNow] = useState(() => Date.now());
    const [finishedAt, setFinishedAt] = useState(null);
    const [translationOpen, setTranslationOpen] = useState(false);
    const [translation, setTranslation] = useState();
    const [translationLoading, setTranslationLoading] = useState(false);
    const [translationThinking, setTranslationThinking] = useState(false);
    const [translationError, setTranslationError] = useState(false);
    const translationAbortRef = useRef(undefined);
    useEffect(() => {
        if (!content || !thinkingActive)
            return;
        setNow(Date.now());
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [content, thinkingActive]);
    useEffect(() => {
        if (!content)
            return;
        if (thinkingActive) {
            sawActiveRef.current = true;
            setFinishedAt(null);
            return;
        }
        if (sawActiveRef.current && finishedAt === null) {
            setFinishedAt(Date.now());
        }
    }, [content, finishedAt, thinkingActive]);
    const thinkingDurationMs = thinkingActive || finishedAt !== null
        ? (thinkingActive ? now : finishedAt) - startTimeRef.current
        : undefined;
    const thinkingSummaryKey = getThinkingSummaryKey({
        isStreaming,
        durationMs: thinkingDurationMs,
    });
    const thinkingDuration = thinkingDurationMs !== undefined
        ? formatThinkingDuration(thinkingDurationMs)
        : '';
    const handleToggle = useCallback(() => {
        setThinkingExpanded((v) => !v);
    }, []);
    useEffect(() => () => {
        translationAbortRef.current?.abort();
    }, []);
    const translate = useCallback(async (force = false) => {
        if (isStreaming || !generateContent || (translationLoading && !force)) {
            return;
        }
        const cacheKey = `${language}:${messageId}:${content}`;
        const cached = thinkingTranslationCache.get(cacheKey);
        if (cached && !force) {
            cacheThinkingTranslation(cacheKey, cached);
            setTranslation(cached);
            return;
        }
        if (force)
            thinkingTranslationCache.delete(cacheKey);
        translationAbortRef.current?.abort();
        const controller = new AbortController();
        translationAbortRef.current = controller;
        setTranslation({ text: '' });
        setTranslationThinking(false);
        setTranslationError(false);
        setTranslationLoading(true);
        let text = '';
        let completed = false;
        try {
            const targetLanguage = language === 'zh-CN' ? 'Simplified Chinese' : 'English';
            const prompt = `Translate the following model reasoning into ${targetLanguage}. Preserve its meaning and Markdown formatting. Output only the translation.\n\n${content}`;
            for await (const event of generateContent(prompt, {
                signal: controller.signal,
            })) {
                if (translationAbortRef.current !== controller)
                    return;
                if (event.type === 'thinking') {
                    setTranslationThinking(true);
                }
                else if (event.type === 'delta') {
                    setTranslationThinking(false);
                    text += event.text;
                    setTranslation({ text });
                }
                else if (event.type === 'done') {
                    if (!text.trim())
                        throw new Error('Translation was empty');
                    completed = true;
                    const result = {
                        text,
                        inputTokens: event.inputTokens,
                        outputTokens: event.outputTokens,
                    };
                    cacheThinkingTranslation(cacheKey, result);
                    setTranslation(result);
                }
                else if (event.type === 'error') {
                    throw new Error(event.message);
                }
            }
            if (!completed)
                throw new Error('Translation stream ended early');
        }
        catch {
            if (!controller.signal.aborted)
                setTranslationError(true);
        }
        finally {
            if (translationAbortRef.current === controller) {
                translationAbortRef.current = undefined;
                setTranslationThinking(false);
                setTranslationLoading(false);
            }
        }
    }, [
        content,
        generateContent,
        isStreaming,
        language,
        messageId,
        translationLoading,
    ]);
    const handleTranslationOpenChange = useCallback((open) => {
        setTranslationOpen(open);
        if (open)
            void translate();
    }, [translate]);
    const handleCancelOrCloseTranslation = useCallback(() => {
        const controller = translationAbortRef.current;
        translationAbortRef.current = undefined;
        controller?.abort();
        setTranslationThinking(false);
        setTranslationLoading(false);
        setTranslationOpen(false);
    }, []);
    return (_jsx("div", { className: `${styles.message}${isLocateFlashing ? ` ${flashStyles.flash}` : ''}`, children: content && !compactMode && (_jsx("div", { className: styles.thinking, children: _jsxs("div", { className: styles.thinkingBody, children: [_jsxs("div", { className: `${styles.thinkingHeader}${thinkingExpanded ? ` ${styles.thinkingHeaderExpanded}` : ''}`, onClick: (event) => {
                            if (event.currentTarget.contains(event.target)) {
                                handleToggle();
                            }
                        }, children: [_jsxs("button", { type: "button", className: styles.thinkingSummary, "aria-expanded": thinkingExpanded, title: thinkingExpanded
                                    ? t('thinking.collapse')
                                    : t('thinking.expand'), children: [_jsx("span", { className: styles.thinkingSummaryIcon, "aria-hidden": "true", children: _jsx(ThinkingDoneIcon, {}) }), _jsx("span", { className: thinkingActive
                                            ? `${styles.thinkingSummaryText} ${styles.thinkingSummaryTextActive}`
                                            : styles.thinkingSummaryText, children: t(thinkingSummaryKey, thinkingDuration ? { duration: thinkingDuration } : {}) })] }), language === 'zh-CN' && !thinkingActive && generateContent && (_jsxs(Popover, { open: translationOpen, onOpenChange: handleTranslationOpenChange, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(Button, { type: "button", variant: "secondary", size: "xs", className: styles.translateButton, title: t('thinking.translate'), onClick: (event) => event.stopPropagation(), children: t('thinking.translate') }) }), _jsxs(PopoverContent, { align: "start", className: styles.translationPopover, children: [_jsx("div", { className: styles.translationTitle, children: t('thinking.translation') }), translationError ? (_jsx("div", { className: styles.translationError, children: t('thinking.translationFailed') })) : translation?.text ? (_jsx("div", { className: `${styles.thinkingExpandedWrap} ${styles.translationContent}`, children: _jsx(Markdown, { content: translation.text, source: "thinking", isStreaming: translationLoading }) })) : (_jsx("div", { className: styles.translationPending, children: t(translationThinking
                                                    ? 'thinking.translationThinking'
                                                    : 'thinking.translating') })), _jsxs("div", { className: styles.translationFooter, children: [_jsx("div", { className: styles.translationUsage, children: !translationLoading && translation?.text && (_jsxs(_Fragment, { children: [_jsx("span", { children: t('thinking.inputTokens', {
                                                                        count: translation.inputTokens ?? '--',
                                                                    }) }), _jsx("span", { children: t('thinking.outputTokens', {
                                                                        count: translation.outputTokens ?? '--',
                                                                    }) })] })) }), _jsxs("div", { className: styles.translationActions, children: [_jsx(Button, { type: "button", variant: "outline", size: "xs", onClick: () => void translate(true), children: t('thinking.retranslate') }), _jsx(Button, { type: "button", variant: "outline", size: "xs", disabled: !translationLoading &&
                                                                    !translation?.text &&
                                                                    !translationError, onClick: handleCancelOrCloseTranslation, children: t(translationLoading
                                                                    ? 'thinking.cancelTranslation'
                                                                    : 'thinking.closeTranslation') })] })] })] })] })), _jsx("span", { className: thinkingExpanded
                                    ? styles.thinkingChevronDown
                                    : styles.thinkingChevronRight, "aria-hidden": "true" })] }), thinkingExpanded && (_jsx("div", { className: styles.thinkingExpandedClip, children: _jsx("div", { className: styles.thinkingExpandedInner, children: _jsx("div", { className: styles.thinkingExpandedWrap, children: _jsx(Markdown, { content: content, source: "thinking", isStreaming: isStreaming }) }) }) }))] }) })) }));
});
export function getThinkingSummaryKey({ isStreaming, durationMs, }) {
    if (isStreaming)
        return 'thinking.running';
    return durationMs !== undefined && durationMs < 1_000
        ? 'thinking.doneBriefly'
        : 'thinking.done';
}
export function formatThinkingDuration(ms) {
    const totalSec = Math.max(1, Math.round(ms / 1000));
    if (totalSec < 60)
        return `${totalSec}s`;
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}
function ThinkingDoneIcon() {
    return (_jsxs("svg", { width: "18", height: "18", viewBox: "0 0 18 18", fill: "none", "aria-hidden": "true", children: [_jsx("path", { d: "M7.2 15.2h4", stroke: "currentColor", strokeWidth: "1.45", strokeLinecap: "round" }), _jsx("path", { d: "M6.5 13.1h5.4", stroke: "currentColor", strokeWidth: "1.45", strokeLinecap: "round" }), _jsx("path", { d: "M9.1 2.8c-3 0-5.1 2.3-5.1 5 0 1.7.8 3.1 2.1 4 .5.4.8.8.8 1.4h4.5c0-.6.3-1 .8-1.4 1.3-.9 2.1-2.3 2.1-4 0-.8-.2-1.6-.6-2.3", stroke: "currentColor", strokeWidth: "1.45", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("path", { d: "M13.2 1.8 14 3.6l1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8.8-1.8Z", fill: "currentColor" })] }));
}
//# sourceMappingURL=AssistantMessage.js.map