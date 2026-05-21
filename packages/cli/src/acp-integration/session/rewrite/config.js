/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Reads messageRewrite configuration from user/workspace originalSettings.
 * Workspace settings are only used when the workspace is trusted,
 * preventing untrusted repos from enabling the rewriter with a custom prompt.
 */
export function loadRewriteConfig(settings) {
    const userOriginal = settings.user?.originalSettings;
    const workspaceOriginal = settings.isTrusted
        ? settings.workspace?.originalSettings
        : undefined;
    return (workspaceOriginal?.['messageRewrite'] ??
        userOriginal?.['messageRewrite']);
}
//# sourceMappingURL=config.js.map