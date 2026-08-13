/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
// ---------------------------------------------------------------------------
// Private / Qwen-specific types (not part of ACP spec)
// ---------------------------------------------------------------------------
// Default auth method for ACP authenticate requests.
// Value matches AuthType.USE_OPENAI from @qwen-code/qwen-code-core.
// Cannot import directly because this file is used in the webview bundle
// where core (Node.js-only) is excluded as external.
export const authMethod = 'openai';
export { ApprovalMode, APPROVAL_MODE_MAP, APPROVAL_MODE_INFO, getApprovalModeInfoFromString, } from './approvalModeTypes.js';
export const NEXT_APPROVAL_MODE = {
    plan: 'default',
    default: 'auto-edit',
    'auto-edit': 'auto',
    auto: 'yolo',
    yolo: 'plan',
};
//# sourceMappingURL=acpTypes.js.map