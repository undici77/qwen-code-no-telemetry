/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { AgentTerminateMode } from './runtime/agent-types.js';
/** Keeps successful subagent scratchpad tags out of the parent model context. */
export declare function toModelVisibleSubagentResult(
  text: string,
  terminateMode?: AgentTerminateMode,
): string;
