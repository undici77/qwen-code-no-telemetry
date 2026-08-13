/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, Response } from 'express';
import { type WorkspaceSettingsWrite } from '../workspace-service/types.js';
type PersistSettings = (workspace: string, writes: WorkspaceSettingsWrite[], assertGenerationOpen?: () => void) => Promise<void>;
export interface WorkspaceModelsRouteDeps {
    boundWorkspace: string;
    isWorkspaceTrusted?: () => boolean;
    captureGenerationAssertion?: () => (() => void) | undefined;
    mutate: (opts?: {
        strict?: boolean;
    }) => import('express').RequestHandler;
    safeBody: (req: Request) => Record<string, unknown>;
    persistSettings: PersistSettings;
    broadcastSettingsChanged: (key: string, value: unknown, scope: string, clientId: string | undefined) => void;
    parseAndValidateClientId: (req: Request, res: Response) => string | undefined | null;
}
/**
 * Removes a configured model from `modelProviders` in the scope that owns the
 * effective model-provider config. When the removed model was the active
 * selection, `model.name`/`model.baseUrl` are cleared in the same write so the
 * runtime doesn't keep pointing at a model that no longer exists.
 */
export declare function registerWorkspaceModelsRoutes(app: Application, deps: WorkspaceModelsRouteDeps): void;
export {};
