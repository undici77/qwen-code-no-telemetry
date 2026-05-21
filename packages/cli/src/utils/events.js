/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
export var AppEvent;
(function (AppEvent) {
    AppEvent["OpenDebugConsole"] = "open-debug-console";
    AppEvent["LogError"] = "log-error";
    AppEvent["OauthDisplayMessage"] = "oauth-display-message";
    AppEvent["OauthAuthUrl"] = "oauth-auth-url";
})(AppEvent || (AppEvent = {}));
export const appEvents = new EventEmitter();
//# sourceMappingURL=events.js.map