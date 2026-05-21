/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Hook Controller
 *
 * Handles hook-related control requests:
 * - hook_callback: Process hook callbacks (placeholder for future)
 */
import { BaseController } from './baseController.js';
import type { ControlRequestPayload } from '../../types.js';
export declare class HookController extends BaseController {
    /**
     * Handle hook control requests
     */
    protected handleRequestPayload(payload: ControlRequestPayload, _signal: AbortSignal): Promise<Record<string, unknown>>;
    /**
     * Handle hook_callback request
     *
     * Processes hook callbacks (placeholder implementation)
     */
    private handleHookCallback;
}
