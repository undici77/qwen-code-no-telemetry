/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ModelInfo } from '@agentclientprotocol/sdk';
import type { ContextUsage } from '@qwen-code/webui';
import type { UsageStatsPayload } from '../../types/chatTypes.js';
export declare function computeContextUsage(usageStats: UsageStatsPayload | null, modelInfo: ModelInfo | null): ContextUsage | null;
