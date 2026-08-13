/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ToolResult } from './tools.js';
import type { PermissionDecision } from '../permissions/types.js';
import { BaseDeclarativeTool, BaseToolInvocation } from './tools.js';
import type { Config } from '../config/config.js';
export interface EnterPlanModeParams {
    /**
     * Set to `true` only when the user explicitly asked for plan mode in this
     * turn (or explicitly confirmed they want it). Distinguishes a genuine
     * user-requested entry from the model deciding to plan on its own, which
     * matters when the session is in YOLO mode — see the guard in `execute()`.
     */
    userRequested?: boolean;
}
declare class EnterPlanModeToolInvocation extends BaseToolInvocation<EnterPlanModeParams, ToolResult> {
    private readonly config;
    constructor(config: Config, params: EnterPlanModeParams);
    getDescription(): string;
    /**
     * Entering plan mode lowers privileges, so it is always allowed without a
     * confirmation prompt.
     */
    getDefaultPermission(): Promise<PermissionDecision>;
    execute(_signal: AbortSignal): Promise<ToolResult>;
}
export declare class EnterPlanModeTool extends BaseDeclarativeTool<EnterPlanModeParams, ToolResult> {
    private readonly config;
    static readonly Name: string;
    get maxOutputChars(): number;
    constructor(config: Config);
    protected createInvocation(params: EnterPlanModeParams): EnterPlanModeToolInvocation;
}
export {};
