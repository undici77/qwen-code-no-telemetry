/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * System Controller
 *
 * Handles system-level control requests:
 * - initialize: Setup session and return system info
 * - interrupt: Cancel current operations
 * - set_model: Switch model (placeholder)
 */
import { BaseController } from './baseController.js';
import type { ControlRequestPayload } from '../../types.js';
export declare class SystemController extends BaseController {
    /**
     * Handle system control requests
     */
    protected handleRequestPayload(payload: ControlRequestPayload, signal: AbortSignal): Promise<Record<string, unknown>>;
    private handleGetContextUsage;
    /**
     * Handle initialize request
     *
     * Processes SDK MCP servers config.
     * SDK servers are registered in context.sdkMcpServers
     * and added to config.mcpServers with the sdk type flag.
     * External MCP servers are configured separately in settings.
     */
    private handleInitialize;
    /**
     * Build control capabilities for initialize control response
     *
     * This method constructs the control capabilities object that indicates
     * what control features are available. It is used exclusively in the
     * initialize control response.
     */
    buildControlCapabilities(): Record<string, unknown>;
    private normalizeMcpServerConfig;
    private normalizeAuthProviderType;
    private normalizeOAuthConfig;
    /**
     * Handle interrupt request
     *
     * Triggers the interrupt callback to cancel current operations
     */
    private handleInterrupt;
    /**
     * Handle set_model request
     *
     * Implements actual model switching with validation and error handling
     */
    private handleSetModel;
    /**
     * Handle supported_commands request
     *
     * Returns list of supported slash commands loaded dynamically
     */
    private handleSupportedCommands;
    /**
     * Load slash command names using getAvailableCommands
     *
     * @param signal - AbortSignal to respect for cancellation
     * @returns Promise resolving to array of slash command names
     */
    private loadSlashCommandNames;
}
