/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export type RestartReason = 'NONE' | 'CONNECTION_CHANGE' | 'TRUST_CHANGE';
/**
 * This hook listens for trust status updates from the IDE companion extension.
 * It provides the current trust status from the IDE and a reason if a restart
 * is needed because the trust state has changed.
 */
export declare function useIdeTrustListener(): {
    isIdeTrusted: boolean | undefined;
    needsRestart: boolean;
    restartReason: RestartReason;
};
