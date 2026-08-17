/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, MCPServerConfig } from '@qwen-code/qwen-code-core';
export declare const MCP_SERVER_REF_PREFIX = 'mcp:';
export declare function parseMcpServerRef(pathName: string): {
  name: string;
} | null;
export declare function buildMcpServerRef(serverName: string): string;
export declare function matchMcpServerByRef(
  name: string,
  servers: Record<string, MCPServerConfig>,
):
  | {
      serverName: string;
      server: MCPServerConfig;
    }
  | undefined;
export declare function buildMcpServerContextText(
  config: Config,
  serverName: string,
): string;
