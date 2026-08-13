/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { inactiveExtensionSkillNames, inactiveExtensionSkillRefs, isInactiveExtensionSkill, } from './extension-skills.js';
function configWithExtensions(extensions) {
    return {
        getExtensions: () => extensions,
    };
}
function extension(fields) {
    return {
        id: fields.name,
        version: '1.0.0',
        path: `/extensions/${fields.name}`,
        config: { name: fields.name, version: '1.0.0' },
        contextFiles: [],
        ...fields,
    };
}
function skill(name, extensionName, level = 'extension') {
    return { name, extensionName, level };
}
function extensionSkill(name) {
    return {
        name,
        description: `${name} description`,
        body: `${name} body`,
        filePath: `/skills/${name}/SKILL.md`,
        level: 'extension',
    };
}
describe('extension skill activity helpers', () => {
    it('matches skills from inactive extensions by name and displayName', () => {
        const refs = inactiveExtensionSkillRefs(configWithExtensions([
            extension({
                name: 'canonical-ext',
                displayName: 'Display Ext',
                isActive: false,
                skills: [extensionSkill('audit')],
            }),
        ]));
        expect(isInactiveExtensionSkill(skill('audit', 'canonical-ext'), refs)).toBe(true);
        expect(isInactiveExtensionSkill(skill('audit', 'Display Ext'), refs)).toBe(true);
    });
    it('ignores skills from active extensions', () => {
        const refs = inactiveExtensionSkillRefs(configWithExtensions([
            extension({
                name: 'active-ext',
                isActive: true,
                skills: [extensionSkill('audit')],
            }),
        ]));
        expect(isInactiveExtensionSkill(skill('audit', 'active-ext'), refs)).toBe(false);
    });
    it('collects inactive extension skill names for commands without extensionName', () => {
        const names = inactiveExtensionSkillNames(configWithExtensions([
            extension({
                name: 'inactive-ext',
                isActive: false,
                skills: [extensionSkill('Audit')],
            }),
            extension({
                name: 'active-ext',
                isActive: true,
                skills: [extensionSkill('Review')],
            }),
        ]));
        expect(names).toEqual(new Set(['audit']));
    });
    it('ignores non-extension skills', () => {
        const refs = inactiveExtensionSkillRefs(configWithExtensions([
            extension({
                name: 'inactive-ext',
                isActive: false,
                skills: [extensionSkill('audit')],
            }),
        ]));
        expect(isInactiveExtensionSkill(skill('audit', 'inactive-ext', 'user'), refs)).toBe(false);
    });
});
//# sourceMappingURL=extension-skills.test.js.map