/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Control Context implementation
 */
export class ControlContext {
    config;
    streamJson;
    sessionId;
    abortSignal;
    getActiveTurnAbortSignal;
    debugMode;
    settings;
    permissionMode;
    sdkCanUseToolTimeoutMs;
    sdkMcpServers;
    mcpClients;
    inputClosed;
    onInterrupt;
    onContinueLastTurn;
    constructor(options) {
        this.config = options.config;
        this.streamJson = options.streamJson;
        this.sessionId = options.sessionId;
        this.abortSignal = options.abortSignal;
        this.getActiveTurnAbortSignal = options.getActiveTurnAbortSignal;
        this.debugMode = options.config.getDebugMode();
        this.settings = options.settings;
        this.permissionMode = options.permissionMode || 'default';
        this.sdkMcpServers = new Set();
        this.mcpClients = new Map();
        this.inputClosed = false;
        this.onInterrupt = options.onInterrupt;
        this.onContinueLastTurn = options.onContinueLastTurn;
    }
}
//# sourceMappingURL=ControlContext.js.map