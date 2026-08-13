import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * FullscreenOverlayBaseHeader - Header component for fullscreen overlays
 *
 * Builds a badge row from structured props (typeBadge, filePath, title, subtitle).
 * The file path badge has a dual-trigger menu:
 * - Left-click → Radix DropdownMenu with "Open" / "Reveal in {file manager}"
 * - Right-click → Radix ContextMenu with the same items
 *
 * Both menus share one internal items array, just wrapped differently.
 * onOpenFileExternal and onRevealInFinder come from PlatformContext — no per-overlay callbacks.
 */
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Check, Copy, ExternalLink, FolderOpen } from 'lucide-react';
import { PreviewHeader, PreviewHeaderBadge } from '../ui/PreviewHeader';
import { DropdownMenu, DropdownMenuTrigger, StyledDropdownMenuContent, StyledDropdownMenuItem, } from '../ui/StyledDropdown';
import { usePlatform } from '../../context/PlatformContext';
import { cn } from '../../lib/utils';
/**
 * Truncates a file path to show just the filename for display in the badge.
 * Full path is available via tooltip.
 */
function displayPath(filePath) {
    const parts = filePath.split('/');
    const name = parts.pop() || filePath;
    // Show parent dir + filename if available (e.g. "src/App.tsx")
    if (parts.length > 0) {
        const parent = parts.pop();
        return `${parent}/${name}`;
    }
    return name;
}
// ============================================================================
// Shared context menu styling — matches StyledDropdown's popover-styled look
// ============================================================================
const contextMenuContentClasses = cn('popover-styled z-dropdown min-w-40 overflow-hidden p-1', 'w-fit font-sans whitespace-nowrap text-xs flex flex-col gap-0.5', 'animate-in fade-in-0 zoom-in-95');
const contextMenuItemClasses = cn('relative flex cursor-default items-center gap-2 px-2 py-1.5 text-sm outline-hidden select-none', '[&_svg]:pointer-events-none [&_svg]:shrink-0', 'pr-4 rounded-[4px] hover:bg-foreground/[0.03] focus:bg-foreground/[0.03]', '[&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0');
/**
 * FilePathBadge - Badge that opens a menu on both left-click and right-click.
 *
 * Implementation: Wraps a Radix DropdownMenu (left-click trigger) inside a
 * Radix ContextMenu (right-click trigger). Both render the same menu items.
 * Uses onOpenFileExternal (not onOpenFile) from PlatformContext — when already
 * viewing a file in an overlay, "Open" should launch the system editor directly,
 * not re-trigger the in-app preview interceptor.
 */
function FilePathBadge({ filePath }) {
    const { onOpenFileExternal, onRevealInFinder, fileManagerName } = usePlatform();
    const revealLabel = `Reveal in ${fileManagerName || 'Finder'}`;
    const handleOpen = useCallback(() => {
        onOpenFileExternal?.(filePath);
    }, [onOpenFileExternal, filePath]);
    const handleReveal = useCallback(() => {
        onRevealInFinder?.(filePath);
    }, [onRevealInFinder, filePath]);
    // Shared menu items — same content rendered by both dropdown and context menu
    const hasMenuItems = !!onOpenFileExternal || !!onRevealInFinder;
    const dropdownItems = (_jsxs(_Fragment, { children: [onOpenFileExternal && (_jsxs(StyledDropdownMenuItem, { onSelect: handleOpen, children: [_jsx(ExternalLink, {}), "Open"] })), onRevealInFinder && (_jsxs(StyledDropdownMenuItem, { onSelect: handleReveal, children: [_jsx(FolderOpen, {}), revealLabel] }))] }));
    const contextItems = (_jsxs(_Fragment, { children: [onOpenFileExternal && (_jsxs(ContextMenu.Item, { className: contextMenuItemClasses, onSelect: handleOpen, children: [_jsx(ExternalLink, {}), "Open"] })), onRevealInFinder && (_jsxs(ContextMenu.Item, { className: contextMenuItemClasses, onSelect: handleReveal, children: [_jsx(FolderOpen, {}), revealLabel] }))] }));
    const display = displayPath(filePath);
    // If no menu items available (e.g. web viewer), just show a static badge
    if (!hasMenuItems) {
        return _jsx(PreviewHeaderBadge, { label: display, title: filePath, shrinkable: true });
    }
    // Wrap: ContextMenu (right-click) wraps DropdownMenu (left-click) wraps the badge
    return (_jsxs(ContextMenu.Root, { children: [_jsx(ContextMenu.Trigger, { asChild: true, children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { className: cn('flex items-center gap-1.5 h-[26px] px-2.5 rounded-[6px]', 'font-sans text-[13px] font-medium text-foreground/70', 'bg-background shadow-minimal', 'min-w-0 cursor-pointer group'), title: filePath, children: _jsx("span", { className: "truncate group-hover:underline", children: display }) }) }), _jsx(StyledDropdownMenuContent, { sideOffset: 6, align: "center", style: { zIndex: 'var(--z-floating-menu, 400)' }, children: dropdownItems })] }) }), _jsx(ContextMenu.Portal, { children: _jsx(ContextMenu.Content, { className: contextMenuContentClasses, children: contextItems }) })] }));
}
// ============================================================================
// FullscreenOverlayBaseHeader
// ============================================================================
export function FullscreenOverlayBaseHeader({ onClose, typeBadge, filePath, title, onTitleClick, subtitle, headerActions, copyContent, }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const handleCopy = useCallback(async () => {
        if (!copyContent)
            return;
        try {
            await navigator.clipboard.writeText(copyContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [copyContent]);
    // Built-in copy button + any custom header actions, rendered in PreviewHeader's right actions area
    const rightActions = (_jsxs(_Fragment, { children: [copyContent != null && (_jsx("button", { onClick: handleCopy, className: cn('p-1.5 rounded-[6px] bg-background shadow-minimal cursor-pointer', 'opacity-70 hover:opacity-100 transition-opacity', 'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring'), title: copied ? t('common.copied') : t('common.copyAll'), children: copied ? _jsx(Check, { className: "w-4 h-4" }) : _jsx(Copy, { className: "w-4 h-4" }) })), headerActions] }));
    return (_jsxs(PreviewHeader, { onClose: onClose, height: 48, rightActions: rightActions, children: [typeBadge && (_jsx(PreviewHeaderBadge, { icon: typeBadge.icon, label: typeBadge.label, variant: typeBadge.variant })), filePath ? (_jsx(FilePathBadge, { filePath: filePath })) : title ? (_jsx(PreviewHeaderBadge, { label: title, onClick: onTitleClick, shrinkable: true })) : null, subtitle && _jsx(PreviewHeaderBadge, { label: subtitle })] }));
}
//# sourceMappingURL=FullscreenOverlayBaseHeader.js.map