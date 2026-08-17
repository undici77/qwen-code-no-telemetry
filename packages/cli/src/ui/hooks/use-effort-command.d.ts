/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, ReasoningEffort } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../../config/settings.js';
import { type HistoryItemWithoutId } from '../types.js';
interface UseEffortCommandReturn {
  isEffortDialogOpen: boolean;
  openEffortDialog: () => void;
  handleEffortSelect: (effort: ReasoningEffort | undefined) => void;
}
export declare const useEffortCommand: (
  loadedSettings: LoadedSettings,
  config: Config,
  addItem?: (item: HistoryItemWithoutId, baseTimestamp: number) => void,
) => UseEffortCommandReturn;
export {};
