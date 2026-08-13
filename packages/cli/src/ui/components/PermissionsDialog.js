import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as nodePath from 'node:path';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { SettingScope } from '../../config/settings.js';
import { TextInput } from './shared/TextInput.js';
import { Colors } from '../colors.js';
import { t } from '../../i18n/index.js';
import { isPathWithinRoot, parseRule } from '@qwen-code/qwen-code-core';
function getPermScopeItems() {
    return [
        {
            label: t('Project settings'),
            description: t('Checked in at .qwen/settings.json'),
            value: SettingScope.Workspace,
            key: 'project',
        },
        {
            label: t('User settings'),
            description: t('Saved in at ~/.qwen/settings.json'),
            value: SettingScope.User,
            key: 'user',
        },
    ];
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getTabs() {
    return [
        {
            id: 'allow',
            label: t('Allow'),
            description: t("Qwen Code won't ask before using allowed tools."),
        },
        {
            id: 'ask',
            label: t('Ask'),
            description: t('Qwen Code will ask before using these tools.'),
        },
        {
            id: 'deny',
            label: t('Deny'),
            description: t('Qwen Code is not allowed to use denied tools.'),
        },
        {
            id: 'workspace',
            label: t('Workspace'),
            description: t('Manage trusted directories for this workspace.'),
        },
    ];
}
function describeRule(raw) {
    const match = raw.match(/^([^(]+?)(?:\((.+)\))?$/);
    if (!match)
        return raw;
    const toolName = match[1].trim();
    const specifier = match[2]?.trim();
    if (!specifier) {
        return t('Any use of the {{tool}} tool', { tool: toolName });
    }
    return t("{{tool}} commands matching '{{pattern}}'", {
        tool: toolName,
        pattern: specifier,
    });
}
function scopeLabel(scope) {
    switch (scope) {
        case 'user':
            return t('From user settings');
        case 'workspace':
            return t('From project settings');
        case 'session':
            return t('From session');
        default:
            return scope;
    }
}
// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function PermissionsDialog({ onExit, }) {
    const config = useConfig();
    const settings = useSettings();
    const pm = config.getPermissionManager?.();
    // --- Tab state ---
    const tabs = useMemo(() => getTabs(), []);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const activeTab = tabs[activeTabIndex];
    // --- Rule list state ---
    const [allRules, setAllRules] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    // --- Dialog view state machine ---
    const [view, setView] = useState('rule-list');
    const [newRuleInput, setNewRuleInput] = useState('');
    const [ruleInputError, setRuleInputError] = useState('');
    const [pendingRuleText, setPendingRuleText] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    // --- Workspace directory state ---
    const workspaceContext = config.getWorkspaceContext();
    const [newDirInput, setNewDirInput] = useState('');
    const [dirInputError, setDirInputError] = useState('');
    const [dirInputRemountKey, setDirInputRemountKey] = useState(0);
    const [completionIndex, setCompletionIndex] = useState(0);
    const [removeDirTarget, setRemoveDirTarget] = useState(null);
    const [dirRefreshKey, setDirRefreshKey] = useState(0);
    // Refresh rules from PermissionManager
    const refreshRules = useCallback(() => {
        if (pm) {
            setAllRules(pm.listRules());
        }
    }, [pm]);
    useEffect(() => {
        refreshRules();
    }, [refreshRules]);
    // --- Workspace directory helpers ---
    const directories = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        dirRefreshKey; // dependency to trigger re-computation
        return workspaceContext.getDirectories();
    }, [workspaceContext, dirRefreshKey]);
    const initialDirs = useMemo(() => new Set(workspaceContext.getInitialDirectories()), [workspaceContext]);
    // Filesystem completions based on current input
    const dirCompletions = useMemo(() => {
        const trimmed = newDirInput.trim();
        if (!trimmed)
            return [];
        const expanded = trimmed.startsWith('~')
            ? trimmed.replace(/^~/, os.homedir())
            : trimmed;
        const endsWithSep = expanded.endsWith('/') || expanded.endsWith(nodePath.sep);
        const searchDir = endsWithSep ? expanded : nodePath.dirname(expanded);
        const prefix = endsWithSep ? '' : nodePath.basename(expanded);
        try {
            return fs
                .readdirSync(searchDir, { withFileTypes: true })
                .filter((e) => e.isDirectory() &&
                e.name.startsWith(prefix) &&
                !e.name.startsWith('.'))
                .map((e) => nodePath.join(searchDir, e.name))
                .slice(0, 6);
        }
        catch {
            return [];
        }
    }, [newDirInput]);
    const handleDirInputChange = useCallback((text) => {
        setNewDirInput(text);
        if (dirInputError)
            setDirInputError('');
    }, [dirInputError]);
    // Reset selection to first item whenever the completions list changes
    useEffect(() => {
        setCompletionIndex(0);
    }, [dirCompletions]);
    const handleDirTabComplete = useCallback(() => {
        const selected = dirCompletions[completionIndex] ?? dirCompletions[0];
        if (selected) {
            setNewDirInput(selected + '/');
            setDirInputRemountKey((k) => k + 1);
        }
    }, [dirCompletions, completionIndex]);
    const handleDirCompletionUp = useCallback(() => {
        if (dirCompletions.length === 0)
            return;
        setCompletionIndex((prev) => (prev - 1 + dirCompletions.length) % dirCompletions.length);
    }, [dirCompletions.length]);
    const handleDirCompletionDown = useCallback(() => {
        if (dirCompletions.length === 0)
            return;
        setCompletionIndex((prev) => (prev + 1) % dirCompletions.length);
    }, [dirCompletions.length]);
    const dirListItems = useMemo(() => {
        const items = [];
        // 'Add directory…' always FIRST
        items.push({
            label: t('Add directory…'),
            value: '__add_dir__',
            key: '__add_dir__',
        });
        // Only show non-initial (runtime-added) directories in the selectable list
        for (const dir of directories) {
            if (!initialDirs.has(dir)) {
                items.push({
                    label: dir,
                    value: dir,
                    key: `dir-${dir}`,
                });
            }
        }
        return items;
    }, [directories, initialDirs]);
    const handleDirListSelect = useCallback((value) => {
        if (value === '__add_dir__') {
            setNewDirInput('');
            setView('ws-add-dir-input');
            return;
        }
        // Selecting a directory → offer to remove if not initial
        if (!initialDirs.has(value)) {
            setRemoveDirTarget(value);
            setView('ws-remove-confirm');
        }
    }, [initialDirs]);
    const handleAddDirSubmit = useCallback(() => {
        const trimmed = newDirInput.trim();
        if (!trimmed)
            return;
        const expanded = trimmed.startsWith('~')
            ? trimmed.replace(/^~/, os.homedir())
            : trimmed;
        const absoluteExpanded = nodePath.isAbsolute(expanded)
            ? expanded
            : nodePath.resolve(expanded);
        // Existence & type checks
        if (!fs.existsSync(absoluteExpanded)) {
            setDirInputError(t('Directory does not exist.'));
            return;
        }
        if (!fs.statSync(absoluteExpanded).isDirectory()) {
            setDirInputError(t('Path is not a directory.'));
            return;
        }
        // Resolve real path to match what workspaceContext stores
        let resolved;
        try {
            resolved = fs.realpathSync(absoluteExpanded);
        }
        catch {
            resolved = absoluteExpanded;
        }
        // Validate: exact duplicate
        if (directories.includes(resolved)) {
            setDirInputError(t('This directory is already in the workspace.'));
            return;
        }
        // Validate: is a subdirectory of an existing workspace directory
        for (const existingDir of directories) {
            if (isPathWithinRoot(resolved, existingDir)) {
                setDirInputError(t('Already covered by existing directory: {{dir}}', {
                    dir: existingDir,
                }));
                return;
            }
        }
        setDirInputError('');
        // Add to workspace context (already validated)
        workspaceContext.addDirectory(resolved);
        // Persist directly to project (Workspace) settings
        const key = 'context.includeDirectories';
        const currentDirs = settings.merged['context'];
        const existingDirs = currentDirs?.['includeDirectories'] ?? [];
        if (!existingDirs.includes(resolved)) {
            settings.setValue(SettingScope.Workspace, key, [
                ...existingDirs,
                resolved,
            ]);
        }
        setDirRefreshKey((k) => k + 1);
        setView('ws-dir-list');
        setNewDirInput('');
    }, [newDirInput, directories, workspaceContext, settings]);
    const handleRemoveDirConfirm = useCallback(() => {
        if (!removeDirTarget)
            return;
        // Remove from workspace context
        workspaceContext.removeDirectory(removeDirTarget);
        // Remove from settings (try both scopes)
        for (const scope of [SettingScope.User, SettingScope.Workspace]) {
            const scopeSettings = settings.forScope(scope).settings;
            const contextSection = scopeSettings['context'];
            const scopeDirs = contextSection?.['includeDirectories'];
            if (scopeDirs?.includes(removeDirTarget)) {
                const updated = scopeDirs.filter((d) => d !== removeDirTarget);
                settings.setValue(scope, 'context.includeDirectories', updated);
                break;
            }
        }
        setDirRefreshKey((k) => k + 1);
        setRemoveDirTarget(null);
        setView('ws-dir-list');
    }, [removeDirTarget, workspaceContext, settings]);
    // Filter rules for current tab
    const currentTabRules = useMemo(() => {
        if (activeTab.id === 'workspace')
            return [];
        return allRules.filter((r) => r.type === activeTab.id);
    }, [allRules, activeTab.id]);
    // Search-filtered rules
    const filteredRules = useMemo(() => {
        if (!searchQuery.trim())
            return currentTabRules;
        const q = searchQuery.toLowerCase();
        return currentTabRules.filter((r) => r.rule.raw.toLowerCase().includes(q) ||
            r.rule.toolName.toLowerCase().includes(q));
    }, [currentTabRules, searchQuery]);
    // Build radio items: "Add a new rule..." + filtered rules
    const listItems = useMemo(() => {
        const items = [
            {
                label: t('Add a new rule…'),
                value: '__add__',
                key: '__add__',
            },
        ];
        for (const r of filteredRules) {
            items.push({
                label: `${r.rule.raw}`,
                value: r.rule.raw,
                key: `${r.type}-${r.scope}-${r.rule.raw}`,
            });
        }
        return items;
    }, [filteredRules]);
    // --- Action handlers ---
    const handleTabCycle = useCallback((direction) => {
        const newIndex = (activeTabIndex + direction + tabs.length) % tabs.length;
        setActiveTabIndex(newIndex);
        setSearchQuery('');
        setIsSearchActive(false);
        setDirInputError('');
        // Set the appropriate default view for each tab
        const newTab = tabs[newIndex];
        setView(newTab.id === 'workspace' ? 'ws-dir-list' : 'rule-list');
    }, [activeTabIndex, tabs]);
    const handleListSelect = useCallback((value) => {
        if (value === '__add__') {
            setNewRuleInput('');
            setRuleInputError('');
            setView('add-rule-input');
            return;
        }
        // Selecting an existing rule → offer to delete
        const found = filteredRules.find((r) => r.rule.raw === value);
        if (found) {
            setDeleteTarget(found);
            setView('delete-confirm');
        }
    }, [filteredRules]);
    const handleAddRuleSubmit = useCallback(() => {
        const trimmed = newRuleInput.trim();
        if (!trimmed)
            return;
        const rule = parseRule(trimmed);
        if (rule.invalid) {
            setRuleInputError(t('Malformed rule: unbalanced parentheses. Use the format ToolName(specifier).'));
            return;
        }
        setRuleInputError('');
        setPendingRuleText(trimmed);
        setView('add-rule-scope');
    }, [newRuleInput]);
    const handleScopeSelect = useCallback((scope) => {
        if (!pm || activeTab.id === 'workspace')
            return;
        const ruleType = activeTab.id;
        // Add to PermissionManager in-memory
        pm.addPersistentRule(pendingRuleText, ruleType);
        // Persist to settings file (with dedup)
        const key = `permissions.${ruleType}`;
        const perms = settings.merged['permissions'];
        const currentRules = perms?.[ruleType] ?? [];
        if (!currentRules.includes(pendingRuleText)) {
            settings.setValue(scope, key, [...currentRules, pendingRuleText]);
        }
        // Refresh and go back
        refreshRules();
        setView('rule-list');
        setPendingRuleText('');
    }, [pm, activeTab.id, pendingRuleText, settings, refreshRules]);
    const handleDeleteConfirm = useCallback(() => {
        if (!pm || !deleteTarget)
            return;
        const ruleType = deleteTarget.type;
        // Remove from PermissionManager in-memory
        pm.removePersistentRule(deleteTarget.rule.raw, ruleType);
        // Persist removal — find and remove from settings
        // We try both User and Workspace scopes
        for (const scope of [SettingScope.User, SettingScope.Workspace]) {
            const scopeSettings = settings.forScope(scope).settings;
            const perms = scopeSettings['permissions'];
            const scopeRules = perms?.[ruleType];
            if (scopeRules?.includes(deleteTarget.rule.raw)) {
                const updated = scopeRules.filter((r) => r !== deleteTarget.rule.raw);
                settings.setValue(scope, `permissions.${ruleType}`, updated);
                break;
            }
        }
        refreshRules();
        setDeleteTarget(null);
        setView('rule-list');
    }, [pm, deleteTarget, settings, refreshRules]);
    // --- Keypress handling ---
    useKeypress((key) => {
        if (view === 'rule-list') {
            if (key.name === 'escape') {
                if (isSearchActive && searchQuery) {
                    setSearchQuery('');
                    setIsSearchActive(false);
                }
                else {
                    onExit();
                }
                return;
            }
            if (key.name === 'tab') {
                handleTabCycle(1);
                return;
            }
            if (key.name === 'right' || key.name === 'left') {
                handleTabCycle(key.name === 'right' ? 1 : -1);
                return;
            }
            // Search input: backspace
            if (key.name === 'backspace' || key.name === 'delete') {
                if (searchQuery.length > 0) {
                    setSearchQuery((prev) => prev.slice(0, -1));
                }
                return;
            }
            // Search input: printable characters
            if (key.sequence &&
                !key.ctrl &&
                !key.meta &&
                key.sequence.length === 1 &&
                key.sequence >= ' ') {
                setSearchQuery((prev) => prev + key.sequence);
                setIsSearchActive(true);
                return;
            }
        }
        if (view === 'add-rule-input') {
            if (key.name === 'escape') {
                setView('rule-list');
                return;
            }
        }
        if (view === 'add-rule-scope') {
            if (key.name === 'escape') {
                setView('add-rule-input');
                return;
            }
        }
        if (view === 'delete-confirm') {
            if (key.name === 'escape') {
                setDeleteTarget(null);
                setView('rule-list');
                return;
            }
            if (key.name === 'return') {
                handleDeleteConfirm();
                return;
            }
        }
        // Workspace tab views
        if (view === 'ws-dir-list') {
            if (key.name === 'escape') {
                onExit();
                return;
            }
            if (key.name === 'tab') {
                handleTabCycle(1);
                return;
            }
            if (key.name === 'right' || key.name === 'left') {
                handleTabCycle(key.name === 'right' ? 1 : -1);
                return;
            }
        }
        if (view === 'ws-add-dir-input') {
            if (key.name === 'escape') {
                setDirInputError('');
                setView('ws-dir-list');
                return;
            }
        }
        if (view === 'ws-remove-confirm') {
            if (key.name === 'escape') {
                setRemoveDirTarget(null);
                setView('ws-dir-list');
                return;
            }
            if (key.name === 'return') {
                handleRemoveDirConfirm();
                return;
            }
        }
    }, { isActive: true });
    // --- Workspace tab: add directory input ---
    if (activeTab.id === 'workspace' && view === 'ws-add-dir-input') {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.text.accent, children: t('Add directory to workspace') }), _jsx(Box, { height: 1 }), _jsx(Text, { color: theme.text.secondary, wrap: "wrap", children: t('Qwen Code will be able to read files in this directory and make edits when auto-accept edits is on.') }), _jsx(Box, { height: 1 }), _jsx(Text, { children: t('Enter the path to the directory:') }), _jsx(Box, { borderStyle: "round", borderColor: theme.border.default, paddingLeft: 1, paddingRight: 1, marginTop: 1, children: _jsx(TextInput, { value: newDirInput, onChange: handleDirInputChange, onSubmit: handleAddDirSubmit, onTab: dirCompletions.length > 0 ? handleDirTabComplete : undefined, onUp: dirCompletions.length > 0 ? handleDirCompletionUp : undefined, onDown: dirCompletions.length > 0 ? handleDirCompletionDown : undefined, placeholder: t('Enter directory path…'), isActive: true, validationErrors: dirInputError ? [dirInputError] : [] }, dirInputRemountKey) }), dirCompletions.length > 0 && (_jsx(Box, { flexDirection: "column", marginTop: 1, paddingLeft: 2, children: dirCompletions.map((completion, idx) => {
                        const name = nodePath.basename(completion);
                        const isSelected = idx === completionIndex;
                        return (_jsxs(Box, { children: [_jsx(Text, { bold: isSelected, color: isSelected ? theme.text.primary : theme.text.secondary, children: `${name}/` }), _jsx(Text, { color: theme.text.secondary, children: `    directory` })] }, completion));
                    }) })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Tab to complete · Enter to add · Esc to cancel') }) })] }));
    }
    // --- Workspace tab: remove directory confirmation ---
    if (activeTab.id === 'workspace' &&
        view === 'ws-remove-confirm' &&
        removeDirTarget) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, children: t('Remove directory?') }), _jsx(Box, { height: 1 }), _jsx(Box, { marginLeft: 2, flexDirection: "column", children: _jsx(Text, { bold: true, children: removeDirTarget }) }), _jsx(Box, { height: 1 }), _jsx(Text, { children: t('Are you sure you want to remove this directory from the workspace?') })] }), _jsx(Box, { marginTop: 1, marginLeft: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to confirm · Esc to cancel') }) })] }));
    }
    // --- Workspace tab: directory list (default) ---
    if (activeTab.id === 'workspace') {
        const initialDirArray = Array.from(initialDirs);
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(TabBar, { tabs: tabs, activeIndex: activeTabIndex }), _jsx(Text, { color: theme.text.secondary, wrap: "wrap", children: t('Qwen Code can read files in the workspace, and make edits when auto-accept edits is on.') }), _jsx(Box, { height: 1 }), initialDirArray.map((dir, idx) => (_jsxs(Box, { marginLeft: 2, children: [_jsx(Text, { color: theme.text.secondary, children: '- ' }), _jsx(Text, { children: dir }), _jsx(Text, { color: theme.text.secondary, children: idx === 0
                                ? t('  (Original working directory)')
                                : t('  (from settings)') })] }, dir))), _jsx(RadioButtonSelect, { items: dirListItems, onSelect: handleDirListSelect, isFocused: view === 'ws-dir-list', showNumbers: true, showScrollArrows: false, maxItemsToShow: 15 }), _jsx(FooterHint, { view: view })] }));
    }
    // --- Render views ---
    if (view === 'add-rule-input') {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, children: t('Add {{type}} permission rule', { type: activeTab.id }) }), _jsx(Box, { height: 1 }), _jsx(Text, { wrap: "wrap", children: t('Permission rules are a tool name, optionally followed by a specifier in parentheses.') }), _jsxs(Text, { children: [t('e.g.,'), " ", _jsx(Text, { bold: true, children: "WebFetch" }), " ", t('or'), ' ', _jsx(Text, { bold: true, children: "Bash(ls:*)" })] }), _jsx(Box, { height: 1 }), _jsx(Box, { borderStyle: "round", borderColor: theme.border.default, paddingLeft: 1, paddingRight: 1, children: _jsx(TextInput, { value: newRuleInput, onChange: setNewRuleInput, onSubmit: handleAddRuleSubmit, placeholder: t('Enter permission rule…'), isActive: true }) }), ruleInputError && (_jsxs(_Fragment, { children: [_jsx(Box, { height: 1 }), _jsx(Text, { color: theme.status.error, children: ruleInputError })] }))] }), _jsx(Box, { marginTop: 1, marginLeft: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to submit · Esc to cancel') }) })] }));
    }
    if (view === 'add-rule-scope') {
        const scopeItems = getPermScopeItems();
        return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, children: t('Add {{type}} permission rule', { type: activeTab.id }) }), _jsx(Box, { height: 1 }), _jsxs(Box, { marginLeft: 2, flexDirection: "column", children: [_jsx(Text, { bold: true, children: pendingRuleText }), _jsx(Text, { color: theme.text.secondary, children: describeRule(pendingRuleText) })] }), _jsx(Box, { height: 1 }), _jsx(Text, { children: t('Where should this rule be saved?') }), _jsx(RadioButtonSelect, { items: scopeItems.map((s) => ({
                                label: `${s.label}    ${s.description}`,
                                value: s.value,
                                key: s.key,
                            })), onSelect: handleScopeSelect, isFocused: true, showNumbers: true })] }), _jsx(Box, { marginTop: 1, marginLeft: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to confirm · Esc to cancel') }) })] }));
    }
    if (view === 'delete-confirm' && deleteTarget) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, children: t('Delete {{type}} rule?', { type: deleteTarget.type }) }), _jsx(Box, { height: 1 }), _jsxs(Box, { marginLeft: 2, flexDirection: "column", children: [_jsx(Text, { bold: true, children: deleteTarget.rule.raw }), _jsx(Text, { color: theme.text.secondary, children: describeRule(deleteTarget.rule.raw) }), _jsx(Text, { color: theme.text.secondary, children: scopeLabel(deleteTarget.scope) })] }), _jsx(Box, { height: 1 }), _jsx(Text, { children: t('Are you sure you want to delete this permission rule?') })] }), _jsx(Box, { marginTop: 1, marginLeft: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to confirm · Esc to cancel') }) })] }));
    }
    // --- Default: rule-list view ---
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(TabBar, { tabs: tabs, activeIndex: activeTabIndex }), _jsx(Text, { children: activeTab.description }), _jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, paddingLeft: 1, paddingRight: 1, width: 60, children: [_jsx(Text, { color: theme.text.accent, children: '> ' }), searchQuery ? (_jsx(Text, { children: searchQuery })) : (_jsx(Text, { color: Colors.Gray, children: t('Search…') }))] }), _jsx(Box, { height: 1 }), _jsx(RadioButtonSelect, { items: listItems, onSelect: handleListSelect, isFocused: view === 'rule-list', showNumbers: true, showScrollArrows: false, maxItemsToShow: 15 }), _jsx(FooterHint, { view: view })] }));
}
// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function TabBar({ tabs, activeIndex, }) {
    return (_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: theme.text.accent, bold: true, children: [t('Permissions:'), ' '] }), tabs.map((tab, i) => (_jsx(Box, { marginRight: 2, children: i === activeIndex ? (_jsx(Text, { bold: true, backgroundColor: theme.text.accent, color: theme.background.primary, children: ` ${tab.label} ` })) : (_jsx(Text, { color: theme.text.secondary, children: ` ${tab.label} ` })) }, tab.id))), _jsx(Text, { color: theme.text.secondary, children: t('(←/→ or tab to cycle)') })] }));
}
function FooterHint({ view }) {
    if (view !== 'rule-list' && view !== 'ws-dir-list')
        return _jsx(_Fragment, {});
    return (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Press ↑↓ to navigate · Enter to select · Type to search · Esc to cancel') }) }));
}
//# sourceMappingURL=PermissionsDialog.js.map