/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application } from 'express';
import type { SendBridgeError } from '../server/error-response.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
export declare function registerWorkspaceGitLogRoutes(app: Application, deps: {
    boundWorkspace: string;
    sendBridgeError: SendBridgeError;
}): void;
export declare function registerWorkspaceQualifiedGitLogRoutes(app: Application, deps: {
    workspaceRegistry: WorkspaceRegistry;
    sendBridgeError: SendBridgeError;
}): void;
