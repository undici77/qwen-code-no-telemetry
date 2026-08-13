/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const CHROME_DEVTOOLS_SERVER_NAME = "chrome-devtools";
export declare const CDP_TUNNEL_ENDPOINT_PATTERN: RegExp;
export type CapabilityStatusState = 'down' | 'needs-allow-origin' | 'chat-only' | 'tunnel-only' | 'automation-configured' | 'automation-connected' | 'automation-pending' | 'automation-shadowed' | 'automation-unavailable';
export interface CapabilityStatus {
    state: CapabilityStatusState;
    shellReady: boolean;
    warning: string | null;
}
export interface WorkspaceMcpSnapshot {
    initialized?: boolean;
    discoveryState?: string;
    servers?: ReadonlyArray<{
        name?: string;
        mcpStatus?: string;
        config?: {
            args?: readonly string[];
        };
    }>;
}
export declare function deriveCapabilityStatus(daemonReachable: boolean, features: readonly string[], mcpSnapshot?: WorkspaceMcpSnapshot | null, baseUrl?: string): CapabilityStatus;
