/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { checkExhaustive } from '../../utils/checks.js';
export var ExtensionUpdateState;
(function (ExtensionUpdateState) {
    ExtensionUpdateState["CHECKING_FOR_UPDATES"] = "checking for updates";
    ExtensionUpdateState["UPDATED_NEEDS_RESTART"] = "updated, needs restart";
    ExtensionUpdateState["UPDATING"] = "updating";
    ExtensionUpdateState["UPDATED"] = "updated";
    ExtensionUpdateState["UPDATE_AVAILABLE"] = "update available";
    ExtensionUpdateState["UP_TO_DATE"] = "up to date";
    ExtensionUpdateState["ERROR"] = "error";
    ExtensionUpdateState["NOT_UPDATABLE"] = "not updatable";
    ExtensionUpdateState["UNKNOWN"] = "unknown";
})(ExtensionUpdateState || (ExtensionUpdateState = {}));
export const initialExtensionUpdatesState = {
    extensionStatuses: new Map(),
    batchChecksInProgress: 0,
};
export function extensionUpdatesReducer(state, action) {
    switch (action.type) {
        case 'SET_STATE': {
            const existing = state.extensionStatuses.get(action.payload.name);
            if (existing?.status === action.payload.state) {
                return state;
            }
            const newStatuses = new Map(state.extensionStatuses);
            newStatuses.set(action.payload.name, {
                status: action.payload.state,
                processed: false,
            });
            return { ...state, extensionStatuses: newStatuses };
        }
        case 'SET_PROCESSED': {
            const existing = state.extensionStatuses.get(action.payload.name);
            if (!existing || existing.processed === action.payload.processed) {
                return state;
            }
            const newStatuses = new Map(state.extensionStatuses);
            newStatuses.set(action.payload.name, {
                ...existing,
                processed: action.payload.processed,
            });
            return { ...state, extensionStatuses: newStatuses };
        }
        case 'BATCH_CHECK_START':
            return {
                ...state,
                batchChecksInProgress: state.batchChecksInProgress + 1,
            };
        case 'BATCH_CHECK_END':
            return {
                ...state,
                batchChecksInProgress: state.batchChecksInProgress - 1,
            };
        default:
            checkExhaustive(action);
    }
}
//# sourceMappingURL=extensions.js.map