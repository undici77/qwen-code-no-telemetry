/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Tool definition helper for SDK-embedded MCP servers
 */
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { z, ZodRawShape, ZodObject, ZodTypeAny } from 'zod';
/**
 * SDK MCP Tool Definition with Zod schema type inference
 */
export type SdkMcpToolDefinition<Schema extends ZodRawShape = ZodRawShape> = {
    name: string;
    description: string;
    inputSchema: Schema;
    handler: (args: z.infer<ZodObject<Schema, 'strip', ZodTypeAny>>, extra: unknown) => Promise<CallToolResult>;
};
/**
 * Create an SDK MCP tool definition with Zod schema inference
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { tool } from '@qwen-code/sdk';
 *
 * const calculatorTool = tool(
 *   'calculate_sum',
 *   'Calculate the sum of two numbers',
 *   { a: z.number(), b: z.number() },
 *   async (args) => {
 *     // args is inferred as { a: number, b: number }
 *     return { content: [{ type: 'text', text: String(args.a + args.b) }] };
 *   }
 * );
 * ```
 */
export declare function tool<Schema extends ZodRawShape>(name: string, description: string, inputSchema: Schema, handler: (args: z.infer<ZodObject<Schema, 'strip', ZodTypeAny>>, extra: unknown) => Promise<CallToolResult>): SdkMcpToolDefinition<Schema>;
export declare function validateToolName(name: string): void;
