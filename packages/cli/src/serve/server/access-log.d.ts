/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application } from 'express';
import type { DaemonLogger } from '../daemon-logger.js';
export declare const ACCESS_LOG_CONTROLLER_LOCAL = "accessLogController";
export interface AccessLogController {
    sealAndFlushSuppressed(): void;
}
export interface AccessLogAppLocals {
    [ACCESS_LOG_CONTROLLER_LOCAL]?: AccessLogController;
}
export declare function installAccessLogMiddleware(app: Application, daemonLog: DaemonLogger | undefined, monotonicNow?: () => number): AccessLogController;
