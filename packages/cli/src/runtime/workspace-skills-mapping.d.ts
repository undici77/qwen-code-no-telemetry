/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SkillConfig } from '@qwen-code/qwen-code-core';
import type { ServeWorkspaceSkillStatus } from '@qwen-code/acp-bridge/status';
import type { SkillDisablement } from '../config/skill-settings.js';
/**
 * Maps a `SkillConfig` (as `SkillManager.listSkills()` returns) to the
 * `/workspace/skills` wire status. Shared by the ACP child's
 * `buildWorkspaceSkillsStatus` and the daemon-local
 * `workspace-skills-status` provider so the two skill listings can never
 * drift in shape.
 */
export declare function mapSkillConfigToStatus(
  skill: SkillConfig,
  disablements?: ReadonlyMap<string, SkillDisablement>,
  opts?: {
    disabled?: boolean;
  },
): ServeWorkspaceSkillStatus;
