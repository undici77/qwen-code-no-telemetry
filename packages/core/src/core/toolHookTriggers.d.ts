/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MessageBus } from '../confirmation-bus/message-bus.js';
import {
  type NotificationType,
  type PermissionSuggestion,
  type PostToolBatchToolCall,
} from '../hooks/types.js';
import type { ToolArtifact } from '../tools/tools.js';
import type { PartListUnion } from '@google/genai';
/**
 * Generate a unique tool_use_id for tracking tool executions
 */
export declare function generateToolUseId(): string;
/**
 * Result of PreToolUse hook execution
 */
export interface PreToolUseHookResult {
  /** Whether the tool execution should proceed */
  shouldProceed: boolean;
  /** If blocked, the reason for blocking */
  blockReason?: string;
  /** If blocked, the error type */
  blockType?: 'denied' | 'ask' | 'stop';
  /** Additional context to add */
  additionalContext?: string;
  /**
   * Set when the hook helper caught and absorbed a transport / dispatch
   * error. The tool execution still proceeds (existing non-blocking
   * contract), but observers (telemetry spans, debug logs) can detect
   * that the hook itself failed instead of treating the safe-default
   * response as a successful "allow" decision (#4321 review).
   */
  hookError?: string;
}
/**
 * Result of PostToolUse hook execution
 */
export interface PostToolUseHookResult {
  /** Whether execution should stop */
  shouldStop: boolean;
  /** Stop reason if applicable */
  stopReason?: string;
  /** Additional context to append to tool response */
  additionalContext?: string;
  /** Structured artifacts returned by post-tool hooks. */
  artifacts?: ToolArtifact[];
  /** See PreToolUseHookResult.hookError. */
  hookError?: string;
}
/**
 * Result of PostToolUseFailure hook execution
 */
export interface PostToolUseFailureHookResult {
  /** Additional context about the failure */
  additionalContext?: string;
  /** Structured artifacts returned by failure hooks. */
  artifacts?: ToolArtifact[];
  /** See PreToolUseHookResult.hookError. */
  hookError?: string;
}
/**
 * Result of PostToolBatch hook execution
 */
export interface PostToolBatchHookResult {
  /** Whether execution should stop before the next model request */
  shouldStop: boolean;
  /** Stop reason if applicable */
  stopReason?: string;
  /** Additional context to append once for the whole batch */
  additionalContext?: string;
  /** Structured artifacts returned by batch hooks. */
  artifacts?: ToolArtifact[];
  /** See PreToolUseHookResult.hookError. */
  hookError?: string;
}
/**
 * Fire PreToolUse hook via MessageBus and process the result
 *
 * @param messageBus - The message bus instance
 * @param toolName - Name of the tool being executed
 * @param toolInput - Input parameters for the tool
 * @param toolUseId - Unique identifier for this tool use (internal format, e.g., toolu_xxx)
 * @param permissionMode - Current permission mode
 * @param tool_call_id - Original API call ID from the LLM provider (e.g., call_xxx for OpenAI/Qwen)
 * @returns PreToolUseHookResult indicating whether to proceed and any modifications
 */
export declare function firePreToolUseHook(
  messageBus: MessageBus | undefined,
  toolName: string,
  toolInput: Record<string, unknown>,
  toolUseId: string,
  permissionMode: string,
  signal?: AbortSignal,
  tool_call_id?: string,
): Promise<PreToolUseHookResult>;
/**
 * Fire PostToolUse hook via MessageBus and process the result
 *
 * @param messageBus - The message bus instance
 * @param toolName - Name of the tool that was executed
 * @param toolInput - Input parameters that were used
 * @param toolResponse - Response from the tool execution
 * @param toolUseId - Unique identifier for this tool use (internal format, e.g., toolu_xxx)
 * @param permissionMode - Current permission mode
 * @param tool_call_id - Original API call ID from the LLM provider (e.g., call_xxx for OpenAI/Qwen)
 * @returns PostToolUseHookResult with any additional context
 */
export declare function firePostToolUseHook(
  messageBus: MessageBus | undefined,
  toolName: string,
  toolInput: Record<string, unknown>,
  toolResponse: Record<string, unknown>,
  toolUseId: string,
  permissionMode: string,
  signal?: AbortSignal,
  tool_call_id?: string,
): Promise<PostToolUseHookResult>;
/**
 * Fire PostToolUseFailure hook via MessageBus and process the result
 *
 * @param messageBus - The message bus instance
 * @param toolUseId - Unique identifier for this tool use (internal format, e.g., toolu_xxx)
 * @param toolName - Name of the tool that failed
 * @param toolInput - Input parameters that were used
 * @param errorMessage - Error message describing the failure
 * @param errorType - Optional error type classification
 * @param isInterrupt - Whether the failure was caused by user interruption
 * @param tool_call_id - Original API call ID from the LLM provider (e.g., call_xxx for OpenAI/Qwen)
 * @returns PostToolUseFailureHookResult with any additional context
 */
export declare function firePostToolUseFailureHook(
  messageBus: MessageBus | undefined,
  toolUseId: string,
  toolName: string,
  toolInput: Record<string, unknown>,
  errorMessage: string,
  isInterrupt?: boolean,
  permissionMode?: string,
  signal?: AbortSignal,
  tool_call_id?: string,
): Promise<PostToolUseFailureHookResult>;
/**
 * Fire PostToolBatch hook via MessageBus and process the result
 *
 * @param messageBus - The message bus instance
 * @param toolCalls - Resolved tool calls in the batch
 * @returns PostToolBatchHookResult with stop/additional-context decisions
 */
export declare function firePostToolBatchHook(
  messageBus: MessageBus | undefined,
  toolCalls: PostToolBatchToolCall[],
  permissionMode?: string,
  signal?: AbortSignal,
): Promise<PostToolBatchHookResult>;
/**
 * Result of Notification hook execution
 */
export interface NotificationHookResult {
  /** Additional context from the hook */
  additionalContext?: string;
  /** Terminal escape sequence requested by the hook */
  terminalSequence?: string;
}
/**
 * Fire Notification hook via MessageBus
 * Called when Qwen Code sends a notification
 */
export declare function fireNotificationHook(
  messageBus: MessageBus | undefined,
  message: string,
  notificationType: NotificationType,
  title?: string,
  signal?: AbortSignal,
): Promise<NotificationHookResult>;
/**
 * Result of PermissionRequest hook execution
 */
export interface PermissionRequestHookResult {
  /** Whether the hook made a permission decision */
  hasDecision: boolean;
  /** If true, the tool execution should proceed */
  shouldAllow?: boolean;
  /** Updated tool input to use if allowed */
  updatedInput?: Record<string, unknown>;
  /** Deny message to pass back to the AI if denied */
  denyMessage?: string;
  /** Whether to interrupt the AI after denial */
  shouldInterrupt?: boolean;
}
/**
 * Fire PermissionRequest hook via MessageBus
 * Called when a permission dialog is about to be shown to the user.
 * Returns a decision that can short-circuit the normal permission flow.
 */
export declare function firePermissionRequestHook(
  messageBus: MessageBus | undefined,
  toolName: string,
  toolInput: Record<string, unknown>,
  permissionMode: string,
  permissionSuggestions?: PermissionSuggestion[],
  signal?: AbortSignal,
): Promise<PermissionRequestHookResult>;
/**
 * Append additional context to tool response content
 *
 * @param content - Original content (string or PartListUnion)
 * @param additionalContext - Context to append
 * @returns Modified content with context appended
 */
export declare function appendAdditionalContext(
  content: string | PartListUnion,
  additionalContext: string | undefined,
): string | PartListUnion;
