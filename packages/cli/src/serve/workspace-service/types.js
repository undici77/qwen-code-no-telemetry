/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export class WorkspaceSettingsPartialPersistError extends Error {
    committedWrites;
    cause;
    constructor(message, committedWrites, cause) {
        super(message);
        this.name = 'WorkspaceSettingsPartialPersistError';
        this.committedWrites = committedWrites;
        this.cause = cause;
    }
}
export class WorkspacePermissionRulesSessionRequiredError extends Error {
    constructor() {
        super('setWorkspacePermissionRules requires a live ACP session to update active permission rules');
        this.name = 'WorkspacePermissionRulesSessionRequiredError';
    }
}
export class WorkspaceSkillNotFoundError extends Error {
    skillName;
    constructor(skillName) {
        super(`Skill not found: ${skillName}`);
        this.skillName = skillName;
        this.name = 'WorkspaceSkillNotFoundError';
    }
}
export class WorkspaceSkillNotToggleableError extends Error {
    skillName;
    reason;
    lockedScope;
    constructor(skillName, reason, lockedScope) {
        super(lockedScope
            ? `Skill ${skillName} is locked by ${lockedScope} settings`
            : `Skill ${skillName} is not toggleable: ${reason}`);
        this.skillName = skillName;
        this.reason = reason;
        this.lockedScope = lockedScope;
        this.name = 'WorkspaceSkillNotToggleableError';
    }
}
export function mapWorkspaceSkillToggleError(error) {
    if (error instanceof WorkspaceSkillNotFoundError) {
        return {
            skillName: error.skillName,
            code: 'skill_not_found',
            error: error.message,
        };
    }
    if (error instanceof WorkspaceSkillNotToggleableError) {
        return {
            skillName: error.skillName,
            code: error.reason === 'inactive_extension'
                ? 'skill_inactive_extension'
                : 'skill_not_toggleable',
            error: error.message,
            reason: error.reason,
            ...(error.lockedScope ? { lockedScope: error.lockedScope } : {}),
        };
    }
    return undefined;
}
//# sourceMappingURL=types.js.map