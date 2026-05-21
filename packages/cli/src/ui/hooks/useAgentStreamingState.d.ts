/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AgentStatus, AgentEventType, type AgentInteractive } from '@qwen-code/qwen-code-core';
import { StreamingState } from '../types.js';
export interface AgentStreamingInfo {
    /** The agent's current lifecycle status. */
    status: AgentStatus | undefined;
    /** Derived streaming state for StreamingContext / LoadingIndicator. */
    streamingState: StreamingState;
    /** Whether the agent can accept user input right now. */
    isInputActive: boolean;
    /** Seconds elapsed while in Responding state (resets each cycle). */
    elapsedTime: number;
    /** Prompt token count from the most recent round (for context usage). */
    lastPromptTokenCount: number;
}
/**
 * Subscribe to an AgentInteractive's events and derive UI streaming state.
 *
 * @param interactiveAgent - The agent instance, or undefined if not yet registered.
 * @param events - Which event types trigger a re-render. Defaults to
 *   STATUS_CHANGE, TOOL_WAITING_APPROVAL, and TOOL_RESULT — sufficient for
 *   composer / footer use. Callers like AgentChatView can pass a broader set
 *   (e.g. include TOOL_CALL, ROUND_END, TOOL_OUTPUT_UPDATE) for richer updates.
 */
export declare function useAgentStreamingState(interactiveAgent: AgentInteractive | undefined, events?: ReadonlyArray<(typeof AgentEventType)[keyof typeof AgentEventType]>): AgentStreamingInfo;
