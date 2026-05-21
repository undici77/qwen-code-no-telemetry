/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export interface UseMemoryDialogReturn {
    isMemoryDialogOpen: boolean;
    openMemoryDialog: () => void;
    closeMemoryDialog: () => void;
}
export declare const useMemoryDialog: () => UseMemoryDialogReturn;
