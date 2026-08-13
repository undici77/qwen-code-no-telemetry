/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
import { applyReasoningEffort } from '@qwen-code/qwen-code-core';
import { getPersistScopeForModelSelection } from '../../config/modelProvidersScope.js';
import { MessageType } from '../types.js';
import { formatEffortChangeMessage } from '../commands/effort-utils.js';
export const useEffortCommand = (loadedSettings, config, addItem) => {
    const [isEffortDialogOpen, setIsEffortDialogOpen] = useState(false);
    const openEffortDialog = useCallback(() => {
        setIsEffortDialogOpen(true);
    }, []);
    const handleEffortSelect = useCallback((effort) => {
        try {
            if (!effort) {
                // User cancelled the dialog — leave the current effort unchanged.
                return;
            }
            // Apply at runtime (next turn) and persist for future sessions; provider
            // adapters clamp the tier to what the active model supports.
            applyReasoningEffort(config, effort);
            loadedSettings.setValue(getPersistScopeForModelSelection(loadedSettings), 'model.reasoningEffort', effort);
            // Report the outcome in-chat instead of silently closing (the status
            // line is the only other signal). The setter no-ops when thinking is
            // explicitly disabled (`reasoning: false`): the tier is still persisted
            // for future sessions, but say it won't take effect until thinking is
            // re-enabled.
            if (addItem) {
                const feedbackItem = {
                    type: MessageType.INFO,
                    text: formatEffortChangeMessage(config, effort),
                };
                addItem(feedbackItem, Date.now());
                config.getChatRecordingService?.()?.recordSlashCommand({
                    phase: 'result',
                    rawCommand: '/effort',
                    outputHistoryItems: [feedbackItem],
                });
            }
        }
        finally {
            setIsEffortDialogOpen(false);
        }
    }, [config, loadedSettings, addItem]);
    return {
        isEffortDialogOpen,
        openEffortDialog,
        handleEffortSelect,
    };
};
//# sourceMappingURL=use-effort-command.js.map