/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ExtendedSystemInfo } from './systemInfo.js';
/**
 * Field configuration for system information display
 */
export interface SystemInfoField {
    label: string;
    key: keyof ExtendedSystemInfo;
}
export interface SystemInfoDisplayField {
    label: string;
    value: string;
}
export declare function getSystemInfoFields(info: ExtendedSystemInfo): SystemInfoDisplayField[];
