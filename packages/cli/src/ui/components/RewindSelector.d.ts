/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HistoryItem } from '../types.js';
import type { FileHistoryService } from '@qwen-code/qwen-code-core';
export type RestoreOption = 'both' | 'conversation' | 'code' | 'cancel';
export interface RewindSelectorProps {
    history: HistoryItem[];
    onRewind: (userItem: HistoryItem, option: RestoreOption) => void;
    onCancel: () => void;
    fileCheckpointingEnabled: boolean;
    fileHistoryService: FileHistoryService;
}
/**
 * Multi-phase rewind selector:
 * 1. Pick list — choose which user turn to rewind to
 * 2. Restore options — choose what to restore (when file checkpointing enabled)
 * 3. Confirm — Y/N confirm (when file checkpointing disabled, legacy fallback)
 */
export declare function RewindSelector({ history, onRewind, onCancel, fileCheckpointingEnabled, fileHistoryService, }: RewindSelectorProps): import("react/jsx-runtime").JSX.Element;
