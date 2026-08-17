/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionUpdate } from '@agentclientprotocol/sdk';
export declare const ACP_TOOL_RESULT_TEXT_JSON_BYTE_BUDGET = 65536;
export declare const ACP_TOOL_RESULT_TEXT_TRUNCATION_MARKER =
  '\n[... truncated for ACP transport ...]\n';
export declare function projectAcpToolResultUpdate(
  update: SessionUpdate,
): SessionUpdate;
