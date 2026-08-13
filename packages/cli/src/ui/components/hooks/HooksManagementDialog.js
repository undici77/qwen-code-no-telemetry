import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { keyMatchers, Command } from '../../keyMatchers.js';
import { useConfig } from '../../contexts/ConfigContext.js';
import { loadSettings, SettingScope } from '../../../config/settings.js';
import { HooksConfigSource, createDebugLogger, HOOKS_CONFIG_FIELDS, } from '@qwen-code/qwen-code-core';
import { HOOKS_MANAGEMENT_STEPS } from './types.js';
import { addConfigToMatcherGroup, getAllConfigs } from './matcherGrouping.js';
import { HooksListStep } from './HooksListStep.js';
import { HookDetailStep } from './HookDetailStep.js';
import { HookMatcherDetailStep } from './HookMatcherDetailStep.js';
import { HookConfigDetailStep } from './HookConfigDetailStep.js';
import { HooksDisabledStep } from './HooksDisabledStep.js';
import { DISPLAY_HOOK_EVENTS, getTranslatedSourceDisplayMap, createEmptyHookEventInfo, supportsMatchers, } from './constants.js';
import { t } from '../../../i18n/index.js';
const debugLogger = createDebugLogger('HOOKS_DIALOG');
function isValidHookConfig(config) {
    if (typeof config !== 'object' || config === null || !('type' in config)) {
        return false;
    }
    const obj = config;
    if (obj['type'] === 'command') {
        return 'command' in obj && typeof obj['command'] === 'string';
    }
    if (obj['type'] === 'http') {
        return 'url' in obj && typeof obj['url'] === 'string';
    }
    if (obj['type'] === 'function') {
        return 'callback' in obj && typeof obj['callback'] === 'function';
    }
    if (obj['type'] === 'prompt') {
        return 'prompt' in obj && typeof obj['prompt'] === 'string';
    }
    return false;
}
function isValidHookDefinition(def) {
    if (typeof def !== 'object' || def === null) {
        return false;
    }
    const obj = def;
    if (!('hooks' in obj) || !Array.isArray(obj['hooks'])) {
        return false;
    }
    for (const hook of obj['hooks']) {
        if (!isValidHookConfig(hook)) {
            return false;
        }
    }
    if ('matcher' in obj && typeof obj['matcher'] !== 'string') {
        return false;
    }
    if ('sequential' in obj && typeof obj['sequential'] !== 'boolean') {
        return false;
    }
    return true;
}
function isValidHooksRecord(hooks) {
    if (typeof hooks !== 'object' || hooks === null) {
        return false;
    }
    const record = hooks;
    for (const [key, value] of Object.entries(record)) {
        if (HOOKS_CONFIG_FIELDS.includes(key)) {
            continue;
        }
        if (!Array.isArray(value)) {
            return false;
        }
    }
    return true;
}
function getValidHookDefinitions(hooksRecord, eventName) {
    const value = hooksRecord[eventName];
    if (!Array.isArray(value)) {
        return [];
    }
    const result = [];
    for (const def of value) {
        if (isValidHookDefinition(def)) {
            result.push(def);
        }
        else {
            debugLogger.warn(`Skipping invalid hook definition for ${eventName}:`, def);
        }
    }
    return result;
}
export function HooksManagementDialog({ onClose, }) {
    const config = useConfig();
    const { columns: width } = useTerminalSize();
    const boxWidth = width - 4;
    const disableAllHooks = config?.getDisableAllHooks() ?? false;
    const [navigationStack, setNavigationStack] = useState([
        disableAllHooks
            ? HOOKS_MANAGEMENT_STEPS.HOOKS_DISABLED
            : HOOKS_MANAGEMENT_STEPS.HOOKS_LIST,
    ]);
    const [selectedHookIndex, setSelectedHookIndex] = useState(-1);
    const [selectedMatcherIndex, setSelectedMatcherIndex] = useState(-1);
    const [selectedConfigIndex, setSelectedConfigIndex] = useState(-1);
    const [listSelectedIndex, setListSelectedIndex] = useState(0);
    const [detailSelectedIndex, setDetailSelectedIndex] = useState(0);
    const [matcherSelectedIndex, setMatcherSelectedIndex] = useState(0);
    const [hooks, setHooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const currentStep = navigationStack[navigationStack.length - 1] ||
        HOOKS_MANAGEMENT_STEPS.HOOKS_LIST;
    const selectedHook = useMemo(() => {
        if (selectedHookIndex >= 0 && selectedHookIndex < hooks.length) {
            return hooks[selectedHookIndex];
        }
        return null;
    }, [hooks, selectedHookIndex]);
    const selectedMatcher = useMemo(() => {
        if (selectedHook &&
            selectedMatcherIndex >= 0 &&
            selectedMatcherIndex < selectedHook.matcherGroups.length) {
            return selectedHook.matcherGroups[selectedMatcherIndex];
        }
        return null;
    }, [selectedHook, selectedMatcherIndex]);
    useKeypress((key) => {
        if (isLoading || loadError) {
            if (key.name === 'escape') {
                onClose();
            }
            return;
        }
        switch (currentStep) {
            case HOOKS_MANAGEMENT_STEPS.HOOKS_DISABLED:
                if (key.name === 'escape') {
                    onClose();
                }
                break;
            case HOOKS_MANAGEMENT_STEPS.HOOKS_LIST:
                if (keyMatchers[Command.SELECTION_UP](key)) {
                    setListSelectedIndex((prev) => Math.max(0, prev - 1));
                }
                else if (keyMatchers[Command.SELECTION_DOWN](key)) {
                    setListSelectedIndex((prev) => Math.min(hooks.length - 1, prev + 1));
                }
                else if (key.name === 'return') {
                    if (hooks.length > 0 && listSelectedIndex >= 0) {
                        setSelectedHookIndex(listSelectedIndex);
                        setSelectedMatcherIndex(-1);
                        setSelectedConfigIndex(-1);
                        setDetailSelectedIndex(0);
                        setMatcherSelectedIndex(0);
                        setNavigationStack((prev) => [
                            ...prev,
                            HOOKS_MANAGEMENT_STEPS.HOOK_DETAIL,
                        ]);
                    }
                }
                else if (key.name === 'escape') {
                    onClose();
                }
                break;
            case HOOKS_MANAGEMENT_STEPS.HOOK_DETAIL:
                if (key.name === 'escape') {
                    handleNavigateBack();
                }
                else if (selectedHook) {
                    const matcherMode = supportsMatchers(selectedHook.event);
                    if (matcherMode) {
                        if (selectedHook.matcherGroups.length === 0) {
                            break;
                        }
                        if (keyMatchers[Command.SELECTION_UP](key)) {
                            setDetailSelectedIndex((prev) => Math.max(0, prev - 1));
                        }
                        else if (keyMatchers[Command.SELECTION_DOWN](key)) {
                            setDetailSelectedIndex((prev) => Math.min(selectedHook.matcherGroups.length - 1, prev + 1));
                        }
                        else if (key.name === 'return') {
                            setSelectedMatcherIndex(detailSelectedIndex);
                            setMatcherSelectedIndex(0);
                            setSelectedConfigIndex(-1);
                            setNavigationStack((prev) => [
                                ...prev,
                                HOOKS_MANAGEMENT_STEPS.HOOK_MATCHER_DETAIL,
                            ]);
                        }
                    }
                    else {
                        const flatConfigs = getAllConfigs(selectedHook);
                        if (flatConfigs.length === 0) {
                            break;
                        }
                        if (keyMatchers[Command.SELECTION_UP](key)) {
                            setDetailSelectedIndex((prev) => Math.max(0, prev - 1));
                        }
                        else if (keyMatchers[Command.SELECTION_DOWN](key)) {
                            setDetailSelectedIndex((prev) => Math.min(flatConfigs.length - 1, prev + 1));
                        }
                        else if (key.name === 'return') {
                            setSelectedMatcherIndex(-1);
                            setSelectedConfigIndex(detailSelectedIndex);
                            setNavigationStack((prev) => [
                                ...prev,
                                HOOKS_MANAGEMENT_STEPS.HOOK_CONFIG_DETAIL,
                            ]);
                        }
                    }
                }
                break;
            case HOOKS_MANAGEMENT_STEPS.HOOK_MATCHER_DETAIL:
                if (key.name === 'escape') {
                    handleNavigateBack();
                }
                else if (selectedMatcher && selectedMatcher.configs.length > 0) {
                    if (keyMatchers[Command.SELECTION_UP](key)) {
                        setMatcherSelectedIndex((prev) => Math.max(0, prev - 1));
                    }
                    else if (keyMatchers[Command.SELECTION_DOWN](key)) {
                        setMatcherSelectedIndex((prev) => Math.min(selectedMatcher.configs.length - 1, prev + 1));
                    }
                    else if (key.name === 'return') {
                        setSelectedConfigIndex(matcherSelectedIndex);
                        setNavigationStack((prev) => [
                            ...prev,
                            HOOKS_MANAGEMENT_STEPS.HOOK_CONFIG_DETAIL,
                        ]);
                    }
                }
                break;
            case HOOKS_MANAGEMENT_STEPS.HOOK_CONFIG_DETAIL:
                if (key.name === 'escape') {
                    handleNavigateBack();
                }
                break;
            default:
                break;
        }
    }, { isActive: true });
    const fetchHooksData = useCallback(() => {
        if (!config)
            return [];
        const settings = loadSettings();
        const userSettings = settings.forScope(SettingScope.User).settings;
        const workspaceSettings = settings.forScope(SettingScope.Workspace).settings;
        const sourceDisplayMap = getTranslatedSourceDisplayMap();
        const result = [];
        for (const eventName of DISPLAY_HOOK_EVENTS) {
            const hookInfo = createEmptyHookEventInfo(eventName);
            const groupByMatcher = supportsMatchers(eventName);
            const userSettingsRecord = userSettings;
            const userHooksRaw = userSettingsRecord?.['hooks'];
            if (isValidHooksRecord(userHooksRaw)) {
                const userDefs = getValidHookDefinitions(userHooksRaw, eventName);
                for (const def of userDefs) {
                    for (const hookConfig of def.hooks) {
                        addConfigToMatcherGroup(hookInfo, def.matcher, def.sequential, {
                            config: hookConfig,
                            source: HooksConfigSource.User,
                            sourceDisplay: sourceDisplayMap[HooksConfigSource.User],
                            enabled: true,
                        }, groupByMatcher);
                    }
                }
            }
            const workspaceSettingsRecord = workspaceSettings;
            const workspaceHooksRaw = workspaceSettingsRecord?.['hooks'];
            if (isValidHooksRecord(workspaceHooksRaw)) {
                const workspaceDefs = getValidHookDefinitions(workspaceHooksRaw, eventName);
                for (const def of workspaceDefs) {
                    for (const hookConfig of def.hooks) {
                        addConfigToMatcherGroup(hookInfo, def.matcher, def.sequential, {
                            config: hookConfig,
                            source: HooksConfigSource.Project,
                            sourceDisplay: sourceDisplayMap[HooksConfigSource.Project],
                            enabled: true,
                        }, groupByMatcher);
                    }
                }
            }
            const extensions = config.getExtensions() || [];
            for (const extension of extensions) {
                if (extension.isActive && extension.hooks?.[eventName]) {
                    const extensionHooks = extension.hooks[eventName];
                    if (Array.isArray(extensionHooks)) {
                        for (const def of extensionHooks) {
                            if (isValidHookDefinition(def)) {
                                for (const hookConfig of def.hooks) {
                                    addConfigToMatcherGroup(hookInfo, def.matcher, def.sequential, {
                                        config: hookConfig,
                                        source: HooksConfigSource.Extensions,
                                        sourceDisplay: extension.displayName ?? extension.name,
                                        sourcePath: extension.path,
                                        enabled: true,
                                    }, groupByMatcher);
                                }
                            }
                        }
                    }
                }
            }
            const hookSystem = config.getHookSystem();
            if (hookSystem) {
                const sessionId = config.getSessionId();
                if (sessionId) {
                    const sessionHooksManager = hookSystem.getSessionHooksManager();
                    const allSessionHooks = sessionHooksManager.getAllSessionHooks(sessionId);
                    const eventSessionHooks = allSessionHooks.filter((hook) => hook.eventName === eventName);
                    for (const sessionHook of eventSessionHooks) {
                        addConfigToMatcherGroup(hookInfo, sessionHook.matcher, sessionHook.sequential, {
                            config: sessionHook.config,
                            source: HooksConfigSource.Session,
                            sourceDisplay: t('Session (temporary)'),
                            enabled: true,
                        }, groupByMatcher);
                    }
                }
            }
            result.push(hookInfo);
        }
        return result;
    }, [config]);
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setLoadError(null);
        try {
            debugLogger.debug('Fetching hooks data for dialog');
            const hooksData = fetchHooksData();
            debugLogger.debug('Hooks data fetched:', hooksData.length, 'events');
            if (!cancelled) {
                setHooks(hooksData);
            }
        }
        catch (error) {
            if (!cancelled) {
                debugLogger.error('Error loading hooks:', error);
                setLoadError(error instanceof Error ? error.message : 'Failed to load hooks');
            }
        }
        finally {
            if (!cancelled) {
                setIsLoading(false);
            }
        }
        return () => {
            cancelled = true;
        };
    }, [fetchHooksData]);
    const handleNavigateBack = useCallback(() => {
        setNavigationStack((prev) => {
            if (prev.length <= 1) {
                onClose();
                return prev;
            }
            return prev.slice(0, -1);
        });
    }, [onClose]);
    const selectedConfig = useMemo(() => {
        if (!selectedHook)
            return null;
        if (!supportsMatchers(selectedHook.event)) {
            const flatConfigs = getAllConfigs(selectedHook);
            if (selectedConfigIndex >= 0 &&
                selectedConfigIndex < flatConfigs.length) {
                return flatConfigs[selectedConfigIndex];
            }
            return null;
        }
        if (selectedMatcher &&
            selectedConfigIndex >= 0 &&
            selectedConfigIndex < selectedMatcher.configs.length) {
            return selectedMatcher.configs[selectedConfigIndex];
        }
        return null;
    }, [selectedHook, selectedMatcher, selectedConfigIndex]);
    const configuredHooksCount = useMemo(() => hooks.reduce((sum, hook) => sum + hook.matcherGroups.reduce((s, g) => s + g.configs.length, 0), 0), [hooks]);
    const renderContent = () => {
        if (currentStep === HOOKS_MANAGEMENT_STEPS.HOOKS_DISABLED) {
            return _jsx(HooksDisabledStep, { configuredHooksCount: configuredHooksCount });
        }
        if (isLoading) {
            return (_jsx(Box, { flexDirection: "column", paddingX: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Loading hooks...') }) }));
        }
        if (loadError) {
            return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [_jsx(Text, { color: theme.status.error, children: t('Error loading hooks:') }), _jsx(Text, { color: theme.text.secondary, children: loadError }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Press Escape to close') }) })] }));
        }
        switch (currentStep) {
            case HOOKS_MANAGEMENT_STEPS.HOOKS_LIST:
                return (_jsx(HooksListStep, { hooks: hooks, selectedIndex: listSelectedIndex }));
            case HOOKS_MANAGEMENT_STEPS.HOOK_DETAIL:
                if (selectedHook) {
                    return (_jsx(HookDetailStep, { hook: selectedHook, selectedIndex: detailSelectedIndex }));
                }
                return (_jsx(Box, { flexDirection: "column", paddingX: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('No hook selected') }) }));
            case HOOKS_MANAGEMENT_STEPS.HOOK_MATCHER_DETAIL:
                if (selectedHook && selectedMatcher) {
                    return (_jsx(HookMatcherDetailStep, { hookEvent: selectedHook, matcherGroup: selectedMatcher, selectedIndex: matcherSelectedIndex }));
                }
                return (_jsx(Box, { flexDirection: "column", paddingX: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('No matcher selected') }) }));
            case HOOKS_MANAGEMENT_STEPS.HOOK_CONFIG_DETAIL:
                if (selectedHook && selectedConfig) {
                    return (_jsx(HookConfigDetailStep, { hookEvent: selectedHook, hookConfig: selectedConfig }));
                }
                return (_jsx(Box, { flexDirection: "column", paddingX: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('No hook config selected') }) }));
            default:
                return null;
        }
    };
    return (_jsx(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.border.default, width: boxWidth, paddingX: 1, paddingY: 1, children: renderContent() }));
}
//# sourceMappingURL=HooksManagementDialog.js.map