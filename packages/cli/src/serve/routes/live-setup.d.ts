/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, RequestHandler } from 'express';
import { type LiveSetupController } from '../live/live-setup-controller.js';
export interface RegisterLiveSetupRoutesDeps {
    controller: LiveSetupController;
    mutate: (options?: {
        strict?: boolean;
    }) => RequestHandler;
}
export declare function registerLiveSetupRoutes(app: Application, deps: RegisterLiveSetupRoutesDeps): void;
