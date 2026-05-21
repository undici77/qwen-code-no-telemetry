/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { ToolCallStatus } from '../../types.js';
export declare const STATUS_INDICATOR_WIDTH = 3;
type ToolStatusIndicatorProps = {
    status: ToolCallStatus;
    name: string;
};
export declare const ToolStatusIndicator: React.FC<ToolStatusIndicatorProps>;
export {};
