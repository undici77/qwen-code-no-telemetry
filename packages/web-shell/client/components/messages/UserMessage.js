import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { getComposerTagIconUrl, getComposerTagViewModel, isBuiltinComposerTagIconUrl, parseUserMessageContentSafely, splitComposerTagContentByAnnotations, } from '../../utils/composerTag';
import { isSafeImageSrc } from './Markdown';
import { useWebShellCustomization } from '../../customization';
import { getComposerTagDisplay, getComposerTagLabel, getComposerTagValue, } from '../../hooks/useComposerCore';
import { useI18n } from '../../i18n';
import { cssUrlVar } from '../../utils/cssUrlVar';
import flashStyles from '../MessageLocateFlash.module.css';
import styles from './UserMessage.module.css';
function DefaultUserMessageContent({ composerTagIcons, content, inputAnnotations, onComposerTagClick, renderComposerTag, renderComposerTagTooltip, }) {
    // Submit-time annotations are the source of truth for reference chips.
    // Unannotated serialized text stays plain text.
    const segments = useMemo(() => splitComposerTagContentByAnnotations(content, inputAnnotations), [content, inputAnnotations]);
    return (_jsx(_Fragment, { children: segments.map((segment, index) => segment.type === 'text' ? (_jsx(Fragment, { children: segment.text }, index)) : (_jsx(ReadonlyComposerTag, { composerTagIcons: composerTagIcons, onComposerTagClick: onComposerTagClick, renderComposerTag: renderComposerTag, renderComposerTagTooltip: renderComposerTagTooltip, tag: segment.tag, title: segment.tag.serialized, preserveCustomKindLabel: true }, `${segment.tag.id}:${index}`))) }));
}
export const UserMessage = memo(function UserMessage({ content, images, inputAnnotations, isLocateFlashing = false, sendFailed = false, onRetrySend, onImagePreview, }) {
    const { t } = useI18n();
    const { parseUserMessageContent, renderUserMessageContent, composerTagIcons, renderComposerTag, renderComposerTagTooltip, onComposerTagClick, } = useWebShellCustomization();
    const contentRef = useRef(null);
    const [expanded, setExpanded] = useState(false);
    const [heightOverflowing, setHeightOverflowing] = useState(false);
    const renderedContent = useMemo(() => {
        const explicit = renderUserMessageContent?.({
            content,
            images,
            inputAnnotations,
        });
        if (explicit !== undefined && explicit !== null)
            return explicit;
        if (inputAnnotations && inputAnnotations.length > 0) {
            return (_jsx(DefaultUserMessageContent, { composerTagIcons: composerTagIcons, content: content, inputAnnotations: inputAnnotations, onComposerTagClick: onComposerTagClick, renderComposerTag: renderComposerTag, renderComposerTagTooltip: renderComposerTagTooltip }));
        }
        const parts = parseUserMessageContentSafely(content, parseUserMessageContent, '[WebShell] failed to parse user message content');
        if (!parts)
            return content;
        return parts.map((part, index) => {
            if (part.type === 'text')
                return part.text;
            return (_jsx(ReadonlyComposerTag, { tag: part.tag, composerTagIcons: composerTagIcons, renderComposerTag: renderComposerTag, renderComposerTagTooltip: renderComposerTagTooltip, onComposerTagClick: onComposerTagClick }, `${part.tag.id}-${index}`));
        });
    }, [
        content,
        images,
        inputAnnotations,
        onComposerTagClick,
        parseUserMessageContent,
        composerTagIcons,
        renderComposerTag,
        renderComposerTagTooltip,
        renderUserMessageContent,
    ]);
    const measureOverflow = useCallback(() => {
        const el = contentRef.current;
        if (!el)
            return;
        setHeightOverflowing(el.scrollHeight > 400);
    }, []);
    useLayoutEffect(() => {
        setExpanded(false);
        measureOverflow();
    }, [content, images?.length, measureOverflow]);
    useEffect(() => {
        const el = contentRef.current;
        if (!el || typeof ResizeObserver === 'undefined')
            return;
        const observer = new ResizeObserver(measureOverflow);
        observer.observe(el);
        return () => observer.disconnect();
    }, [measureOverflow]);
    return (_jsx("div", { className: styles.chatMessageRow, children: _jsxs("div", { className: styles.chatMessageColumn, children: [_jsxs("div", { className: `${styles.chatBubble}${isLocateFlashing ? ` ${flashStyles.flash}` : ''}`, children: [_jsxs("div", { ref: contentRef, className: `${styles.chatContent} ${heightOverflowing && !expanded ? styles.chatContentCollapsed : ''}`, children: [images && images.length > 0 && (_jsx("div", { className: styles.chatImages, children: images.map((img, index) => {
                                        const src = img.data.startsWith('data:')
                                            ? img.data
                                            : `data:${img.mimeType};base64,${img.data}`;
                                        if (!isSafeImageSrc(src))
                                            return null;
                                        return (_jsx("img", { src: src, alt: t('user.uploadedImage', { index: index + 1 }), className: `${styles.chatImageThumb}${onImagePreview
                                                ? ` ${styles.chatImageThumbInteractive}`
                                                : ''}`, onClick: onImagePreview
                                                ? () => onImagePreview(src, t('user.uploadedImage', { index: index + 1 }))
                                                : undefined, onLoad: measureOverflow }, index));
                                    }) })), renderedContent] }), heightOverflowing && (_jsxs("button", { type: "button", className: styles.toggleButton, onClick: () => setExpanded((value) => !value), children: [_jsx("span", { children: expanded
                                        ? t('userMessage.showLess')
                                        : t('userMessage.showMore') }), _jsx("svg", { className: `${styles.toggleIcon} ${expanded ? styles.toggleIconExpanded : ''}`, viewBox: "0 0 16 16", "aria-hidden": "true", children: _jsx("path", { d: "m4 6 4 4 4-4", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" }) })] }))] }), sendFailed && onRetrySend && (_jsxs("div", { className: styles.sendFailure, children: [_jsx("span", { children: t('userMessage.sendFailed') }), _jsxs("button", { type: "button", className: styles.retryButton, onClick: onRetrySend, "aria-label": t('userMessage.retrySend'), title: t('userMessage.retrySend'), children: [_jsx(RefreshCwIcon, { "aria-hidden": "true" }), _jsx("span", { children: t('common.retry') })] })] }))] }) }));
});
function getTagText(tag) {
    return getComposerTagDisplay(tag);
}
export function ReadonlyComposerTag({ tag, composerTagIcons, renderComposerTag, renderComposerTagTooltip, onComposerTagClick, title, preserveCustomKindLabel = false, }) {
    const info = { tag, placement: 'user-message', readonly: true };
    let custom;
    let tooltip;
    try {
        custom = renderComposerTag?.(info);
    }
    catch (error) {
        console.warn('[WebShell] user message tag render failed', error);
    }
    try {
        tooltip = renderComposerTagTooltip?.(info);
    }
    catch (error) {
        console.warn('[WebShell] user message tag tooltip render failed', error);
    }
    const clickable = Boolean(onComposerTagClick);
    const viewModel = preserveCustomKindLabel
        ? getComposerTagViewModel(tag, composerTagIcons)
        : null;
    const rawTagLabel = getComposerTagLabel(tag);
    const tagValue = viewModel?.tagValue ?? getComposerTagValue(tag);
    const tagLabel = viewModel?.tagLabel ?? (tag.kind ? '' : rawTagLabel);
    const fallback = viewModel?.fallback ?? tag.id;
    const iconUrl = tag.icon ??
        viewModel?.iconUrl ??
        getComposerTagIconUrl(tag.kind, composerTagIcons);
    const safeIconUrl = iconUrl && (isBuiltinComposerTagIconUrl(iconUrl) || isSafeImageSrc(iconUrl))
        ? iconUrl
        : undefined;
    return (_jsxs("span", { className: `${styles.messageTag}${clickable ? ` ${styles.messageTagClickable}` : ''}`, role: clickable ? 'button' : undefined, tabIndex: clickable ? 0 : undefined, title: title ?? getTagText(tag), onClick: (event) => {
            if (!clickable)
                return;
            event.stopPropagation();
            onComposerTagClick?.({
                ...info,
                anchorRect: event.currentTarget.getBoundingClientRect(),
            });
        }, onKeyDown: (event) => {
            if (!clickable)
                return;
            if (event.key !== 'Enter' && event.key !== ' ')
                return;
            event.preventDefault();
            onComposerTagClick?.({
                ...info,
                anchorRect: event.currentTarget.getBoundingClientRect(),
            });
        }, children: [custom ?? (_jsxs(_Fragment, { children: [safeIconUrl && (_jsx("span", { className: styles.messageTagIcon, style: cssUrlVar('--user-message-tag-icon-url', safeIconUrl), "aria-hidden": "true" })), tagLabel && (_jsx("span", { className: styles.messageTagLabel, children: tagLabel })), tagValue ? (_jsx("span", { className: styles.messageTagValue, children: tagValue })) : !tagLabel ? (_jsx("span", { className: styles.messageTagLabel, children: fallback })) : null] })), tooltip !== undefined && tooltip !== null && (_jsx("span", { className: styles.messageTagTooltip, role: "tooltip", children: tooltip }))] }));
}
//# sourceMappingURL=UserMessage.js.map