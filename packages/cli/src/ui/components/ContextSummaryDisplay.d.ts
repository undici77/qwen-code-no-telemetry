/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { type IdeContext, type MCPServerConfig } from '@qwen-code/qwen-code-core';
interface ContextSummaryDisplayProps {
    geminiMdFileCount: number;
    contextFileNames: string[];
    mcpServers?: Record<string, MCPServerConfig>;
    blockedMcpServers?: Array<{
        name: string;
        extensionName: string;
    }>;
    showToolDescriptions?: boolean;
    ideContext?: IdeContext;
}
export declare const ContextSummaryDisplay: React.FC<ContextSummaryDisplayProps>;
export {};
