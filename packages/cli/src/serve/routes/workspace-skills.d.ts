/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import type { SendBridgeError } from '../server/error-response.js';
import type { WorkspaceRegistry, WorkspaceRuntime } from '../workspace-registry.js';
interface RegisterWorkspaceSkillsRoutesDeps {
    workspaceRuntime: WorkspaceRuntime;
    mutate: (opts?: {
        strict?: boolean;
    }) => RequestHandler;
    safeBody: (req: Request) => Record<string, unknown>;
    sendBridgeError: SendBridgeError;
    parseAndValidateClientId: (req: Request, res: Response) => string | undefined | null;
}
export declare function registerWorkspaceSkillsRoutes(app: Application, deps: RegisterWorkspaceSkillsRoutesDeps): void;
export declare function registerWorkspaceQualifiedSkillsRoutes(app: Application, deps: Pick<RegisterWorkspaceSkillsRoutesDeps, 'mutate' | 'safeBody' | 'sendBridgeError'> & {
    workspaceRegistry: WorkspaceRegistry;
}): void;
export {};
