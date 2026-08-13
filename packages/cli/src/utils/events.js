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
    /**
     * A settings hot-reload changed the set of gated MCP servers pending
     * approval (e.g. an edit to a `workspace`/`project`-scoped server invalidated
     * its hash-bound approval). Drives the interactive approval dialog to
     * re-evaluate mid-session instead of only at startup. See issue #4615.
     */
    AppEvent["McpPendingApprovalChanged"] = "mcp-pending-approval-changed";
    AppEvent["LspStatusChanged"] = "lsp-status-changed";
    AppEvent["ExtensionContentChanged"] = "extension-content-changed";
    AppEvent["ExtensionRefreshNeeded"] = "extension-refresh-needed";
    AppEvent["ExtensionsReloadStarted"] = "extensions-reload-started";
    AppEvent["ExtensionsReloaded"] = "extensions-reloaded";
    AppEvent["StartupIdeConnectionStatusChanged"] = "startup-ide-connection-status-changed";
})(AppEvent || (AppEvent = {}));
export const appEvents = new EventEmitter();
//# sourceMappingURL=events.js.map