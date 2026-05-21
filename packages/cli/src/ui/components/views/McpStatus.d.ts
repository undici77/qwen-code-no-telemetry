/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MCPServerConfig } from '@qwen-code/qwen-code-core';
import { MCPServerStatus } from '@qwen-code/qwen-code-core';
import type React from 'react';
import type { HistoryItemMcpStatus, JsonMcpPrompt, JsonMcpTool } from '../../types.js';
interface McpStatusProps {
    servers: Record<string, MCPServerConfig>;
    tools: JsonMcpTool[];
    prompts: JsonMcpPrompt[];
    blockedServers: Array<{
        name: string;
        extensionName: string;
    }>;
    serverStatus: (serverName: string) => MCPServerStatus;
    authStatus: HistoryItemMcpStatus['authStatus'];
    discoveryInProgress: boolean;
    connectingServers: string[];
    showDescriptions: boolean;
    showSchema: boolean;
    showTips: boolean;
}
export declare const McpStatus: React.FC<McpStatusProps>;
export {};
