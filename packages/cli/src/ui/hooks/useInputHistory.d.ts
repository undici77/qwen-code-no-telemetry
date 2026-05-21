/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
interface UseInputHistoryProps {
    userMessages: readonly string[];
    onSubmit: (value: string) => void;
    isActive: boolean;
    currentQuery: string;
    onChange: (value: string) => void;
}
export interface UseInputHistoryReturn {
    handleSubmit: (value: string) => void;
    navigateUp: () => boolean;
    navigateDown: () => boolean;
    resetHistoryNav: () => void;
}
export declare function useInputHistory({ userMessages, onSubmit, isActive, currentQuery, onChange, }: UseInputHistoryProps): UseInputHistoryReturn;
export {};
