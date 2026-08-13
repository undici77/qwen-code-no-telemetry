/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application } from 'express';
import type { AcpSessionBridge } from '../acp-session-bridge.js';
import type { getAdvertisedServeFeatures } from '../capabilities.js';
import { type ServeOptions } from '../types.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
interface RegisterCapabilitiesRoutesDeps {
    qwenCodeVersion?: string;
    mode: ServeOptions['mode'];
    currentServeFeatures: () => ReturnType<typeof getAdvertisedServeFeatures>;
    boundWorkspace: string;
    workspaceRegistry: WorkspaceRegistry;
    permissionPolicy: AcpSessionBridge['permissionPolicy'];
    maxSessionsPerWorkspace: ServeOptions['maxSessions'];
    maxTotalSessions: ServeOptions['maxTotalSessions'];
    maxPendingPromptsPerSession: ServeOptions['maxPendingPromptsPerSession'];
    sessionRestoreTimeoutMs: number;
    languageCodes: string[];
}
export declare function registerCapabilitiesRoutes(app: Application, deps: RegisterCapabilitiesRoutesDeps): void;
export {};
