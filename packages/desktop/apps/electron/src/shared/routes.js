/**
 * Route Registry
 *
 * Type-safe route definitions for navigation throughout the app.
 * All navigation should use these route builders instead of hardcoded strings.
 *
 * Route Formats:
 * - action/{name}[/{id}] - Trigger side effects
 * - {filter}[/session/{sessionId}] - Compound view routes for full navigation state
 *
 * Usage:
 *   import { routes } from '@/shared/routes'
 *   navigate(routes.action.newSession())
 *   navigate(routes.view.allSessions())
 *   navigate(routes.view.settings('shortcuts'))
 */
// Helper to build query strings from params
function toQueryString(params) {
    if (!params)
        return '';
    const filtered = Object.entries(params).filter(([, v]) => v !== undefined);
    if (filtered.length === 0)
        return '';
    const searchParams = new URLSearchParams(filtered);
    return `?${searchParams.toString()}`;
}
/**
 * Route definitions with type-safe builders
 */
export const routes = {
    // ============================================
    // Action Routes - Trigger actions
    // ============================================
    action: {
        /**
         * Create a new session
         * @param input - Optional initial message to pre-fill or send
         * @param name - Optional session name
         * @param send - If true and input is provided, immediately sends the message
         * @param status - Optional status/todo-state ID to apply to the new session
         * @param label - Optional label ID to apply to the new session
         */
        newSession: (params) => `action/new-session${toQueryString(params ? { ...params, send: params.send ? 'true' : undefined } : undefined)}`,
        /** Rename a session */
        renameSession: (sessionId, name) => `action/rename-session/${sessionId}?name=${encodeURIComponent(name)}`,
        /** Delete a session (with confirmation) */
        deleteSession: (sessionId) => `action/delete-session/${sessionId}`,
        /** Toggle flag on a session */
        flagSession: (sessionId) => `action/flag-session/${sessionId}`,
        /** Unflag a session */
        unflagSession: (sessionId) => `action/unflag-session/${sessionId}`,
        /** Start OAuth flow for a source */
        oauth: (sourceSlug) => `action/oauth/${sourceSlug}`,
        /** Open add source UI */
        addSource: () => 'action/add-source',
        // Note: test-source route can be added when API support is available
        // testSource: (sourceSlug: string) => `action/test-source/${sourceSlug}` as const,
        /** Delete a source */
        deleteSource: (sourceSlug) => `action/delete-source/${sourceSlug}`,
        /** Set permission mode for a session */
        setPermissionMode: (sessionId, mode) => `action/set-mode/${sessionId}?mode=${mode}`,
        /** Copy text to clipboard */
        copyToClipboard: (text) => `action/copy?text=${encodeURIComponent(text)}`,
    },
    // ============================================
    // View Routes - Compound sidebar/navigator/details routes
    // ============================================
    view: {
        /** All sessions view (sessions navigator, allSessions filter) */
        allSessions: (sessionId) => sessionId
            ? `allSessions/session/${sessionId}`
            : 'allSessions',
        /** Flagged view (sessions navigator, flagged filter) */
        flagged: (sessionId) => sessionId
            ? `flagged/session/${sessionId}`
            : 'flagged',
        /** Archived view (sessions navigator, archived filter) */
        archived: (sessionId) => sessionId
            ? `archived/session/${sessionId}`
            : 'archived',
        /** Todo state filter view (sessions navigator, state filter) */
        state: (stateId, sessionId) => sessionId
            ? `state/${stateId}/session/${sessionId}`
            : `state/${stateId}`,
        /** Label filter view (sessions navigator, label filter — includes descendants via tree hierarchy) */
        label: (labelId, sessionId) => sessionId
            ? `label/${encodeURIComponent(labelId)}/session/${sessionId}`
            : `label/${encodeURIComponent(labelId)}`,
        /** View filter (sessions navigator, view filter — evaluated dynamically) */
        view: (viewId, sessionId) => sessionId
            ? `view/${encodeURIComponent(viewId)}/session/${sessionId}`
            : `view/${encodeURIComponent(viewId)}`,
        /** Sources view (sources navigator) - supports type filtering */
        sources: (params) => {
            const { sourceSlug, type } = params ?? {};
            // Build base from filter type
            const base = type ? `sources/${type}` : 'sources';
            if (sourceSlug) {
                return `${base}/source/${sourceSlug}`;
            }
            return base;
        },
        /** API sources view (sources navigator, api filter) */
        sourcesApi: (sourceSlug) => sourceSlug
            ? `sources/api/source/${sourceSlug}`
            : 'sources/api',
        /** MCP sources view (sources navigator, mcp filter) */
        sourcesMcp: (sourceSlug) => sourceSlug
            ? `sources/mcp/source/${sourceSlug}`
            : 'sources/mcp',
        /** Local folder sources view (sources navigator, local filter) */
        sourcesLocal: (sourceSlug) => sourceSlug
            ? `sources/local/source/${sourceSlug}`
            : 'sources/local',
        /** Skills view (skills navigator). Pass a slug string for a local skill detail view. */
        skills: (skillSlug) => {
            if (!skillSlug)
                return 'skills';
            return `skills/skill/${skillSlug}`;
        },
        /** Skill marketplace view (curated skill installer). */
        skillMarketplace: (skillId) => skillId
            ? `skillMarketplace/skill/${skillId}`
            : 'skillMarketplace',
        /** Automations view (automations navigator) - supports type filtering */
        automations: (params) => {
            const { automationId, type } = params ?? {};
            const base = type ? `automations/${type}` : 'automations';
            if (automationId)
                return `${base}/automation/${automationId}`;
            return base;
        },
        /** Scheduled automations view (automations navigator, scheduled filter) */
        automationsScheduled: (automationId) => automationId
            ? `automations/scheduled/automation/${automationId}`
            : 'automations/scheduled',
        /** Event-based automations view (automations navigator, event filter) */
        automationsEvent: (automationId) => automationId
            ? `automations/event/automation/${automationId}`
            : 'automations/event',
        /** Agentic automations view (automations navigator, agentic filter) */
        automationsAgentic: (automationId) => automationId
            ? `automations/agentic/automation/${automationId}`
            : 'automations/agentic',
        /** Settings view (settings navigator) - uses SettingsSubpage from registry */
        settings: (subpage) => subpage ? `settings/${subpage}` : 'settings',
    },
};
//# sourceMappingURL=routes.js.map