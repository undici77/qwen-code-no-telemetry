/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
export const useMcpDialog = () => {
    const [isMcpDialogOpen, setIsMcpDialogOpen] = useState(false);
    const openMcpDialog = useCallback(() => {
        setIsMcpDialogOpen(true);
    }, []);
    const closeMcpDialog = useCallback(() => {
        setIsMcpDialogOpen(false);
    }, []);
    return {
        isMcpDialogOpen,
        openMcpDialog,
        closeMcpDialog,
    };
};
//# sourceMappingURL=useMcpDialog.js.map