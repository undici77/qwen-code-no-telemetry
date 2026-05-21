/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
type DisposableProvider = {
    dispose(): void;
};
/**
 * Tracks chat providers by host type while exposing a combined list for flows
 * like permission handling and diff suppression.
 */
export declare class ChatProviderRegistry<T extends DisposableProvider> {
    private readonly createProvider;
    private editorProviders;
    private viewProviders;
    constructor(createProvider: () => T);
    createEditorProvider(provider?: T): T;
    createViewProvider(provider?: T): T;
    getEditorProviders(): T[];
    getPermissionAwareProviders(): T[];
    disposeAll(): void;
}
export {};
