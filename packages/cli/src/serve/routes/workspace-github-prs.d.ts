/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, RequestHandler } from 'express';
import type { SendBridgeError } from '../server/error-response.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
export declare function registerWorkspaceQualifiedGitHubPrsRoutes(app: Application, deps: {
    workspaceRegistry: WorkspaceRegistry;
    sendBridgeError: SendBridgeError;
    mutate: (opts?: {
        strict?: boolean;
    }) => RequestHandler;
    /** Coalescing/refresh window for the cached PR list. Defaults to 60s. */
    cacheTtlMs?: number;
}): void;
