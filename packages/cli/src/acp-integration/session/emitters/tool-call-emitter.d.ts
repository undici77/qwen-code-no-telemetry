/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseEmitter } from './base-emitter.js';
import type {
  SessionEmitterContext,
  ToolCallStartParams,
  ToolCallResultParams,
  ResolvedToolMetadata,
  SubagentMeta,
} from '../types.js';
import type { ToolCallContent, ToolKind } from '@agentclientprotocol/sdk';
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
  private readonly preparedCallIds;
  constructor(ctx: SessionEmitterContext);
  /**
   * Emits a tool call start event.
   *
   * @param params - Tool call start parameters
   * @returns true if event was emitted, false if skipped (e.g., TodoWriteTool)
   */
  emitStart(params: ToolCallStartParams): Promise<boolean>;
  /**
   * Emits a terminal frame when a prepared tool call is discarded before
   * execution. TodoWrite remains represented exclusively by plan updates.
   *
   * @param callId - ID of the prepared tool call
   * @param toolName - Name of the prepared tool
   */
  emitPreparationDiscarded(callId: string, toolName: string): Promise<void>;
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
  emitError(
    callId: string,
    toolName: string,
    error: Error,
    subagentMeta?: SubagentMeta,
  ): Promise<void>;
  /**
   * Resolve a tool's provenance for UI dispatch on tool_call events.
   * The SDK reads `_meta.
   * provenance` + `_meta.serverId` to render builtin / MCP-server-badge /
   * subagent-block differently. Without this stamping, the SDK falls
   * back to string-matching the toolName which can't reliably
   * distinguish builtin from subagent.
   *
   * Resolution rules:
   *   - `subagentMeta` present → `'subagent'` (a Task tool / Codex
   *     subagent / etc. wrapping its own tool calls)
   *   - toolName matches `mcp__<server>__<tool>` → `'mcp'` with
   *     `serverId: <server>`. Naming convention from
   *     `packages/core/src/tools/mcp-tool.ts` in the
   *     `@qwen-code/qwen-code-core` package — mirrors the SDK's same
   *     heuristic fallback so SDK consumers stay consistent with
   *     daemon classification.
   *   - everything else → `'builtin'`
   *
   * Static + pure so it can be unit-tested without an emitter
   * instance. Exported via `ToolCallEmitter.resolveToolProvenance`.
   */
  static resolveToolProvenance(
    toolName: string,
    subagentMeta?: SubagentMeta,
  ): {
    provenance: 'builtin' | 'mcp' | 'subagent';
    serverId?: string;
  };
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
   * Checks if a tool name is the EnterPlanModeTool.
   */
  isEnterPlanModeTool(toolName: string): boolean;
  /**
   * Resolves tool metadata from the registry.
   * Falls back to defaults if tool not found or build fails.
   *
   * @param toolName - Name of the tool
   * @param args - Tool call arguments (used to build invocation)
   */
  resolveToolMetadata(
    toolName: string,
    args?: Record<string, unknown>,
  ): ResolvedToolMetadata;
  /**
   * Maps core Tool Kind enum to ACP ToolKind string literals.
   *
   * @param kind - The core Kind enum value
   * @param toolName - Optional tool name to handle special cases like exit_plan_mode
   */
  mapToolKind(kind: Kind, toolName?: string): ToolKind;
}
export declare function buildToolResultContentPrefix(
  resultDisplay: unknown,
): ToolCallContent[];
