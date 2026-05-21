/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SlashCommand } from '../ui/commands/types.js';
export type CommandSourceGroup = {
    key: 'built-in' | 'bundled-skill' | 'custom' | 'plugin' | 'mcp' | 'other';
    title: string;
    order: number;
};
export declare function getCommandSourceBadge(command: Pick<SlashCommand, 'source' | 'sourceDetail'>): string | null;
export declare function getCommandSourceGroup(command: Pick<SlashCommand, 'source'>): CommandSourceGroup;
export declare function formatSupportedModes(command: SlashCommand): string;
export declare function getCommandDisplayName(command: Pick<SlashCommand, 'name' | 'altNames'>, options?: {
    prefix?: string;
    matchedAlias?: string;
    includeAliases?: boolean;
}): string;
export declare function getCommandSubcommandNames(command: SlashCommand): string[];
export declare function formatCommandSourceLabel(command: Pick<SlashCommand, 'source' | 'sourceLabel'>): string;
