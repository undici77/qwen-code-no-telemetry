/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application } from 'express';
import type { AcpSessionBridge } from '../acp-session-bridge.js';
import type { DaemonLogger } from '../daemon-logger.js';
import { type SendBridgeError } from '../server/error-response.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
import { type VirtualSubagentSessions } from '../virtual-subagent-sessions.js';
export declare function getActiveSseCount(): number;
interface RegisterSseEventsRoutesDeps {
    bridge: AcpSessionBridge;
    workspaceRegistry: WorkspaceRegistry;
    daemonLog?: DaemonLogger;
    writerIdleTimeoutMs?: number;
    sendBridgeError: SendBridgeError;
    virtualSubagentSessions?: VirtualSubagentSessions;
}
export declare function registerSseEventsRoutes(app: Application, deps: RegisterSseEventsRoutesDeps): void;
export {};
