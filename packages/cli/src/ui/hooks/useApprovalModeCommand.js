/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
export const useApprovalModeCommand = (loadedSettings, config) => {
    const [isApprovalModeDialogOpen, setIsApprovalModeDialogOpen] = useState(false);
    const openApprovalModeDialog = useCallback(() => {
        setIsApprovalModeDialogOpen(true);
    }, []);
    const handleApprovalModeSelect = useCallback((mode, scope) => {
        try {
            if (!mode) {
                // User cancelled the dialog
                setIsApprovalModeDialogOpen(false);
                return;
            }
            // Set the mode in the current session and persist to settings
            loadedSettings.setValue(scope, 'tools.approvalMode', mode);
            config.setApprovalMode(loadedSettings.merged.tools?.approvalMode ?? mode);
        }
        finally {
            setIsApprovalModeDialogOpen(false);
        }
    }, [config, loadedSettings]);
    return {
        isApprovalModeDialogOpen,
        openApprovalModeDialog,
        handleApprovalModeSelect,
    };
};
//# sourceMappingURL=useApprovalModeCommand.js.map