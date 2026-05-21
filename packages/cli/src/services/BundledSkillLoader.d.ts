/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import type { ICommandLoader } from './types.js';
import type { SlashCommand } from '../ui/commands/types.js';
/**
 * Loads bundled skills as slash commands, making them directly invocable
 * via /<skill-name> (e.g., /review).
 */
export declare class BundledSkillLoader implements ICommandLoader {
    private readonly config;
    constructor(config: Config | null);
    loadCommands(_signal: AbortSignal): Promise<SlashCommand[]>;
}
