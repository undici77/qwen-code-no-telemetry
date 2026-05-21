/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
interface OverflowState {
    overflowingIds: ReadonlySet<string>;
}
interface OverflowActions {
    addOverflowingId: (id: string) => void;
    removeOverflowingId: (id: string) => void;
}
export declare const useOverflowState: () => OverflowState | undefined;
export declare const useOverflowActions: () => OverflowActions | undefined;
export declare const OverflowProvider: React.FC<{
    children: React.ReactNode;
}>;
export {};
