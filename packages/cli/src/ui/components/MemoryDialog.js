import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { useCallback, useEffect, useMemo, useState } from 'react';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getAllGeminiMdFilenames, Storage, getAutoMemoryRoot, getAutoMemoryProjectStateDir, } from '@qwen-code/qwen-code-core';
import { useConfig } from '../contexts/ConfigContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { SettingScope } from '../../config/settings.js';
import { useLaunchEditor } from '../hooks/useLaunchEditor.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { keyMatchers, Command } from '../keyMatchers.js';
import { theme } from '../semantic-colors.js';
import { formatRelativeTime } from '../utils/formatters.js';
import { t } from '../../i18n/index.js';
async function resolvePreferredMemoryFile(dir, fallbackFilename) {
    for (const filename of getAllGeminiMdFilenames()) {
        const filePath = path.join(dir, filename);
        try {
            await fs.access(filePath);
            return filePath;
        }
        catch {
            // Try the next configured file name.
        }
    }
    return path.join(dir, fallbackFilename);
}
function openFolderPath(folderPath) {
    let command = 'xdg-open';
    switch (process.platform) {
        case 'darwin':
            command = 'open';
            break;
        case 'win32':
            command = 'explorer';
            break;
        default:
            command = 'xdg-open';
            break;
    }
    const needsShell = process.platform === 'win32' &&
        (command.endsWith('.cmd') || command.endsWith('.bat'));
    const result = spawnSync(command, [folderPath], {
        stdio: 'inherit',
        shell: needsShell,
    });
    if (result.error) {
        throw result.error;
    }
    if (typeof result.status === 'number' && result.status !== 0) {
        throw new Error(`Folder opener exited with status ${result.status}`);
    }
}
async function ensureFileExists(filePath) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    try {
        await fs.access(filePath);
    }
    catch {
        await fs.writeFile(filePath, '', 'utf-8');
    }
}
function formatDisplayPath(filePath) {
    const home = os.homedir();
    if (filePath.startsWith(home)) {
        return `~${filePath.slice(home.length)}`;
    }
    return filePath;
}
export function MemoryDialog({ onClose }) {
    const config = useConfig();
    const loadedSettings = useSettings();
    const launchEditor = useLaunchEditor();
    const [error, setError] = useState(null);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    // 'autoMemory' | 'autoDream' = focus on that toggle row; 'list' = focus on the file list
    const [focusedSection, setFocusedSection] = useState('list');
    const [autoMemoryOn, setAutoMemoryOn] = useState(() => config.getManagedAutoMemoryEnabled());
    const [autoDreamOn, setAutoDreamOn] = useState(() => config.getManagedAutoDreamEnabled());
    const [lastDreamAt, setLastDreamAt] = useState(null);
    const globalMemoryPath = useMemo(() => path.join(Storage.getGlobalQwenDir(), getAllGeminiMdFilenames()[0] ?? 'QWEN.md'), []);
    const projectMemoryPath = useMemo(() => path.join(config.getWorkingDir(), getAllGeminiMdFilenames()[0] ?? 'QWEN.md'), [config]);
    const managedMemoryPath = useMemo(() => getAutoMemoryRoot(config.getProjectRoot()), [config]);
    const memoryStatePath = useMemo(() => getAutoMemoryProjectStateDir(config.getProjectRoot()), [config]);
    const items = useMemo(() => [
        {
            label: t('User memory'),
            value: 'global',
            description: t('Saved in {{path}}', {
                path: formatDisplayPath(globalMemoryPath),
            }),
        },
        {
            label: t('Project memory'),
            value: 'project',
            description: t('Saved in {{path}}', {
                path: path.relative(config.getWorkingDir(), projectMemoryPath) ||
                    path.basename(projectMemoryPath),
            }),
        },
        {
            label: t('Open auto-memory folder'),
            value: 'managed',
        },
    ], [config, globalMemoryPath, projectMemoryPath]);
    // Load lastDreamAt from meta.json
    useEffect(() => {
        let cancelled = false;
        async function loadMeta() {
            try {
                const metadataPath = path.join(memoryStatePath, 'meta.json');
                const content = await fs.readFile(metadataPath, 'utf-8');
                const parsed = JSON.parse(content);
                if (!cancelled && parsed.lastDreamAt) {
                    const ts = new Date(parsed.lastDreamAt).getTime();
                    if (!Number.isNaN(ts)) {
                        setLastDreamAt(ts);
                    }
                }
            }
            catch {
                // meta.json not found or invalid — keep null
            }
        }
        void loadMeta();
        return () => {
            cancelled = true;
        };
    }, [memoryStatePath]);
    const dreamStatusText = useMemo(() => {
        if (lastDreamAt !== null)
            return formatRelativeTime(lastDreamAt);
        return t('never');
    }, [lastDreamAt]);
    const resolveTargetPath = useCallback(async (target) => {
        switch (target) {
            case 'project':
                return resolvePreferredMemoryFile(config.getWorkingDir(), getAllGeminiMdFilenames()[0] ?? 'QWEN.md');
            case 'global':
                return resolvePreferredMemoryFile(Storage.getGlobalQwenDir(), getAllGeminiMdFilenames()[0] ?? 'QWEN.md');
            case 'managed':
                return managedMemoryPath;
            default:
                return managedMemoryPath;
        }
    }, [config, managedMemoryPath]);
    const handleSelect = useCallback(async (target) => {
        try {
            setError(null);
            const targetPath = await resolveTargetPath(target);
            if (target === 'managed') {
                await fs.mkdir(targetPath, { recursive: true });
                openFolderPath(targetPath);
            }
            else {
                await ensureFileExists(targetPath);
                await launchEditor(targetPath);
            }
            onClose();
        }
        catch (selectionError) {
            setError(selectionError instanceof Error
                ? selectionError.message
                : String(selectionError));
        }
    }, [launchEditor, onClose, resolveTargetPath]);
    const handleToggleAutoMemory = useCallback(() => {
        const newValue = !autoMemoryOn;
        loadedSettings.setValue(SettingScope.Workspace, 'memory.enableManagedAutoMemory', newValue);
        setAutoMemoryOn(newValue);
    }, [autoMemoryOn, loadedSettings]);
    const handleToggleAutoDream = useCallback(() => {
        const newValue = !autoDreamOn;
        loadedSettings.setValue(SettingScope.Workspace, 'memory.enableManagedAutoDream', newValue);
        setAutoDreamOn(newValue);
    }, [autoDreamOn, loadedSettings]);
    useKeypress((key) => {
        if (key.name === 'escape') {
            onClose();
            return;
        }
        if (focusedSection === 'autoMemory') {
            // No "up" target above autoMemory; only handle down → autoDream.
            if (keyMatchers[Command.SELECTION_DOWN](key)) {
                setFocusedSection('autoDream');
                return;
            }
            if (key.name === 'return') {
                handleToggleAutoMemory();
                return;
            }
            return;
        }
        if (focusedSection === 'autoDream') {
            if (keyMatchers[Command.SELECTION_UP](key)) {
                setFocusedSection('autoMemory');
                return;
            }
            if (keyMatchers[Command.SELECTION_DOWN](key)) {
                setFocusedSection('list');
                setHighlightedIndex(0);
                return;
            }
            if (key.name === 'return') {
                handleToggleAutoDream();
                return;
            }
            return;
        }
        // focusedSection === 'list'
        if (keyMatchers[Command.SELECTION_UP](key)) {
            if (highlightedIndex === 0) {
                setFocusedSection('autoDream');
            }
            else {
                setHighlightedIndex((current) => current - 1);
            }
            return;
        }
        if (keyMatchers[Command.SELECTION_DOWN](key)) {
            setHighlightedIndex((current) => (current + 1) % items.length);
            return;
        }
        if (key.name === 'return') {
            void handleSelect(items[highlightedIndex]?.value ?? 'project');
            return;
        }
        if (key.sequence && /^[1-3]$/.test(key.sequence)) {
            const nextIndex = Number(key.sequence) - 1;
            if (items[nextIndex]) {
                setHighlightedIndex(nextIndex);
                void handleSelect(items[nextIndex].value);
            }
        }
    }, { isActive: true });
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsx(Text, { bold: true, children: t('Memory') }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Text, { color: focusedSection === 'autoMemory'
                            ? theme.status.success
                            : theme.text.secondary, children: [focusedSection === 'autoMemory' ? '› ' : '  ', t('Auto-memory: {{status}}', {
                                status: autoMemoryOn ? t('on') : t('off'),
                            })] }), _jsxs(Text, { color: focusedSection === 'autoDream'
                            ? theme.status.success
                            : theme.text.secondary, children: [focusedSection === 'autoDream' ? '› ' : '  ', t('Auto-dream: {{status}} · {{lastDream}} · /dream to run', {
                                status: autoDreamOn ? t('on') : t('off'),
                                lastDream: dreamStatusText,
                            })] })] }), error && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.error, children: error }) })), _jsx(Box, { marginTop: 1, flexDirection: "column", children: items.map((item, index) => {
                    const isSelected = focusedSection === 'list' && index === highlightedIndex;
                    return (_jsxs(Box, { flexDirection: "row", children: [_jsxs(Text, { color: isSelected ? theme.status.success : undefined, children: [isSelected ? '› ' : '  ', index + 1, ". ", item.label] }), item.description ? (_jsx(Text, { color: theme.text.secondary, children: `  ${item.description}` })) : null] }, item.value));
                }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to confirm · Esc to cancel') }) })] }));
}
//# sourceMappingURL=MemoryDialog.js.map