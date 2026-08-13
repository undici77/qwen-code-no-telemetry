import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import { SettingScope } from '../../../config/settings.js';
import { computeWorkspaceSkillListUpdates, resolveSkillSettings, skillSettingStrings, } from '../../../config/skill-settings.js';
import { t } from '../../../i18n/index.js';
import { levelLabel } from '../../utils/skill-level-label.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { theme } from '../../semantic-colors.js';
import { MessageType } from '../../types.js';
import { MultiSelect } from '../shared/MultiSelect.js';
const LEVEL_ORDER = {
    project: 0,
    user: 1,
    extension: 2,
    bundled: 3,
};
const NAME_COLUMN = 24;
function lower(name) {
    return name.trim().toLowerCase();
}
function normalizeNames(list) {
    return list
        .filter((n) => typeof n === 'string')
        .map(lower)
        .filter(Boolean);
}
function namesFromScope(settings, scope) {
    // settings.json is user-editable: `disabled` could be a non-array
    // (e.g. `"disabled": "all"`) OR contain non-strings. Guard with
    // `Array.isArray` BEFORE returning so downstream `.map(lower)` /
    // `normalizeNames` never see a non-iterable. The element-level
    // string filter still happens in `normalizeNames`. Mirrors the same
    // defense in `buildDisabledSkillNamesProvider` (config.ts).
    const raw = settings.forScope(scope).settings.skills?.disabled;
    return Array.isArray(raw) ? raw : [];
}
function buildHigherDisabled(settings) {
    const sysDefaults = normalizeNames(namesFromScope(settings, SettingScope.SystemDefaults));
    const user = normalizeNames(namesFromScope(settings, SettingScope.User));
    const system = normalizeNames(namesFromScope(settings, SettingScope.System));
    const set = new Set([...sysDefaults, ...user, ...system]);
    // Highest-precedence scope wins for the locked-row label. System >
    // User > SystemDefaults matches the merge order in `settings.ts`.
    const scopeOf = (name) => {
        const l = lower(name);
        if (system.includes(l))
            return 'System';
        if (user.includes(l))
            return 'User';
        if (sysDefaults.includes(l))
            return 'SystemDefaults';
        return null;
    };
    return { set, scopeOf };
}
function sortSkills(skills) {
    return [...skills].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] ||
        a.name.localeCompare(b.name));
}
function truncate(text, max) {
    if (text.length <= max)
        return text;
    return `${text.slice(0, Math.max(0, max - 1))}…`;
}
export function SkillsManagerDialog({ settings, config, addItem, onClose, reloadCommands, setInputBuffer, availableTerminalHeight, }) {
    const [skills, setSkills] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [query, setQuery] = useState('');
    // Track which row the MultiSelect is currently highlighting so Enter
    // (which the dialog interprets as "invoke the highlighted skill") knows
    // what to launch. Updated via the `onHighlight` callback on every up/down.
    const [activeValue, setActiveValue] = useState(null);
    // Capture the workspace and higher-scope disabled lists once at mount.
    // The dialog is short-lived and these are derived from the *current*
    // settings snapshot at open time — using `useMemo` keyed on `settings`
    // would re-derive on every parent re-render and could thrash the
    // `selectedKeys` derivation below.
    const initialResolved = useMemo(() => resolveSkillSettings(settings), [settings]);
    const higher = useMemo(() => buildHigherDisabled(settings), [settings]);
    const skillManager = config?.getSkillManager() ?? null;
    useEffect(() => {
        if (!skillManager) {
            setLoadError(t('SkillManager not available.'));
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const list = await skillManager.listSkills();
                const userInvocableList = list.filter((skill) => skill.userInvocable !== false);
                if (!cancelled)
                    setSkills(sortSkills(userInvocableList));
            }
            catch (e) {
                if (!cancelled) {
                    setLoadError(e instanceof Error ? e.message : String(e));
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [skillManager]);
    // Memoize so the `?? []` fallback doesn't produce a fresh array on every
    // render — that would invalidate every downstream useMemo dependency.
    const allSkills = useMemo(() => skills ?? [], [skills]);
    const lockedSkills = useMemo(() => allSkills.filter((s) => higher.set.has(lower(s.name))), [allSkills, higher.set]);
    const unlockedSkills = useMemo(() => allSkills.filter((s) => !higher.set.has(lower(s.name))), [allSkills, higher.set]);
    const initialSelectedKeys = useMemo(() => new Set(unlockedSkills
        .filter((skill) => !initialResolved.disabledNames.has(lower(skill.name)))
        .map((skill) => skill.name)), [initialResolved, unlockedSkills]);
    // Initial selection: every effectively enabled, unlocked skill.
    // Checked = enabled.
    const [selectedKeys, setSelectedKeys] = useState(null);
    useEffect(() => {
        if (selectedKeys !== null || unlockedSkills.length === 0)
            return;
        setSelectedKeys([...initialSelectedKeys]);
    }, [unlockedSkills, initialSelectedKeys, selectedKeys]);
    const filteredUnlocked = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery)
            return unlockedSkills;
        return unlockedSkills.filter((s) => s.name.toLowerCase().includes(normalizedQuery) ||
            s.description.toLowerCase().includes(normalizedQuery));
    }, [unlockedSkills, query]);
    // `activeValue` is what Enter operates on. MultiSelect's `onHighlight`
    // populates it on arrow-key navigation, but NOT on initial mount or
    // after a search filter that drops the previously highlighted row
    // (`useSelectionList` re-INITIALIZE's with `pendingHighlight: false`).
    // Without this effect, Enter on the first render is a no-op and Enter
    // after a filter would invoke a stale (now-invisible) skill.
    useEffect(() => {
        if (filteredUnlocked.length === 0) {
            if (activeValue !== null)
                setActiveValue(null);
            return;
        }
        const stillVisible = activeValue !== null &&
            filteredUnlocked.some((s) => s.name === activeValue.name);
        if (!stillVisible) {
            const top = filteredUnlocked[0];
            setActiveValue({
                name: top.name,
                description: top.description,
                level: top.level,
            });
        }
    }, [filteredUnlocked, activeValue]);
    const filteredLocked = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery)
            return lockedSkills;
        return lockedSkills.filter((s) => s.name.toLowerCase().includes(normalizedQuery) ||
            s.description.toLowerCase().includes(normalizedQuery));
    }, [lockedSkills, query]);
    const items = useMemo(() => filteredUnlocked.map((s) => ({
        key: s.name,
        value: { name: s.name, description: s.description, level: s.level },
        label: `${truncate(s.name, NAME_COLUMN).padEnd(NAME_COLUMN)} ${truncate(s.description, 80)}  (${levelLabel(s.level)})`,
    })), [filteredUnlocked]);
    // Persist any pending toggle changes. Returns:
    //   - 'ok'        — write succeeded (or no-op because nothing changed)
    //   - 'untrusted' — workspace is untrusted; follow-up actions (e.g. pick)
    //                   should be aborted, error already surfaced to the user
    //   - 'error'     — settings.setValue threw; error surfaced to the user.
    //                   Caller should still close the dialog so the user is
    //                   not stuck with a re-throwing Esc handler.
    // The Esc-during-loading race is handled BY THE CALLER (see
    // `handleSaveAndClose`) — `persistChanges` assumes data is loaded.
    const persistChanges = useCallback(async () => {
        if (!settings.isTrusted) {
            addItem({
                type: MessageType.ERROR,
                text: t('Workspace is untrusted; workspace settings are ignored by the merged config. Run /trust first to persist skills changes here, or edit ~/.qwen/settings.json directly to manage skills at user scope.'),
            }, Date.now());
            return 'untrusted';
        }
        const selected = new Set(selectedKeys ?? []);
        const workspaceDisabled = namesFromScope(settings, SettingScope.Workspace).filter((name) => typeof name === 'string');
        const lockedNames = new Set(lockedSkills.map((skill) => lower(skill.name)));
        const { disabled, enabled, disabledChanged, enabledChanged } = computeWorkspaceSkillListUpdates(workspaceDisabled, lockedNames, skillSettingStrings(settings, SettingScope.Workspace, 'enabled'), unlockedSkills.map((skill) => ({
            name: skill.name,
            wasEnabled: initialSelectedKeys.has(skill.name),
            isEnabled: selected.has(skill.name),
            defaultDisabled: initialResolved.defaultDisabledNames.has(lower(skill.name)) &&
                !initialResolved.enabledNames.has(lower(skill.name)),
        })));
        if (!disabledChanged && !enabledChanged)
            return 'ok';
        try {
            settings.setValues([
                ...(disabledChanged
                    ? [
                        {
                            scope: SettingScope.Workspace,
                            key: 'skills.disabled',
                            value: disabled.length > 0 ? disabled : undefined,
                        },
                    ]
                    : []),
                ...(enabledChanged
                    ? [
                        {
                            scope: SettingScope.Workspace,
                            key: 'skills.enabled',
                            value: enabled.length > 0 ? enabled : undefined,
                        },
                    ]
                    : []),
            ]);
        }
        catch (e) {
            addItem({
                type: MessageType.ERROR,
                text: t('Failed to save skills configuration: {{error}}', {
                    error: e instanceof Error ? e.message : String(e),
                }),
            }, Date.now());
            return 'error';
        }
        try {
            // ORDER MATTERS — must NOT be Promise.all. `reloadCommands` rebuilds
            // CommandService AND re-registers the `modelInvocableCommandsProvider`
            // closure over the new instance; `notifyConfigChanged` triggers
            // `SkillTool.refreshSkills`, which calls that provider. Running them
            // in parallel can let the model description pick up the OLD provider,
            // leaking the just-disabled skill back into `<available_skills>` as
            // a command-form entry.
            await reloadCommands();
            if (skillManager) {
                // Tell `slashCommandProcessor`'s change-listener to skip its own
                // `reloadCommands()` — we just awaited one above, the listener's
                // fire-and-forget reload would be a wasted CommandService
                // rebuild. SkillTool's listener still runs normally so the model
                // description picks up the new disabled set. One-shot consumed
                // by the next `notifyChangeListeners` call.
                skillManager.suppressNextSlashReload();
                await skillManager.notifyConfigChanged();
            }
        }
        catch (e) {
            addItem({
                type: MessageType.WARNING,
                text: t('Skills configuration saved, but refresh failed: {{error}}. Restart to ensure the new state is applied.', { error: e instanceof Error ? e.message : String(e) }),
            }, Date.now());
            return 'refresh-failed';
        }
        return 'ok';
    }, [
        addItem,
        initialResolved,
        initialSelectedKeys,
        lockedSkills,
        reloadCommands,
        selectedKeys,
        settings,
        skillManager,
        unlockedSkills,
    ]);
    // Esc handler: auto-save current toggle state and close. Replaces the
    // earlier "save = Enter, Esc = cancel" model with auto-save on exit.
    //
    // Esc-during-loading guard: if the user presses Esc before `skills` and
    // `selectedKeys` finish loading, we have no signal for "what should the
    // disabled set look like" — `selectedKeys ?? []` would compute an empty
    // selection, treat every unlocked skill as just-disabled (in fact the
    // unlocked set is also empty here), and quietly clear any pre-existing
    // workspace `skills.disabled` entry. Just close — there is nothing to
    // save yet.
    const handleSaveAndClose = useCallback(async () => {
        if (skills === null || selectedKeys === null) {
            onClose();
            return;
        }
        const result = await persistChanges();
        if (result === 'ok') {
            addItem({
                type: MessageType.INFO,
                text: t('Skills configuration saved.'),
            }, Date.now());
        }
        onClose();
    }, [addItem, onClose, persistChanges, selectedKeys, skills]);
    // Enter handler: save pending toggles, close, and DROP `/<skill-name>`
    // into the input buffer WITHOUT submitting. The user reviews and hits
    // Enter themselves to send. This is "select" semantic — the dialog
    // points at a skill, the user decides whether/when to invoke.
    const handlePick = useCallback(async (skill) => {
        // Don't pick a skill the user has just toggled off — `/<name>` would
        // resolve to the disabled error path on submit. The same gate applies
        // to skills locked by higher scope (those don't appear in the
        // MultiSelect at all, so we only see them via stale `activeValue`).
        const isEnabled = selectedKeys !== null &&
            selectedKeys.includes(skill.name) &&
            !higher.set.has(lower(skill.name));
        if (!isEnabled) {
            // Persist any OTHER pending toggles before bailing — otherwise
            // the user's session-long edits get silently discarded just
            // because their cursor happened to land on a toggled-off (or
            // locked) row when they pressed Enter. Mirrors handleSaveAndClose
            // (Esc) which persists unconditionally once data has loaded.
            if (skills !== null && selectedKeys !== null) {
                await persistChanges();
            }
            onClose();
            return;
        }
        const result = await persistChanges();
        onClose();
        if (result === 'ok') {
            setInputBuffer(`/${skill.name}`);
        }
    }, [higher.set, onClose, persistChanges, selectedKeys, setInputBuffer, skills]);
    useKeypress((key) => {
        if (key.name === 'escape') {
            // Esc with active search: just clear the query (refining without
            // exiting is intuitive). Esc on an empty search: auto-save and
            // close — there is no longer a "cancel without saving" path,
            // matching the user-requested keymap (Esc = exit, changes stick).
            if (query) {
                setQuery('');
                return;
            }
            void handleSaveAndClose();
            return;
        }
        if (key.name === 'backspace' || key.name === 'delete') {
            setQuery((current) => current.slice(0, -1));
            return;
        }
        // Defer navigation/selection keys to MultiSelect.
        // j/k are only deferred when no search query is active — they are
        // valid filter characters (e.g. "json", "jwt", "kotlin", "jdk").
        // When the user IS searching, MultiSelect receives
        // `isFocused={false}` which disables its vim-style key handlers,
        // so j/k flow through to the printable-character branch below.
        if ((key.name === 'j' || key.name === 'k') && !query) {
            return;
        }
        if (key.name === 'up' ||
            key.name === 'down' ||
            key.name === 'space' ||
            key.name === 'return') {
            return;
        }
        if (!key.ctrl &&
            !key.meta &&
            key.sequence.length === 1 &&
            key.sequence >= '!' &&
            key.sequence <= '~') {
            setQuery((current) => `${current}${key.sequence}`);
        }
    }, { isActive: true });
    const maxItemsToShow = Math.max(5, Math.min(15, (availableTerminalHeight ?? 24) - 10));
    // -- Render --
    if (loadError) {
        return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingX: 1, paddingY: 1, width: "100%", children: [_jsx(Text, { bold: true, children: t('Manage Skills') }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.error, children: t('Failed to load skills: {{error}}', { error: loadError ?? '' }) }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Press esc to close.') }) })] }));
    }
    if (skills === null) {
        return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingX: 1, paddingY: 1, width: "100%", children: [_jsx(Text, { bold: true, children: t('Manage Skills') }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Loading skills…') }) })] }));
    }
    // Counts shown in the header so users can see filter effect at a glance.
    const totalCount = allSkills.length;
    const matchedCount = filteredUnlocked.length + filteredLocked.length;
    const hasQuery = query.trim().length > 0;
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", paddingX: 1, paddingY: 1, width: "100%", children: [_jsx(Text, { bold: true, children: t('Manage Skills') }), _jsxs(Text, { color: theme.text.secondary, children: [hasQuery
                        ? t('{{matched}} / {{total}} skills · ', {
                            matched: String(matchedCount),
                            total: String(totalCount),
                        })
                        : t('{{count}} skills · ', { count: String(totalCount) }), t('Space toggle · Enter pick (fill input) · Esc save & exit · workspace scope')] }), _jsxs(Box, { marginTop: 1, flexDirection: "row", children: [_jsxs(Text, { color: hasQuery ? theme.text.accent : theme.text.secondary, children: [t('Search:'), ' '] }), _jsx(Text, { children: query || (_jsx(Text, { color: theme.text.secondary, dimColor: true, children: t('type to filter…') })) })] }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: allSkills.length === 0 ? (_jsx(Text, { color: theme.text.secondary, children: t('No skills are currently available.') })) : items.length > 0 ? (_jsx(MultiSelect, { items: items, disableVimNav: !!query, selectedKeys: selectedKeys ?? [], onSelectedKeysChange: setSelectedKeys, 
                    // Enter == "pick" the highlighted skill: close the dialog and
                    // drop `/<name>` into the input buffer (no auto-submit).
                    // MultiSelect's `onConfirm` fires on Enter; we read the row
                    // tracked via `onHighlight` so we know which one. Saving lives
                    // entirely on Esc — see `handleSaveAndClose`.
                    onConfirm: () => {
                        if (activeValue) {
                            void handlePick(activeValue);
                        }
                        // Empty list (search filtered everything out): no-op; Esc to exit.
                    }, onHighlight: (v) => setActiveValue(v), showNumbers: false, checkedText: "[x]", showActiveMarker: true, maxItemsToShow: maxItemsToShow })) : unlockedSkills.length === 0 ? (_jsx(Text, { color: theme.text.secondary, children: t('All available skills are locked at a higher scope (see below).') })) : (_jsx(Text, { color: theme.text.secondary, children: t('No skills match the search.') })) }), filteredLocked.length > 0 && (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: t('Locked by higher-scope settings (cannot toggle here):') }), filteredLocked.map((s) => {
                        // Scope identifiers (System / User / SystemDefaults) stay as
                        // untranslated technical labels — they refer to settings file
                        // scopes by name and matching them exactly helps users locate
                        // the offending entry.
                        const scopeName = higher.scopeOf(s.name) ?? t('higher scope');
                        return (_jsx(Text, { dimColor: true, wrap: "truncate", children: t('  {{name}} {{description}}  [locked: {{scope}}]', {
                                name: truncate(s.name, NAME_COLUMN).padEnd(NAME_COLUMN),
                                description: truncate(s.description, 60),
                                scope: scopeName,
                            }) }, s.name));
                    })] })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, dimColor: true, children: t('↑/↓ navigate · backspace edits search') }) })] }));
}
//# sourceMappingURL=SkillsManagerDialog.js.map