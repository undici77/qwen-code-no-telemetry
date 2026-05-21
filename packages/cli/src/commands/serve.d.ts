/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface ServeArgs {
    port: number;
    hostname: string;
    token?: string;
    'max-sessions': number;
    'max-connections': number;
    'event-ring-size': number;
    workspace?: string;
    'require-auth': boolean;
    'http-bridge': boolean;
    'mcp-client-budget'?: number;
    'mcp-budget-mode'?: 'enforce' | 'warn' | 'off';
}
export declare const serveCommand: CommandModule<unknown, ServeArgs>;
export {};
