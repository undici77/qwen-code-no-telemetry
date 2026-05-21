/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export interface UseMcpDialogReturn {
    isMcpDialogOpen: boolean;
    openMcpDialog: () => void;
    closeMcpDialog: () => void;
}
export declare const useMcpDialog: () => UseMcpDialogReturn;
