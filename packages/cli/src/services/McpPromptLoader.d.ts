/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import type { SlashCommand } from '../ui/commands/types.js';
import type { ICommandLoader } from './types.js';
import type { PromptArgument } from '@modelcontextprotocol/sdk/types.js';
/**
 * Discovers and loads executable slash commands from prompts exposed by
 * Model-Context-Protocol (MCP) servers.
 */
export declare class McpPromptLoader implements ICommandLoader {
    private readonly config;
    constructor(config: Config | null);
    /**
     * Loads all available prompts from all configured MCP servers and adapts
     * them into executable SlashCommand objects.
     *
     * @param _signal An AbortSignal (unused for this synchronous loader).
     * @returns A promise that resolves to an array of loaded SlashCommands.
     */
    loadCommands(_signal: AbortSignal): Promise<SlashCommand[]>;
    /**
     * Parses the `userArgs` string representing the prompt arguments (all the text
     * after the command) into a record matching the shape of the `promptArgs`.
     *
     * @param userArgs
     * @param promptArgs
     * @returns A record of the parsed arguments
     * @visibleForTesting
     */
    parseArgs(userArgs: string, promptArgs: PromptArgument[] | undefined): Record<string, unknown> | Error;
}
