/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Control Service - Public Programmatic API
 *
 * Provides type-safe access to control plane functionality for internal
 * CLI code. This is the ONLY programmatic interface that should be used by:
 * - nonInteractiveCli
 * - Session managers
 * - Tool execution handlers
 * - Internal CLI logic
 *
 * DO NOT use ControlDispatcher or controllers directly from application code.
 *
 * Architecture:
 * - ControlContext stores shared session state (Layer 1)
 * - ControlDispatcher handles protocol-level routing (Layer 2)
 * - ControlService provides programmatic API for internal CLI usage (Layer 3)
 *
 * ControlService and ControlDispatcher share controller instances to ensure
 * a single source of truth. All higher level code MUST access the control
 * plane exclusively through ControlService.
 */
import type { IControlContext } from './ControlContext.js';
import type { ControlDispatcher } from './ControlDispatcher.js';
import type { PermissionServiceAPI, SystemServiceAPI } from './types/serviceAPIs.js';
/**
 * Control Service
 *
 * Facade layer providing domain-grouped APIs for control plane operations.
 * Shares controller instances with ControlDispatcher to ensure single source
 * of truth and state consistency.
 */
export declare class ControlService {
    private dispatcher;
    /**
     * Construct ControlService
     *
     * @param context - Control context (unused directly, passed to dispatcher)
     * @param dispatcher - Control dispatcher that owns the controller instances
     */
    constructor(context: IControlContext, dispatcher: ControlDispatcher);
    /**
     * Permission Domain API
     *
     * Handles tool execution permissions, approval checks, and callbacks.
     * Delegates to the shared PermissionController instance.
     */
    get permission(): PermissionServiceAPI;
    /**
     * System Domain API
     *
     * Handles system-level operations and session management.
     * Delegates to the shared SystemController instance.
     */
    get system(): SystemServiceAPI;
    /**
     * MCP Domain API
     *
     * Handles Model Context Protocol server interactions.
     * Delegates to the shared MCPController instance.
     */
    /**
     * Hook Domain API
     *
     * Handles hook callback processing (placeholder for future expansion).
     * Delegates to the shared HookController instance.
     */
    /**
     * Cleanup all controllers
     *
     * Should be called on session shutdown. Delegates to dispatcher's shutdown
     * method to ensure all controllers are properly cleaned up.
     */
    cleanup(): void;
}
