/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, RequestHandler } from 'express';
import type { AcpSessionBridge } from '../acp-session-bridge.js';
import type { SendBridgeError } from '../server/error-response.js';
import type { DaemonWorkspaceService } from '../workspace-service/index.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
interface RegisterWorkspaceStatusRoutesDeps {
    boundWorkspace: string;
    bridge: AcpSessionBridge;
    workspace: DaemonWorkspaceService;
    mutate: (opts?: {
        strict?: boolean;
    }) => RequestHandler;
    sendBridgeError: SendBridgeError;
    captureGenerationAssertion?: () => (() => void) | undefined;
}
export declare function registerWorkspaceStatusRoutes(app: Application, deps: RegisterWorkspaceStatusRoutesDeps): void;
export declare function registerWorkspaceQualifiedStatusRoutes(app: Application, deps: Pick<RegisterWorkspaceStatusRoutesDeps, 'sendBridgeError'> & {
    workspaceRegistry: WorkspaceRegistry;
}): void;
export declare function registerWorkspaceDiagnosticStatusRoutes(app: Application, deps: RegisterWorkspaceStatusRoutesDeps): void;
export declare function registerWorkspaceQualifiedDiagnosticStatusRoutes(app: Application, deps: Pick<RegisterWorkspaceStatusRoutesDeps, 'sendBridgeError'> & {
    workspaceRegistry: WorkspaceRegistry;
}): void;
export {};
