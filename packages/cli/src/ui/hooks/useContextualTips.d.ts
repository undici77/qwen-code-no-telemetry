/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import { StreamingState, type HistoryItemWithoutId } from '../types.js';
import { type TipHistory } from '../../services/tips/index.js';
interface UseContextualTipsOptions {
    streamingState: StreamingState;
    lastPromptTokenCount: number;
    sessionPromptCount: number;
    config: Config;
    tipHistory: TipHistory | null;
    addItem: (item: HistoryItemWithoutId, timestamp: number) => void;
    hideTips: boolean;
}
export declare function useContextualTips({ streamingState, lastPromptTokenCount, sessionPromptCount, config, tipHistory, addItem, hideTips, }: UseContextualTipsOptions): void;
export {};
