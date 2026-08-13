/**
 * Navigation Registry
 *
 * Type-safe registry that defines the relationships between navigators and details pages.
 * This ensures compile-time safety: you cannot add a page without registering it here,
 * and the app won't compile if relationships are incomplete.
 *
 * Structure:
 *   Navigator → Details Pages → Components
 *
 * Each navigator has:
 * - A list of valid details page types
 * - A default details page (or null for empty state)
 * - Logic to get the first item for auto-selection
 */
// =============================================================================
// Registry Definition
// =============================================================================
/**
 * Placeholder components - will be replaced with real imports
 * These ensure type safety during the transition
 */
const PlaceholderComponent = () => null;
/**
 * The central navigation registry
 *
 * IMPORTANT: This object defines ALL valid navigation paths in the app.
 * Adding a new page requires:
 * 1. Creating the component
 * 2. Adding it to the appropriate navigator's detailsPages
 * 3. Exporting meta from the component
 */
export const NavigationRegistry = {
    sessions: {
        displayName: 'Sessions',
        detailsPages: {
            session: PlaceholderComponent, // Will be: ChatPage
        },
        defaultDetails: null, // Empty state when no sessions
        getFirstItem: (ctx) => {
            if (!ctx.sessions.length)
                return null;
            // Filter based on current session filter
            const filter = ctx.sessionFilter;
            if (!filter)
                return ctx.sessions[0]?.id ?? null;
            let filtered = ctx.sessions;
            switch (filter.kind) {
                case 'flagged':
                    filtered = ctx.sessions.filter(s => s.isFlagged);
                    break;
                case 'state':
                    filtered = ctx.sessions.filter(s => s.stateId === filter.stateId);
                    break;
                case 'allSessions':
                default:
                    // allSessions shows all sessions
                    break;
            }
            return filtered[0]?.id ?? null;
        },
    },
    sources: {
        displayName: 'Sources',
        detailsPages: {
            source: PlaceholderComponent, // Will be: SourceInfoPage
        },
        defaultDetails: null, // Empty state when no sources
        getFirstItem: (ctx) => ctx.sources[0]?.slug ?? null,
    },
    settings: {
        displayName: 'Settings',
        detailsPages: {
            app: PlaceholderComponent, // AppSettingsPage
            ai: PlaceholderComponent, // AiSettingsPage
            appearance: PlaceholderComponent, // AppearanceSettingsPage
            input: PlaceholderComponent, // InputSettingsPage
            workspace: PlaceholderComponent, // WorkspaceSettingsPage
            permissions: PlaceholderComponent, // PermissionsSettingsPage
            labels: PlaceholderComponent, // LabelsSettingsPage
            shortcuts: PlaceholderComponent, // ShortcutsPage
            preferences: PlaceholderComponent, // PreferencesPage
        },
        defaultDetails: 'app', // Always has a default
        getFirstItem: () => 'app',
    },
};
//# sourceMappingURL=navigation-registry.js.map