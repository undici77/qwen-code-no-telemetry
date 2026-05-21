/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
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
export function tool(name, description, inputSchema, handler) {
    if (!name || typeof name !== 'string') {
        throw new Error('Tool name must be a non-empty string');
    }
    if (!description || typeof description !== 'string') {
        throw new Error(`Tool '${name}' must have a description (string)`);
    }
    if (!inputSchema || typeof inputSchema !== 'object') {
        throw new Error(`Tool '${name}' must have an inputSchema (object)`);
    }
    if (!handler || typeof handler !== 'function') {
        throw new Error(`Tool '${name}' must have a handler (function)`);
    }
    return { name, description, inputSchema, handler };
}
export function validateToolName(name) {
    if (!name) {
        throw new Error('Tool name cannot be empty');
    }
    if (name.length > 64) {
        throw new Error(`Tool name '${name}' is too long (max 64 characters): ${name.length}`);
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
        throw new Error(`Tool name '${name}' is invalid. Must start with a letter and contain only letters, numbers, and underscores.`);
    }
}
//# sourceMappingURL=tool.js.map