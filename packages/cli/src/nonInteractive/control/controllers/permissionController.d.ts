/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ControlRequestPayload, PermissionSuggestion } from '../../types.js';
import { BaseController } from './baseController.js';
export declare class PermissionController extends BaseController {
    private pendingOutgoingRequests;
    /**
     * Handle permission control requests
     */
    protected handleRequestPayload(payload: ControlRequestPayload, signal: AbortSignal): Promise<Record<string, unknown>>;
    /**
     * Handle can_use_tool request
     *
     * Comprehensive permission evaluation based on:
     * - Permission mode (approval level)
     * - Tool registry validation
     * - Error handling with safe defaults
     */
    private handleCanUseTool;
    /**
     * Check permission mode for tool execution
     */
    private checkPermissionMode;
    /**
     * Check if tool exists in registry
     */
    private checkToolRegistry;
    /**
     * Handle set_permission_mode request
     *
     * Updates the permission mode in the context
     */
    private handleSetPermissionMode;
    /**
     * Build permission suggestions for tool confirmation UI
     *
     * This method creates UI suggestions based on tool confirmation details,
     * helping the host application present appropriate permission options.
     */
    buildPermissionSuggestions(confirmationDetails: unknown): PermissionSuggestion[] | null;
    /**
     * Get callback for monitoring tool calls and handling outgoing permission requests
     * This is passed to executeToolCall to hook into CoreToolScheduler updates
     */
    getToolCallUpdateCallback(): (toolCalls: unknown[]) => void;
    /**
     * Handle outgoing permission request
     *
     * Behavior depends on input format:
     * - stream-json mode: Send can_use_tool to SDK and await response
     * - Other modes: Check local approval mode and decide immediately
     */
    private handleOutgoingPermissionRequest;
}
