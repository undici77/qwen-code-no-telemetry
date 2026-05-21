/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import type { ICommandLoader } from './types.js';
import type { SlashCommand } from '../ui/commands/types.js';
/**
 * Discovers and loads custom slash commands from .toml files in both the
 * user's global config directory and the current project's directory.
 *
 * This loader is responsible for:
 * - Recursively scanning command directories.
 * - Parsing and validating TOML files.
 * - Adapting valid definitions into executable SlashCommand objects.
 * - Handling file system errors and malformed files gracefully.
 */
export declare class FileCommandLoader implements ICommandLoader {
    private readonly config;
    private readonly projectRoot;
    private readonly folderTrustEnabled;
    private readonly folderTrust;
    constructor(config: Config | null);
    /**
     * Loads all commands from user, project, and extension directories.
     * Returns commands in order: user → project → extensions (alphabetically).
     *
     * Order is important for conflict resolution in CommandService:
     * - User/project commands (without extensionName) use "last wins" strategy
     * - Extension commands (with extensionName) get renamed if conflicts exist
     *
     * @param signal An AbortSignal to cancel the loading process.
     * @returns A promise that resolves to an array of all loaded SlashCommands.
     */
    loadCommands(signal: AbortSignal): Promise<SlashCommand[]>;
    /**
     * Get all command directories in order for loading.
     * User commands → Project commands → Extension commands
     * This order ensures extension commands can detect all conflicts.
     */
    private getCommandDirectories;
    /**
     * Get commands paths from an extension.
     * Returns paths from config.commands if specified, otherwise defaults to 'commands' directory.
     */
    private getExtensionCommandsPaths;
    /**
     * Parses a single .toml file and transforms it into a SlashCommand object.
     * @param filePath The absolute path to the .toml file.
     * @param baseDir The root command directory for name calculation.
     * @param extensionName Optional extension name to prefix commands with.
     * @returns A promise resolving to a SlashCommand, or null if the file is invalid.
     */
    private parseAndAdaptTomlFile;
    /**
     * Parses a single .md file and transforms it into a SlashCommand object.
     * @param filePath The absolute path to the .md file.
     * @param baseDir The root command directory for name calculation.
     * @param extensionName Optional extension name to prefix commands with.
     * @returns A promise resolving to a SlashCommand, or null if the file is invalid.
     */
    private parseAndAdaptMarkdownFile;
}
