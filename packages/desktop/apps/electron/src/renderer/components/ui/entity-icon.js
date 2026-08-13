import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * EntityIcon - Unified base component for rendering any entity's icon.
 *
 * Handles three icon kinds:
 * - emoji: Renders as sized text span with bg-muted container
 * - file: Renders via CrossfadeAvatar with smooth loading transition
 * - fallback: Renders the fallbackIcon (Lucide component) with proper sizing
 *
 * Entity-specific wrappers (SourceAvatar, SkillAvatar, StatusIcon)
 * call this with their own fallbackIcon and any extra chrome (status dots, color, etc.)
 *
 * The fallbackIcon prop is the primary customisation point for subclasses.
 * EntityIcon handles all sizing, styling, and rendering logic internally.
 */
import * as React from 'react';
import { CrossfadeAvatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ICON_SIZE_CLASSES, ICON_EMOJI_SIZES } from '@craft-agent/shared/icons';
// ============================================================================
// Component
// ============================================================================
function EntityIconComponent({ icon, size = 'md', fallbackIcon: FallbackIcon, fallback, alt, className, containerClassName, chromeless, bare, }) {
    // Container size: use override if provided, otherwise standard size classes
    const sizeClass = containerClassName ?? ICON_SIZE_CLASSES[size];
    // Standard container styling (ring + rounded + shrink-0)
    const containerBase = 'rounded-[4px] ring-1 ring-border/30 shrink-0';
    // --- Emoji rendering ---
    if (icon.kind === 'emoji') {
        if (bare) {
            return _jsx("span", { className: cn(ICON_EMOJI_SIZES[size], 'leading-none', className), title: alt, children: icon.value });
        }
        return (_jsx("div", { className: cn(
            // Chromeless mode: keep size, but no background, ring, or rounded
            sizeClass, !chromeless && containerBase, !chromeless && 'bg-muted', 'flex items-center justify-center', ICON_EMOJI_SIZES[size], 'leading-none', className), title: alt, children: icon.value }));
    }
    // --- File icon rendering ---
    if (icon.kind === 'file') {
        // Colorable SVGs with rawSvg: render inline so CSS color classes from the
        // parent cascade into SVG fills/strokes via currentColor inheritance.
        // Parent applies color via Tailwind class (e.g. <span className="text-success">).
        if (icon.colorable && icon.rawSvg) {
            if (bare) {
                return (_jsx("span", { className: cn("[&>svg]:h-3.5 [&>svg]:w-3.5", className), title: alt, dangerouslySetInnerHTML: { __html: icon.rawSvg } }));
            }
            return (_jsx("div", { className: cn(sizeClass, !chromeless && containerBase, "[&>svg]:w-full [&>svg]:h-full", className), title: alt, dangerouslySetInnerHTML: { __html: icon.rawSvg } }));
        }
        // Non-colorable files (raster images, SVGs with hardcoded colors):
        // render via CrossfadeAvatar with smooth loading transition
        const fallbackNode = fallback ?? (_jsx(FallbackIcon, { className: "w-full h-full text-muted-foreground p-0.5" }));
        return (_jsx(CrossfadeAvatar, { src: icon.value, alt: alt, className: cn(sizeClass, !chromeless && containerBase, className), fallbackClassName: !chromeless ? "bg-muted rounded-[4px]" : undefined, fallback: fallbackNode }));
    }
    // --- Fallback rendering (no icon file or emoji found) ---
    if (fallback) {
        if (bare) {
            return _jsx(_Fragment, { children: fallback });
        }
        // Escape hatch: render custom fallback node
        return (_jsx("div", { className: cn(sizeClass, !chromeless && containerBase, !chromeless && 'bg-muted', className), title: alt, children: fallback }));
    }
    // Default: render the Lucide fallback icon via CrossfadeAvatar (shows immediately, no loading)
    if (bare) {
        return _jsx(FallbackIcon, { className: cn("h-3.5 w-3.5", className) });
    }
    return (_jsx(CrossfadeAvatar, { src: null, alt: alt, className: cn(sizeClass, !chromeless && containerBase, className), fallbackClassName: !chromeless ? "bg-muted rounded-[4px]" : undefined, fallback: _jsx(FallbackIcon, { className: "w-full h-full text-muted-foreground p-0.5" }) }));
}
export const EntityIcon = EntityIconComponent;
EntityIcon.acceptsBare = true;
//# sourceMappingURL=entity-icon.js.map