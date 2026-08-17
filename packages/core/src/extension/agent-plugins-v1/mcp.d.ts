/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MCPServerConfig } from '../../config/config.js';
export declare const AGENT_PLUGIN_MCP_SCHEMA =
  'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json';
export declare function loadAgentPluginMcpServers(
  pluginRoot: string,
  pluginDataRoot: string,
  options?: {
    createDataDir?: boolean;
  },
): Promise<Record<string, MCPServerConfig>>;
export declare function validateAgentPluginStdioRuntimePaths(
  server: MCPServerConfig,
): void;
