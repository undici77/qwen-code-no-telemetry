/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  Suggestion,
  SuggestionCategory,
} from '../components/SuggestionsDisplay.js';
import type { CommandContext, SlashCommand } from '../commands/types.js';
import type { TextBuffer } from '../components/shared/text-buffer.js';
import { type RecentSlashCommands } from './useSlashCompletion.js';
import type { Config } from '@qwen-code/qwen-code-core';
export declare enum CompletionMode {
  IDLE = 'IDLE',
  AT = 'AT',
  SLASH = 'SLASH',
}
export interface UseCommandCompletionReturn {
  suggestions: Suggestion[];
  activeSuggestionIndex: number;
  visibleStartIndex: number;
  showSuggestions: boolean;
  isLoadingSuggestions: boolean;
  isPerfectMatch: boolean;
  setActiveSuggestionIndex: React.Dispatch<React.SetStateAction<number>>;
  setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  resetCompletionState: () => void;
  dismissCompletion: () => void;
  navigateUp: () => void;
  navigateDown: () => void;
  handleAutocomplete: (indexToUse: number) => void;
  completionMode: CompletionMode;
  /** Inline ghost text for mid-input slash commands (not at line start). */
  midInputGhostText: {
    text: string;
    insertPosition: number;
    acceptText?: string;
    showCursorBeforeText?: boolean;
  } | null;
  /** Active category tab for the `@` completion UI ('all' shows everything). */
  activeCategory: SuggestionCategory | 'all';
  /** Tabs available for the current suggestion set (always includes 'all'). */
  availableCategories: Array<SuggestionCategory | 'all'>;
  /** Cycle the active category tab; resets active/scroll index. */
  switchCategory: (direction: 1 | -1) => void;
}
export declare function useCommandCompletion(
  buffer: TextBuffer,
  cwd: string,
  slashCommands: readonly SlashCommand[],
  commandContext: CommandContext,
  reverseSearchActive?: boolean,
  config?: Config,
  active?: boolean,
  recentCommands?: RecentSlashCommands,
): UseCommandCompletionReturn;
