import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * MarkdownPdfBlock - Renders ```pdf-preview code blocks as inline PDF previews.
 *
 * Loads PDF(s) from file(s) (via `src` or `items` field) and renders the first page
 * using react-pdf. Supports multiple items with a tab bar for switching between them.
 *
 * Expected JSON shapes:
 * Single item:
 * {
 *   "src": "/absolute/path/to/file.pdf",
 *   "title": "Optional title"
 * }
 *
 * Multiple items:
 * {
 *   "title": "Quarterly Reports",
 *   "items": [
 *     { "src": "/path/to/q1.pdf", "label": "Q1 Report" },
 *     { "src": "/path/to/q2.pdf", "label": "Q2 Report" }
 *   ]
 * }
 *
 * Only one Document is mounted at a time. The content area uses a fixed height
 * container to prevent layout shift when switching between items.
 *
 * Inline: Shows first page in a fixed 400px container with bottom fade + expand button.
 * Fullscreen: Opens PDFPreviewOverlay with full page-by-page navigation.
 */
import * as React from 'react';
import { FileText, Maximize2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { cn } from '../../lib/utils';
import { CodeBlock } from './CodeBlock';
import { PDFPreviewOverlay } from '../overlay/PDFPreviewOverlay';
import { ItemNavigator } from '../overlay/ItemNavigator';
import { usePlatform } from '../../context/PlatformContext';
import { useTranslation } from 'react-i18next';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
// Configure pdf.js worker using Vite's ?url import for cross-platform dev/prod compatibility
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
// ── Error boundary ───────────────────────────────────────────────────────────
class PdfBlockErrorBoundary extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error) {
        console.warn('[MarkdownPdfBlock] Render failed, falling back to CodeBlock:', error);
    }
    render() {
        if (this.state.hasError)
            return this.props.fallback;
        return this.props.children;
    }
}
export function MarkdownPdfBlock({ code, className, onCreateRegionAnnotation: _onCreateRegionAnnotation }) {
    const { t } = useTranslation();
    const { onReadFileBinary } = usePlatform();
    // Parse the JSON spec — supports single src or items array
    const spec = React.useMemo(() => {
        try {
            const raw = JSON.parse(code);
            if (raw.items && Array.isArray(raw.items) && raw.items.length > 0) {
                return raw;
            }
            if (raw.src && typeof raw.src === 'string') {
                return raw;
            }
            return null;
        }
        catch {
            return null;
        }
    }, [code]);
    // Normalize to items array (backward compat)
    const items = React.useMemo(() => {
        if (!spec)
            return [];
        if (spec.items && spec.items.length > 0)
            return spec.items;
        if (spec.src)
            return [{ src: spec.src }];
        return [];
    }, [spec]);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    // Content cache: src path → loaded Uint8Array (master copy, never passed to react-pdf directly)
    const [contentCache, setContentCache] = React.useState({});
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const activeItem = items[activeIndex];
    const activePdfData = activeItem ? contentCache[activeItem.src] : undefined;
    // Load active item's content when it changes
    React.useEffect(() => {
        if (!activeItem?.src || !onReadFileBinary)
            return;
        if (contentCache[activeItem.src]) {
            setError(null);
            return;
        }
        setLoading(true);
        setError(null);
        onReadFileBinary(activeItem.src)
            .then((data) => {
            // Store a copy — react-pdf transfers ArrayBuffers to workers, detaching the original
            setContentCache((prev) => ({ ...prev, [activeItem.src]: new Uint8Array(data) }));
        })
            .catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to read PDF file');
        })
            .finally(() => setLoading(false));
    }, [activeItem?.src, onReadFileBinary, contentCache]);
    // Stable file objects per item (ref ensures Documents don't remount on re-render).
    // Each Document gets its own Uint8Array copy since react-pdf transfers the ArrayBuffer.
    const fileObjsRef = React.useRef({});
    for (const [src, data] of Object.entries(contentCache)) {
        if (!fileObjsRef.current[src]) {
            fileObjsRef.current[src] = { data: new Uint8Array(data) };
        }
    }
    const activeFileObj = activeItem ? fileObjsRef.current[activeItem.src] : undefined;
    // Fullscreen overlay: always provide a fresh copy (the overlay's Document will also transfer it)
    const loadPdfData = React.useCallback(async (path) => {
        if (contentCache[path])
            return new Uint8Array(contentCache[path]);
        if (!onReadFileBinary)
            throw new Error('Cannot load PDF');
        return onReadFileBinary(path);
    }, [contentCache, onReadFileBinary]);
    const hasMultiple = items.length > 1;
    // Invalid spec → fall back to code block
    if (!spec || items.length === 0) {
        return _jsx(CodeBlock, { code: code, language: "json", mode: "full", className: className });
    }
    const fallback = _jsx(CodeBlock, { code: code, language: "json", mode: "full", className: className });
    return (_jsxs(PdfBlockErrorBoundary, { fallback: fallback, children: [_jsxs("div", { className: cn('relative group rounded-[8px] overflow-hidden border bg-muted/10', className), children: [_jsxs("div", { className: "px-3 py-2 bg-muted/50 border-b flex items-center gap-2", children: [_jsx(FileText, { className: "w-3.5 h-3.5 text-muted-foreground/50" }), _jsx("span", { className: "text-[12px] text-muted-foreground font-medium flex-1", children: spec.title || t('preview.pdfPreview') }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(ItemNavigator, { items: items, activeIndex: activeIndex, onSelect: setActiveIndex }), _jsx("button", { onClick: () => setIsFullscreen(true), className: cn("p-1 rounded-[6px] transition-all select-none", "bg-background shadow-minimal", "text-muted-foreground/50 hover:text-foreground", "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100", hasMultiple ? "opacity-100" : "opacity-0 group-hover:opacity-100"), title: t('common.viewFullscreen'), children: _jsx(Maximize2, { className: "w-3.5 h-3.5" }) })] })] }), _jsxs("div", { className: "relative h-[400px] overflow-hidden", children: [activeFileObj && (_jsx("div", { className: "flex items-start justify-center bg-white p-4", children: _jsx(Document, { file: activeFileObj, loading: _jsx("div", { className: "py-8 text-center text-muted-foreground text-[13px]", children: t('common.rendering') }), error: _jsx("div", { className: "py-6 text-center text-destructive/70 text-[13px]", children: t('preview.failedToRenderPdf') }), children: _jsx(Page, { pageNumber: 1, renderTextLayer: false, renderAnnotationLayer: false, width: 500 }) }) })), !activePdfData && loading && (_jsx("div", { className: "py-8 text-center text-muted-foreground text-[13px]", children: t('common.loading') })), !activePdfData && !loading && error && (_jsx("div", { className: "py-6 text-center text-destructive/70 text-[13px]", children: error })), activePdfData && (_jsx("div", { className: "absolute bottom-0 left-0 right-0 h-8 pointer-events-none", style: {
                                    background: 'linear-gradient(to bottom, transparent, var(--muted))',
                                    zIndex: 'var(--z-local, 10)',
                                } }))] })] }), _jsx(PDFPreviewOverlay, { isOpen: isFullscreen, onClose: () => setIsFullscreen(false), filePath: activeItem.src, items: items, initialIndex: activeIndex, loadPdfData: loadPdfData })] }));
}
//# sourceMappingURL=MarkdownPdfBlock.js.map