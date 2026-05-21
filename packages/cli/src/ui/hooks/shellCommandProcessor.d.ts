/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HistoryItemWithoutId } from '../types.js';
import type { Config, GeminiClient } from '@qwen-code/qwen-code-core';
import { type PartListUnion } from '@google/genai';
import type { UseHistoryManagerReturn } from './useHistoryManager.js';
export declare const OUTPUT_UPDATE_INTERVAL_MS = 1000;
/**
 * Hook to process shell commands.
 * Orchestrates command execution and updates history and agent context.
 */
export declare const useShellCommandProcessor: (addItemToHistory: UseHistoryManagerReturn["addItem"], setPendingHistoryItem: React.Dispatch<React.SetStateAction<HistoryItemWithoutId | null>>, onExec: (command: Promise<void>) => void, onDebugMessage: (message: string) => void, config: Config, geminiClient: GeminiClient, setShellInputFocused: (value: boolean) => void, terminalWidth?: number, terminalHeight?: number) => {
    handleShellCommand: (rawQuery: PartListUnion, abortSignal: AbortSignal) => boolean;
    activeShellPtyId: number | null;
};
