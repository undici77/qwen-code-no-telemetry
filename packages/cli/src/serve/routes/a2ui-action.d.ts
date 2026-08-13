/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler } from 'express';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
export interface McpServerConfigLike {
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    httpUrl?: string;
    cwd?: string;
}
export interface McpServerCell {
    name: string;
    mcpStatus?: string;
    config?: McpServerConfigLike;
}
export interface A2uiActionArgs {
    name: string;
    surfaceId?: string;
    context?: Record<string, unknown>;
}
export interface A2uiActionResult {
    commands: unknown[] | null;
    fallback: string;
}
export interface A2uiToolResult {
    isError?: boolean;
    content?: Array<{
        type: string;
        text?: string;
        resource?: {
            mimeType?: string;
            text?: string;
        };
    }>;
}
interface RegisterA2uiActionRoutesOptions {
    boundWorkspace: string;
    mutate: () => RequestHandler;
    safeBody: (req: Request) => Record<string, unknown>;
    /** Workspace MCP status from the daemon (includes runtime-registered servers). */
    getMcpServers: () => Promise<McpServerCell[]>;
    /** Injectable for unit tests; defaults to the real one-shot MCP call. */
    callAction?: (cfg: McpServerConfigLike, args: A2uiActionArgs) => Promise<A2uiActionResult>;
    env?: Readonly<Record<string, string | undefined>>;
    isWorkspaceTrusted?: () => boolean;
    captureGenerationAssertion?: () => (() => void) | undefined;
}
/** Exported for unit testing. */
export declare function usableServerConfig(cfg?: McpServerConfigLike): boolean;
/**
 * Fallback: read the workspace settings file directly (when the daemon
 * status is unavailable). Exported for unit testing.
 */
export declare function findFromSettingsFile(workspaceCwd: string): Promise<McpServerConfigLike | null>;
/** Build a one-shot transport from the config shape: stdio (command) or streamable HTTP (httpUrl). */
export declare function buildTransport(cfg: McpServerConfigLike, baseEnv?: Readonly<Record<string, string | undefined>>): Transport;
/** Exported for unit testing the MCP content normalization rules. */
export declare function extractA2uiActionResult(result: A2uiToolResult): A2uiActionResult;
/** Call the UI MCP server's action tool directly and extract the A2UI continuation commands plus fallback text. */
export declare function callA2uiAction(cfg: McpServerConfigLike, args: A2uiActionArgs, env?: Readonly<Record<string, string | undefined>>): Promise<A2uiActionResult>;
export declare function registerA2uiActionRoutes(app: Application, opts: RegisterA2uiActionRoutesOptions): void;
export {};
