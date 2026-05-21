/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { ToolConfirmationOutcome } from '@qwen-code/qwen-code-core';
const basicPermissionOptions = [
    {
        optionId: ToolConfirmationOutcome.ProceedOnce,
        name: 'Allow',
        kind: 'allow_once',
    },
    {
        optionId: ToolConfirmationOutcome.Cancel,
        name: 'Reject',
        kind: 'reject_once',
    },
];
function supportsHideAlwaysAllow(confirmation) {
    return confirmation.type !== 'ask_user_question';
}
function filterAlwaysAllowOptions(confirmation, options, forceHideAlwaysAllow = false) {
    const hideAlwaysAllow = forceHideAlwaysAllow ||
        (supportsHideAlwaysAllow(confirmation) &&
            confirmation.hideAlwaysAllow === true);
    return hideAlwaysAllow
        ? options.filter((option) => option.kind !== 'allow_always')
        : options;
}
function formatExecPermissionScopeLabel(confirmation) {
    const permissionRules = confirmation.permissionRules ?? [];
    const bashRules = permissionRules
        .map((rule) => {
        const match = /^Bash\((.*)\)$/.exec(rule.trim());
        return match?.[1]?.trim() || undefined;
    })
        .filter((rule) => Boolean(rule));
    const uniqueRules = [...new Set(bashRules)];
    if (uniqueRules.length === 1) {
        return uniqueRules[0];
    }
    if (uniqueRules.length > 1) {
        return uniqueRules.join(', ');
    }
    return confirmation.rootCommand;
}
export function buildPermissionRequestContent(confirmation) {
    const content = [];
    if (confirmation.type === 'edit') {
        content.push({
            type: 'diff',
            path: confirmation.filePath ?? confirmation.fileName,
            oldText: confirmation.originalContent ?? '',
            newText: confirmation.newContent,
        });
    }
    if (confirmation.type === 'plan') {
        content.push({
            type: 'content',
            content: {
                type: 'text',
                text: confirmation.plan,
            },
        });
    }
    return content;
}
export function toPermissionOptions(confirmation, forceHideAlwaysAllow = false) {
    switch (confirmation.type) {
        case 'edit':
            return filterAlwaysAllowOptions(confirmation, [
                {
                    optionId: ToolConfirmationOutcome.ProceedAlways,
                    name: 'Allow All Edits',
                    kind: 'allow_always',
                },
                ...basicPermissionOptions,
            ], forceHideAlwaysAllow);
        case 'exec': {
            const label = formatExecPermissionScopeLabel(confirmation);
            return filterAlwaysAllowOptions(confirmation, [
                {
                    optionId: ToolConfirmationOutcome.ProceedAlwaysProject,
                    name: `Always Allow in project: ${label}`,
                    kind: 'allow_always',
                },
                {
                    optionId: ToolConfirmationOutcome.ProceedAlwaysUser,
                    name: `Always Allow for user: ${label}`,
                    kind: 'allow_always',
                },
                ...basicPermissionOptions,
            ], forceHideAlwaysAllow);
        }
        case 'mcp':
            return filterAlwaysAllowOptions(confirmation, [
                {
                    optionId: ToolConfirmationOutcome.ProceedAlwaysProject,
                    name: `Always Allow in project: ${confirmation.toolName}`,
                    kind: 'allow_always',
                },
                {
                    optionId: ToolConfirmationOutcome.ProceedAlwaysUser,
                    name: `Always Allow for user: ${confirmation.toolName}`,
                    kind: 'allow_always',
                },
                ...basicPermissionOptions,
            ], forceHideAlwaysAllow);
        case 'info':
            return filterAlwaysAllowOptions(confirmation, [
                {
                    optionId: ToolConfirmationOutcome.ProceedAlwaysProject,
                    name: 'Always Allow in project',
                    kind: 'allow_always',
                },
                {
                    optionId: ToolConfirmationOutcome.ProceedAlwaysUser,
                    name: 'Always Allow for user',
                    kind: 'allow_always',
                },
                ...basicPermissionOptions,
            ], forceHideAlwaysAllow);
        case 'plan':
            return [
                {
                    optionId: ToolConfirmationOutcome.RestorePrevious,
                    name: `Yes, restore previous mode (${confirmation.prePlanMode ?? 'default'})`,
                    kind: 'allow_once',
                },
                {
                    optionId: ToolConfirmationOutcome.ProceedAlways,
                    name: 'Yes, and auto-accept edits',
                    kind: 'allow_always',
                },
                {
                    optionId: ToolConfirmationOutcome.ProceedOnce,
                    name: 'Yes, and manually approve edits',
                    kind: 'allow_once',
                },
                {
                    optionId: ToolConfirmationOutcome.Cancel,
                    name: 'No, keep planning (esc)',
                    kind: 'reject_once',
                },
            ];
        case 'ask_user_question':
            return [
                {
                    optionId: ToolConfirmationOutcome.ProceedOnce,
                    name: 'Submit',
                    kind: 'allow_once',
                },
                {
                    optionId: ToolConfirmationOutcome.Cancel,
                    name: 'Cancel',
                    kind: 'reject_once',
                },
            ];
        default: {
            const unreachable = confirmation;
            throw new Error(`Unexpected: ${unreachable}`);
        }
    }
}
//# sourceMappingURL=permissionUtils.js.map