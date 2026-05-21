/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HookConfig, HooksConfigSource, HookEventName } from '@qwen-code/qwen-code-core';
/**
 * Exit code description for hooks
 */
export interface HookExitCode {
    code: number | string;
    description: string;
}
/**
 * UI display information for a hook event
 */
export interface HookEventDisplayInfo {
    event: HookEventName;
    shortDescription: string;
    description: string;
    exitCodes: HookExitCode[];
    configs: HookConfigDisplayInfo[];
}
/**
 * UI display information for a hook configuration
 */
export interface HookConfigDisplayInfo {
    config: HookConfig;
    source: HooksConfigSource;
    sourceDisplay: string;
    sourcePath?: string;
    matcher?: string;
    enabled: boolean;
}
/**
 * Hook management dialog step names
 */
export declare const HOOKS_MANAGEMENT_STEPS: {
    readonly HOOKS_DISABLED: "hooks_disabled";
    readonly HOOKS_LIST: "hooks_list";
    readonly HOOK_DETAIL: "hook_detail";
    readonly HOOK_CONFIG_DETAIL: "hook_config_detail";
};
export type HooksManagementStep = (typeof HOOKS_MANAGEMENT_STEPS)[keyof typeof HOOKS_MANAGEMENT_STEPS];
/**
 * Props for HooksManagementDialog
 */
export interface HooksManagementDialogProps {
    onClose: () => void;
}
