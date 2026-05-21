/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface KittyProtocolStatus {
    supported: boolean;
    enabled: boolean;
    checking: boolean;
}
/**
 * Hook that returns the cached Kitty keyboard protocol status.
 * Detection is done once at app startup to avoid repeated queries.
 */
export declare function useKittyKeyboardProtocol(): KittyProtocolStatus;
