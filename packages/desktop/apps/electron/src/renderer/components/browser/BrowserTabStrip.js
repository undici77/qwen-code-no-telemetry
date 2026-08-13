import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * BrowserTabStrip
 *
 * Rendered in the TopBar, shows compact badges for all active browser instances.
 * Each badge opens a shared action menu.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import * as Icons from 'lucide-react';
import { Spinner } from '@craft-agent/ui';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuSub, StyledDropdownMenuContent, StyledDropdownMenuItem, StyledDropdownMenuSubTrigger, StyledDropdownMenuSubContent, StyledDropdownMenuSeparator, } from '@/components/ui/styled-dropdown';
import { activeBrowserInstanceIdAtom, browserInstancesAtom, setBrowserInstancesAtom, updateBrowserInstanceAtom, removeBrowserInstanceAtom, } from '@/atoms/browser-pane';
import { BrowserTabBadge } from './BrowserTabBadge';
import { getHostname } from './utils';
import { navigate, routes } from '@/lib/navigate';
const DEFAULT_MAX_VISIBLE_BADGES = 3;
export function BrowserTabStrip({ activeSessionId, instancesOverride, maxVisibleBadges = DEFAULT_MAX_VISIBLE_BADGES, }) {
    const instances = useAtomValue(browserInstancesAtom);
    const setInstances = useSetAtom(setBrowserInstancesAtom);
    const updateInstance = useSetAtom(updateBrowserInstanceAtom);
    const removeInstance = useSetAtom(removeBrowserInstanceAtom);
    const [activeInstanceId, setActiveInstanceId] = useAtom(activeBrowserInstanceIdAtom);
    const effectiveInstances = instancesOverride ?? instances;
    const instancesRef = useRef(effectiveInstances);
    const removeReconcileTimerRef = useRef(null);
    const orderedInstances = useMemo(() => {
        const items = [...effectiveInstances];
        // Global list: keep all browser windows visible.
        // Optional ordering preference: session-local windows first.
        if (activeSessionId) {
            items.sort((a, b) => {
                const aInActiveSession = a.boundSessionId === activeSessionId ? 0 : 1;
                const bInActiveSession = b.boundSessionId === activeSessionId ? 0 : 1;
                if (aInActiveSession !== bInActiveSession)
                    return aInActiveSession - bInActiveSession;
                return a.id.localeCompare(b.id);
            });
        }
        else {
            items.sort((a, b) => a.id.localeCompare(b.id));
        }
        return items;
    }, [effectiveInstances, activeSessionId]);
    useEffect(() => {
        instancesRef.current = effectiveInstances;
    }, [effectiveInstances]);
    useEffect(() => {
        if (instancesOverride)
            return;
        const browserPaneApi = window.electronAPI?.browserPane;
        if (!browserPaneApi || !window.electronAPI.isChannelAvailable('browser-pane:list')) {
            setInstances([]);
            setActiveInstanceId(null);
            return;
        }
        browserPaneApi.list()
            .then((items) => {
            setInstances(items);
            if (items.length === 0) {
                setActiveInstanceId(null);
                return;
            }
            setActiveInstanceId((prev) => prev ?? items[0].id);
        })
            .catch((error) => {
            console.warn('[BrowserTabStrip] Failed to list browser panes:', error);
            setInstances([]);
            setActiveInstanceId(null);
        });
    }, [instancesOverride, setInstances, setActiveInstanceId]);
    useEffect(() => {
        if (instancesOverride)
            return;
        const browserPaneApi = window.electronAPI?.browserPane;
        if (!browserPaneApi || !window.electronAPI.isChannelAvailable('browser-pane:list'))
            return;
        const cleanupState = browserPaneApi.onStateChanged((info) => {
            updateInstance(info);
        });
        const cleanupRemoved = browserPaneApi.onRemoved((id) => {
            removeInstance(id);
            setActiveInstanceId((prev) => {
                if (prev !== id)
                    return prev;
                const remaining = instancesRef.current.filter((item) => item.id !== id);
                return remaining[0]?.id ?? null;
            });
            if (removeReconcileTimerRef.current) {
                clearTimeout(removeReconcileTimerRef.current);
            }
            removeReconcileTimerRef.current = setTimeout(() => {
                removeReconcileTimerRef.current = null;
                void browserPaneApi.list()
                    .then((items) => {
                    setInstances(items);
                    setActiveInstanceId((prev) => {
                        if (!prev)
                            return items[0]?.id ?? null;
                        return items.some((item) => item.id === prev) ? prev : (items[0]?.id ?? null);
                    });
                })
                    .catch((error) => {
                    console.warn('[BrowserTabStrip] Reconcile list failed after remove:', error);
                });
            }, 75);
        });
        const cleanupInteracted = browserPaneApi.onInteracted((id) => {
            setActiveInstanceId(id);
        });
        return () => {
            cleanupState();
            cleanupRemoved();
            cleanupInteracted();
            if (removeReconcileTimerRef.current) {
                clearTimeout(removeReconcileTimerRef.current);
                removeReconcileTimerRef.current = null;
            }
        };
    }, [instancesOverride, updateInstance, removeInstance, setActiveInstanceId, setInstances]);
    useEffect(() => {
        if (orderedInstances.length === 0) {
            setActiveInstanceId(null);
            return;
        }
        if (!activeInstanceId || !orderedInstances.some((item) => item.id === activeInstanceId)) {
            setActiveInstanceId(orderedInstances[0].id);
        }
    }, [orderedInstances, activeInstanceId, setActiveInstanceId]);
    const focusBrowserWindow = useCallback((instance) => {
        setActiveInstanceId(instance.id);
        if (instancesOverride)
            return;
        const browserPaneApi = window.electronAPI?.browserPane;
        if (!browserPaneApi) {
            console.warn('[BrowserTabStrip] browserPane API unavailable for focus action');
            return;
        }
        void browserPaneApi.focus(instance.id).catch((error) => {
            console.warn(`[BrowserTabStrip] Failed to focus browser window ${instance.id}:`, error);
        });
    }, [instancesOverride, setActiveInstanceId]);
    const openSessionUsingWindow = useCallback((instance) => {
        const sessionId = instance.boundSessionId ?? instance.ownerSessionId;
        if (!sessionId)
            return;
        navigate(routes.view.allSessions(sessionId));
    }, []);
    const terminateBrowserWindow = useCallback((instance) => {
        if (!instancesOverride) {
            const browserPaneApi = window.electronAPI?.browserPane;
            if (!browserPaneApi) {
                console.warn('[BrowserTabStrip] browserPane API unavailable for terminate action');
            }
            else {
                void browserPaneApi.destroy(instance.id).catch((error) => {
                    console.warn(`[BrowserTabStrip] Failed to terminate browser window ${instance.id}:`, error);
                });
            }
            removeInstance(instance.id);
        }
        setActiveInstanceId((prev) => {
            if (prev !== instance.id)
                return prev;
            const remaining = instancesRef.current.filter((item) => item.id !== instance.id);
            return remaining[0]?.id ?? null;
        });
    }, [instancesOverride, removeInstance, setActiveInstanceId]);
    const renderBrowserActions = useCallback((instance) => {
        const canUseLiveWindowActions = !instancesOverride;
        const targetSessionId = instance.boundSessionId ?? instance.ownerSessionId;
        const canOpenSession = !!targetSessionId;
        const openSessionLabel = instance.agentControlActive
            ? 'Open Session Using this Window'
            : 'Open Session Which Used this Window';
        return (_jsxs(_Fragment, { children: [_jsxs(StyledDropdownMenuItem, { disabled: !canUseLiveWindowActions, onSelect: () => focusBrowserWindow(instance), children: [_jsx(Icons.Monitor, { className: "h-3.5 w-3.5" }), "Show Browser Window"] }), _jsxs(StyledDropdownMenuItem, { disabled: !canOpenSession, onSelect: () => openSessionUsingWindow(instance), children: [_jsx(Icons.PanelRightOpen, { className: "h-3.5 w-3.5" }), openSessionLabel] }), _jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { variant: "destructive", disabled: !canUseLiveWindowActions, onSelect: () => terminateBrowserWindow(instance), children: [_jsx(Icons.XCircle, { className: "h-3.5 w-3.5" }), "Terminate Browser"] })] }));
    }, [instancesOverride, focusBrowserWindow, openSessionUsingWindow, terminateBrowserWindow]);
    if (orderedInstances.length === 0)
        return null;
    const visibleBadgeCount = Math.max(1, maxVisibleBadges);
    const visible = orderedInstances.slice(0, visibleBadgeCount);
    const overflow = orderedInstances.slice(visibleBadgeCount);
    return (_jsxs("div", { className: "flex items-center gap-1.5", children: [visible.map((instance) => (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(BrowserTabBadge, { instance: instance, isActive: instance.id === activeInstanceId }) }), _jsx(StyledDropdownMenuContent, { align: "end", minWidth: "min-w-56", children: renderBrowserActions(instance) })] }, instance.id))), overflow.length > 0 && (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs("button", { type: "button", className: "h-[26px] px-1.5 rounded-lg text-[11px] text-foreground/50 bg-background shadow-minimal hover:bg-foreground/[0.03] transition-colors cursor-pointer titlebar-no-drag", children: ["+", overflow.length] }) }), _jsx(StyledDropdownMenuContent, { align: "end", minWidth: "min-w-64", children: overflow.map((instance) => {
                            const hostname = getHostname(instance.url);
                            const displayLabel = instance.title.trim() || hostname || 'Local File';
                            return (_jsxs(DropdownMenuSub, { children: [_jsxs(StyledDropdownMenuSubTrigger, { children: [instance.isLoading ? (_jsx(Spinner, { className: "text-[10px]" })) : (_jsx(Icons.Globe, { className: "h-3.5 w-3.5" })), _jsx("span", { className: "truncate", children: displayLabel })] }), _jsx(StyledDropdownMenuSubContent, { minWidth: "min-w-56", children: renderBrowserActions(instance) })] }, instance.id));
                        }) })] }))] }));
}
//# sourceMappingURL=BrowserTabStrip.js.map