import { jsx as _jsx } from "react/jsx-runtime";
/**
 * AppShellContext
 *
 * Provides session and workspace data to tab panels without prop drilling.
 * This context is used by ChatTabPanel and other components that need
 * access to the current session, workspace, and callback functions.
 */
import * as React from 'react';
import { createContext, useContext, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { defaultSessionOptions } from '../hooks/useSessionOptions';
import { sessionAtomFamily } from '../atoms/sessions';
const AppShellContext = createContext(null);
export function AppShellProvider({ children, value, }) {
    return (_jsx(AppShellContext.Provider, { value: value, children: children }));
}
/** Returns context or null if outside provider (safe for optional consumers like playground) */
export function useOptionalAppShellContext() {
    return useContext(AppShellContext);
}
export function useAppShellContext() {
    const context = useContext(AppShellContext);
    if (!context) {
        throw new Error('useAppShellContext must be used within an AppShellProvider');
    }
    return context;
}
/**
 * Get a specific session by ID using per-session atoms
 * This hook only re-renders when the specific session changes,
 * not when other sessions change (solves streaming isolation)
 */
export function useSession(sessionId) {
    // Use per-session atom for isolated updates
    return useAtomValue(sessionAtomFamily(sessionId));
}
/**
 * Get the active workspace
 */
export function useActiveWorkspace() {
    const { workspaces, activeWorkspaceId } = useAppShellContext();
    if (!activeWorkspaceId)
        return null;
    return workspaces.find((w) => w.id === activeWorkspaceId) || null;
}
/**
 * Get pending permission for a session (first in queue)
 */
export function usePendingPermission(sessionId) {
    const { pendingPermissions } = useAppShellContext();
    return pendingPermissions.get(sessionId)?.[0];
}
/**
 * Get pending credential request for a session (first in queue)
 */
export function usePendingCredential(sessionId) {
    const { pendingCredentials } = useAppShellContext();
    return pendingCredentials.get(sessionId)?.[0];
}
/**
 * Hook to get and update session options for a specific session.
 * This is the primary way components should access session options.
 *
 * Usage:
 *   const { options, setPermissionMode } = useSessionOptionsFor(sessionId)
 *   setPermissionMode('safe')
 */
export function useSessionOptionsFor(sessionId) {
    const { sessionOptions, globalPermissionMode, onSessionOptionsChange } = useAppShellContext();
    const options = {
        ...defaultSessionOptions,
        ...sessionOptions.get(sessionId),
        permissionMode: globalPermissionMode,
    };
    const setOption = useCallback((key, value) => {
        onSessionOptionsChange(sessionId, { [key]: value });
    }, [sessionId, onSessionOptionsChange]);
    const setOptions = useCallback((updates) => {
        onSessionOptionsChange(sessionId, updates);
    }, [sessionId, onSessionOptionsChange]);
    const setPermissionMode = useCallback((mode) => {
        setOption('permissionMode', mode);
    }, [setOption]);
    const isSafeModeActive = useCallback(() => {
        return options.permissionMode === 'safe';
    }, [options.permissionMode]);
    return {
        options,
        setOption,
        setOptions,
        setPermissionMode,
        isSafeModeActive,
    };
}
//# sourceMappingURL=AppShellContext.js.map