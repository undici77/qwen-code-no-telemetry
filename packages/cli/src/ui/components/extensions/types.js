/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Top-level tabs of the extensions manager dialog, aligned with the Claude Code
 * `/plugin` command. The Errors tab is intentionally deferred per the spec.
 */
export const EXTENSIONS_TABS = {
    DISCOVER: 'discover',
    INSTALLED: 'installed',
    SOURCES: 'sources',
};
/**
 * Management steps for the extensions manager dialog.
 */
export const MANAGEMENT_STEPS = {
    EXTENSION_LIST: 'extension-list',
    ACTION_SELECTION: 'action-selection',
    EXTENSION_DETAIL: 'extension-detail',
    UNINSTALL_CONFIRMATION: 'uninstall-confirmation',
    DISABLE_SCOPE_SELECT: 'disable-scope-select',
    ENABLE_SCOPE_SELECT: 'enable-scope-select',
    UPDATE_PROGRESS: 'update-progress',
};
//# sourceMappingURL=types.js.map