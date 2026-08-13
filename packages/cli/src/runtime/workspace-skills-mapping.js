/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Maps a `SkillConfig` (as `SkillManager.listSkills()` returns) to the
 * `/workspace/skills` wire status. Shared by the ACP child's
 * `buildWorkspaceSkillsStatus` and the daemon-local
 * `workspace-skills-status` provider so the two skill listings can never
 * drift in shape.
 */
export function mapSkillConfigToStatus(skill, disablements = new Map(), opts = {}) {
    const disablement = disablements.get(skill.name.toLowerCase());
    const disabledReason = opts.disabled
        ? 'inactive_extension'
        : disablement?.reason;
    const modelInvocable = skill.disableModelInvocation !== true;
    return {
        kind: 'skill',
        status: disabledReason ? 'disabled' : 'ok',
        name: skill.name,
        description: skill.description,
        level: skill.level,
        modelInvocable,
        ...(disabledReason ? { disabledReason } : {}),
        ...(!opts.disabled && disablement?.lockedScope
            ? { lockedScope: disablement.lockedScope }
            : {}),
        ...(skill.userInvocable === false ? { userInvocable: false } : {}),
        installedPath: skill.filePath,
        ...(skill.argumentHint ? { argumentHint: skill.argumentHint } : {}),
        ...(skill.model ? { model: skill.model } : {}),
        ...(skill.extensionName ? { extensionName: skill.extensionName } : {}),
    };
}
//# sourceMappingURL=workspace-skills-mapping.js.map