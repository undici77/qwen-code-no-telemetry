/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
export const useAgentsManagerDialog = () => {
    const [isAgentsManagerDialogOpen, setIsAgentsManagerDialogOpen] = useState(false);
    const openAgentsManagerDialog = useCallback(() => {
        setIsAgentsManagerDialogOpen(true);
    }, []);
    const closeAgentsManagerDialog = useCallback(() => {
        setIsAgentsManagerDialogOpen(false);
    }, []);
    return {
        isAgentsManagerDialogOpen,
        openAgentsManagerDialog,
        closeAgentsManagerDialog,
    };
};
//# sourceMappingURL=useAgentsManagerDialog.js.map