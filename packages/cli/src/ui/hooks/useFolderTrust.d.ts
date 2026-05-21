/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LoadedSettings } from '../../config/settings.js';
import { FolderTrustChoice } from '../components/FolderTrustDialog.js';
export declare const useFolderTrust: (settings: LoadedSettings, onTrustChange: (isTrusted: boolean | undefined) => void) => {
    isTrusted: boolean | undefined;
    isFolderTrustDialogOpen: boolean;
    handleFolderTrustSelect: (choice: FolderTrustChoice) => void;
    isRestarting: boolean;
};
