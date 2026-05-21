/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adapter layer for normalizing different data formats to unified message format
 */
export type { UnifiedMessage, UnifiedMessageType, JSONLMessage, ACPMessage, ACPMessageData, ToolCallData, FileContext, } from './types.js';
export { adaptJSONLMessages, filterEmptyMessages } from './JSONLAdapter.js';
export { adaptACPMessages, isToolCallData, isMessageData, } from './ACPAdapter.js';
