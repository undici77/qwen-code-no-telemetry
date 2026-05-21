/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request, RequestHandler, Response } from 'express';
import type { HttpAcpBridge } from '../httpAcpBridge.js';
interface RegisterDeps {
    bridge: HttpAcpBridge;
    mutate: (opts?: {
        strict?: boolean;
    }) => RequestHandler;
    parseClientId: (req: Request, res: Response) => string | undefined | null;
    safeBody: (req: Request) => Record<string, unknown>;
}
export declare function registerWorkspaceFileWriteRoutes(app: Application, deps: RegisterDeps): void;
export {};
