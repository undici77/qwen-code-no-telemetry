/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface VSCodeAPI {
    postMessage: (message: unknown) => void;
    getState: () => unknown;
    setState: (state: unknown) => void;
}
/**
 * Hook to get VS Code API
 * Multiple components can safely call this hook, API instance will be reused
 */
export declare function useVSCode(): VSCodeAPI;
