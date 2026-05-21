/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type SlashCommand } from '../ui/commands/types.js';
export type ParsedSlashCommand = {
    commandToExecute: SlashCommand | undefined;
    args: string;
    canonicalPath: string[];
};
/**
 * Parses a raw slash command string into its command, arguments, and canonical path.
 * If no valid command is found, the `commandToExecute` property will be `undefined`.
 *
 * @param query The raw input string, e.g., "/config set theme dark" or "/help".
 * @param commands The list of available top-level slash commands.
 * @returns An object containing the resolved command, its arguments, and its canonical path.
 */
export declare const parseSlashCommand: (query: string, commands: readonly SlashCommand[]) => ParsedSlashCommand;
