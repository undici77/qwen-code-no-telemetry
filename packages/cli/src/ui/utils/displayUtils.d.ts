/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { AgentStatus } from '@qwen-code/qwen-code-core';
export interface StatusLabel {
    icon: string;
    text: string;
    color: string;
}
export declare function getArenaStatusLabel(status: AgentStatus): StatusLabel;
export declare const TOOL_SUCCESS_RATE_HIGH = 95;
export declare const TOOL_SUCCESS_RATE_MEDIUM = 85;
export declare const USER_AGREEMENT_RATE_HIGH = 75;
export declare const USER_AGREEMENT_RATE_MEDIUM = 45;
export declare const CACHE_EFFICIENCY_HIGH = 40;
export declare const CACHE_EFFICIENCY_MEDIUM = 15;
export declare const getStatusColor: (value: number, thresholds: {
    green: number;
    yellow: number;
    red?: number;
}, options?: {
    defaultColor?: string;
}) => string;
