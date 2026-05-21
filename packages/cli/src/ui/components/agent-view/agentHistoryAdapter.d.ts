/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview agentHistoryAdapter — converts AgentMessage[] to HistoryItem[].
 *
 * This adapter bridges the sub-agent data model (AgentMessage[] from
 * AgentInteractive) to the shared rendering model (HistoryItem[] consumed by
 * HistoryItemDisplay). It lives in the CLI package so that packages/core types
 * are never coupled to CLI rendering types.
 *
 * ID stability: AgentMessage[] is append-only, so the resulting HistoryItem[]
 * only ever grows. Index-based IDs are therefore stable — Ink's <Static>
 * requires items never shift or be removed, which this guarantees.
 */
import type { AgentMessage, ToolCallConfirmationDetails, ToolResultDisplay } from '@qwen-code/qwen-code-core';
import type { HistoryItem } from '../../types.js';
/**
 * Convert AgentMessage[] + pendingApprovals into HistoryItem[].
 *
 * Consecutive tool_call / tool_result messages are merged into a single
 * tool_group HistoryItem. pendingApprovals overlays confirmation state so
 * ToolGroupMessage can render confirmation dialogs.
 *
 * liveOutputs (optional) provides real-time display data for executing tools.
 * shellPids (optional) provides PTY PIDs for interactive shell tools so
 * HistoryItemDisplay can render ShellInputPrompt on the active shell.
 */
export declare function agentMessagesToHistoryItems(messages: readonly AgentMessage[], pendingApprovals: ReadonlyMap<string, ToolCallConfirmationDetails>, liveOutputs?: ReadonlyMap<string, ToolResultDisplay>, shellPids?: ReadonlyMap<string, number>, executionStartTimes?: ReadonlyMap<string, number>): HistoryItem[];
