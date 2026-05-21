/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
export const useMemoryDialog = () => {
    const [isMemoryDialogOpen, setIsMemoryDialogOpen] = useState(false);
    const openMemoryDialog = useCallback(() => {
        setIsMemoryDialogOpen(true);
    }, []);
    const closeMemoryDialog = useCallback(() => {
        setIsMemoryDialogOpen(false);
    }, []);
    return {
        isMemoryDialogOpen,
        openMemoryDialog,
        closeMemoryDialog,
    };
};
//# sourceMappingURL=useMemoryDialog.js.map