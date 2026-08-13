import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PreviewOverlay - Base component for all preview overlays
 *
 * Provides unified presentation logic for modal/fullscreen overlays:
 * - Portal rendering to document.body (via FullscreenOverlayBase for fullscreen mode)
 * - Responsive modal (>=1200px) vs fullscreen (<1200px) modes
 * - Escape key to close
 * - Backdrop click to close (modal mode)
 * - Consistent header layout with badges, close button
 * - Optional error banner
 *
 * Header is delegated to FullscreenOverlayBase in fullscreen mode (which renders
 * FullscreenOverlayBaseHeader). In modal/embedded mode, renders the header directly.
 *
 * Used by: CodePreviewOverlay, TerminalPreviewOverlay, GenericOverlay, etc.
 */
import { useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import {} from 'lucide-react';
import { useOverlayMode, OVERLAY_LAYOUT } from '../../lib/layout';
import { FullscreenOverlayBase } from './FullscreenOverlayBase';
import { FullscreenOverlayBaseHeader } from './FullscreenOverlayBaseHeader';
import { OverlayErrorBanner } from './OverlayErrorBanner';
/** Shared background class for all overlay modes - single source of truth */
const OVERLAY_BG = 'bg-background';
export function PreviewOverlay({ isOpen, onClose, theme = 'light', typeBadge, filePath, title, onTitleClick, subtitle, error, headerActions, children, embedded = false, className, }) {
    // Use custom className if provided, otherwise fall back to default bg
    const bgClass = className || OVERLAY_BG;
    const responsiveMode = useOverlayMode();
    const isModal = responsiveMode === 'modal';
    // Handle Escape key for modal mode only (fullscreen mode uses FullscreenOverlayBase which handles ESC)
    useEffect(() => {
        if (!isOpen || !isModal)
            return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isModal, onClose]);
    if (!isOpen && !embedded)
        return null;
    // Header rendered in modal/embedded mode (fullscreen delegates to FullscreenOverlayBase)
    const header = (_jsx(FullscreenOverlayBaseHeader, { onClose: onClose, typeBadge: typeBadge, filePath: filePath, title: title, onTitleClick: onTitleClick, subtitle: subtitle, headerActions: headerActions }));
    // Error banner — uses shared OverlayErrorBanner with tinted-shadow styling.
    // Rendered inside the centering wrapper so error + content are centered together.
    const errorBanner = error && (_jsx("div", { className: "px-6 pb-4", children: _jsx(OverlayErrorBanner, { label: error.label, message: error.message }) }));
    // Gradient fade mask for modal/embedded modes — mirrors FullscreenOverlayBase's
    // scroll container structure so children (ContentFrame, etc.) work identically
    // in all modes using flow-based layout inside a scrollable, masked viewport.
    const FADE_SIZE = 24;
    const FADE_MASK = `linear-gradient(to bottom, transparent 0%, black ${FADE_SIZE}px, black calc(100% - ${FADE_SIZE}px), transparent 100%)`;
    const contentArea = (_jsx("div", { className: "flex-1 min-h-0 relative", style: { maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }, children: _jsx("div", { className: "absolute inset-0 overflow-y-auto", style: { paddingTop: FADE_SIZE, paddingBottom: FADE_SIZE, scrollPaddingTop: FADE_SIZE }, children: _jsxs("div", { className: "min-h-full flex flex-col justify-center", children: [errorBanner, children] }) }) }));
    // Embedded mode — renders inline without dialog/portal, for design system playground
    if (embedded) {
        return (_jsxs("div", { className: `flex flex-col ${bgClass} h-full w-full overflow-hidden rounded-lg border border-foreground/5`, children: [header, contentArea] }));
    }
    // Fullscreen mode — FullscreenOverlayBase renders the header via structured props
    // and owns the masked scroll container. Children are rendered directly inside it.
    if (!isModal) {
        return (_jsx(FullscreenOverlayBase, { isOpen: isOpen, onClose: onClose, typeBadge: typeBadge, filePath: filePath, title: title, onTitleClick: onTitleClick, subtitle: subtitle, headerActions: headerActions, error: error, children: children }));
    }
    // Modal mode - uses its own portal with backdrop click to close
    return ReactDOM.createPortal(_jsx("div", { className: `fixed inset-0 z-50 flex items-center justify-center ${OVERLAY_LAYOUT.modalBackdropClass}`, onClick: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: `flex flex-col ${bgClass} shadow-3xl overflow-hidden smooth-corners`, style: {
                width: '90vw',
                maxWidth: OVERLAY_LAYOUT.modalMaxWidth,
                height: `${OVERLAY_LAYOUT.modalMaxHeightPercent}vh`,
                borderRadius: 16,
            }, children: [header, contentArea] }) }), document.body);
}
//# sourceMappingURL=PreviewOverlay.js.map