/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ToolConfirmationOutcome } from '@qwen-code/qwen-code-core';
import type React from 'react';
export interface ShellConfirmationRequest {
    commands: string[];
    onConfirm: (outcome: ToolConfirmationOutcome, approvedCommands?: string[]) => void;
}
export interface ShellConfirmationDialogProps {
    request: ShellConfirmationRequest;
}
export declare const ShellConfirmationDialog: React.FC<ShellConfirmationDialogProps>;
