import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PDFPreviewOverlay - In-app PDF preview using Mozilla's pdf.js via react-pdf.
 *
 * Renders PDFs using the react-pdf library, which wraps pdfjs-dist.
 * Supports multiple items with arrow navigation in the header.
 *
 * The PDF is loaded from a Uint8Array (via IPC) and rendered to canvas.
 * The pdf.js worker handles decoding and rendering in a background thread.
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText } from 'lucide-react';
import { PreviewOverlay } from './PreviewOverlay';
import { CopyButton } from './CopyButton';
import { ItemNavigator } from './ItemNavigator';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
// Configure pdf.js worker using Vite's ?url import for cross-platform dev/prod compatibility
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
export function PDFPreviewOverlay({ isOpen, onClose, filePath, items, initialIndex = 0, loadPdfData, theme = 'light', embedded, }) {
    const { t } = useTranslation();
    // Normalize: items array or single filePath
    const resolvedItems = useMemo(() => {
        if (items && items.length > 0)
            return items;
        return [{ src: filePath }];
    }, [items, filePath]);
    const [activeIdx, setActiveIdx] = useState(initialIndex);
    const [pdfData, setPdfData] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const activeItem = resolvedItems[activeIdx];
    // Reset index when overlay opens
    useEffect(() => {
        if (isOpen) {
            setActiveIdx(initialIndex);
        }
    }, [isOpen, initialIndex]);
    // Load PDF data when overlay opens or active item changes
    useEffect(() => {
        if (!isOpen || !activeItem?.src)
            return;
        let cancelled = false;
        setIsLoading(true);
        setError(null);
        setPdfData(null);
        setNumPages(0);
        loadPdfData(activeItem.src)
            .then((data) => {
            if (!cancelled) {
                setPdfData(data);
                setIsLoading(false);
            }
        })
            .catch((err) => {
            if (!cancelled) {
                setError(err instanceof Error ? err.message : 'Failed to load PDF');
                setIsLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [isOpen, activeItem?.src, loadPdfData]);
    const onDocumentLoadSuccess = useCallback(({ numPages }) => {
        setNumPages(numPages);
    }, []);
    const onDocumentLoadError = useCallback((error) => {
        setError(`Failed to load PDF: ${error.message}`);
    }, []);
    // Memoize file object to prevent unnecessary re-renders (react-pdf uses === equality)
    const fileObj = useMemo(() => pdfData ? { data: pdfData } : null, [pdfData]);
    // Header actions: item navigation + copy button
    const headerActions = (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ItemNavigator, { items: resolvedItems, activeIndex: activeIdx, onSelect: setActiveIdx, size: "md" }), _jsx(CopyButton, { content: activeItem?.src || filePath, title: t('common.copyPath'), className: "bg-background shadow-minimal" })] }));
    return (_jsx(PreviewOverlay, { isOpen: isOpen, onClose: onClose, theme: theme, typeBadge: {
            icon: FileText,
            label: 'PDF',
            variant: 'orange',
        }, filePath: activeItem?.src || filePath, error: error ? { label: 'Load Failed', message: error } : undefined, headerActions: headerActions, embedded: embedded, children: _jsxs("div", { className: "h-full flex flex-col items-center overflow-auto", children: [isLoading && (_jsx("div", { className: "text-muted-foreground text-sm", children: t('preview.loadingPdf') })), fileObj && (_jsx(Document, { file: fileObj, onLoadSuccess: onDocumentLoadSuccess, onLoadError: onDocumentLoadError, loading: _jsx("div", { className: "text-muted-foreground text-sm", children: t('common.rendering') }), children: Array.from({ length: numPages }, (_, i) => (_jsx(Page, { pageNumber: i + 1, renderTextLayer: true, renderAnnotationLayer: true, className: "pdf-page" }, i + 1))) }))] }) }));
}
//# sourceMappingURL=PDFPreviewOverlay.js.map