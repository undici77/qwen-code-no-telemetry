/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type SlashCommand } from '../ui/commands/types.js';
/** Maximum number of stacked skill commands that can be loaded in one prompt. */
export declare const MAX_STACKED_SKILLS = 5;
export type ParsedSlashCommand = {
    commandToExecute: SlashCommand | undefined;
    args: string;
    canonicalPath: string[];
};
export type ParsedStackedSkillCommands = {
    /** All matched skill commands (up to MAX_STACKED_SKILLS). */
    skills: SlashCommand[];
    /** Text remaining after the last matched skill token. */
    remainingText: string;
    /** True when more than MAX_STACKED_SKILLS leading tokens were found. */
    exceededMax: boolean;
};
/** Returns whether a command can be offered in a stacked skill completion. */
export declare const isStackedSkillCompletableCommand: (command: SlashCommand) => boolean;
/**
 * Returns whether the text before a partial slash token is a valid stacked
 * skill prefix. A further skill can only be completed while the existing
 * leading tokens are user-invocable skills and the stack is below its limit.
 */
export declare const isValidStackedSkillPrefix: (prefix: string, commands: readonly SlashCommand[]) => boolean;
/**
 * Parses a raw slash command string into its command, arguments, and canonical path.
 * If no valid command is found, the `commandToExecute` property will be `undefined`.
 *
 * @param query The raw input string, e.g., "/config set theme dark" or "/help".
 * @param commands The list of available top-level slash commands.
 * @returns An object containing the resolved command, its arguments, and its canonical path.
 */
export declare const parseSlashCommand: (query: string, commands: readonly SlashCommand[]) => ParsedSlashCommand;
/**
 * Detects multiple leading `/skill-name` tokens in user input.
 *
 * For input like `/feat-dev /e2e-testing implement X`, returns all matched
 * skill commands (up to MAX_STACKED_SKILLS) and the remaining text.
 *
 * Only matches commands with `kind === CommandKind.SKILL`. Stops at the first
 * non-skill token or unmatched `/token`.
 *
 * @param query The raw input string starting with `/`.
 * @param commands The list of available slash commands.
 * @returns Matched skill commands and the remaining text after them.
 */
export declare const parseStackedSlashCommands: (query: string, commands: readonly SlashCommand[]) => ParsedStackedSkillCommands;
