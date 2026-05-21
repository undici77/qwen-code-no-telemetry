/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { type ToolDefinition } from '../../types.js';
interface ToolsListProps {
    tools: readonly ToolDefinition[];
    showDescriptions: boolean;
    contentWidth: number;
}
export declare const ToolsList: React.FC<ToolsListProps>;
export {};
