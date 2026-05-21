/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
interface UseModelCommandReturn {
    isModelDialogOpen: boolean;
    isFastModelMode: boolean;
    openModelDialog: (options?: {
        fastModelMode?: boolean;
    }) => void;
    closeModelDialog: () => void;
}
export declare const useModelCommand: () => UseModelCommandReturn;
export {};
