import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { ICON } from '../../../constants.js';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { keyMatchers, Command } from '../../../keyMatchers.js';
import { TextInput } from '../../shared/TextInput.js';
import { RadioButtonSelect } from '../../shared/RadioButtonSelect.js';
import { t } from '../../../../i18n/index.js';
import { parseInstallSource, redactUrlCredentials, createDebugLogger, isExtensionCommittedWithWarningsError, } from '@qwen-code/qwen-code-core';
import { getErrorMessage } from '../../../../utils/errors.js';
import { stripUnsafeCharacters } from '../../../utils/textUtils.js';
const debugLogger = createDebugLogger('SOURCES_TAB');
// How many installed plugins to list in the marketplace detail before
// collapsing the rest into a "… and N more" summary (keeps the view short).
const INSTALLED_PREVIEW_LIMIT = 5;
function formatDate(iso) {
    if (!iso)
        return null;
    const time = Date.parse(iso);
    if (Number.isNaN(time))
        return null;
    return new Date(time).toLocaleDateString();
}
export const SourcesTab = ({ config, isActive, onLockChange, onStatus, onChanged, onBrowse, onFooter, reloadSignal, }) => {
    const [sources, setSources] = useState([]);
    const [extensions, setExtensions] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [view, setView] = useState('list');
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [detailConfig, setDetailConfig] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    // The marketplace currently being viewed or confirmed.
    const [detailSource, setDetailSource] = useState(null);
    const extensionManager = config.getExtensionManager();
    const load = useCallback(async () => {
        if (!extensionManager)
            return;
        try {
            await extensionManager.refreshCache();
        }
        catch (error) {
            debugLogger.error('Failed to refresh extensions:', error);
        }
        setExtensions(extensionManager.getLoadedExtensions());
        setSources(extensionManager.getSources());
    }, [extensionManager]);
    useEffect(() => {
        load();
    }, [load, reloadSignal]);
    // Entries: two action rows, then the configured marketplaces.
    const entries = useMemo(() => [
        { kind: 'install-extension' },
        { kind: 'add-marketplace' },
        ...sources.map((source) => ({ kind: 'marketplace', source })),
    ], [sources]);
    // Keep the cursor in range as the list changes.
    useEffect(() => {
        if (selectedIndex >= entries.length) {
            setSelectedIndex(0);
        }
    }, [entries.length, selectedIndex]);
    const selectedEntry = entries[selectedIndex];
    // Context-aware footer hint. Mostly list-view only, but the marketplace
    // detail surfaces an R-to-retry hint when its load failed.
    useEffect(() => {
        if (!isActive) {
            onFooter(null);
            return;
        }
        if (view === 'detail') {
            // R re-fetches in the detail view either way; advertise it in the
            // footer (as a retry on failure, a refresh once loaded).
            if (detailLoading) {
                onFooter(null);
            }
            else if (!detailConfig) {
                onFooter(t('Press R to retry · Esc to go back'));
            }
            else {
                onFooter(t('Enter to select · R refresh · Esc to go back'));
            }
            return () => onFooter(null);
        }
        if (view !== 'list') {
            onFooter(null);
            return;
        }
        const kind = selectedEntry?.kind;
        if (kind === 'marketplace') {
            onFooter(t('↑↓ navigate · Enter open · d remove marketplace · Esc close'));
        }
        else {
            onFooter(t('↑↓ navigate · Enter select · Esc close'));
        }
        return () => onFooter(null);
    }, [
        isActive,
        view,
        selectedEntry?.kind,
        onFooter,
        detailLoading,
        detailConfig,
    ]);
    const goToList = useCallback(() => {
        setView('list');
        setInput('');
        setDetailConfig(null);
        setDetailSource(null);
        onLockChange(false);
    }, [onLockChange]);
    const submitAdd = useCallback(async () => {
        if (!extensionManager || !input.trim())
            return;
        setBusy(true);
        try {
            const entry = await extensionManager.addSource(input.trim());
            onStatus({
                type: 'success',
                text: t('Added marketplace "{{name}}".', { name: entry.name }),
            });
            await load();
            onChanged();
            goToList();
        }
        catch (error) {
            onStatus({
                type: 'error',
                text: redactUrlCredentials(getErrorMessage(error)),
            });
        }
        finally {
            setBusy(false);
        }
    }, [extensionManager, input, onStatus, load, onChanged, goToList]);
    const submitInstall = useCallback(async () => {
        if (!extensionManager || !input.trim())
            return;
        setBusy(true);
        try {
            const metadata = await parseInstallSource(input.trim());
            const ext = await extensionManager.installExtension(metadata);
            onStatus({
                type: 'success',
                text: t('Installed extension "{{name}}".', { name: ext.name }),
            });
            await load();
            onChanged();
            goToList();
        }
        catch (error) {
            if (isExtensionCommittedWithWarningsError(error)) {
                onStatus({
                    type: 'warning',
                    text: redactUrlCredentials(getErrorMessage(error)),
                });
                await load();
                onChanged();
                goToList();
                return;
            }
            onStatus({
                type: 'error',
                text: redactUrlCredentials(getErrorMessage(error)),
            });
        }
        finally {
            setBusy(false);
        }
    }, [extensionManager, input, onStatus, load, onChanged, goToList]);
    const openSourceDetail = useCallback(async (source) => {
        onStatus(null);
        setDetailSource(source);
        setView('detail');
        onLockChange(true);
        setDetailLoading(true);
        setDetailConfig(null);
        try {
            const cfg = await extensionManager?.loadSource(source.source);
            setDetailConfig(cfg ?? null);
        }
        catch (error) {
            debugLogger.error('Failed to load marketplace detail:', error);
        }
        finally {
            setDetailLoading(false);
        }
    }, [extensionManager, onLockChange, onStatus]);
    // Re-fetch the marketplace config for the currently-open detail. Used by the
    // R key so a failed load can be retried without leaving the detail view.
    const refetchDetail = useCallback(async () => {
        if (!extensionManager || !detailSource)
            return;
        setDetailLoading(true);
        setDetailConfig(null);
        try {
            const cfg = await extensionManager.loadSource(detailSource.source);
            setDetailConfig(cfg ?? null);
        }
        catch (error) {
            debugLogger.error('Failed to load marketplace detail:', error);
        }
        finally {
            setDetailLoading(false);
        }
    }, [extensionManager, detailSource]);
    const removeSource = useCallback(() => {
        if (!extensionManager || !detailSource)
            return;
        // removeSource() -> atomicWriteFileSync can throw (EACCES/EROFS/ENOSPC, or
        // a Windows lock on marketplaces.json). Unlike the async sibling handlers,
        // this runs synchronously inside the keypress broadcast loop, so an
        // unguarded throw would tear down the whole TUI session. Degrade to an
        // error toast instead.
        try {
            const removed = extensionManager.removeSource(detailSource.name);
            if (removed) {
                onStatus({
                    type: 'success',
                    text: t('Removed marketplace "{{name}}".', {
                        name: detailSource.name,
                    }),
                });
                void load();
                onChanged();
            }
        }
        catch (error) {
            onStatus({ type: 'error', text: getErrorMessage(error) });
        }
        goToList();
    }, [extensionManager, detailSource, onStatus, load, onChanged, goToList]);
    const updateSource = useCallback(async () => {
        if (!extensionManager || !detailSource)
            return;
        setDetailLoading(true);
        try {
            const cfg = await extensionManager.loadSource(detailSource.source);
            setDetailConfig(cfg ?? null);
            // loadSource returns null when the marketplace is unreachable / invalid.
            // Only advance the lastUpdated timestamp and report success on a real
            // refresh — otherwise a failed update would show "Updated marketplace X".
            if (cfg === null) {
                onStatus({
                    type: 'error',
                    text: t('Could not update marketplace "{{name}}".', {
                        name: detailSource.name,
                    }),
                });
                await load();
                return;
            }
            extensionManager.markSourceUpdated(detailSource.name);
            await load();
            onChanged();
            onStatus({
                type: 'success',
                text: t('Updated marketplace "{{name}}".', { name: detailSource.name }),
            });
        }
        catch (error) {
            onStatus({
                type: 'error',
                text: redactUrlCredentials(getErrorMessage(error)),
            });
        }
        finally {
            setDetailLoading(false);
        }
    }, [extensionManager, detailSource, load, onChanged, onStatus]);
    const handleSourceDetailAction = useCallback((action) => {
        if (!detailSource)
            return;
        if (action === 'browse') {
            onBrowse(detailSource.name);
        }
        else if (action === 'update') {
            void updateSource();
        }
        else if (action === 'remove') {
            setView('remove-confirm');
        }
    }, [detailSource, onBrowse, updateSource]);
    // List keyboard: navigate entries, Enter dispatches by kind, d removes.
    useKeypress((key) => {
        if (entries.length === 0)
            return;
        if (keyMatchers[Command.SELECTION_UP](key)) {
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : entries.length - 1));
            return;
        }
        if (keyMatchers[Command.SELECTION_DOWN](key)) {
            setSelectedIndex((prev) => (prev < entries.length - 1 ? prev + 1 : 0));
            return;
        }
        if (key.name === 'return') {
            if (!selectedEntry)
                return;
            onStatus(null);
            switch (selectedEntry.kind) {
                case 'install-extension':
                    setView('install-extension');
                    onLockChange(true);
                    break;
                case 'add-marketplace':
                    setView('add');
                    onLockChange(true);
                    break;
                case 'marketplace':
                    void openSourceDetail(selectedEntry.source);
                    break;
                default:
                    break;
            }
            return;
        }
        if ((key.sequence === 'd' || key.sequence === 'x') &&
            !key.ctrl &&
            !key.meta &&
            selectedEntry?.kind === 'marketplace') {
            setDetailSource(selectedEntry.source);
            setView('remove-confirm');
            onLockChange(true);
        }
    }, { isActive: isActive && view === 'list' });
    // Input views: Escape cancels.
    useKeypress((key) => {
        if (key.name === 'escape' && !busy) {
            goToList();
        }
    }, {
        isActive: isActive && (view === 'add' || view === 'install-extension'),
    });
    // Marketplace detail: Escape goes back; R re-fetches (retry on load failure);
    // the selector owns Enter.
    useKeypress((key) => {
        if (key.name === 'escape') {
            goToList();
        }
        else if ((key.name === 'r' || key.sequence === 'r') &&
            !key.ctrl &&
            !key.meta &&
            !detailLoading) {
            void refetchDetail();
        }
    }, { isActive: isActive && view === 'detail' });
    // Remove-marketplace confirmation.
    useKeypress((key) => {
        if (key.name === 'return' || key.sequence === 'y') {
            removeSource();
        }
        else if (key.name === 'escape' || key.sequence === 'n') {
            goToList();
        }
    }, { isActive: isActive && view === 'remove-confirm' });
    if (view === 'install-extension') {
        return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: theme.text.primary, bold: true, children: t('Install Extension') }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.primary, children: t('Enter extension source:') }), _jsx(Text, { color: theme.text.secondary, children: t('Examples:') }), _jsx(Text, { color: theme.text.secondary, children: ' · owner/repo (GitHub)' }), _jsx(Text, { color: theme.text.secondary, children: ' · git@github.com:owner/repo.git (SSH)' }), _jsx(Text, { color: theme.text.secondary, children: ' · @scope/name (npm)' }), _jsx(Text, { color: theme.text.secondary, children: ' · ./path/to/extension' })] }), busy ? (_jsx(Text, { color: theme.text.secondary, children: t('Installing...') })) : (_jsx(TextInput, { value: input, onChange: setInput, onSubmit: () => void submitInstall(), isActive: isActive }))] }));
    }
    if (view === 'add') {
        return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: theme.text.primary, bold: true, children: t('Add Marketplace') }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.primary, children: t('Enter marketplace source (Claude format):') }), _jsx(Text, { color: theme.text.secondary, children: t('Examples:') }), _jsx(Text, { color: theme.text.secondary, children: ' · owner/repo (GitHub)' }), _jsx(Text, { color: theme.text.secondary, children: ' · git@github.com:owner/repo.git (SSH)' }), _jsx(Text, { color: theme.text.secondary, children: ' · https://example.com/marketplace.json' }), _jsx(Text, { color: theme.text.secondary, children: ' · ./path/to/marketplace' })] }), busy ? (_jsx(Text, { color: theme.text.secondary, children: t('Adding...') })) : (_jsx(TextInput, { value: input, onChange: setInput, onSubmit: () => void submitAdd(), isActive: isActive }))] }));
    }
    if (view === 'detail' && detailSource) {
        const plugins = detailConfig?.plugins ?? [];
        const availableCount = plugins.length;
        const installedNames = new Set(extensions.map((ext) => ext.name));
        const installedHere = plugins.filter((p) => installedNames.has(p.name));
        const lastUpdated = formatDate(detailSource.lastUpdatedAt ?? detailSource.addedAt);
        const actions = [
            {
                key: 'browse',
                label: t('Browse extensions ({{count}})', {
                    count: String(availableCount),
                }),
                value: 'browse',
            },
            {
                key: 'update',
                label: lastUpdated
                    ? t('Update marketplace (last updated {{date}})', {
                        date: lastUpdated,
                    })
                    : t('Update marketplace'),
                value: 'update',
            },
            { key: 'remove', label: t('Remove marketplace'), value: 'remove' },
        ];
        return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.primary, bold: true, children: stripUnsafeCharacters(detailSource.name) }), _jsx(Text, { color: theme.text.secondary, children: redactUrlCredentials(detailSource.source) })] }), detailLoading ? (_jsx(Text, { color: theme.text.secondary, children: t('Loading...') })) : detailConfig ? (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: theme.text.primary, children: t('{{count}} available extensions', {
                                count: String(availableCount),
                            }) }), installedHere.length > 0 ? (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.primary, bold: true, children: t('Installed extensions ({{count}}):', {
                                        count: String(installedHere.length),
                                    }) }), installedHere.slice(0, INSTALLED_PREVIEW_LIMIT).map((p) => (_jsxs(Box, { children: [_jsx(Box, { minWidth: 2, flexShrink: 0, children: _jsx(Text, { color: theme.status.success, children: ICON.CIRCLE_FILLED }) }), _jsx(Text, { color: theme.text.primary, children: stripUnsafeCharacters(p.name) })] }, p.name))), installedHere.length > INSTALLED_PREVIEW_LIMIT ? (_jsx(Text, { color: theme.text.secondary, children: t('... and {{count}} more', {
                                        count: String(installedHere.length - INSTALLED_PREVIEW_LIMIT),
                                    }) })) : null] })) : null, _jsx(RadioButtonSelect, { items: actions, isFocused: isActive, showNumbers: false, onSelect: handleSourceDetailAction })] })) : (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: theme.status.error, children: t('Could not load this marketplace.') }), _jsx(Text, { color: theme.text.secondary, children: t('Press R to retry · Esc to go back') }), _jsx(RadioButtonSelect, { items: [
                                {
                                    key: 'remove',
                                    label: t('Remove marketplace'),
                                    value: 'remove',
                                },
                            ], isFocused: isActive, showNumbers: false, onSelect: handleSourceDetailAction })] }))] }));
    }
    if (view === 'remove-confirm') {
        return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: theme.status.warning, children: t('Remove marketplace "{{name}}"?', {
                        name: stripUnsafeCharacters(detailSource?.name ?? ''),
                    }) }), _jsx(Text, { color: theme.text.secondary, children: t('Y/Enter to confirm · N/Esc to cancel') })] }));
    }
    // List view.
    const renderRow = (index, label, rightText, isAction = false) => {
        const isSelected = index === selectedIndex;
        const labelColor = isSelected
            ? theme.text.accent
            : isAction
                ? theme.text.link
                : theme.text.primary;
        return (_jsxs(Box, { children: [_jsx(Box, { minWidth: 2, flexShrink: 0, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, children: isSelected ? ICON.CIRCLE_FILLED : ' ' }) }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { color: labelColor, children: label }) }), rightText ? (_jsx(Text, { color: theme.text.secondary, children: rightText })) : null] }, `row-${index}`));
    };
    const sourcesStart = 2;
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.accent, bold: true, children: t('Add new') }), renderRow(0, t('+ Install a new extension'), undefined, true), renderRow(1, t('+ Add new marketplace'), t('Claude plugin marketplace'), true)] }), sources.length > 0 ? (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Text, { color: theme.text.accent, bold: true, children: [t('Marketplaces'), " (", sources.length, ")"] }), sources.map((source, j) => renderRow(sourcesStart + j, 
                    // Persisted marketplace name is stored raw from untrusted config;
                    // scrub it at the render site (also defends already-persisted
                    // entries) like the detail header does.
                    stripUnsafeCharacters(source.name), `${redactUrlCredentials(source.source)} (${source.type})`))] })) : (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('No marketplaces added yet.') }) }))] }));
};
//# sourceMappingURL=SourcesTab.js.map