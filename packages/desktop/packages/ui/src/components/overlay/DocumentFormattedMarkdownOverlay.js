import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * DocumentFormattedMarkdownOverlay - Fullscreen view for reading AI responses and plans
 *
 * Renders markdown content in a document-like format with:
 * - Centered content card with max-width
 * - Copy button via FullscreenOverlayBase's built-in copyContent prop
 * - Optional "Plan" header variant
 * - Optional filePath badge with dual-trigger menu (Open / Reveal in {file manager})
 *
 * Background and scenic blur are provided by FullscreenOverlayBase.
 * Uses FullscreenOverlayBase for portal, traffic lights, ESC handling, and header.
 */
import { ListTodo } from 'lucide-react';
import { Markdown } from '../markdown';
import { FullscreenOverlayBase } from './FullscreenOverlayBase';
import { AnnotatableMarkdownDocument } from './AnnotatableMarkdownDocument';
export function DocumentFormattedMarkdownOverlay({ content, isOpen, onClose, variant = 'response', onOpenUrl, onOpenFile, filePath, typeBadge, error, sessionId, messageId, annotations, onAddAnnotation, onRemoveAnnotation, onUpdateAnnotation, sendMessageKey = 'enter', isStreaming = false, openAnnotationRequest, embedded = false, }) {
    return (_jsx(FullscreenOverlayBase, { isOpen: isOpen, onClose: onClose, filePath: filePath, typeBadge: typeBadge, copyContent: content, error: error ? { label: 'Write Failed', message: error } : undefined, embedded: embedded, children: _jsx("div", { className: embedded ? 'min-h-full flex flex-col justify-center px-3 py-6' : 'min-h-full flex flex-col justify-center px-6 py-16', children: _jsxs("div", { className: "bg-background rounded-[16px] shadow-strong w-full max-w-[960px] h-fit mx-auto my-auto", children: [variant === 'plan' && (_jsxs("div", { className: "px-4 py-2 border-b border-border/30 flex items-center gap-2 bg-success/5 rounded-t-[16px]", children: [_jsx(ListTodo, { className: "w-3 h-3 text-success" }), _jsx("span", { className: "text-[13px] font-medium text-success", children: "Plan" })] })), _jsx("div", { className: embedded ? 'px-5 pt-6 pb-6' : 'px-10 pt-8 pb-8', children: _jsx("div", { className: "text-sm", children: messageId && onAddAnnotation ? (_jsx(AnnotatableMarkdownDocument, { content: content, sessionId: sessionId, messageId: messageId, annotations: annotations, onAddAnnotation: onAddAnnotation, onRemoveAnnotation: onRemoveAnnotation, onUpdateAnnotation: onUpdateAnnotation, onOpenUrl: onOpenUrl, onOpenFile: onOpenFile, sendMessageKey: sendMessageKey, islandZIndex: 420, openAnnotationRequest: openAnnotationRequest, isStreaming: isStreaming })) : (_jsx(Markdown, { mode: "minimal", onUrlClick: onOpenUrl, onFileClick: onOpenFile, hideFirstMermaidExpand: false, children: content })) }) })] }) }) }));
}
//# sourceMappingURL=DocumentFormattedMarkdownOverlay.js.map