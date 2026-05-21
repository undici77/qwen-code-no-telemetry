/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const DEFAULT_STOP_HOOK_BLOCK_CAP = 8;
export declare const MAX_STOP_HOOK_BLOCK_CAP = 100;
export declare const STOP_HOOK_BLOCK_CAP_ENV = "QWEN_CODE_STOP_HOOK_BLOCK_CAP";
export declare function normalizeStopHookBlockingCap(value: unknown): number;
export declare function resolveStopHookBlockingCap(configValue?: number): number;
export declare function formatStopHookBlockingCapWarning(hookLabel: 'Stop' | 'SubagentStop', cap: number): string;
export declare function appendStopHookBlockingCapWarning(text: string, warning: string | undefined): string;
