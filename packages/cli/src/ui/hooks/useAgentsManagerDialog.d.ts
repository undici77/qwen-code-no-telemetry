/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export interface UseAgentsManagerDialogReturn {
    isAgentsManagerDialogOpen: boolean;
    openAgentsManagerDialog: () => void;
    closeAgentsManagerDialog: () => void;
}
export declare const useAgentsManagerDialog: () => UseAgentsManagerDialogReturn;
