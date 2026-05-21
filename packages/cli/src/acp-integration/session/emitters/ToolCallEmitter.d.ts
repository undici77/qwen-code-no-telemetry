/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseEmitter } from './BaseEmitter.js';
import type { SessionContext, ToolCallStartParams, ToolCallResultParams, ResolvedToolMetadata, SubagentMeta } from '../types.js';
import type { ToolKind } from '@agentclientprotocol/sdk';
import { Kind } from '@qwen-code/qwen-code-core';
/**
 * Unified tool call event emitter.
 *
 * Handles tool_call and tool_call_update for ALL flows:
 * - Normal tool execution in runTool()
 * - History replay in HistoryReplayer
 * - SubAgent tool tracking in SubAgentTracker
 *
 * This ensures consistent behavior across all tool event sources,
 * including special handling for tools like TodoWriteTool.
 */
export declare class ToolCallEmitter extends BaseEmitter {
    private readonly planEmitter;
    constructor(ctx: SessionContext);
    /**
     * Emits a tool call start event.
     *
     * @param params - Tool call start parameters
     * @returns true if event was emitted, false if skipped (e.g., TodoWriteTool)
     */
    emitStart(params: ToolCallStartParams): Promise<boolean>;
    /**
     * Emits a tool call result event.
     * Handles TodoWriteTool specially by routing to plan updates.
     *
     * @param params - Tool call result parameters
     */
    emitResult(params: ToolCallResultParams): Promise<void>;
    /**
     * Emits a tool call error event.
     * Use this for explicit error handling when not using emitResult.
     *
     * @param callId - The tool call ID
     * @param toolName - The tool name
     * @param error - The error that occurred
     * @param subagentMeta - Optional subagent metadata
     */
    emitError(callId: string, toolName: string, error: Error, subagentMeta?: SubagentMeta): Promise<void>;
    /**
     * Checks if a tool name is the TodoWriteTool.
     * Exposed for external use in components that need to check this.
     */
    isTodoWriteTool(toolName: string): boolean;
    /**
     * Checks if a tool name is the ExitPlanModeTool.
     */
    isExitPlanModeTool(toolName: string): boolean;
    /**
     * Resolves tool metadata from the registry.
     * Falls back to defaults if tool not found or build fails.
     *
     * @param toolName - Name of the tool
     * @param args - Tool call arguments (used to build invocation)
     */
    resolveToolMetadata(toolName: string, args?: Record<string, unknown>): ResolvedToolMetadata;
    /**
     * Maps core Tool Kind enum to ACP ToolKind string literals.
     *
     * @param kind - The core Kind enum value
     * @param toolName - Optional tool name to handle special cases like exit_plan_mode
     */
    mapToolKind(kind: Kind, toolName?: string): ToolKind;
    /**
     * Extracts diff content from resultDisplay if it's a diff type (edit tool result).
     * Returns null if not a diff.
     */
    private extractDiffContent;
    /**
     * Transforms Part[] to ToolCallContent[].
     * Extracts text from functionResponse parts and text parts.
     */
    private transformPartsToToolCallContent;
}
