/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ICommandLoader } from './types.js';
import type { SlashCommand } from '../ui/commands/types.js';
import type { Config } from '@qwen-code/qwen-code-core';
/**
 * Loads the core, hard-coded slash commands that are an integral part
 * of the Qwen Code application.
 */
export declare class BuiltinCommandLoader implements ICommandLoader {
    private config;
    constructor(config: Config | null);
    /**
     * Gathers all raw built-in command definitions, injects dependencies where
     * needed (e.g., config) and filters out any that are not available.
     *
     * @param _signal An AbortSignal (unused for this synchronous loader).
     * @returns A promise that resolves to an array of `SlashCommand` objects.
     */
    loadCommands(_signal: AbortSignal): Promise<SlashCommand[]>;
}
