import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Text } from 'ink';
import open from 'open';
import { theme } from '../../../semantic-colors.js';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { useTerminalSize } from '../../../hooks/useTerminalSize.js';
import { RadioButtonSelect } from '../../shared/RadioButtonSelect.js';
import { t } from '../../../../i18n/index.js';
import { parseInstallSource, redactUrlCredentials, createDebugLogger, isExtensionCommittedWithWarningsError, } from '@qwen-code/qwen-code-core';
import { getErrorMessage } from '../../../../utils/errors.js';
const debugLogger = createDebugLogger('DISCOVER_TAB');
/** Formats a raw install count like 787100 -> "787.1K". */
function formatInstalls(n) {
    if (typeof n !== 'number' || !Number.isFinite(n))
        return null;
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(n);
}
function truncateText(text, max) {
    if (max <= 1 || text.length <= max)
        return text;
    return `${text.slice(0, max - 1)}…`;
}
// Built per-render so the literal t() labels stay extractable and localize.
function scopeItems() {
    return [
        { key: 'user', label: t('Global (User Scope)'), value: 'user' },
        {
            key: 'project',
            label: t('Project (Workspace)'),
            value: 'project',
        },
    ];
}
export const DiscoverTab = ({ config, isActive, onLockChange, onStatus, onInstalled, marketplaceFilter, reloadSignal, }) => {
    const [plugins, setPlugins] = useState([]);
    const [cursor, setCursor] = useState(0);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [query, setQuery] = useState('');
    const [selectedKeys, setSelectedKeys] = useState(new Set());
    const [view, setView] = useState('list');
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(false);
    const { columns, rows } = useTerminalSize();
    const availableWidth = Math.max(24, columns - 8);
    // Each item renders as 3 lines (title, description, gap). Reserve rows for
    // the tab bar, header, search box, scroll hints, status and footer.
    const visibleCount = Math.max(3, Math.min(6, Math.floor(((rows || 24) - 13) / 3)));
    const extensionManager = config.getExtensionManager();
    const keyOf = (p) => `${p.marketplaceName}/${p.name}`;
    const filtered = useMemo(() => {
        const byMarketplace = marketplaceFilter
            ? plugins.filter((p) => p.marketplaceName === marketplaceFilter)
            : plugins;
        const q = query.trim().toLowerCase();
        if (!q)
            return byMarketplace;
        return byMarketplace.filter((p) => p.name.toLowerCase().includes(q) ||
            p.marketplaceName.toLowerCase().includes(q) ||
            (p.description?.toLowerCase().includes(q) ?? false));
    }, [plugins, query, marketplaceFilter]);
    // Reset the cursor to the top when the marketplace filter changes.
    useEffect(() => {
        setCursor(0);
        setScrollOffset(0);
    }, [marketplaceFilter]);
    const load = useCallback(async (options) => {
        if (!extensionManager) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const discovered = await extensionManager.discoverPlugins(options);
            setPlugins(discovered);
            setCursor((prev) => (prev < discovered.length ? prev : 0));
            if (options?.refresh) {
                onStatus({
                    type: 'success',
                    text: t('Refreshed {{count}} extension(s).', {
                        count: String(discovered.length),
                    }),
                });
            }
        }
        catch (error) {
            debugLogger.error('Failed to discover plugins:', error);
            onStatus({ type: 'error', text: getErrorMessage(error) });
        }
        finally {
            setLoading(false);
        }
    }, [extensionManager, onStatus]);
    const handleReload = useCallback(() => {
        // Ignore repeat presses while a refresh is in flight so rapid Ctrl+R
        // doesn't stack concurrent network fetches across every marketplace.
        if (loading)
            return;
        void load({ refresh: true });
    }, [load, loading]);
    useEffect(() => {
        load();
    }, [load, reloadSignal]);
    const goToList = useCallback(() => {
        setView('list');
        onLockChange(false);
    }, [onLockChange]);
    const selected = filtered[cursor] ?? null;
    // Keep the cursor in range as the filtered list changes (e.g. while typing).
    useEffect(() => {
        if (cursor > filtered.length - 1) {
            setCursor(filtered.length > 0 ? filtered.length - 1 : 0);
        }
    }, [filtered.length, cursor]);
    // Keep the cursor inside the visible window (scrolling viewport).
    useEffect(() => {
        if (cursor < scrollOffset) {
            setScrollOffset(cursor);
        }
        else if (cursor >= scrollOffset + visibleCount) {
            setScrollOffset(cursor - visibleCount + 1);
        }
    }, [cursor, scrollOffset, visibleCount]);
    // Plugins queued for installation when the scope is chosen.
    const pendingInstall = useCallback(() => {
        const chosen = plugins.filter((p) => selectedKeys.has(keyOf(p)) && !p.installed);
        if (chosen.length > 0)
            return chosen;
        if (selected && !selected.installed)
            return [selected];
        return [];
    }, [plugins, selectedKeys, selected]);
    const beginInstall = useCallback(() => {
        if (pendingInstall().length === 0) {
            onStatus({
                type: 'info',
                text: t('No installable extensions selected.'),
            });
            return;
        }
        setView('scope-select');
        onLockChange(true);
    }, [pendingInstall, onLockChange, onStatus]);
    const runInstall = useCallback(async (targets, scope, origin) => {
        if (!extensionManager || targets.length === 0)
            return;
        setInstalling(true);
        let installed = 0;
        const errors = [];
        const warnings = [];
        for (const plugin of targets) {
            let ext;
            try {
                const metadata = await parseInstallSource(plugin.installSource);
                ext = await extensionManager.installExtension(metadata, undefined, undefined, process.cwd(), undefined, scope === 'user'
                    ? { scope: 'user' }
                    : { scope: 'workspace', workspacePath: process.cwd() });
            }
            catch (error) {
                if (isExtensionCommittedWithWarningsError(error)) {
                    installed++;
                    warnings.push(`${plugin.name}: ${redactUrlCredentials(getErrorMessage(error))}`);
                    try {
                        extensionManager.setExtensionScope(error.identity.name, scope);
                    }
                    catch (scopeError) {
                        warnings.push(`${plugin.name}: ${redactUrlCredentials(getErrorMessage(scopeError))}`);
                        debugLogger.error('Installed extension but failed to apply scope preference:', scopeError);
                    }
                    continue;
                }
                errors.push(`${plugin.name}: ${redactUrlCredentials(getErrorMessage(error))}`);
                continue;
            }
            // The extension is installed on disk now. Recording the scope/enablement
            // preference below is non-critical: a failure there must not flip a
            // successful install to "failed" (which would prompt a confusing retry).
            installed++;
            try {
                extensionManager.setExtensionScope(ext.name, scope);
            }
            catch (scopeError) {
                warnings.push(`${plugin.name}: ${redactUrlCredentials(getErrorMessage(scopeError))}`);
                debugLogger.error('Installed extension but failed to apply scope preference:', scopeError);
            }
        }
        setInstalling(false);
        setSelectedKeys(new Set());
        if (errors.length === 0) {
            onStatus({
                type: warnings.length === 0 ? 'success' : 'warning',
                text: warnings.length === 0
                    ? t('Installed {{count}} extension(s).', {
                        count: String(installed),
                    })
                    : t('Installed {{count}} extension(s) with warnings: {{detail}}', {
                        count: String(installed),
                        detail: warnings.join('; '),
                    }),
            });
        }
        else {
            onStatus({
                type: 'error',
                text: t('Installed {{ok}}, failed {{fail}}: {{detail}}', {
                    ok: String(installed),
                    fail: String(errors.length),
                    detail: [...warnings, ...errors].join('; '),
                }),
            });
        }
        await load();
        onInstalled();
        if (errors.length === 0) {
            goToList();
        }
        else if (origin === 'detail') {
            // Single install from a plugin's detail: stay on detail so the error
            // remains visible over the right plugin and the user can retry.
            setView('detail');
            onLockChange(true);
        }
        else {
            // Batch install started from the list: the detail view renders
            // filtered[cursor] — an arbitrary row unrelated to what failed — so
            // returning there would offer a misleading retry. Keep the error over
            // the list instead.
            goToList();
        }
    }, [extensionManager, onStatus, load, onInstalled, goToList, onLockChange]);
    const installWithScope = useCallback((scope) => void runInstall(pendingInstall(), scope, 'list'), [runInstall, pendingInstall]);
    const openHomepage = useCallback(async (plugin) => {
        if (!plugin.homepage) {
            onStatus({ type: 'info', text: t('No homepage available.') });
            return;
        }
        if (process.env['NODE_ENV'] === 'test') {
            onStatus({
                type: 'info',
                text: t('Would open: {{url}}', { url: plugin.homepage }),
            });
            return;
        }
        // homepage comes from untrusted marketplace metadata; only follow web
        // links. `open()` would otherwise launch file:// / other schemes in the
        // OS default handler (e.g. file:///Users/victim/.ssh/id_rsa).
        let protocol;
        try {
            protocol = new URL(plugin.homepage).protocol;
        }
        catch {
            protocol = '';
        }
        if (protocol !== 'http:' && protocol !== 'https:') {
            onStatus({
                type: 'error',
                text: t('Failed to open {{url}}', { url: plugin.homepage }),
            });
            return;
        }
        try {
            await open(plugin.homepage);
        }
        catch {
            onStatus({
                type: 'error',
                text: t('Failed to open {{url}}', { url: plugin.homepage }),
            });
        }
    }, [onStatus]);
    const handleDetailAction = useCallback((action) => {
        if (action === 'back') {
            goToList();
        }
        else if (action === 'homepage') {
            if (selected)
                void openHomepage(selected);
        }
        else if (selected) {
            void runInstall([selected], action, 'detail');
        }
    }, [selected, goToList, openHomepage, runInstall]);
    const detailActionItems = useCallback(() => {
        const items = [];
        if (selected && !selected.installed) {
            items.push({
                key: 'user',
                label: t('Install for you (user scope)'),
                value: 'user',
            }, {
                key: 'project',
                label: t('Install for the current workspace (project scope)'),
                value: 'project',
            });
        }
        if (selected?.homepage) {
            items.push({
                key: 'homepage',
                label: t('Open homepage'),
                value: 'homepage',
            });
        }
        items.push({
            key: 'back',
            label: t('Back to extension list'),
            value: 'back',
        });
        return items;
    }, [selected]);
    // List keyboard: navigate, type-to-search, Space to toggle, Enter to view
    // (or install the selected set), matching Claude Code's Discover list.
    // Note: navigation here intentionally bypasses the global SELECTION_UP/DOWN
    // matchers (which include bare j/k) so that j and k stay available as
    // printable characters for the type-to-search query.
    useKeypress((key) => {
        if (key.name === 'up' || (key.ctrl && key.name === 'p')) {
            if (filtered.length > 0)
                setCursor((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
            return;
        }
        if (key.name === 'down' || (key.ctrl && key.name === 'n')) {
            if (filtered.length > 0)
                setCursor((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
            return;
        }
        if (key.name === 'return') {
            if (selectedKeys.size > 0) {
                beginInstall();
            }
            else if (selected) {
                onStatus(null);
                setView('detail');
                onLockChange(true);
            }
            return;
        }
        if (key.name === 'space' || key.sequence === ' ') {
            if (!selected || selected.installed)
                return;
            setSelectedKeys((prev) => {
                const next = new Set(prev);
                const k = keyOf(selected);
                if (next.has(k))
                    next.delete(k);
                else
                    next.add(k);
                return next;
            });
            return;
        }
        if (key.name === 'backspace' || key.name === 'delete') {
            setQuery((q) => q.slice(0, -1));
            return;
        }
        // Ctrl+R: refresh / re-discover all sources.
        if (key.ctrl && key.name === 'r') {
            handleReload();
            return;
        }
        // Printable character -> append to the search query.
        if (!key.ctrl &&
            !key.meta &&
            key.sequence &&
            key.sequence.length === 1 &&
            key.sequence >= ' ') {
            setQuery((q) => q + key.sequence);
        }
    }, { isActive: isActive && view === 'list' });
    // Detail: Escape goes back; the action selector (RadioButtonSelect) owns Enter.
    useKeypress((key) => {
        if (key.name === 'escape') {
            goToList();
        }
    }, { isActive: isActive && view === 'detail' });
    // Scope-select (batch install from the list) escape returns to the list.
    useKeypress((key) => {
        if (key.name === 'escape' && !installing) {
            goToList();
        }
    }, { isActive: isActive && view === 'scope-select' });
    if (loading) {
        return (_jsx(Text, { color: theme.text.secondary, children: t('Discovering extensions...') }));
    }
    if (view === 'scope-select') {
        const count = pendingInstall().length;
        return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: theme.text.primary, children: t('Install {{count}} extension(s) to which scope?', {
                        count: String(count),
                    }) }), installing ? (_jsx(Text, { color: theme.text.secondary, children: t('Installing...') })) : (_jsx(RadioButtonSelect, { items: scopeItems(), isFocused: isActive, showNumbers: false, onSelect: (scope) => void installWithScope(scope) }))] }));
    }
    if (view === 'detail' && selected) {
        const comps = selected.components;
        const componentLines = [];
        if (comps?.skills?.length)
            componentLines.push({ label: t('Skills'), names: comps.skills });
        if (comps?.commands?.length)
            componentLines.push({ label: t('Commands'), names: comps.commands });
        if (comps?.agents?.length)
            componentLines.push({ label: t('Agents'), names: comps.agents });
        if (comps?.mcpServers?.length)
            componentLines.push({
                label: t('MCP servers'),
                names: comps.mcpServers,
            });
        return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: theme.text.primary, bold: true, children: t('Extension details') }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.primary, bold: true, children: selected.name }), _jsx(Text, { color: theme.text.secondary, children: t('from {{marketplace}}', {
                                marketplace: selected.marketplaceName,
                            }) }), selected.lastUpdated ? (_jsx(Text, { color: theme.text.secondary, children: t('Last updated: {{date}}', { date: selected.lastUpdated }) })) : selected.version ? (_jsx(Text, { color: theme.text.secondary, children: t('Version: {{v}}', { v: selected.version }) })) : null] }), selected.description ? _jsx(Text, { children: selected.description }) : null, selected.author ? (_jsx(Text, { color: theme.text.secondary, children: t('By: {{a}}', { a: selected.author }) })) : null, componentLines.length > 0 ? (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.primary, bold: true, children: t('Will install:') }), componentLines.map((line) => (_jsx(Text, { color: theme.text.secondary, children: `· ${line.label}: ${line.names.join(', ')}` }, line.label)))] })) : null, _jsx(Text, { color: theme.text.secondary, italic: true, children: t('⚠ Make sure you trust an extension before installing, updating, or using it. We cannot verify what MCP servers, files, or other software an extension includes, or that it works as intended. See the extension homepage for more information.') }), installing ? (_jsx(Text, { color: theme.text.secondary, children: t('Installing...') })) : (_jsx(RadioButtonSelect, { items: detailActionItems(), isFocused: isActive, showNumbers: false, onSelect: handleDetailAction }))] }));
    }
    if (plugins.length === 0) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: t('No extensions discovered.') }), _jsx(Text, { color: theme.text.secondary, children: t('Add a marketplace in the Sources tab to discover extensions.') })] }));
    }
    const windowItems = filtered.slice(scrollOffset, scrollOffset + visibleCount);
    const hasAbove = scrollOffset > 0;
    const hasBelow = scrollOffset + visibleCount < filtered.length;
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { color: theme.text.primary, bold: true, children: t('Discover extensions') }), _jsx(Text, { color: theme.text.secondary, children: ` (${filtered.length ? cursor + 1 : 0}/${filtered.length})` }), marketplaceFilter ? (_jsx(Text, { color: theme.text.secondary, children: t(' · {{marketplace}} (Tab to clear)', {
                            marketplace: marketplaceFilter,
                        }) })) : null] }), _jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, paddingX: 1, width: availableWidth, children: [_jsx(Text, { color: theme.text.secondary, children: '⌕ ' }), query ? (_jsx(Text, { color: theme.text.primary, children: query })) : (_jsx(Text, { color: theme.text.secondary, children: t('Search…') }))] }), filtered.length === 0 ? (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('No extensions match your search.') }) })) : (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [hasAbove ? (_jsx(Text, { color: theme.text.secondary, children: t('↑ more above') })) : null, windowItems.map((plugin, i) => {
                        const absIndex = scrollOffset + i;
                        const isCursor = absIndex === cursor;
                        const isChecked = selectedKeys.has(keyOf(plugin));
                        const installs = formatInstalls(plugin.installs);
                        const checkbox = plugin.installed ? '✓' : isChecked ? '●' : '○';
                        const titleColor = isCursor
                            ? theme.text.accent
                            : theme.text.primary;
                        const meta = ` · ${plugin.marketplaceName}` +
                            (installs ? ` · ${installs} installs` : '') +
                            (plugin.installed ? ` · ${t('installed')}` : '');
                        return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Box, { children: [_jsx(Box, { minWidth: 2, flexShrink: 0, children: _jsx(Text, { color: theme.text.accent, children: isCursor ? '›' : ' ' }) }), _jsx(Box, { minWidth: 2, flexShrink: 0, children: _jsx(Text, { color: plugin.installed
                                                    ? theme.status.success
                                                    : theme.text.primary, children: checkbox }) }), _jsx(Text, { bold: true, color: titleColor, children: plugin.name }), _jsx(Text, { color: theme.text.secondary, children: meta })] }), plugin.description ? (_jsx(Box, { paddingLeft: 4, children: _jsx(Text, { color: theme.text.secondary, children: truncateText(plugin.description, availableWidth - 4) }) })) : null] }, keyOf(plugin)));
                    }), hasBelow ? (_jsx(Text, { color: theme.text.secondary, children: t('↓ more below') })) : null] }))] }));
};
//# sourceMappingURL=DiscoverTab.js.map