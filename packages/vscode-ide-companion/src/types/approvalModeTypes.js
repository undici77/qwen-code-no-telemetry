/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Enum for approval modes with UI-friendly labels
 * Represents the different approval modes available in the ACP protocol
 * with their corresponding user-facing display names
 */
export var ApprovalMode;
(function (ApprovalMode) {
    ApprovalMode["PLAN"] = "plan";
    ApprovalMode["DEFAULT"] = "default";
    ApprovalMode["AUTO_EDIT"] = "auto-edit";
    ApprovalMode["AUTO"] = "auto";
    ApprovalMode["YOLO"] = "yolo";
})(ApprovalMode || (ApprovalMode = {}));
/**
 * Mapping from string values to enum values for runtime conversion
 */
export const APPROVAL_MODE_MAP = {
    plan: ApprovalMode.PLAN,
    default: ApprovalMode.DEFAULT,
    'auto-edit': ApprovalMode.AUTO_EDIT,
    auto: ApprovalMode.AUTO,
    yolo: ApprovalMode.YOLO,
};
/**
 * UI display information for each approval mode
 */
export const APPROVAL_MODE_INFO = {
    [ApprovalMode.PLAN]: {
        label: 'Plan mode',
        title: 'Qwen will plan before executing. Click to switch modes.',
        iconType: 'plan',
    },
    [ApprovalMode.DEFAULT]: {
        label: 'Ask before edits',
        title: 'Qwen will ask before each edit. Click to switch modes.',
        iconType: 'edit',
    },
    [ApprovalMode.AUTO_EDIT]: {
        label: 'Edit automatically',
        title: 'Qwen will edit files automatically. Click to switch modes.',
        iconType: 'auto',
    },
    [ApprovalMode.AUTO]: {
        label: 'Auto',
        title: 'Qwen will use a classifier to auto-approve safe tools and block risky ones. Click to switch modes.',
        iconType: 'auto',
    },
    [ApprovalMode.YOLO]: {
        label: 'YOLO',
        title: 'Automatically approve all tools. Click to switch modes.',
        iconType: 'yolo',
    },
};
/**
 * Get UI display information for an approval mode from string value
 */
export function getApprovalModeInfoFromString(mode) {
    const enumValue = APPROVAL_MODE_MAP[mode];
    if (enumValue !== undefined) {
        return APPROVAL_MODE_INFO[enumValue];
    }
    return {
        label: 'Unknown mode',
        title: 'Unknown edit mode',
        iconType: undefined,
    };
}
//# sourceMappingURL=approvalModeTypes.js.map