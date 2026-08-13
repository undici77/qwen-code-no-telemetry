import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * FullscreenOverlayBase - Base component for all fullscreen overlays
 *
 * Uses Radix Dialog primitives for proper:
 * - Focus management (blur on open, restore on close)
 * - ESC key handling
 * - Coordination with other Radix components (popovers, dropdowns)
 * - Accessibility (role="dialog", aria-modal)
 *
 * Additionally handles:
 * - macOS traffic light hiding (via PlatformContext)
 * - Default scenic background (bg-foreground-3 + fullscreen-overlay-background blur)
 *   Callers can override via className (twMerge resolves conflicts)
 * - Optional structured header with badges (typeBadge, filePath, title, subtitle)
 * - Optional built-in copy button (copyContent prop)
 * - Full-viewport scroll container with edge-to-edge gradient fade mask (iOS-style contentInset).
 *   The scroll area covers the entire viewport — content scrolls behind the floating header.
 *   A CSS mask gradient fades content at both edges (top and bottom, starting from y=0).
 *   The header floats on top and covers content behind it.
 *   Content padding clears the header at rest so nothing is clipped initially.
 *
 * Layout:
 *   Dialog.Content (fixed inset-0, relative)
 *   ├── Masked area (absolute inset-0, CSS mask gradient)
 *   │   └── Scroll container (h-full, overflow-y-auto, paddingTop = header + fade)
 *   │       └── {error banner}
 *   │       └── {children}
 *   └── Header (absolute top-0, z-10, floating on top of scroll content)
 *
 * Used by: PreviewOverlay, DocumentFormattedMarkdownOverlay, WorkspaceCreationScreen
 */
import { useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { usePlatform } from '../../context/PlatformContext';
import { cn } from '../../lib/utils';
import { getDismissibleLayerBridge } from '../../lib/dismissible-layer-bridge';
import { FullscreenOverlayBaseHeader } from './FullscreenOverlayBaseHeader';
import { OverlayErrorBanner } from './OverlayErrorBanner';
// Z-index for fullscreen overlays - must be above app chrome (z-overlay: 300)
// Uses CSS variable when available, falls back to hardcoded value
const Z_FULLSCREEN = 'var(--z-fullscreen, 350)';
// HEADER_HEIGHT must match PreviewHeader's height prop (48px).
// FADE_SIZE is the transition zone where content fades in/out at edges.
const HEADER_HEIGHT = 48;
const FADE_SIZE = 24;
// Edge-to-edge gradient fade mask — starts at y=0, fades over FADE_SIZE at both edges.
// The floating header covers content behind it; the mask just provides the smooth fade.
const FADE_MASK = `linear-gradient(to bottom, transparent 0px, black ${FADE_SIZE}px, black calc(100% - ${FADE_SIZE}px), transparent 100%)`;
export function handleFullscreenEscapeWithStack() {
    const bridge = getDismissibleLayerBridge();
    if (!bridge)
        return false;
    return bridge.handleEscape();
}
export function FullscreenOverlayBase({ isOpen, onClose, children, className, accessibleTitle = 'Overlay', typeBadge, filePath, title, onTitleClick, subtitle, headerActions, copyContent, error, embedded = false, }) {
    const { onSetTrafficLightsVisible } = usePlatform();
    // Determine if we should render the structured header.
    // Any header-related prop triggers header rendering.
    const hasHeader = !!(typeBadge || filePath || title || subtitle || headerActions || copyContent);
    const overlayIdRef = useRef(`fullscreen-overlay-${Math.random().toString(36).slice(2)}`);
    useEffect(() => {
        // Docked mode is a persistent side panel, not a dismissible modal layer.
        if (!isOpen || embedded)
            return;
        const bridge = getDismissibleLayerBridge();
        if (!bridge)
            return;
        return bridge.registerLayer({
            id: overlayIdRef.current,
            type: 'radix-dialog',
            priority: 100,
            close: onClose,
        });
    }, [isOpen, onClose, embedded]);
    // Hide macOS traffic lights when overlay opens, restore when it closes
    // This prevents accidental clicks on window controls behind the fullscreen overlay.
    // Docked mode leaves the window chrome alone since it never covers it.
    useEffect(() => {
        if (!isOpen || embedded)
            return;
        onSetTrafficLightsVisible?.(false);
        return () => onSetTrafficLightsVisible?.(true);
    }, [isOpen, onSetTrafficLightsVisible, embedded]);
    // Content padding clears the floating header at rest (when present).
    // Without a header, just the fade zone inset.
    const contentPaddingTop = hasHeader ? HEADER_HEIGHT + FADE_SIZE : FADE_SIZE;
    // Shared inner layout (masked scroll area + floating header) — identical structure for
    // both fullscreen (inside Dialog.Content) and docked (inline) modes.
    const overlayBody = (_jsxs(_Fragment, { children: [_jsx("div", { className: "absolute inset-0", style: { maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }, children: _jsx("div", { className: "h-full overflow-y-auto", style: { paddingTop: contentPaddingTop, paddingBottom: FADE_SIZE, scrollPaddingTop: contentPaddingTop }, children: _jsxs("div", { className: "min-h-full flex flex-col justify-center", children: [error && (_jsx("div", { className: "px-6 pb-4", children: _jsx(OverlayErrorBanner, { label: error.label, message: error.message }) })), children] }) }) }), hasHeader && (_jsx("div", { className: "absolute top-0 left-0 right-0 z-10", children: _jsx(FullscreenOverlayBaseHeader, { onClose: onClose, typeBadge: typeBadge, filePath: filePath, title: title, onTitleClick: onTitleClick, subtitle: subtitle, headerActions: headerActions, copyContent: copyContent }) }))] }));
    // Docked / embedded mode — render inline filling the parent container (e.g. a resizable
    // side panel) without a modal portal, so the rest of the app stays visible and usable.
    if (embedded) {
        if (!isOpen)
            return null;
        return (_jsx("div", { className: cn('relative h-full w-full overflow-hidden outline-none', 'bg-foreground-3 fullscreen-overlay-background', className), children: overlayBody }));
    }
    return (_jsx(Dialog.Root, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsx(Dialog.Portal, { children: _jsxs(Dialog.Content, { className: cn('fixed inset-0 overflow-hidden outline-none', 'bg-foreground-3 fullscreen-overlay-background', className), style: { zIndex: Z_FULLSCREEN }, onOpenAutoFocus: (e) => e.preventDefault(), onEscapeKeyDown: (event) => {
                    const handled = handleFullscreenEscapeWithStack();
                    if (!handled)
                        return;
                    event.preventDefault();
                    event.stopPropagation();
                }, children: [_jsx(Dialog.Title, { className: "sr-only", children: accessibleTitle }), overlayBody] }) }) }));
}
//# sourceMappingURL=FullscreenOverlayBase.js.map