/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare enum ExtensionUpdateState {
    CHECKING_FOR_UPDATES = "checking for updates",
    UPDATED_NEEDS_RESTART = "updated, needs restart",
    UPDATING = "updating",
    UPDATED = "updated",
    UPDATE_AVAILABLE = "update available",
    UP_TO_DATE = "up to date",
    ERROR = "error",
    NOT_UPDATABLE = "not updatable",
    UNKNOWN = "unknown"
}
export interface ExtensionUpdateStatus {
    status: ExtensionUpdateState;
    processed: boolean;
}
export interface ExtensionUpdatesState {
    extensionStatuses: Map<string, ExtensionUpdateStatus>;
    batchChecksInProgress: number;
}
export declare const initialExtensionUpdatesState: ExtensionUpdatesState;
export type ExtensionUpdateAction = {
    type: 'SET_STATE';
    payload: {
        name: string;
        state: ExtensionUpdateState;
    };
} | {
    type: 'SET_PROCESSED';
    payload: {
        name: string;
        processed: boolean;
    };
} | {
    type: 'BATCH_CHECK_START';
} | {
    type: 'BATCH_CHECK_END';
};
export declare function extensionUpdatesReducer(state: ExtensionUpdatesState, action: ExtensionUpdateAction): ExtensionUpdatesState;
