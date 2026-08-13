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
import type { SettingsSubpage } from './settings-registry';
import type { PermissionMode } from '@craft-agent/shared/agent/mode-types';
/**
 * Route definitions with type-safe builders
 */
export declare const routes: {
    readonly action: {
        /**
         * Create a new session
         * @param input - Optional initial message to pre-fill or send
         * @param name - Optional session name
         * @param send - If true and input is provided, immediately sends the message
         * @param status - Optional status/todo-state ID to apply to the new session
         * @param label - Optional label ID to apply to the new session
         */
        readonly newSession: (params?: {
            input?: string;
            name?: string;
            send?: boolean;
            status?: string;
            label?: string;
        }) => `action/new-session${string}`;
        /** Rename a session */
        readonly renameSession: (sessionId: string, name: string) => `action/rename-session/${string}?name=${string}`;
        /** Delete a session (with confirmation) */
        readonly deleteSession: (sessionId: string) => `action/delete-session/${string}`;
        /** Toggle flag on a session */
        readonly flagSession: (sessionId: string) => `action/flag-session/${string}`;
        /** Unflag a session */
        readonly unflagSession: (sessionId: string) => `action/unflag-session/${string}`;
        /** Start OAuth flow for a source */
        readonly oauth: (sourceSlug: string) => `action/oauth/${string}`;
        /** Open add source UI */
        readonly addSource: () => "action/add-source";
        /** Delete a source */
        readonly deleteSource: (sourceSlug: string) => `action/delete-source/${string}`;
        /** Set permission mode for a session */
        readonly setPermissionMode: (sessionId: string, mode: PermissionMode) => `action/set-mode/${string}?mode=${PermissionMode}`;
        /** Copy text to clipboard */
        readonly copyToClipboard: (text: string) => `action/copy?text=${string}`;
    };
    readonly view: {
        /** All sessions view (sessions navigator, allSessions filter) */
        readonly allSessions: (sessionId?: string) => "allSessions" | `allSessions/session/${string}`;
        /** Flagged view (sessions navigator, flagged filter) */
        readonly flagged: (sessionId?: string) => "flagged" | `flagged/session/${string}`;
        /** Archived view (sessions navigator, archived filter) */
        readonly archived: (sessionId?: string) => "archived" | `archived/session/${string}`;
        /** Todo state filter view (sessions navigator, state filter) */
        readonly state: (stateId: string, sessionId?: string) => `state/${string}`;
        /** Label filter view (sessions navigator, label filter — includes descendants via tree hierarchy) */
        readonly label: (labelId: string, sessionId?: string) => `label/${string}`;
        /** View filter (sessions navigator, view filter — evaluated dynamically) */
        readonly view: (viewId: string, sessionId?: string) => `view/${string}`;
        /** Sources view (sources navigator) - supports type filtering */
        readonly sources: (params?: {
            sourceSlug?: string;
            type?: "api" | "mcp" | "local";
        }) => "sources" | `${string}/source/${string}` | "sources/mcp" | "sources/local" | "sources/api";
        /** API sources view (sources navigator, api filter) */
        readonly sourcesApi: (sourceSlug?: string) => "sources/api" | `sources/api/source/${string}`;
        /** MCP sources view (sources navigator, mcp filter) */
        readonly sourcesMcp: (sourceSlug?: string) => "sources/mcp" | `sources/mcp/source/${string}`;
        /** Local folder sources view (sources navigator, local filter) */
        readonly sourcesLocal: (sourceSlug?: string) => "sources/local" | `sources/local/source/${string}`;
        /** Skills view (skills navigator). Pass a slug string for a local skill detail view. */
        readonly skills: (skillSlug?: string) => "skills" | `skills/skill/${string}`;
        /** Skill marketplace view (curated skill installer). */
        readonly skillMarketplace: (skillId?: string) => "skillMarketplace" | `skillMarketplace/skill/${string}`;
        /** Automations view (automations navigator) - supports type filtering */
        readonly automations: (params?: {
            automationId?: string;
            type?: "scheduled" | "event" | "agentic";
        }) => "automations" | `${string}/automation/${string}` | "automations/event" | "automations/scheduled" | "automations/agentic";
        /** Scheduled automations view (automations navigator, scheduled filter) */
        readonly automationsScheduled: (automationId?: string) => "automations/scheduled" | `automations/scheduled/automation/${string}`;
        /** Event-based automations view (automations navigator, event filter) */
        readonly automationsEvent: (automationId?: string) => "automations/event" | `automations/event/automation/${string}`;
        /** Agentic automations view (automations navigator, agentic filter) */
        readonly automationsAgentic: (automationId?: string) => "automations/agentic" | `automations/agentic/automation/${string}`;
        /** Settings view (settings navigator) - uses SettingsSubpage from registry */
        readonly settings: (subpage?: SettingsSubpage) => "settings" | `settings/${any}`;
    };
};
/**
 * Type representing any valid route string
 */
export type ActionRoute = ReturnType<(typeof routes.action)[keyof typeof routes.action]>;
export type ViewRoute = ReturnType<(typeof routes.view)[keyof typeof routes.view]>;
export type Route = ActionRoute | ViewRoute;
