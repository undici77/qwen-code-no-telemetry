/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adapter layer for normalizing different data formats to unified message format
 */
// JSONL Adapter (for ChatViewer)
export { adaptJSONLMessages, filterEmptyMessages } from './JSONLAdapter.js';
// ACP Adapter (for vscode-ide-companion)
export { adaptACPMessages, isToolCallData, isMessageData, } from './ACPAdapter.js';
//# sourceMappingURL=index.js.map