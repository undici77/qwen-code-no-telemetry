/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Suggestion } from '../components/SuggestionsDisplay.js';
import { type CommandContext, type SlashCommand } from '../commands/types.js';
export type RecentSlashCommand = {
    name: string;
    usedAt: number;
    count: number;
};
export type RecentSlashCommands = ReadonlyMap<string, RecentSlashCommand>;
export interface UseSlashCompletionProps {
    enabled: boolean;
    query: string | null;
    slashCommands: readonly SlashCommand[];
    commandContext: CommandContext;
    recentCommands?: RecentSlashCommands;
    setSuggestions: (suggestions: Suggestion[]) => void;
    setIsLoadingSuggestions: (isLoading: boolean) => void;
    setIsPerfectMatch: (isMatch: boolean) => void;
}
export declare function useSlashCompletion(props: UseSlashCompletionProps): {
    completionStart: number;
    completionEnd: number;
};
