/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { getErrorMessage } from '../../utils/errors.js';
import { ExtensionUpdateState, extensionUpdatesReducer, initialExtensionUpdatesState, } from '../state/extensions.js';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { MessageType, } from '../types.js';
import { checkExhaustive } from '../../utils/checks.js';
function confirmationRequestsReducer(state, action) {
    switch (action.type) {
        case 'add':
            return [...state, action.request];
        case 'remove':
            return state.filter((r) => r !== action.request);
        default:
            checkExhaustive(action);
            return state;
    }
}
export const useConfirmUpdateRequests = () => {
    const [confirmUpdateExtensionRequests, dispatchConfirmUpdateExtensionRequests,] = useReducer(confirmationRequestsReducer, []);
    const addConfirmUpdateExtensionRequest = useCallback((original) => {
        const wrappedRequest = {
            prompt: original.prompt,
            onConfirm: (confirmed) => {
                // Remove it from the outstanding list of requests by identity.
                dispatchConfirmUpdateExtensionRequests({
                    type: 'remove',
                    request: wrappedRequest,
                });
                original.onConfirm(confirmed);
            },
        };
        dispatchConfirmUpdateExtensionRequests({
            type: 'add',
            request: wrappedRequest,
        });
    }, [dispatchConfirmUpdateExtensionRequests]);
    return {
        addConfirmUpdateExtensionRequest,
        confirmUpdateExtensionRequests,
        dispatchConfirmUpdateExtensionRequests,
    };
};
function settingInputRequestsReducer(state, action) {
    switch (action.type) {
        case 'add':
            return [...state, action.request];
        case 'remove':
            return state.filter((r) => r !== action.request);
        default:
            checkExhaustive(action);
            return state;
    }
}
export const useSettingInputRequests = () => {
    const [settingInputRequests, dispatchSettingInputRequests] = useReducer(settingInputRequestsReducer, []);
    const addSettingInputRequest = useCallback((original) => {
        const wrappedRequest = {
            settingName: original.settingName,
            settingDescription: original.settingDescription,
            sensitive: original.sensitive,
            onSubmit: (value) => {
                // Remove it from the outstanding list of requests by identity.
                dispatchSettingInputRequests({
                    type: 'remove',
                    request: wrappedRequest,
                });
                original.onSubmit(value);
            },
            onCancel: () => {
                dispatchSettingInputRequests({
                    type: 'remove',
                    request: wrappedRequest,
                });
                original.onCancel();
            },
        };
        dispatchSettingInputRequests({
            type: 'add',
            request: wrappedRequest,
        });
    }, [dispatchSettingInputRequests]);
    return {
        addSettingInputRequest,
        settingInputRequests,
        dispatchSettingInputRequests,
    };
};
function pluginChoiceRequestsReducer(state, action) {
    switch (action.type) {
        case 'add':
            return [...state, action.request];
        case 'remove':
            return state.filter((r) => r !== action.request);
        default:
            checkExhaustive(action);
            return state;
    }
}
export const usePluginChoiceRequests = () => {
    const [pluginChoiceRequests, dispatchPluginChoiceRequests] = useReducer(pluginChoiceRequestsReducer, []);
    const addPluginChoiceRequest = useCallback((original) => {
        const wrappedRequest = {
            marketplaceName: original.marketplaceName,
            plugins: original.plugins,
            onSelect: (pluginName) => {
                dispatchPluginChoiceRequests({
                    type: 'remove',
                    request: wrappedRequest,
                });
                original.onSelect(pluginName);
            },
            onCancel: () => {
                dispatchPluginChoiceRequests({
                    type: 'remove',
                    request: wrappedRequest,
                });
                original.onCancel();
            },
        };
        dispatchPluginChoiceRequests({
            type: 'add',
            request: wrappedRequest,
        });
    }, [dispatchPluginChoiceRequests]);
    return {
        addPluginChoiceRequest,
        pluginChoiceRequests,
        dispatchPluginChoiceRequests,
    };
};
export const useExtensionUpdates = (extensionManager, addItem, cwd) => {
    const [extensionsUpdateState, dispatchExtensionStateUpdate] = useReducer(extensionUpdatesReducer, initialExtensionUpdatesState);
    const extensions = extensionManager.getLoadedExtensions();
    useEffect(() => {
        (async () => {
            const extensionsToCheck = extensions.filter((extension) => {
                const currentStatus = extensionsUpdateState.extensionStatuses.get(extension.name);
                if (!currentStatus)
                    return true;
                const currentState = currentStatus.status;
                return !currentState || currentState === ExtensionUpdateState.UNKNOWN;
            });
            if (extensionsToCheck.length === 0)
                return;
            dispatchExtensionStateUpdate({ type: 'BATCH_CHECK_START' });
            await extensionManager.checkForAllExtensionUpdates((extensionName, state) => {
                dispatchExtensionStateUpdate({
                    type: 'SET_STATE',
                    payload: { name: extensionName, state },
                });
            });
            dispatchExtensionStateUpdate({ type: 'BATCH_CHECK_END' });
        })();
    }, [
        extensions,
        extensionManager,
        extensionsUpdateState.extensionStatuses,
        dispatchExtensionStateUpdate,
    ]);
    useEffect(() => {
        if (extensionsUpdateState.batchChecksInProgress > 0) {
            return;
        }
        let extensionsWithUpdatesCount = 0;
        for (const extension of extensions) {
            const currentState = extensionsUpdateState.extensionStatuses.get(extension.name);
            if (!currentState ||
                currentState.processed ||
                currentState.status !== ExtensionUpdateState.UPDATE_AVAILABLE) {
                continue;
            }
            // Mark as processed immediately to avoid re-triggering.
            dispatchExtensionStateUpdate({
                type: 'SET_PROCESSED',
                payload: { name: extension.name, processed: true },
            });
            if (extension.installMetadata?.autoUpdate) {
                extensionManager
                    .updateExtension(extension, currentState.status, (extensionName, state) => {
                    dispatchExtensionStateUpdate({
                        type: 'SET_STATE',
                        payload: { name: extensionName, state },
                    });
                })
                    .then((result) => {
                    if (!result)
                        return;
                    addItem({
                        type: MessageType.INFO,
                        text: `Extension "${extension.name}" successfully updated: ${result.originalVersion} → ${result.updatedVersion}.`,
                    }, Date.now());
                })
                    .catch((error) => {
                    addItem({
                        type: MessageType.ERROR,
                        text: getErrorMessage(error),
                    }, Date.now());
                });
            }
            else {
                extensionsWithUpdatesCount++;
            }
        }
        if (extensionsWithUpdatesCount > 0) {
            const s = extensionsWithUpdatesCount > 1 ? 's' : '';
            addItem({
                type: MessageType.INFO,
                text: `You have ${extensionsWithUpdatesCount} extension${s} with an update available, run "/extensions list" for more information.`,
            }, Date.now());
        }
    }, [extensions, extensionManager, extensionsUpdateState, addItem, cwd]);
    const extensionsUpdateStateComputed = useMemo(() => {
        const result = new Map();
        for (const [key, value,] of extensionsUpdateState.extensionStatuses.entries()) {
            result.set(key, value.status);
        }
        return result;
    }, [extensionsUpdateState]);
    return {
        extensionsUpdateState: extensionsUpdateStateComputed,
        extensionsUpdateStateInternal: extensionsUpdateState.extensionStatuses,
        dispatchExtensionStateUpdate,
    };
};
//# sourceMappingURL=useExtensionUpdates.js.map