/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
export const useModelCommand = () => {
    const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
    const [isFastModelMode, setIsFastModelMode] = useState(false);
    const openModelDialog = useCallback((options) => {
        setIsFastModelMode(options?.fastModelMode ?? false);
        setIsModelDialogOpen(true);
    }, []);
    const closeModelDialog = useCallback(() => {
        setIsModelDialogOpen(false);
        setIsFastModelMode(false);
    }, []);
    return {
        isModelDialogOpen,
        isFastModelMode,
        openModelDialog,
        closeModelDialog,
    };
};
//# sourceMappingURL=useModelCommand.js.map