/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Tracks chat providers by host type while exposing a combined list for flows
 * like permission handling and diff suppression.
 */
export class ChatProviderRegistry {
    createProvider;
    editorProviders = [];
    viewProviders = [];
    constructor(createProvider) {
        this.createProvider = createProvider;
    }
    createEditorProvider(provider = this.createProvider()) {
        this.editorProviders.push(provider);
        return provider;
    }
    createViewProvider(provider = this.createProvider()) {
        this.viewProviders.push(provider);
        return provider;
    }
    getEditorProviders() {
        return [...this.editorProviders];
    }
    getPermissionAwareProviders() {
        return [...this.editorProviders, ...this.viewProviders];
    }
    disposeAll() {
        for (const provider of this.getPermissionAwareProviders()) {
            provider.dispose();
        }
        this.editorProviders = [];
        this.viewProviders = [];
    }
}
//# sourceMappingURL=ChatProviderRegistry.js.map