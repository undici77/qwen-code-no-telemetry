/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import type { ChannelManagementService } from '../channel-management-service.js';
import type { WorkspaceRegistry, WorkspaceRuntime } from '../workspace-registry.js';
interface RegisterWorkspaceChannelManagementRoutesDeps {
    primaryRuntime: WorkspaceRuntime;
    workspaceRegistry: WorkspaceRegistry;
    resolveService: (runtime: WorkspaceRuntime) => ChannelManagementService | undefined | Promise<ChannelManagementService | undefined>;
    mutate: (opts?: {
        strict?: boolean;
    }) => RequestHandler;
    safeBody: (req: Request) => Record<string, unknown>;
    parseAndValidateClientId: (req: Request, res: Response, runtime: WorkspaceRuntime) => string | undefined | null;
}
export declare function registerWorkspaceChannelManagementRoutes(app: Application, deps: RegisterWorkspaceChannelManagementRoutesDeps): void;
export {};
