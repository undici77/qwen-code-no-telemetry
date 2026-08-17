/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  ExternalContextConfigV1,
  ExternalContextProvider,
  ExternalMemoryWriter,
} from './types.js';
interface ToolRuntime {
  config: ExternalContextConfigV1;
  provider: ExternalContextProvider;
  writer?: ExternalMemoryWriter;
}
export declare function createExternalContextMcpServer(
  runtime: ToolRuntime,
): McpServer;
export declare function runMcp(): Promise<void>;
export {};
