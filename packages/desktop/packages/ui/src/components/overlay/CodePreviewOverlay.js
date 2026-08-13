import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * CodePreviewOverlay - Overlay for code file preview (Read/Write tools)
 *
 * Uses PreviewOverlay for presentation and ShikiCodeViewer for syntax highlighting.
 * File path badge provides "Open" / "Reveal in {file manager}" via PlatformContext.
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, PenLine } from 'lucide-react';
import { PreviewOverlay } from './PreviewOverlay';
import { ContentFrame } from './ContentFrame';
import { ShikiCodeViewer } from '../code-viewer/ShikiCodeViewer';
export function CodePreviewOverlay({ isOpen, onClose, content, filePath, language, mode = 'read', startLine = 1, totalLines, numLines, theme = 'light', error, embedded, command, }) {
    const { t } = useTranslation();
    // Build subtitle with line info
    const subtitle = startLine !== undefined && totalLines !== undefined && numLines !== undefined
        ? `Lines ${startLine}–${startLine + numLines - 1} of ${totalLines}`
        : undefined;
    return (_jsxs(PreviewOverlay, { isOpen: isOpen, onClose: onClose, theme: theme, typeBadge: {
            icon: mode === 'write' ? PenLine : BookOpen,
            label: mode === 'write' ? 'Write' : 'Read',
            variant: mode === 'write' ? 'amber' : 'blue',
        }, filePath: filePath, subtitle: subtitle, error: error ? { label: mode === 'write' ? 'Write Failed' : 'Read Failed', message: error } : undefined, embedded: embedded, className: "bg-foreground-3", children: [command && (_jsx("div", { className: "px-6 mb-4", children: _jsx("div", { className: "w-full max-w-[850px] mx-auto", children: _jsxs("div", { className: "bg-background shadow-minimal rounded-[8px] px-4 py-3 font-mono", children: [_jsx("div", { className: "text-xs font-semibold text-muted-foreground/70 mb-1", children: "Command" }), _jsxs("div", { className: "text-sm text-foreground overflow-x-auto", children: [_jsx("span", { className: "text-muted-foreground select-none", children: "$ " }), _jsx("span", { children: command })] })] }) }) })), _jsx(ContentFrame, { title: t('overlay.code'), fitContent: !embedded, minWidth: embedded ? undefined : 850, children: _jsx("div", { children: _jsx(ShikiCodeViewer, { code: content, filePath: filePath, language: language, startLine: startLine, theme: theme }) }) })] }));
}
//# sourceMappingURL=CodePreviewOverlay.js.map