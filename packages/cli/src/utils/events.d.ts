/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
export declare enum AppEvent {
    OpenDebugConsole = "open-debug-console",
    LogError = "log-error",
    OauthDisplayMessage = "oauth-display-message",
    OauthAuthUrl = "oauth-auth-url"
}
export declare const appEvents: EventEmitter<[never]>;
