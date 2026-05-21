/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SlashCommand } from '../ui/commands/types.js';
export interface CommandDefinition {
    prompt: string;
    description?: string;
    argumentHint?: string;
    whenToUse?: string;
    disableModelInvocation?: boolean;
}
/**
 * Creates a SlashCommand from a parsed command definition.
 * This function is used by both TOML and Markdown command loaders.
 *
 * @param filePath The absolute path to the command file
 * @param baseDir The root command directory for name calculation
 * @param definition The parsed command definition (prompt and optional description)
 * @param extensionName Optional extension name to prefix commands with
 * @param fileExtension The file extension (e.g., '.toml' or '.md')
 * @returns A SlashCommand object
 */
export declare function createSlashCommandFromDefinition(filePath: string, baseDir: string, definition: CommandDefinition, extensionName: string | undefined, fileExtension: string): SlashCommand;
