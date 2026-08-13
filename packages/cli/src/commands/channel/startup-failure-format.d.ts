/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function sanitizeChannelCommandValue(value: string, maxLength?: number): string;
export declare function safeChannelCommandErrorMessage(error: unknown): string;
export declare function channelStartupFailureBody(error: unknown): unknown;
export declare function formatChannelStartupFailures(source: unknown, fallbackWorkspaceCwd?: string): string[];
