/**
 * Sidebar Mode Types
 *
 * Defines the different content modes for the 2nd sidebar.
 * The left sidebar navigation items control which mode is active.
 */
import { DEFAULT_SETTINGS_SUBPAGE } from '../../../shared/settings-registry';
/**
 * Type guard to check if mode is sessions mode
 */
export const isSessionsMode = (mode) => mode.type === 'sessions';
/**
 * Type guard to check if mode is sources mode
 */
export const isSourcesMode = (mode) => mode.type === 'sources';
/**
 * Type guard to check if mode is settings mode
 */
export const isSettingsMode = (mode) => mode.type === 'settings';
/**
 * Get a persistence key for localStorage
 * Used to save/restore the last selected sidebar mode
 */
export const getSidebarModeKey = (mode) => {
    if (mode.type === 'sources')
        return 'sources';
    if (mode.type === 'settings')
        return `settings:${mode.subpage}`;
    const f = mode.filter;
    if (f.kind === 'state')
        return `state:${f.stateId}`;
    return f.kind;
};
/**
 * Parse a persistence key back to a SidebarMode
 * Returns null if the key is invalid or requires validation (state)
 */
export const parseSidebarModeKey = (key) => {
    if (key === 'sources')
        return { type: 'sources' };
    if (key === 'allSessions')
        return { type: 'sessions', filter: { kind: 'allSessions' } };
    if (key === 'flagged')
        return { type: 'sessions', filter: { kind: 'flagged' } };
    if (key.startsWith('state:')) {
        const stateId = key.slice(6);
        if (stateId)
            return { type: 'sessions', filter: { kind: 'state', stateId } };
    }
    if (key.startsWith('settings:')) {
        const subpage = key.slice(9);
        if ([
            'app',
            'ai',
            'general',
            'mcpServers',
            'hooks',
            'extensions',
            'memory',
            'appearance',
            'input',
            'workspace',
            'permissions',
            'labels',
            'messaging',
            'server',
            'shortcuts',
            'preferences',
        ].includes(subpage)) {
            return { type: 'settings', subpage };
        }
    }
    if (key === 'settings') {
        return { type: 'settings', subpage: DEFAULT_SETTINGS_SUBPAGE };
    }
    return null;
};
/**
 * Default sidebar mode - all sessions view
 */
export const DEFAULT_SIDEBAR_MODE = {
    type: 'sessions',
    filter: { kind: 'allSessions' },
};
//# sourceMappingURL=sidebar-types.js.map