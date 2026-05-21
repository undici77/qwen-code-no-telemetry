/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FC } from 'react';
export interface PermissionOption {
    name: string;
    kind: string;
    optionId: string;
}
export interface PermissionToolCall {
    title?: string;
    kind?: string;
    toolCallId?: string;
    rawInput?: {
        command?: string;
        description?: string;
        [key: string]: unknown;
    };
    content?: Array<{
        type: string;
        [key: string]: unknown;
    }>;
    locations?: Array<{
        path: string;
        line?: number | null;
    }>;
    status?: string;
}
export interface PermissionDrawerProps {
    isOpen: boolean;
    options: PermissionOption[];
    toolCall: PermissionToolCall;
    onResponse: (optionId: string) => void;
    onClose?: () => void;
}
export declare const PermissionDrawer: FC<PermissionDrawerProps>;
