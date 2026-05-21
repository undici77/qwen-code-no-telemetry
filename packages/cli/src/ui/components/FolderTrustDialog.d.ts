/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
export declare enum FolderTrustChoice {
    TRUST_FOLDER = "trust_folder",
    TRUST_PARENT = "trust_parent",
    DO_NOT_TRUST = "do_not_trust"
}
interface FolderTrustDialogProps {
    onSelect: (choice: FolderTrustChoice) => void;
    isRestarting?: boolean;
}
export declare const FolderTrustDialog: React.FC<FolderTrustDialogProps>;
export {};
