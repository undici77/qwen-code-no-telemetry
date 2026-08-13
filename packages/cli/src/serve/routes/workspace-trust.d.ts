/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, Response } from 'express';
import type { DaemonWorkspaceService } from '../workspace-service/types.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
import { type DaemonTrustPolicySnapshot } from '../../config/daemon-trust-policy.js';
export interface WorkspaceTrustRouteDeps {
    boundWorkspace: string;
    workspace: DaemonWorkspaceService;
    mutate: (opts?: {
        strict?: boolean;
    }) => import('express').RequestHandler;
    safeBody: (req: Request) => Record<string, unknown>;
    parseAndValidateClientId: (req: Request, res: Response) => string | undefined | null;
    workspaceRegistry?: WorkspaceRegistry;
    workspaceTrustHotReloadAvailable?: boolean;
    getWorkspaceTrustPolicySnapshot?: () => DaemonTrustPolicySnapshot | Promise<DaemonTrustPolicySnapshot>;
}
export declare function registerWorkspaceTrustRoutes(app: Application, deps: WorkspaceTrustRouteDeps): void;
export declare function registerWorkspaceQualifiedTrustRoutes(app: Application, deps: Pick<WorkspaceTrustRouteDeps, 'mutate' | 'safeBody' | 'getWorkspaceTrustPolicySnapshot'> & {
    workspaceRegistry: WorkspaceRegistry;
    workspaceTrustHotReloadAvailable?: boolean;
}): void;
