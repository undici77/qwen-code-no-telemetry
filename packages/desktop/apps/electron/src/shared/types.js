// =============================================================================
// Protocol re-exports (channels, DTOs, events, wire types)
// =============================================================================
export * from '@craft-agent/shared/protocol';
export { PERMISSION_MODE_CONFIG } from '@craft-agent/shared/agent/modes';
export { THINKING_LEVELS, DEFAULT_THINKING_LEVEL, } from '@craft-agent/shared/agent/thinking-levels';
// =============================================================================
// GUI-only types (not used by server/handler code)
// =============================================================================
/**
 * Browser toolbar window IPC channels (preload <-> BrowserPaneManager).
 * Kept separate from RPC_CHANNELS because these are scoped to toolbar windows.
 */
export const BROWSER_TOOLBAR_CHANNELS = {
    NAVIGATE: 'browser-toolbar:navigate',
    GO_BACK: 'browser-toolbar:go-back',
    GO_FORWARD: 'browser-toolbar:go-forward',
    RELOAD: 'browser-toolbar:reload',
    STOP: 'browser-toolbar:stop',
    OPEN_MENU: 'browser-toolbar:open-menu',
    TOGGLE_DOCK_EXPANDED: 'browser-toolbar:toggle-dock-expanded',
    HIDE: 'browser-toolbar:hide',
    DESTROY: 'browser-toolbar:destroy',
    STATE_UPDATE: 'browser-toolbar:state-update',
    THEME_COLOR: 'browser-toolbar:theme-color',
};
import { DEFAULT_SETTINGS_SUBPAGE, isValidSettingsSubpage, } from './settings-registry';
export const isSessionsNavigation = (state) => state.navigator === 'sessions';
export const isSourcesNavigation = (state) => state.navigator === 'sources';
export const isSettingsNavigation = (state) => state.navigator === 'settings';
export const isSkillsNavigation = (state) => state.navigator === 'skills';
export const isSkillMarketplaceNavigation = (state) => state.navigator === 'skillMarketplace';
export const isAutomationsNavigation = (state) => state.navigator === 'automations';
export const DEFAULT_NAVIGATION_STATE = {
    navigator: 'sessions',
    filter: { kind: 'allSessions' },
    details: null,
};
export const getNavigationStateKey = (state) => {
    if (state.navigator === 'sources') {
        if (state.details) {
            return `sources/source/${state.details.sourceSlug}`;
        }
        return 'sources';
    }
    if (state.navigator === 'skills') {
        if (state.details?.type === 'skill') {
            return `skills/skill/${state.details.skillSlug}`;
        }
        return 'skills';
    }
    if (state.navigator === 'skillMarketplace') {
        if (state.details?.type === 'marketplaceSkill') {
            return `skillMarketplace/skill/${state.details.skillId}`;
        }
        return 'skillMarketplace';
    }
    if (state.navigator === 'automations') {
        if (state.details?.type === 'automation') {
            return `automations/automation/${state.details.automationId}`;
        }
        return 'automations';
    }
    if (state.navigator === 'settings') {
        return `settings:${state.subpage}`;
    }
    // Chats
    const f = state.filter;
    let base;
    if (f.kind === 'state')
        base = `state:${f.stateId}`;
    else if (f.kind === 'label')
        base = `label:${f.labelId}`;
    else if (f.kind === 'view')
        base = `view:${f.viewId}`;
    else
        base = f.kind;
    if (state.details) {
        return `${base}/chat/${state.details.sessionId}`;
    }
    return base;
};
export const parseNavigationStateKey = (key) => {
    // Handle sources
    if (key === 'sources')
        return { navigator: 'sources', details: null };
    if (key.startsWith('sources/source/')) {
        const sourceSlug = key.slice(15);
        if (sourceSlug) {
            return { navigator: 'sources', details: { type: 'source', sourceSlug } };
        }
        return { navigator: 'sources', details: null };
    }
    // Handle skills
    if (key === 'skills')
        return { navigator: 'skills', details: null };
    if (key.startsWith('skills/skill/')) {
        const skillSlug = key.slice(13);
        if (skillSlug) {
            return { navigator: 'skills', details: { type: 'skill', skillSlug } };
        }
        return { navigator: 'skills', details: null };
    }
    // Handle skill marketplace
    if (key === 'skillMarketplace') {
        return { navigator: 'skillMarketplace', details: null };
    }
    if (key.startsWith('skillMarketplace/skill/')) {
        const skillId = key.slice('skillMarketplace/skill/'.length);
        if (skillId) {
            return {
                navigator: 'skillMarketplace',
                details: { type: 'marketplaceSkill', skillId },
            };
        }
        return { navigator: 'skillMarketplace', details: null };
    }
    // Handle automations
    if (key === 'automations')
        return { navigator: 'automations', details: null };
    if (key.startsWith('automations/automation/')) {
        const automationId = key.slice(22);
        if (automationId) {
            return {
                navigator: 'automations',
                details: { type: 'automation', automationId },
            };
        }
        return { navigator: 'automations', details: null };
    }
    // Handle settings
    if (key === 'settings') {
        return { navigator: 'settings', subpage: DEFAULT_SETTINGS_SUBPAGE };
    }
    if (key.startsWith('settings:')) {
        const subpage = key.slice(9);
        if (isValidSettingsSubpage(subpage)) {
            return { navigator: 'settings', subpage };
        }
    }
    // Handle sessions
    const parseSessionsKey = (filterKey, sessionId) => {
        let filter;
        if (filterKey === 'allSessions')
            filter = { kind: 'allSessions' };
        else if (filterKey === 'flagged')
            filter = { kind: 'flagged' };
        else if (filterKey === 'archived')
            filter = { kind: 'archived' };
        else if (filterKey.startsWith('state:')) {
            const stateId = filterKey.slice(6);
            if (!stateId)
                return null;
            filter = { kind: 'state', stateId };
        }
        else if (filterKey.startsWith('label:')) {
            const labelId = filterKey.slice(6);
            if (!labelId)
                return null;
            filter = { kind: 'label', labelId };
        }
        else if (filterKey.startsWith('view:')) {
            const viewId = filterKey.slice(5);
            if (!viewId)
                return null;
            filter = { kind: 'view', viewId };
        }
        else {
            return null;
        }
        return {
            navigator: 'sessions',
            filter,
            details: sessionId ? { type: 'session', sessionId } : null,
        };
    };
    // Check for session details
    if (key.includes('/session/')) {
        const [filterPart, , sessionId] = key.split('/');
        return parseSessionsKey(filterPart, sessionId);
    }
    // Simple filter key
    return parseSessionsKey(key);
};
//# sourceMappingURL=types.js.map