import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ensureConfigDir } from './storage.ts';
import { CONFIG_DIR } from './paths.ts';
import { readJsonFileSync } from '../utils/files.ts';
import { i18n } from '../i18n/index.ts';
import { LOCALE_REGISTRY } from '../i18n/registry.ts';
const PREFERENCES_FILE = join(CONFIG_DIR, 'preferences.json');
export function loadPreferences() {
    try {
        if (!existsSync(PREFERENCES_FILE)) {
            return {};
        }
        return readJsonFileSync(PREFERENCES_FILE);
    }
    catch {
        return {};
    }
}
export function savePreferences(prefs) {
    ensureConfigDir();
    prefs.updatedAt = Date.now();
    writeFileSync(PREFERENCES_FILE, JSON.stringify(prefs, null, 2), 'utf-8');
}
export function updatePreferences(updates) {
    const current = loadPreferences();
    const updated = {
        ...current,
        ...updates,
        // Merge location if provided
        location: updates.location
            ? { ...current.location, ...updates.location }
            : current.location,
        // Merge diffViewer if provided
        diffViewer: updates.diffViewer
            ? { ...current.diffViewer, ...updates.diffViewer }
            : current.diffViewer,
    };
    savePreferences(updated);
    return updated;
}
export function getPreferencesPath() {
    return PREFERENCES_FILE;
}
/**
 * Format preferences for inclusion in system prompt
 */
export function formatPreferencesForPrompt() {
    const prefs = loadPreferences();
    // Derive language from the app's i18n setting (Appearance > Language).
    // This replaces the old prefs.language field which is now ignored.
    const langCode = (i18n.resolvedLanguage ?? 'en');
    const langEntry = LOCALE_REGISTRY[langCode];
    const langName = langEntry?.nativeName ?? 'English';
    if (Object.keys(prefs).length === 0 ||
        (!prefs.name && !prefs.timezone && !prefs.location && !prefs.notes && langCode === 'en')) {
        return '';
    }
    const lines = ['## User Preferences - User has explicitly set these preferences, so adhere to them', ''];
    if (prefs.name) {
        lines.push(`- Name: ${prefs.name}`);
    }
    if (prefs.timezone) {
        lines.push(`- Timezone: ${prefs.timezone}`);
    }
    if (prefs.location) {
        const loc = prefs.location;
        const parts = [loc.city, loc.region, loc.country].filter(Boolean);
        if (parts.length > 0) {
            lines.push(`- Location: ${parts.join(', ')}`);
        }
    }
    // Always include language so the AI knows which language to respond in.
    // Derived from the Appearance language setting, not the old prefs.language field.
    lines.push(`- Preferred language: ${langName}`);
    if (prefs.notes) {
        lines.push('', '### Notes about this user', prefs.notes);
    }
    lines.push('');
    return lines.join('\n');
}
/**
 * Format preferences as readable text for display
 */
export function formatPreferencesDisplay() {
    const prefs = loadPreferences();
    const lines = ['**Your Preferences**', ''];
    // Check if any preferences are actually set
    const hasName = !!prefs.name;
    const hasTimezone = !!prefs.timezone;
    const hasLocation = prefs.location && (prefs.location.city || prefs.location.region || prefs.location.country);
    const hasNotes = !!prefs.notes;
    const hasAnyPrefs = hasName || hasTimezone || hasLocation || hasNotes;
    lines.push('Your preferences help personalise your experience. The assistant uses these to provide more relevant responses (e.g., timezone for scheduling, language for communication).');
    lines.push('');
    if (!hasAnyPrefs) {
        lines.push('**Status:** Nothing saved yet.');
        lines.push('');
    }
    else {
        lines.push(`- Name: ${prefs.name || '(not set)'}`);
        lines.push(`- Timezone: ${prefs.timezone || '(not set)'}`);
        if (hasLocation) {
            const loc = prefs.location;
            const parts = [loc.city, loc.region, loc.country].filter(Boolean);
            lines.push(`- Location: ${parts.join(', ')}`);
        }
        else {
            lines.push('- Location: (not set)');
        }
        const displayLangCode = (i18n.resolvedLanguage ?? 'en');
        const displayLangEntry = LOCALE_REGISTRY[displayLangCode];
        lines.push(`- Language: ${displayLangEntry?.nativeName ?? 'English'} (via Appearance settings)`);
        if (hasNotes) {
            lines.push('', '**Notes**', prefs.notes);
        }
        if (prefs.updatedAt) {
            lines.push('', `_Last updated: ${new Date(prefs.updatedAt).toLocaleString()}_`);
        }
        lines.push('');
    }
    lines.push('**How to update:** Just tell the assistant (e.g., "My name is Alex" or "I\'m in London, GMT timezone").');
    lines.push(`**Config file:** \`${PREFERENCES_FILE}\``);
    return lines.join('\n');
}
/**
 * Whether the Co-Authored-By trailer should be included on git commits.
 * Defaults to true when the preference is not explicitly set.
 */
export function getCoAuthorPreference() {
    const prefs = loadPreferences();
    return prefs.includeCoAuthoredBy !== false;
}
//# sourceMappingURL=preferences.js.map