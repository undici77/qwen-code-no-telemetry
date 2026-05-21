import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Text } from 'ink';
import { ExtensionListStep, ExtensionDetailStep, ActionSelectionStep, UninstallConfirmStep, ScopeSelectStep, } from './steps/index.js';
import { MANAGEMENT_STEPS } from './types.js';
import { theme } from '../../semantic-colors.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { useUIState } from '../../contexts/UIStateContext.js';
import { t } from '../../../i18n/index.js';
import { SettingScope, createDebugLogger } from '@qwen-code/qwen-code-core';
import { ExtensionUpdateState } from '../../state/extensions.js';
import { getErrorMessage } from '../../../utils/errors.js';
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
const debugLogger = createDebugLogger('EXTENSIONS_MANAGER_DIALOG');
export function ExtensionsManagerDialog({ onClose, config, }) {
    const { extensionsUpdateState } = useUIState();
    const [extensions, setExtensions] = useState([]);
    const [selectedExtensionIndex, setSelectedExtensionIndex] = useState(-1);
    const [navigationStack, setNavigationStack] = useState([
        MANAGEMENT_STEPS.EXTENSION_LIST,
    ]);
    const [updateInProgress, setUpdateInProgress] = useState(false);
    const [updateError, setUpdateError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const { columns } = useTerminalSize();
    const boxWidth = columns - 4;
    // Load extensions
    const loadExtensions = useCallback(async () => {
        if (!config)
            return;
        const extensionManager = config.getExtensionManager();
        if (!extensionManager) {
            debugLogger.error('ExtensionManager not available');
            return;
        }
        try {
            await extensionManager.refreshCache();
            const loadedExtensions = extensionManager.getLoadedExtensions();
            setExtensions(loadedExtensions);
        }
        catch (error) {
            debugLogger.error('Failed to load extensions:', error);
        }
    }, [config]);
    // Initial load
    useEffect(() => {
        loadExtensions();
    }, [loadExtensions]);
    // Memoized selected extension
    const selectedExtension = useMemo(() => selectedExtensionIndex >= 0 ? extensions[selectedExtensionIndex] : null, [extensions, selectedExtensionIndex]);
    // Check if update is available for selected extension
    const hasUpdateAvailable = useMemo(() => {
        if (!selectedExtension)
            return false;
        const state = extensionsUpdateState.get(selectedExtension.name);
        return state === ExtensionUpdateState.UPDATE_AVAILABLE;
    }, [selectedExtension, extensionsUpdateState]);
    // Helper to get current step
    const getCurrentStep = useCallback(() => navigationStack[navigationStack.length - 1] ||
        MANAGEMENT_STEPS.EXTENSION_LIST, [navigationStack]);
    const handleSelectExtension = useCallback((extensionIndex) => {
        setSelectedExtensionIndex(extensionIndex);
        setSuccessMessage(null); // Clear success message when navigating
        setErrorMessage(null); // Clear error message when navigating
        setNavigationStack((prev) => [...prev, MANAGEMENT_STEPS.ACTION_SELECTION]);
    }, []);
    const handleNavigateToStep = useCallback((step) => {
        setNavigationStack((prev) => [...prev, step]);
    }, []);
    const handleNavigateBack = useCallback(() => {
        setNavigationStack((prev) => {
            if (prev.length <= 1) {
                return prev;
            }
            return prev.slice(0, -1);
        });
        // Clear messages when navigating back
        setErrorMessage(null);
    }, []);
    const handleUpdateExtension = useCallback(async () => {
        if (!config || !selectedExtension)
            return;
        setUpdateInProgress(true);
        setUpdateError(null);
        try {
            const extensionManager = config.getExtensionManager();
            if (!extensionManager) {
                throw new Error('ExtensionManager not available');
            }
            const state = extensionsUpdateState.get(selectedExtension.name);
            if (state !== ExtensionUpdateState.UPDATE_AVAILABLE) {
                throw new Error('No update available');
            }
            // Use the extension manager to update
            await extensionManager.updateExtension(selectedExtension, ExtensionUpdateState.UPDATE_AVAILABLE, (name, newState) => {
                debugLogger.debug(`Update state for ${name}:`, newState);
            });
            // Reload extensions after update to get new version info
            await loadExtensions();
            // Trigger a re-check of update status for all extensions
            await extensionManager.checkForAllExtensionUpdates((name, newState) => {
                debugLogger.debug(`Recheck update state for ${name}:`, newState);
            });
            // Show success message
            setSuccessMessage(t('Extension "{{name}}" updated successfully.', {
                name: selectedExtension.name,
            }));
            // Go back to action selection
            handleNavigateBack();
        }
        catch (error) {
            debugLogger.error('Failed to update extension:', error);
            setUpdateError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
        finally {
            setUpdateInProgress(false);
        }
    }, [
        config,
        selectedExtension,
        extensionsUpdateState,
        loadExtensions,
        handleNavigateBack,
    ]);
    const handleActionSelect = useCallback((action) => {
        switch (action) {
            case 'view':
                handleNavigateToStep(MANAGEMENT_STEPS.EXTENSION_DETAIL);
                break;
            case 'update':
                handleNavigateToStep(MANAGEMENT_STEPS.UPDATE_PROGRESS);
                handleUpdateExtension();
                break;
            case 'disable':
                handleNavigateToStep(MANAGEMENT_STEPS.DISABLE_SCOPE_SELECT);
                break;
            case 'enable':
                handleNavigateToStep(MANAGEMENT_STEPS.ENABLE_SCOPE_SELECT);
                break;
            case 'uninstall':
                handleNavigateToStep(MANAGEMENT_STEPS.UNINSTALL_CONFIRMATION);
                break;
            default:
                break;
        }
    }, [handleNavigateToStep, handleUpdateExtension]);
    // Unified handler for toggling extension state (enable/disable)
    const handleToggleExtensionState = useCallback(async (scope, newState) => {
        if (!config || !selectedExtension)
            return;
        try {
            const extensionManager = config.getExtensionManager();
            if (!extensionManager) {
                throw new Error('ExtensionManager not available');
            }
            const settingScope = scope === 'user' ? SettingScope.User : SettingScope.Workspace;
            if (newState) {
                await extensionManager.enableExtension(selectedExtension.name, settingScope);
            }
            else {
                await extensionManager.disableExtension(selectedExtension.name, settingScope);
            }
            // Update local state
            setExtensions((prev) => prev.map((ext) => ext.name === selectedExtension.name
                ? { ...ext, isActive: newState }
                : ext));
            // Show success message
            const actionKey = newState ? 'enabled' : 'disabled';
            setSuccessMessage(t(`Extension "{{name}}" ${actionKey} successfully.`, {
                name: selectedExtension.name,
            }));
            setErrorMessage(null);
            // Go back to extension list to show success message
            setNavigationStack([MANAGEMENT_STEPS.EXTENSION_LIST]);
        }
        catch (error) {
            debugLogger.error(`Failed to ${newState ? 'enable' : 'disable'} extension:`, error);
            setErrorMessage(t('Failed to {{action}} extension "{{name}}": {{error}}', {
                action: newState ? 'enable' : 'disable',
                name: selectedExtension.name,
                error: getErrorMessage(error),
            }));
            setSuccessMessage(null);
        }
    }, [config, selectedExtension]);
    const handleDisableExtension = useCallback(async (scope) => {
        await handleToggleExtensionState(scope, false);
    }, [handleToggleExtensionState]);
    const handleEnableExtension = useCallback(async (scope) => {
        await handleToggleExtensionState(scope, true);
    }, [handleToggleExtensionState]);
    const handleUninstallExtension = useCallback(async (extension) => {
        if (!config)
            return;
        try {
            const extensionManager = config.getExtensionManager();
            if (!extensionManager) {
                throw new Error('ExtensionManager not available');
            }
            await extensionManager.uninstallExtension(extension.name, false);
            // Reload extensions
            await loadExtensions();
            // Navigate back to extension list
            setNavigationStack([MANAGEMENT_STEPS.EXTENSION_LIST]);
            setSelectedExtensionIndex(-1);
        }
        catch (error) {
            debugLogger.error('Failed to uninstall extension:', error);
            throw error;
        }
    }, [config, loadExtensions]);
    // Centralized ESC key handling
    useKeypress((key) => {
        if (key.name !== 'escape') {
            return;
        }
        const currentStep = getCurrentStep();
        // If there's a success message, clear it first instead of closing
        if (successMessage && currentStep === MANAGEMENT_STEPS.EXTENSION_LIST) {
            setSuccessMessage(null);
            return;
        }
        if (currentStep === MANAGEMENT_STEPS.EXTENSION_LIST) {
            onClose();
        }
        else {
            handleNavigateBack();
        }
    }, { isActive: true });
    const renderStepHeader = useCallback(() => {
        const currentStep = getCurrentStep();
        const getStepHeaderText = () => {
            switch (currentStep) {
                case MANAGEMENT_STEPS.EXTENSION_LIST:
                    return t('Manage Extensions');
                case MANAGEMENT_STEPS.ACTION_SELECTION:
                    return selectedExtension?.name || t('Choose Action');
                case MANAGEMENT_STEPS.EXTENSION_DETAIL:
                    return t('Extension Details');
                case MANAGEMENT_STEPS.DISABLE_SCOPE_SELECT:
                    return t('Disable Extension');
                case MANAGEMENT_STEPS.ENABLE_SCOPE_SELECT:
                    return t('Enable Extension');
                case MANAGEMENT_STEPS.UNINSTALL_CONFIRMATION:
                    return t('Uninstall Extension');
                case MANAGEMENT_STEPS.UPDATE_PROGRESS:
                    return t('Update Extension');
                default:
                    return t('Unknown Step');
            }
        };
        return (_jsx(Box, { children: _jsx(Text, { color: theme.text.accent, bold: true, children: getStepHeaderText() }) }));
    }, [getCurrentStep, selectedExtension]);
    const renderStepFooter = useCallback(() => {
        const currentStep = getCurrentStep();
        const getNavigationInstructions = () => {
            if (currentStep === MANAGEMENT_STEPS.EXTENSION_LIST) {
                if (extensions.length === 0 || successMessage) {
                    return t('Esc to close');
                }
                return t('↑↓ to navigate · Enter to select · Esc to close');
            }
            if (currentStep === MANAGEMENT_STEPS.EXTENSION_DETAIL) {
                return t('Esc to go back');
            }
            if (currentStep === MANAGEMENT_STEPS.UNINSTALL_CONFIRMATION) {
                return t('Y/Enter to confirm · N/Esc to cancel');
            }
            if (currentStep === MANAGEMENT_STEPS.UPDATE_PROGRESS) {
                return updateInProgress ? t('Updating...') : '';
            }
            return t('↑↓ to navigate · Enter to select · Esc to go back');
        };
        return (_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: getNavigationInstructions() }) }));
    }, [getCurrentStep, extensions.length, updateInProgress, successMessage]);
    const renderStepContent = useCallback(() => {
        const currentStep = getCurrentStep();
        // Show error message if present (only on extension list step)
        if (errorMessage && currentStep === MANAGEMENT_STEPS.EXTENSION_LIST) {
            return (_jsx(Box, { flexDirection: "column", gap: 1, children: _jsx(Text, { color: theme.status.error, children: errorMessage }) }));
        }
        // Show success message if present (only on extension list step)
        if (successMessage && currentStep === MANAGEMENT_STEPS.EXTENSION_LIST) {
            return (_jsx(Box, { flexDirection: "column", gap: 1, children: _jsx(Text, { color: theme.status.success, children: successMessage }) }));
        }
        if (updateError && currentStep === MANAGEMENT_STEPS.UPDATE_PROGRESS) {
            return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { color: theme.status.error, children: t('Update failed:') }), _jsx(Text, { children: updateError })] }));
        }
        switch (currentStep) {
            case MANAGEMENT_STEPS.EXTENSION_LIST:
                return (_jsx(ExtensionListStep, { extensions: extensions, extensionsUpdateState: extensionsUpdateState, onExtensionSelect: handleSelectExtension }));
            case MANAGEMENT_STEPS.ACTION_SELECTION:
                return (_jsx(ActionSelectionStep, { selectedExtension: selectedExtension, hasUpdateAvailable: hasUpdateAvailable, onNavigateToStep: handleNavigateToStep, onActionSelect: handleActionSelect }));
            case MANAGEMENT_STEPS.EXTENSION_DETAIL:
                return _jsx(ExtensionDetailStep, { selectedExtension: selectedExtension });
            case MANAGEMENT_STEPS.DISABLE_SCOPE_SELECT:
                return (_jsx(ScopeSelectStep, { selectedExtension: selectedExtension, mode: "disable", onScopeSelect: handleDisableExtension }));
            case MANAGEMENT_STEPS.ENABLE_SCOPE_SELECT:
                return (_jsx(ScopeSelectStep, { selectedExtension: selectedExtension, mode: "enable", onScopeSelect: handleEnableExtension }));
            case MANAGEMENT_STEPS.UNINSTALL_CONFIRMATION:
                return (_jsx(UninstallConfirmStep, { selectedExtension: selectedExtension, onConfirm: handleUninstallExtension, onNavigateBack: handleNavigateBack }));
            case MANAGEMENT_STEPS.UPDATE_PROGRESS:
                return (_jsx(Box, { flexDirection: "column", gap: 1, children: _jsx(Text, { children: updateInProgress
                            ? t('Updating {{name}}...', {
                                name: selectedExtension?.name || '',
                            })
                            : t('Update complete!') }) }));
            default:
                return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('Invalid step: {{step}}', { step: currentStep }) }) }));
        }
    }, [
        getCurrentStep,
        extensions,
        extensionsUpdateState,
        selectedExtension,
        hasUpdateAvailable,
        updateInProgress,
        updateError,
        successMessage,
        errorMessage,
        handleSelectExtension,
        handleNavigateToStep,
        handleNavigateBack,
        handleActionSelect,
        handleDisableExtension,
        handleEnableExtension,
        handleUninstallExtension,
    ]);
    return (_jsx(Box, { flexDirection: "column", width: boxWidth, children: _jsxs(Box, { borderStyle: "single", borderColor: theme.border.default, flexDirection: "column", paddingLeft: 1, paddingRight: 1, width: boxWidth, gap: 1, children: [renderStepHeader(), renderStepContent(), renderStepFooter()] }) }));
}
//# sourceMappingURL=ExtensionsManagerDialog.js.map