/**
 * Settings Registry - Single Source of Truth
 *
 * This file defines all settings pages in one place. All other files that need
 * settings page information should import from here.
 *
 * To add a new settings page:
 * 1. Add an entry to SETTINGS_PAGES below
 * 2. Create the page component in renderer/pages/settings/
 * 3. Add to SETTINGS_PAGE_COMPONENTS in renderer/pages/settings/settings-pages.ts
 * 4. Add icon to SETTINGS_ICONS in renderer/components/icons/SettingsIcons.tsx
 *
 * That's it - types, routes, and validation are derived automatically.
 */
import { FEATURE_FLAGS } from '@craft-agent/shared/feature-flags';
/**
 * The canonical list of all settings pages.
 * Order here determines display order in the settings navigator.
 *
 * ADD NEW PAGES HERE - everything else derives from this list.
 *
 * NOTE: labelKey/descriptionKey are i18n translation keys, resolved at render
 * time via t(). Do NOT call i18n.t() here — this module loads before i18n init.
 */
export const SETTINGS_PAGES = [
    {
        id: 'general',
        labelKey: 'settings.general.title',
        descriptionKey: 'settings.general.description',
    },
    {
        id: 'appearance',
        labelKey: 'settings.appearance.title',
        descriptionKey: 'settings.appearance.description',
    },
    {
        id: 'app',
        labelKey: 'settings.app.title',
        descriptionKey: 'settings.app.description',
    },
    {
        id: 'ai',
        labelKey: 'settings.ai.title',
        descriptionKey: 'settings.ai.description',
    },
    {
        id: 'input',
        labelKey: 'settings.input.title',
        descriptionKey: 'settings.input.description',
    },
    {
        id: 'shortcuts',
        labelKey: 'settings.shortcuts.title',
        descriptionKey: 'settings.shortcuts.description',
    },
    {
        id: 'memory',
        labelKey: 'settings.memory.title',
        descriptionKey: 'settings.memory.description',
    },
    {
        id: 'mcpServers',
        labelKey: 'settings.mcpServers.title',
        descriptionKey: 'settings.mcpServers.description',
    },
    {
        id: 'hooks',
        labelKey: 'settings.hooks.title',
        descriptionKey: 'settings.hooks.description',
    },
    {
        id: 'extensions',
        labelKey: 'settings.extensions.title',
        descriptionKey: 'settings.extensions.description',
    },
    {
        id: 'permissions',
        labelKey: 'settings.permissions.title',
        descriptionKey: 'settings.permissions.description',
    },
    {
        id: 'labels',
        labelKey: 'settings.labels.title',
        descriptionKey: 'settings.labels.description',
    },
    {
        id: 'messaging',
        labelKey: 'settings.messaging.title',
        descriptionKey: 'settings.messaging.description',
    },
    {
        id: 'server',
        labelKey: 'settings.server.title',
        descriptionKey: 'settings.server.description',
    },
    {
        id: 'workspace',
        labelKey: 'settings.workspace.title',
        descriptionKey: 'settings.workspace.description',
    },
    {
        id: 'preferences',
        labelKey: 'settings.preferences.title',
        descriptionKey: 'settings.preferences.description',
    },
];
export const DEFAULT_SETTINGS_SUBPAGE = SETTINGS_PAGES[0].id;
/**
 * Array of valid settings subpage IDs - for runtime validation
 */
export const VALID_SETTINGS_SUBPAGES = SETTINGS_PAGES.map((p) => p.id);
const HIDDEN_SETTINGS_NAVIGATION_SUBPAGES = new Set([
    'workspace',
    'preferences',
    'messaging',
    ...(FEATURE_FLAGS.sessionLabelsUi ? [] : ['labels']),
]);
/**
 * Settings subpages that should be shown in settings navigation surfaces.
 */
export const VISIBLE_SETTINGS_SUBPAGES = VALID_SETTINGS_SUBPAGES.filter((subpage) => !HIDDEN_SETTINGS_NAVIGATION_SUBPAGES.has(subpage));
/**
 * Type guard to check if a string is a valid settings subpage
 */
export function isValidSettingsSubpage(value) {
    return VALID_SETTINGS_SUBPAGES.includes(value);
}
/**
 * Check if a valid settings subpage should be shown in settings navigation.
 */
export function isVisibleSettingsSubpage(value) {
    return VISIBLE_SETTINGS_SUBPAGES.includes(value);
}
/**
 * Get settings page definition by ID
 */
export function getSettingsPage(id) {
    const page = SETTINGS_PAGES.find((p) => p.id === id);
    if (!page)
        throw new Error(`Unknown settings page: ${id}`);
    return page;
}
//# sourceMappingURL=settings-registry.js.map