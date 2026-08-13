import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ToolbarStatusSlot
 *
 * Priority-based overlay slot for the input toolbar bottom row.
 * Shows contextual status indicators — escape-to-interrupt hint (highest priority),
 * browser session state, or future status types.
 *
 * Positioned absolute inset-0 over the toolbar's relative container.
 * Uses AnimatePresence for smooth fade transitions between states.
 *
 * Browser state is consumed directly from Jotai atoms (same pattern as BrowserTabStrip)
 * to avoid threading props through 4 component levels.
 */
import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { useTranslation, Trans } from 'react-i18next';
import { Spinner } from '@craft-agent/ui';
import { cn } from '@/lib/utils';
import { Kbd } from '@/components/ui/kbd';
import { getHostname, getThemeLuminance } from '@/components/browser/utils';
import { browserInstancesAtom } from '@/atoms/browser-pane';
export function ToolbarStatusSlot({ showEscapeOverlay, sessionId, }) {
    const browserInstances = useAtomValue(browserInstancesAtom);
    // Find the visible browser instance bound to this session with active agent control.
    // Hidden instances are intentionally excluded so the status slot mirrors actual visibility.
    const browserInstance = React.useMemo(() => {
        if (!sessionId)
            return null;
        const visibleCandidates = browserInstances.filter(i => i.boundSessionId === sessionId && i.agentControlActive && i.isVisible);
        if (visibleCandidates.length === 0)
            return null;
        return visibleCandidates.at(-1) ?? null;
    }, [browserInstances, sessionId]);
    // Priority resolution: escape interrupt > browser status
    const showBrowser = !showEscapeOverlay && browserInstance !== null;
    const handleBrowserClick = React.useCallback((instanceId) => {
        window.electronAPI?.browserPane?.focus?.(instanceId);
    }, []);
    return (_jsxs(AnimatePresence, { children: [showEscapeOverlay && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 }, className: cn("absolute inset-0 z-10", "rounded-b-[12px]", "shadow-tinted", "flex items-center justify-center", "pointer-events-auto"), style: {
                    '--shadow-color': 'var(--info-rgb)',
                    backgroundColor: 'color-mix(in srgb, var(--info) 10%, var(--background))',
                    color: 'color-mix(in oklab, var(--info) 30%, var(--foreground))',
                }, children: _jsx("span", { className: "text-sm font-medium flex items-center gap-1.5", children: _jsx(Trans, { i18nKey: "toolbar.escapeToInterrupt", components: { kbd: _jsx(Kbd, { className: "text-inherit bg-current/10" }) } }) }) }, "escape")), showBrowser && browserInstance && (_jsx(BrowserStatusBar, { instance: browserInstance, onClick: () => handleBrowserClick(browserInstance.id) }, "browser"))] }));
}
/**
 * Browser status bar — shows when the agent is actively using a browser window.
 * Uses the site's theme color as background with luminance-based text contrast.
 */
function BrowserStatusBar({ instance, onClick, }) {
    const { t } = useTranslation();
    const hostname = getHostname(instance.url);
    const themeColor = instance.themeColor;
    const themeLuminance = themeColor ? getThemeLuminance(themeColor) : null;
    const isDarkTheme = themeLuminance !== null && themeLuminance < 0.42;
    // Compute styles based on whether we have a theme color
    const backgroundStyle = themeColor
        ? { backgroundColor: themeColor }
        : { backgroundColor: 'color-mix(in srgb, var(--accent) 15%, var(--background))' };
    const textColorClass = themeColor
        ? (isDarkTheme ? 'text-white/90' : 'text-black/80')
        : '';
    const [faviconFailed, setFaviconFailed] = React.useState(false);
    React.useEffect(() => {
        setFaviconFailed(false);
    }, [instance.favicon]);
    return (_jsxs(motion.button, { type: "button", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 }, className: cn("absolute inset-0 z-10", "rounded-b-[12px]", "flex items-center justify-center gap-2", "pointer-events-auto cursor-pointer", "transition-[background-color] duration-200", textColorClass), style: {
            ...backgroundStyle,
        }, onClick: onClick, children: [_jsx("div", { className: "absolute top-0 left-0 right-0 h-[2px] z-10 overflow-hidden", children: _jsx("div", { className: "h-full w-full animate-shimmer-loading", style: {
                        background: 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)',
                    } }) }), _jsx("span", { className: `shrink-0 flex items-center justify-center ${isDarkTheme ? 'h-4 w-4' : 'h-3.5 w-3.5'}`, children: instance.isLoading ? (_jsx(Spinner, { className: "text-[10px] leading-none" })) : instance.favicon && !faviconFailed ? (isDarkTheme ? (_jsx("span", { className: "inline-flex h-4 w-4 items-center justify-center rounded-[5px] bg-white/90 p-[1px] leading-none", children: _jsx("img", { src: instance.favicon, alt: "", className: "h-3.5 w-3.5 aspect-square rounded-none object-cover block", onError: () => setFaviconFailed(true) }) })) : (_jsx("img", { src: instance.favicon, alt: "", className: "h-3.5 w-3.5 rounded-sm block", onError: () => setFaviconFailed(true) }))) : (_jsx(Globe, { className: "h-3.5 w-3.5" })) }), _jsx("span", { className: "text-sm font-medium truncate max-w-[200px]", children: t('chat.usingConnection', { name: hostname }) })] }));
}
//# sourceMappingURL=ToolbarStatusSlot.js.map