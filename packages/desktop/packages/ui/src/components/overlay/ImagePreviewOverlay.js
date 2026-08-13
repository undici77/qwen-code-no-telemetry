import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ImagePreviewOverlay - In-app image preview for the link interceptor and markdown blocks.
 */
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'lucide-react';
import { PreviewOverlay } from './PreviewOverlay';
import { CopyButton } from './CopyButton';
import { ItemNavigator } from './ItemNavigator';
import { ZoomControls } from './ZoomControls';
import { RICH_BLOCK_DEFAULTS } from './rich-block-interaction-spec';
import { useRichBlockInteractions } from './useRichBlockInteractions';
export function ImagePreviewOverlay({ isOpen, onClose, filePath, items, initialIndex = 0, title, loadDataUrl, theme = 'light', embedded, }) {
    const { t } = useTranslation();
    const resolvedItems = useMemo(() => {
        if (items && items.length > 0)
            return items;
        return [{ src: filePath }];
    }, [items, filePath]);
    const [activeIdx, setActiveIdx] = useState(initialIndex);
    const [contentCache, setContentCache] = useState({});
    const [dimensionsCache, setDimensionsCache] = useState({});
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = React.useRef(null);
    const { scale, translate, isDragging, isAnimating, setIsAnimating, zoomByStep, zoomToPreset, zoomToFit, reset, onMouseDown, onDoubleClick, } = useRichBlockInteractions({
        isOpen,
        containerRef,
    });
    const activeItem = resolvedItems[activeIdx];
    const activeDataUrl = activeItem ? contentCache[activeItem.src] : null;
    const activeDimensions = activeItem ? dimensionsCache[activeItem.src] : null;
    useEffect(() => {
        if (isOpen) {
            const bounded = Math.max(0, Math.min(initialIndex, resolvedItems.length - 1));
            setActiveIdx(bounded);
            reset();
        }
    }, [isOpen, initialIndex, resolvedItems.length, reset]);
    useEffect(() => {
        if (!isOpen)
            return;
        reset();
    }, [activeIdx, isOpen, reset]);
    useEffect(() => {
        if (!isOpen || !activeItem?.src)
            return;
        if (contentCache[activeItem.src]) {
            setError(null);
            return;
        }
        let cancelled = false;
        setIsLoading(true);
        setError(null);
        loadDataUrl(activeItem.src)
            .then((url) => {
            if (!cancelled) {
                setContentCache((prev) => ({ ...prev, [activeItem.src]: url }));
                const img = new window.Image();
                img.onload = () => {
                    if (cancelled)
                        return;
                    if (!img.naturalWidth || !img.naturalHeight)
                        return;
                    setDimensionsCache(prev => ({
                        ...prev,
                        [activeItem.src]: { width: img.naturalWidth, height: img.naturalHeight },
                    }));
                };
                img.src = url;
                setIsLoading(false);
            }
        })
            .catch((err) => {
            if (!cancelled) {
                setError(err instanceof Error ? err.message : 'Failed to load image');
                setIsLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [isOpen, activeItem?.src, loadDataUrl, contentCache]);
    const isDefaultView = scale === 1 && translate.x === 0 && translate.y === 0;
    const headerActions = (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ItemNavigator, { items: resolvedItems, activeIndex: activeIdx, onSelect: setActiveIdx, size: "md" }), _jsx(ZoomControls, { scale: scale, minScale: RICH_BLOCK_DEFAULTS.minScale, maxScale: RICH_BLOCK_DEFAULTS.maxScale, zoomPresets: RICH_BLOCK_DEFAULTS.zoomPresets, onZoomIn: () => zoomByStep('in'), onZoomOut: () => zoomByStep('out'), onZoomToPreset: zoomToPreset, onZoomToFit: () => zoomToFit(activeDimensions ?? null), onReset: reset, resetDisabled: isDefaultView }), _jsx(CopyButton, { content: activeItem?.src || filePath, title: t('common.copyPath'), className: "bg-background shadow-minimal" })] }));
    return (_jsx(PreviewOverlay, { isOpen: isOpen, onClose: onClose, theme: theme, typeBadge: {
            icon: Image,
            label: 'Image',
            variant: 'purple',
        }, filePath: activeItem?.src || filePath, title: title, error: error ? { label: 'Load Failed', message: error } : undefined, headerActions: headerActions, embedded: embedded, children: _jsxs("div", { ref: containerRef, className: "min-h-full flex items-center justify-center p-4 select-none", onMouseDown: onMouseDown, onDoubleClick: onDoubleClick, style: {
                cursor: isDragging ? 'grabbing' : 'grab',
                overflow: 'hidden',
            }, children: [!activeDataUrl && isLoading && (_jsx("div", { className: "text-muted-foreground text-sm", children: t('preview.loadingImage') })), activeDataUrl && (_jsx("img", { src: activeDataUrl, alt: activeItem?.label || activeItem?.src.split('/').pop() || 'Image preview', className: "max-w-full max-h-full object-contain rounded-sm", draggable: false, onTransitionEnd: () => setIsAnimating(false), style: {
                        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                        transformOrigin: 'center center',
                        transition: isAnimating ? 'transform 150ms ease-out' : 'none',
                    } }))] }) }));
}
//# sourceMappingURL=ImagePreviewOverlay.js.map