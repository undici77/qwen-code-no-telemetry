/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Factory function to create SDK-embedded MCP servers
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SdkMcpToolDefinition } from './tool.js';
/**
 * Options for creating an SDK MCP server
 */
export type CreateSdkMcpServerOptions = {
    name: string;
    version?: string;
    tools?: Array<SdkMcpToolDefinition<any>>;
};
/**
 * SDK MCP Server configuration with instance
 */
export type McpSdkServerConfigWithInstance = {
    type: 'sdk';
    name: string;
    instance: McpServer;
};
/**
 * Creates an MCP server instance that can be used with the SDK transport.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { tool, createSdkMcpServer } from '@qwen-code/sdk';
 *
 * const calculatorTool = tool(
 *   'calculate_sum',
 *   'Add two numbers',
 *   { a: z.number(), b: z.number() },
 *   async (args) => ({ content: [{ type: 'text', text: String(args.a + args.b) }] })
 * );
 *
 * const server = createSdkMcpServer({
 *   name: 'calculator',
 *   version: '1.0.0',
 *   tools: [calculatorTool],
 * });
 * ```
 */
export declare function createSdkMcpServer(options: CreateSdkMcpServerOptions): McpSdkServerConfigWithInstance;
