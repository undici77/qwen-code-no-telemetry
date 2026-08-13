/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SkillConfig } from '../../skills/types.js';
export declare function loadAgentPluginSkills(pluginRoot: string): Promise<SkillConfig[]>;
export declare function parseAgentPluginSkill(content: string, filePath: string, directoryName?: string): SkillConfig;
