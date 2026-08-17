/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  Config,
  OutputUpdateHandler,
  ToolCallRequestInfo,
  SessionMetrics,
} from '@qwen-code/qwen-code-core';
import type { Part, PartListUnion } from '@google/genai';
import type {
  CLIUserMessage,
  Usage,
  PermissionMode,
  CLISystemMessage,
} from '../nonInteractive/types.js';
import type {
  JsonOutputAdapterInterface,
  MessageEmitter,
} from '../nonInteractive/io/BaseJsonOutputAdapter.js';
/**
 * Normalizes various part list formats into a consistent Part[] array.
 *
 * @param parts - Input parts in various formats (string, Part, Part[], or null)
 * @returns Normalized array of Part objects
 */
export declare function normalizePartList(parts: PartListUnion | null): Part[];
/**
 * Extracts user message parts from a CLI protocol message.
 *
 * @param message - User message sourced from the CLI protocol layer
 * @returns Extracted parts or null if the message lacks textual content
 */
export declare function extractPartsFromUserMessage(
  message: CLIUserMessage | undefined,
): PartListUnion | null;
/**
 * Computes Usage information from SessionMetrics using computeSessionStats.
 * Aggregates token usage across all models in the session.
 *
 * @param metrics - Session metrics from uiTelemetryService
 * @returns Usage object with token counts
 */
export declare function computeUsageFromMetrics(metrics: SessionMetrics): Usage;
export declare function buildInitialSystemReminders(config: Config): Part[];
export declare function insertAfterFunctionResponses(
  parts: Part[],
  additions: Part[],
): Part[];
/**
 * Build system message for SDK
 *
 * Constructs a system initialization message including tools, MCP servers,
 * and model configuration. System messages are independent of the control
 * system and are sent before every turn regardless of whether control
 * system is available.
 *
 * Note: Control capabilities are NOT included in system messages. They
 * are only included in the initialize control response, which is handled
 * separately by SystemController.
 *
 * @param config - Config instance
 * @param sessionId - Session identifier
 * @param permissionMode - Current permission/approval mode
 * @returns Promise resolving to CLISystemMessage
 */
export declare function buildSystemMessage(
  config: Config,
  sessionId: string,
  permissionMode: PermissionMode,
): Promise<CLISystemMessage>;
/**
 * Creates a generic output update handler for tools with canUpdateOutput=true.
 * This handler forwards MCP progress data (McpToolProgressData) and shell
 * liveness heartbeats (ShellProgressData) as tool_progress stream events via
 * the adapter. Progress events are only emitted when the adapter supports
 * partial messages (i.e., includePartialMessages is true).
 *
 * @param request - Tool call request info
 * @param adapter - The adapter instance for emitting messages
 * @returns An object containing the output update handler
 */
export declare function createToolProgressHandler(
  request: ToolCallRequestInfo,
  adapter: MessageEmitter,
): {
  handler: OutputUpdateHandler;
};
/**
 * Creates an output update handler specifically for Agent tool subagent execution.
 * This handler monitors AgentResultDisplay updates and converts them to protocol messages
 * using the unified adapter's subagent APIs. All emitted messages will have parent_tool_use_id set to
 * the agent tool's callId.
 *
 * @param config - Config instance for getting output format
 * @param agentToolCallId - The agent tool's callId to use as parent_tool_use_id for all subagent messages
 * @param adapter - The unified adapter instance (JsonOutputAdapter or StreamJsonOutputAdapter)
 * @returns An object containing the output update handler
 */
export declare function createAgentToolProgressHandler(
  config: Config,
  agentToolCallId: string,
  adapter: JsonOutputAdapterInterface,
): {
  handler: OutputUpdateHandler;
};
/**
 * Converts function response parts to a string representation.
 * Handles functionResponse parts specially by extracting their output content.
 *
 * @param parts - Array of Part objects to convert
 * @returns String representation of the parts
 */
export declare function functionResponsePartsToString(parts: Part[]): string;
