/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
interface Logger {
    getPreviousUserMessages(): Promise<string[]>;
}
export interface UseInputHistoryStoreReturn {
    inputHistory: string[];
    addInput: (input: string) => void;
    initializeFromLogger: (logger: Logger | null) => Promise<void>;
}
/**
 * Hook for independently managing input history.
 * Completely separated from chat history and unaffected by /clear commands.
 */
export declare function useInputHistoryStore(): UseInputHistoryStoreReturn;
export {};
