/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type ArenaDialogType = 'start' | 'select' | 'stop' | 'status' | null;
interface UseArenaCommandReturn {
    activeArenaDialog: ArenaDialogType;
    openArenaDialog: (type: Exclude<ArenaDialogType, null>) => void;
    closeArenaDialog: () => void;
}
export declare function useArenaCommand(): UseArenaCommandReturn;
export {};
