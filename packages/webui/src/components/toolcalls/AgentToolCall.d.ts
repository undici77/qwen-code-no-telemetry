/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dedicated agent tool call component for structured subagent execution output.
 */
import type { FC } from 'react';
import type { AgentExecutionRawOutput, BaseToolCallProps, ToolCallData } from './shared/index.js';
export declare const isAgentExecutionRawOutput: (value: unknown) => value is AgentExecutionRawOutput;
export declare const isAgentExecutionToolCall: (toolCall: ToolCallData) => toolCall is ToolCallData & {
    rawOutput: AgentExecutionRawOutput;
};
export declare const AgentToolCall: FC<BaseToolCallProps>;
