/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
export const useSkillsManagerDialog = () => {
    const [isSkillsManagerDialogOpen, setIsSkillsManagerDialogOpen] = useState(false);
    const openSkillsManagerDialog = useCallback(() => {
        setIsSkillsManagerDialogOpen(true);
    }, []);
    const closeSkillsManagerDialog = useCallback(() => {
        setIsSkillsManagerDialogOpen(false);
    }, []);
    return {
        isSkillsManagerDialogOpen,
        openSkillsManagerDialog,
        closeSkillsManagerDialog,
    };
};
//# sourceMappingURL=useSkillsManagerDialog.js.map