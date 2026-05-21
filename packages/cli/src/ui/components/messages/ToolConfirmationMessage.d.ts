/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { ToolCallConfirmationDetails, Config } from '@qwen-code/qwen-code-core';
export interface ToolConfirmationMessageProps {
    confirmationDetails: ToolCallConfirmationDetails;
    config: Config;
    isFocused?: boolean;
    availableTerminalHeight?: number;
    contentWidth: number;
    compactMode?: boolean;
}
export declare const ToolConfirmationMessage: React.FC<ToolConfirmationMessageProps>;
