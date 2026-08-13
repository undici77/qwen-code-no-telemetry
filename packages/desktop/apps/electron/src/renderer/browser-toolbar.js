import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Browser Toolbar — React entry point
 *
 * Renders the shared BrowserControls component inside a chromeless
 * BrowserWindow. Communicates with the main process via a dedicated
 * preload script (browser-toolbar preload).
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { EyeOff, Maximize2, Minimize2, X, XCircle } from 'lucide-react';
import { BrowserControls } from '@craft-agent/ui';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { DropdownMenu, DropdownMenuTrigger, StyledDropdownMenuContent, StyledDropdownMenuItem, } from '@/components/ui/styled-dropdown';
import './index.css';
/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */
function BrowserToolbarApp() {
    const [state, setState] = useState({
        url: 'about:blank',
        title: 'New Tab',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
    });
    const [themeColor, setThemeColor] = useState(null);
    const [windowMenuOpen, setWindowMenuOpen] = useState(false);
    const menuContentRef = useRef(null);
    const api = window.browserToolbar;
    useEffect(() => {
        if (!api)
            return;
        return api.onStateUpdate((s) => {
            setState(s);
            // Sync theme color from full state push (initial load / reconnection)
            if ('themeColor' in s) {
                setThemeColor(s.themeColor ?? null);
            }
        });
    }, [api]);
    useEffect(() => {
        if (!api)
            return;
        return api.onThemeColor(setThemeColor);
    }, [api]);
    useEffect(() => {
        if (!api)
            return;
        return api.onForceCloseMenu(() => {
            setWindowMenuOpen(false);
        });
    }, [api]);
    useEffect(() => {
        if (!api)
            return;
        if (!windowMenuOpen) {
            void api.setMenuGeometry(false, 0);
            return;
        }
        // Prime expansion immediately to avoid a constrained first measurement.
        void api.setMenuGeometry(true, 120);
        const sendGeometry = () => {
            const height = Math.ceil(menuContentRef.current?.getBoundingClientRect().height ?? 0);
            void api.setMenuGeometry(true, height);
        };
        let frame = requestAnimationFrame(sendGeometry);
        const observer = new ResizeObserver(() => {
            sendGeometry();
        });
        if (menuContentRef.current) {
            observer.observe(menuContentRef.current);
        }
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            void api.setMenuGeometry(false, 0);
        };
    }, [api, windowMenuOpen]);
    const handleNavigate = useCallback((url) => {
        void api?.navigate(url);
    }, [api]);
    const handleGoBack = useCallback(() => {
        void api?.goBack();
    }, [api]);
    const handleGoForward = useCallback(() => {
        void api?.goForward();
    }, [api]);
    const handleReload = useCallback(() => {
        void api?.reload();
    }, [api]);
    const handleStop = useCallback(() => {
        void api?.stop();
    }, [api]);
    const handleToggleDockExpanded = useCallback(() => {
        void api?.toggleDockExpanded();
    }, [api]);
    const handleHideWindow = useCallback(() => {
        setWindowMenuOpen(false);
        void api?.hideWindow();
    }, [api]);
    const handleCloseWindowEntirely = useCallback(() => {
        setWindowMenuOpen(false);
        void api?.closeWindowEntirely();
    }, [api]);
    return (_jsxs(_Fragment, { children: [windowMenuOpen && (_jsx("div", { className: "fixed inset-0 z-[90] titlebar-no-drag bg-black/[0.0039215686]", onPointerDown: (event) => {
                    event.preventDefault();
                    setWindowMenuOpen(false);
                } })), _jsx(BrowserControls, { url: state.url, loading: state.isLoading, canGoBack: state.canGoBack, canGoForward: state.canGoForward, onNavigate: handleNavigate, onGoBack: handleGoBack, onGoForward: handleGoForward, onReload: handleReload, onStop: handleStop, trailingContent: (_jsxs("div", { className: "ml-2 flex items-center gap-1.5 titlebar-no-drag", children: [state.presentation === 'docked' && (_jsxs(_Fragment, { children: [_jsx(HeaderIconButton, { icon: state.dockExpanded ? (_jsx(Minimize2, { className: "h-3.5 w-3.5" })) : (_jsx(Maximize2, { className: "h-3.5 w-3.5" })), "aria-label": state.dockExpanded ? 'Restore panel width' : 'Expand panel', tooltip: state.dockExpanded ? 'Restore panel width' : 'Expand panel', onClick: handleToggleDockExpanded, className: themeColor ? '' : 'bg-background shadow-minimal hover:bg-foreground/5', style: themeColor ? { color: 'var(--tb-fg)' } : undefined }), _jsx(HeaderIconButton, { icon: _jsx(X, { className: "h-3.5 w-3.5" }), "aria-label": "Close side panel", tooltip: "Close side panel", onClick: handleHideWindow, className: themeColor ? '' : 'bg-background shadow-minimal hover:bg-foreground/5', style: themeColor ? { color: 'var(--tb-fg)' } : undefined })] })), state.presentation !== 'docked' && (_jsxs(DropdownMenu, { open: windowMenuOpen, onOpenChange: setWindowMenuOpen, children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(HeaderIconButton, { icon: _jsx(X, { className: "h-3.5 w-3.5" }), "aria-label": "Browser window options", className: themeColor ? '' : 'bg-background shadow-minimal hover:bg-foreground/5', style: themeColor ? { color: 'var(--tb-fg)' } : undefined }) }), _jsxs(StyledDropdownMenuContent, { ref: menuContentRef, align: "end", side: "bottom", sideOffset: 6, minWidth: "min-w-44", className: "titlebar-no-drag z-[110] max-h-none overflow-visible", children: [_jsxs(StyledDropdownMenuItem, { onSelect: handleHideWindow, children: [_jsx(EyeOff, { className: "h-3.5 w-3.5" }), "Hide Window"] }), _jsxs(StyledDropdownMenuItem, { variant: "destructive", onSelect: handleCloseWindowEntirely, children: [_jsx(XCircle, { className: "h-3.5 w-3.5" }), "Close Window Entirely"] })] })] }))] })), themeColor: themeColor, urlBarClassName: "max-w-[600px]", className: "titlebar-drag-region bg-background" })] }));
}
/* ------------------------------------------------------------------ */
/*  Mount                                                              */
/* ------------------------------------------------------------------ */
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(BrowserToolbarApp, {}) }));
//# sourceMappingURL=browser-toolbar.js.map