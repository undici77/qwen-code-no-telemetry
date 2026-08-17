/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import type { ICommandLoader } from './types.js';
import type { SlashCommand } from '../ui/commands/types.js';
export declare function recordAutoSkillCommandUsage(
  config: Config | null,
  command: SlashCommand,
): Promise<void>;
/**
 * Loads user-level, project-level, and extension-level skills as slash
 * commands, making them directly invocable via /<skill-name>.
 *
 * - User/project skills: always model-invocable (same as bundled), unless
 *   disable-model-invocation is set.
 * - Extension skills: model-invocable only when description or whenToUse is
 *   present (same rule as plugin commands), unless disable-model-invocation
 *   is set.
 */
export declare class SkillCommandLoader implements ICommandLoader {
  private readonly config;
  constructor(config: Config | null);
  loadCommands(_signal: AbortSignal): Promise<SlashCommand[]>;
}
