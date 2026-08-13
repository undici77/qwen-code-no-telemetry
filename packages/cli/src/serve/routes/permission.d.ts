/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, RequestHandler, Response } from 'express';
import type { AcpSessionBridge } from '../acp-session-bridge.js';
import type { DaemonLogger } from '../daemon-logger.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
type SendPermissionVoteError = (res: Response, err: unknown, ctx: {
    route: string;
    sessionId?: string;
}) => void;
interface RegisterPermissionRoutesDeps {
    bridge: AcpSessionBridge;
    workspaceRegistry: WorkspaceRegistry;
    daemonLog?: DaemonLogger;
    mutate: (opts?: {
        strict?: boolean;
    }) => RequestHandler;
    sendPermissionVoteError: SendPermissionVoteError;
}
export declare function registerPermissionRoutes(app: Application, deps: RegisterPermissionRoutesDeps): void;
export {};
