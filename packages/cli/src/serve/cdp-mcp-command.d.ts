/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Stdio MCP adapter command used by the optional CDP browser automation bridge. */
export declare const QWEN_CDP_MCP_COMMAND_ENV = "QWEN_CDP_MCP_COMMAND";
export declare function resolveCdpMcpCommand(env: Readonly<Record<string, string | undefined>>): string | undefined;
export declare function isBrowserAutomationMcpAvailable(opts: {
    cdpTunnelOverWs?: boolean;
    token?: string;
}, env: Readonly<Record<string, string | undefined>>): boolean;
