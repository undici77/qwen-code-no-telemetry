/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
function extensionSkillRef(extensionName, skillName) {
    return `${extensionName}\0${skillName}`;
}
export function inactiveExtensionSkillRefs(config) {
    const refs = new Set();
    for (const extension of config.getExtensions()) {
        if (extension.isActive)
            continue;
        for (const skill of extension.skills ?? []) {
            refs.add(extensionSkillRef(extension.name, skill.name));
            // SkillManager exposes extensionName as displayName ?? name.
            if (extension.displayName) {
                refs.add(extensionSkillRef(extension.displayName, skill.name));
            }
        }
    }
    return refs;
}
export function inactiveExtensionSkillNames(config) {
    const names = new Set();
    for (const extension of config.getExtensions()) {
        if (extension.isActive)
            continue;
        for (const skill of extension.skills ?? []) {
            names.add(skill.name.toLowerCase());
        }
    }
    return names;
}
export function isInactiveExtensionSkill(skill, inactiveSkillRefs) {
    return (skill.level === 'extension' &&
        skill.extensionName !== undefined &&
        inactiveSkillRefs.has(extensionSkillRef(skill.extensionName, skill.name)));
}
//# sourceMappingURL=extension-skills.js.map