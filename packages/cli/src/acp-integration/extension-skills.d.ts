/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, SkillConfig } from '@qwen-code/qwen-code-core';
export declare function inactiveExtensionSkillRefs(config: Config): Set<string>;
export declare function inactiveExtensionSkillNames(
  config: Config,
): Set<string>;
export declare function isInactiveExtensionSkill(
  skill: Pick<SkillConfig, 'extensionName' | 'level' | 'name'>,
  inactiveSkillRefs: Set<string>,
): boolean;
