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
export declare enum ApprovalMode {
    PLAN = "plan",
    DEFAULT = "default",
    AUTO_EDIT = "auto-edit",
    AUTO = "auto",
    YOLO = "yolo"
}
/**
 * Mapping from string values to enum values for runtime conversion
 */
export declare const APPROVAL_MODE_MAP: Record<string, ApprovalMode>;
/**
 * UI display information for each approval mode
 */
export declare const APPROVAL_MODE_INFO: Record<ApprovalMode, {
    label: string;
    title: string;
    iconType?: 'edit' | 'auto' | 'plan' | 'yolo';
}>;
/**
 * Get UI display information for an approval mode from string value
 */
export declare function getApprovalModeInfoFromString(mode: string): {
    label: string;
    title: string;
    iconType?: 'edit' | 'auto' | 'plan' | 'yolo';
};
