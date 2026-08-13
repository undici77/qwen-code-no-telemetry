/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application } from 'express';
import type { WorkspaceRegistry } from '../workspace-registry.js';
interface RegisterWorkspaceChannelObservedContactRoutesDeps {
    primaryWorkspace: string;
    workspaceRegistry: WorkspaceRegistry;
    isWorkspaceTrusted?: () => boolean;
    captureGenerationAssertion?: () => (() => void) | undefined;
}
export declare function registerWorkspaceChannelObservedContactRoutes(app: Application, deps: RegisterWorkspaceChannelObservedContactRoutesDeps): void;
export {};
