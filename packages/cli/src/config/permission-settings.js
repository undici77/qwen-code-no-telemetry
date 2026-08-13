/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { parseRule } from '@qwen-code/qwen-code-core';
export const PERMISSION_RULE_TYPES = ['allow', 'ask', 'deny'];
export const MAX_PERMISSION_RULES_COUNT = 500;
export const MAX_PERMISSION_RULE_LENGTH = 512;
export class PermissionRulesValidationError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'PermissionRulesValidationError';
    }
}
export function isPermissionRuleType(value) {
    return (typeof value === 'string' &&
        PERMISSION_RULE_TYPES.includes(value));
}
export function readPermissionRuleSet(settings) {
    const permissions = settings && typeof settings === 'object'
        ? settings.permissions
        : undefined;
    const readRules = (type) => {
        const value = permissions?.[type];
        return Array.isArray(value)
            ? value.filter((item) => typeof item === 'string')
            : [];
    };
    return {
        allow: readRules('allow'),
        ask: readRules('ask'),
        deny: readRules('deny'),
    };
}
export function normalizePermissionRules(value, opts) {
    const inputRules = normalizePermissionRuleInputs(value);
    const result = [];
    const seen = new Set();
    const existingRules = new Set((opts?.existingRules ?? []).map((rule) => rule.trim()));
    for (const rule of inputRules) {
        if (parseRule(rule).invalid) {
            if (existingRules.has(rule)) {
                if (!seen.has(rule)) {
                    seen.add(rule);
                    result.push(rule);
                }
                continue;
            }
            throw new PermissionRulesValidationError(`Malformed permission rule: ${rule}`, 'invalid_rules');
        }
        if (!seen.has(rule)) {
            seen.add(rule);
            result.push(rule);
        }
    }
    return result;
}
export function normalizePermissionRuleInputs(value) {
    if (!Array.isArray(value)) {
        throw new PermissionRulesValidationError('rules must be an array', 'invalid_rules');
    }
    if (value.length > MAX_PERMISSION_RULES_COUNT) {
        throw new PermissionRulesValidationError(`rules array exceeds ${MAX_PERMISSION_RULES_COUNT} entries`, 'invalid_rules');
    }
    const result = [];
    for (const item of value) {
        if (typeof item !== 'string' || !item.trim()) {
            throw new PermissionRulesValidationError('rules must contain only non-empty strings', 'invalid_rules');
        }
        const rule = item.trim();
        if (rule.length > MAX_PERMISSION_RULE_LENGTH) {
            throw new PermissionRulesValidationError(`rule exceeds ${MAX_PERMISSION_RULE_LENGTH}-character limit`, 'invalid_rules');
        }
        result.push(rule);
    }
    return result;
}
export function buildPermissionSettings(settings) {
    return {
        v: 1,
        user: {
            path: settings.user.path,
            rules: readPermissionRuleSet(settings.user.settings),
        },
        workspace: {
            path: settings.workspace.path,
            rules: readPermissionRuleSet(settings.workspace.settings),
        },
        merged: readPermissionRuleSet(settings.merged),
        isTrusted: settings.isTrusted,
    };
}
//# sourceMappingURL=permission-settings.js.map